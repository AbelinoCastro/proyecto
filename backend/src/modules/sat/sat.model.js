const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');

const obtenerISRPreview = async (id_periodo) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT
                e.nombre AS empleado,
                n.total_percepciones,
                n.total_deducciones,
                NVL(d_isr.monto, 0)  AS isr_retenido,
                NVL(d_igss.monto, 0) AS igss,
                NVL(p_bono.monto, 0) AS bonificacion,
                n.estado
             FROM HISTORICO_NOMINA n
             JOIN EMPLEADO e ON e.id_empleado = n.id_empleado
             LEFT JOIN HISTORICO_DEDUCCIONES_DETALLE d_isr
                 ON d_isr.id_nomina = n.id_nomina AND d_isr.id_deduccion = 'DED02'
             LEFT JOIN HISTORICO_DEDUCCIONES_DETALLE d_igss
                 ON d_igss.id_nomina = n.id_nomina AND d_igss.id_deduccion = 'DED01'
             LEFT JOIN HISTORICO_PERCEPCIONES_DETALLE p_bono
                 ON p_bono.id_nomina = n.id_nomina AND p_bono.id_percepcion = 'PER02'
             WHERE n.id_periodo = :id_periodo AND n.estado = 'PAGADO'
             ORDER BY e.nombre`,
            { id_periodo: Number(id_periodo) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

const pagarISR = async (id_periodo) => {
    const conn = await getConnection();
    try {
        // Validar que toda la nómina esté pagada
        const validacion = await conn.execute(
            `SELECT COUNT(*) AS TOTAL FROM HISTORICO_NOMINA
             WHERE id_periodo = :id_periodo AND estado != 'PAGADO'`,
            { id_periodo: Number(id_periodo) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (validacion.rows[0].TOTAL > 0)
            throw new Error('La nómina no está completamente pagada');

        // Validar si ya existe pago
        const existe = await conn.execute(
            `SELECT COUNT(*) AS TOTAL FROM PAGO_SAT
             WHERE id_periodo = :id_periodo AND tipo_pago = 'ISR'`,
            { id_periodo: Number(id_periodo) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (existe.rows[0].TOTAL > 0)
            throw new Error('El ISR ya fue pagado para este período');

        // Obtener datos ISR e IGSS por empleado para calcular base correcta
        const data = await conn.execute(
            `SELECT n.id_nomina, n.id_empleado, n.total_percepciones,
                    NVL(SUM(CASE WHEN d.id_deduccion = 'DED02' THEN d.monto ELSE 0 END), 0) AS isr,
                    NVL(SUM(CASE WHEN d.id_deduccion = 'DED01' THEN d.monto ELSE 0 END), 0) AS igss
             FROM HISTORICO_NOMINA n
             LEFT JOIN HISTORICO_DEDUCCIONES_DETALLE d
                 ON d.id_nomina = n.id_nomina AND d.id_deduccion IN ('DED01','DED02')
             WHERE n.id_periodo = :id_periodo
             GROUP BY n.id_nomina, n.id_empleado, n.total_percepciones`,
            { id_periodo: Number(id_periodo) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        let total = 0;
        data.rows.forEach(r => { total += Number(r.ISR); });

        // Obtener ID usando secuencia (ID_PAGO_SAT es NUMBER)
        const seqRes = await conn.execute(
            `SELECT SEQ_PAGO_SAT.NEXTVAL AS ID FROM DUAL`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const pagoId = seqRes.rows[0].ID;

        await conn.execute(
            `INSERT INTO PAGO_SAT (id_pago_sat, id_periodo, tipo_pago, total, fecha_pago)
             VALUES (:id, :periodo, 'ISR', :total, SYSDATE)`,
            { id: pagoId, periodo: Number(id_periodo), total }
        );

        for (const row of data.rows) {
            await conn.execute(
                `INSERT INTO PAGO_SAT_DETALLE (id_detalle, id_pago_sat, id_empleado, base_isr, isr_monto)
                 VALUES (SEQ_PAGO_SAT_DETALLE.NEXTVAL, :pago, :emp, :base, :isr)`,
                {
                    pago: pagoId,
                    emp:  Number(row.ID_EMPLEADO),
                    // base = percepciones − IGSS (base mensual neta sobre la que aplica ISR)
                    base: parseFloat((Number(row.TOTAL_PERCEPCIONES) - Number(row.IGSS)).toFixed(2)),
                    isr:  Number(row.ISR)
                }
            );
        }

        await conn.commit();
        return { message: 'Pago ISR registrado correctamente', total };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally { await conn.close(); }
};

const getComprobanteISR = async (id_periodo) => {
    const conn = await getConnection();
    try {
        const pago = await conn.execute(
            `SELECT id_pago_sat, id_periodo, tipo_pago, total, fecha_pago
             FROM PAGO_SAT WHERE id_periodo = :id_periodo AND tipo_pago = 'ISR'`,
            { id_periodo: Number(id_periodo) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (!pago.rows.length) throw new Error('No existe pago ISR para este período');

        const id_pago = Number(pago.rows[0].ID_PAGO_SAT);

        const detalle = await conn.execute(
            `SELECT e.nombre, d.base_isr, d.isr_monto
             FROM PAGO_SAT_DETALLE d
             JOIN EMPLEADO e ON e.id_empleado = d.id_empleado
             WHERE d.id_pago_sat = :id_pago
             ORDER BY e.nombre`,
            { id_pago },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        return { pago: pago.rows[0], detalle: detalle.rows };
    } finally { await conn.close(); }
};

const getPatronoActivo = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT razon_social, numero_patronal, nit
             FROM PATRONO
             ORDER BY id_patrono FETCH FIRST 1 ROW ONLY`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows.length ? result.rows[0] : null;
    } finally { await conn.close(); }
};

const getEstadoISR = async (id_periodo) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT COUNT(*) AS TOTAL FROM PAGO_SAT
             WHERE id_periodo = :id_periodo AND tipo_pago = 'ISR'`,
            { id_periodo: Number(id_periodo) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return { pagado: result.rows[0].TOTAL > 0 };
    } finally { await conn.close(); }
};

module.exports = { obtenerISRPreview, pagarISR, getComprobanteISR, getEstadoISR, getPatronoActivo };
