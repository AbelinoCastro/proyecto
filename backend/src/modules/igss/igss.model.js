const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');

// Preview: empleados con IGSS retenido en el período
const getIGSSPreview = async (id_periodo) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT
                e.nombre AS empleado,
                e.no_afiliacion_igss,
                n.id_nomina,
                n.id_empleado,
                NVL(d_igss.monto,  0) AS igss_monto,
                NVL(p_base.monto,  0) AS sueldo_base,
                NVL(p_he.he_total, 0) AS horas_extra_monto
             FROM HISTORICO_NOMINA n
             JOIN EMPLEADO e ON e.id_empleado = n.id_empleado
             LEFT JOIN HISTORICO_DEDUCCIONES_DETALLE d_igss
                 ON d_igss.id_nomina = n.id_nomina AND d_igss.id_deduccion = 'DED01'
             LEFT JOIN HISTORICO_PERCEPCIONES_DETALLE p_base
                 ON p_base.id_nomina = n.id_nomina AND p_base.id_percepcion = 'PER01'
             LEFT JOIN (
                 SELECT id_nomina, SUM(monto) AS he_total
                 FROM HISTORICO_PERCEPCIONES_DETALLE
                 WHERE id_percepcion = 'PER05'
                 GROUP BY id_nomina
             ) p_he ON p_he.id_nomina = n.id_nomina
             WHERE n.id_periodo = :id_periodo AND n.estado = 'PAGADO'
             ORDER BY e.nombre`,
            { id_periodo: Number(id_periodo) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

// Verificar si la nómina está completamente pagada
const validarNominaPagada = async (id_periodo) => {
    const conn = await getConnection();
    try {
        const r = await conn.execute(
            `SELECT COUNT(*) AS TOTAL FROM HISTORICO_NOMINA
             WHERE id_periodo = :id_periodo AND estado != 'PAGADO'`,
            { id_periodo: Number(id_periodo) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return r.rows[0].TOTAL === 0;
    } finally { await conn.close(); }
};

// Registrar pago IGSS
const pagarIGSS = async (id_periodo) => {
    const conn = await getConnection();
    try {
        // Verificar si ya existe
        const existe = await conn.execute(
            `SELECT COUNT(*) AS TOTAL FROM PAGO_IGSS WHERE id_periodo = :id_periodo`,
            { id_periodo: Number(id_periodo) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (existe.rows[0].TOTAL > 0)
            throw new Error('El IGSS ya fue pagado para este período');

        // Calcular total IGSS del período
        const totRes = await conn.execute(
            `SELECT NVL(SUM(d.monto), 0) AS total_igss
             FROM HISTORICO_NOMINA n
             JOIN HISTORICO_DEDUCCIONES_DETALLE d
                 ON d.id_nomina = n.id_nomina AND d.id_deduccion = 'DED01'
             WHERE n.id_periodo = :id_periodo AND n.estado = 'PAGADO'`,
            { id_periodo: Number(id_periodo) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const total = Number(totRes.rows[0].TOTAL_IGSS);

        const pagoId = 'IGSS-' + Date.now().toString();

        await conn.execute(
            `INSERT INTO PAGO_IGSS (id_pago_igss, id_periodo, total, fecha_pago)
             VALUES (:id, :periodo, :total, SYSDATE)`,
            { id: pagoId, periodo: Number(id_periodo), total }
        );

        await conn.commit();
        return { message: 'Pago IGSS registrado correctamente', total };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally { await conn.close(); }
};

// Estado de pago IGSS
const getEstadoIGSS = async (id_periodo) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT COUNT(*) AS TOTAL FROM PAGO_IGSS WHERE id_periodo = :id_periodo`,
            { id_periodo: Number(id_periodo) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return { pagado: result.rows[0].TOTAL > 0 };
    } finally { await conn.close(); }
};

// Comprobante de pago IGSS
const getComprobanteIGSS = async (id_periodo) => {
    const conn = await getConnection();
    try {
        const pago = await conn.execute(
            `SELECT id_pago_igss, id_periodo, total, fecha_pago FROM PAGO_IGSS
             WHERE id_periodo = :id_periodo`,
            { id_periodo: Number(id_periodo) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (!pago.rows.length) throw new Error('No existe pago IGSS para este período');

        const detalle = await conn.execute(
            `SELECT e.nombre AS empleado, e.no_afiliacion_igss,
                    NVL(d_igss.monto,  0) AS igss_monto,
                    NVL(p_base.monto,  0) AS sueldo_base,
                    NVL(p_he.he_total, 0) AS horas_extra_monto
             FROM HISTORICO_NOMINA n
             JOIN EMPLEADO e ON e.id_empleado = n.id_empleado
             LEFT JOIN HISTORICO_DEDUCCIONES_DETALLE d_igss
                 ON d_igss.id_nomina = n.id_nomina AND d_igss.id_deduccion = 'DED01'
             LEFT JOIN HISTORICO_PERCEPCIONES_DETALLE p_base
                 ON p_base.id_nomina = n.id_nomina AND p_base.id_percepcion = 'PER01'
             LEFT JOIN (
                 SELECT id_nomina, SUM(monto) AS he_total
                 FROM HISTORICO_PERCEPCIONES_DETALLE
                 WHERE id_percepcion = 'PER05'
                 GROUP BY id_nomina
             ) p_he ON p_he.id_nomina = n.id_nomina
             WHERE n.id_periodo = :id_periodo AND n.estado = 'PAGADO'
             ORDER BY e.nombre`,
            { id_periodo: Number(id_periodo) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        return { pago: pago.rows[0], detalle: detalle.rows };
    } finally { await conn.close(); }
};

module.exports = { getIGSSPreview, validarNominaPagada, pagarIGSS, getEstadoIGSS, getComprobanteIGSS };
