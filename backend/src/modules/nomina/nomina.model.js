const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');

// Obtener datos completos del empleado para el formulario
const getDatosEmpleado = async (id_empleado) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT e.id_empleado, e.nombre, e.correo, e.telefono, e.cuenta_bancaria,
                    e.porcentaje_pago_comision, e.estado,
                    p.id_puesto, p.nombre_puesto, p.sueldo_base,
                    j.id_jornada, j.nombre_jornada, j.horas_diarias,
                    d.nombre_departamento
             FROM EMPLEADO e
             JOIN PUESTOS      p ON p.id_puesto      = e.id_puesto
             JOIN JORNADAS     j ON j.id_jornada     = e.id_jornada
             JOIN DEPARTAMENTOS d ON d.id_departamento = p.id_departamento
             WHERE e.id_empleado = :id AND e.estado = 'ACTIVO'`,
            { id: id_empleado },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } finally { await conn.close(); }
};

// Obtener horas extra APROBADAS del empleado en un mes/año
const getHorasExtra = async (id_empleado, anio, mes) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT rhe.id_hora_extra, rhe.fecha, rhe.cantidad, rhe.factor,
                    rhe.justificacion, j.nombre_jornada, j.horas_diarias
             FROM REGISTRO_HORAS_EXTRA rhe
             JOIN JORNADAS j ON j.id_jornada = rhe.id_jornada
             WHERE rhe.id_empleado = :id
               AND rhe.estado      = 'APROBADO'
               AND EXTRACT(YEAR  FROM rhe.fecha) = :anio
               AND EXTRACT(MONTH FROM rhe.fecha) = :mes
             ORDER BY rhe.fecha`,
            { id: id_empleado, anio, mes },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

// Obtener faltas APROBADAS del empleado en un mes/año
// Solo las que tienen es_pagado = 'N' generan descuento
const getFaltas = async (id_empleado, anio, mes) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT rf.id_registro_falta, rf.fecha, rf.fecha_fin,
                    rf.justificacion, rf.estado,
                    f.descripcion AS tipo_falta, f.es_pagado
             FROM REGISTRO_FALTAS rf
             JOIN FALTAS f ON f.id_falta = rf.id_falta
             WHERE rf.id_empleado = :id
               AND rf.estado      = 'APROBADO'
               AND EXTRACT(YEAR  FROM rf.fecha) = :anio
               AND EXTRACT(MONTH FROM rf.fecha) = :mes
             ORDER BY rf.fecha`,
            { id: id_empleado, anio, mes },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

// Obtener cuota mensual del préstamo ACTIVO del empleado (0 si no tiene)
const getPrestamoPendiente = async (id_empleado) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT pago_mensual
             FROM PRESTAMOS
             WHERE id_empleado = :id
               AND estado      = 'ACTIVO'
             FETCH FIRST 1 ROW ONLY`,
            { id: id_empleado },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows.length ? parseFloat(result.rows[0].PAGO_MENSUAL) : 0;
    } finally { await conn.close(); }
};

// Obtener prima mensual del seguro vigente del empleado (0 si no tiene)
const getSeguroActivo = async (id_empleado) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT monto_prima
             FROM POLIZA_SEGUROS
             WHERE id_empleado = :id
               AND fecha_renovacion >= SYSDATE
             FETCH FIRST 1 ROW ONLY`,
            { id: id_empleado },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows.length ? parseFloat(result.rows[0].MONTO_PRIMA) : 0;
    } finally { await conn.close(); }
};

// Verificar si ya existe nómina procesada para este empleado y período
const getNominaExistente = async (id_empleado, id_periodo) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT id_nomina, estado FROM HISTORICO_NOMINA
             WHERE id_empleado = :id_empleado AND id_periodo = :id_periodo`,
            { id_empleado, id_periodo },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } finally { await conn.close(); }
};

// Obtener o crear período de nómina para el mes/año dado
const getOCrearPeriodo = async (anio, mes) => {
    const conn = await getConnection();
    try {
        // Buscar período existente
        const existing = await conn.execute(
            `SELECT id_periodo, numero_periodo, anio, fecha_inicio, fecha_fin, estado
             FROM PERIODO_NOMINA
             WHERE numero_periodo = :mes AND anio = :anio`,
            { mes, anio },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (existing.rows[0]) return existing.rows[0];

        // Crear período automáticamente
        const fechaInicio = new Date(anio, mes - 1, 1);
        const fechaFin = new Date(anio, mes, 0); // último día del mes

        const strInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
        const strFin = `${anio}-${String(mes).padStart(2, '0')}-${String(fechaFin.getDate()).padStart(2, '0')}`;

        const inserted = await conn.execute(
            `INSERT INTO PERIODO_NOMINA (numero_periodo, anio, fecha_inicio, fecha_fin, estado)
             VALUES (:mes, :anio, TO_DATE(:fi,'YYYY-MM-DD'), TO_DATE(:ff,'YYYY-MM-DD'), 'ABIERTO')
             RETURNING id_periodo INTO :id_periodo`,
            {
                mes, anio,
                fi: strInicio,
                ff: strFin,
                id_periodo: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            { autoCommit: true }
        );

        const id_periodo = inserted.outBinds.id_periodo[0];
        const nuevo = await conn.execute(
            `SELECT id_periodo, numero_periodo, anio, fecha_inicio, fecha_fin, estado
             FROM PERIODO_NOMINA WHERE id_periodo = :id`,
            { id: id_periodo },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return nuevo.rows[0];
    } finally { await conn.close(); }
};

// Guardar la nómina procesada con todos sus detalles y actualizar estados operativos
const procesarNomina = async ({
    id_empleado, id_periodo, fecha_pago,
    total_percepciones, total_deducciones, liquido_a_pagar,
    observacion, detalles_percepciones, detalles_deducciones
}) => {
    const conn = await getConnection();
    try {
        // 1. Insertar encabezado en HISTORICO_NOMINA
        const resNomina = await conn.execute(
            `INSERT INTO HISTORICO_NOMINA
                (id_empleado, id_periodo, fecha_pago, total_percepciones, total_deducciones, liquido_a_pagar, estado, observacion)
             VALUES (:id_empleado, :id_periodo, TO_DATE(:fecha_pago,'YYYY-MM-DD'),
                     :total_percepciones, :total_deducciones, :liquido_a_pagar, 'PAGADO', :observacion)
             RETURNING id_nomina INTO :id_nomina`,
            {
                id_empleado, id_periodo,
                fecha_pago,
                total_percepciones, total_deducciones, liquido_a_pagar,
                observacion: observacion || null,
                id_nomina: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            { autoCommit: false }
        );
        const id_nomina = resNomina.outBinds.id_nomina[0];

        // 2. Procesar detalles de percepciones y sellar Horas Extra
        for (const det of detalles_percepciones) {
            await conn.execute(
                `INSERT INTO HISTORICO_PERCEPCIONES_DETALLE (id_nomina, id_percepcion, id_hora_extra, monto)
                 VALUES (:id_nomina, :id_percepcion, :id_hora_extra, :monto)`,
                { id_nomina, id_percepcion: det.id_percepcion, id_hora_extra: det.id_hora_extra || null, monto: det.monto },
                { autoCommit: false }
            );

            if (det.id_hora_extra) {
                await conn.execute(
                    `UPDATE REGISTRO_HORAS_EXTRA SET estado = 'PAGADO' WHERE id_hora_extra = :id`,
                    { id: det.id_hora_extra }, { autoCommit: false }
                );
            }
        }

        // 3. Procesar detalles de deducciones y sellar Faltas / Préstamos
        for (const det of detalles_deducciones) {
            await conn.execute(
                `INSERT INTO HISTORICO_DEDUCCIONES_DETALLE (id_nomina, id_deduccion, id_registro_falta, monto)
                 VALUES (:id_nomina, :id_deduccion, :id_registro_falta, :monto)`,
                { id_nomina, id_deduccion: det.id_deduccion, id_registro_falta: det.id_registro_falta || null, monto: det.monto },
                { autoCommit: false }
            );

            if (det.id_registro_falta) {
                await conn.execute(
                    `UPDATE REGISTRO_FALTAS SET estado = 'PAGADO' WHERE id_registro_falta = :id`,
                    { id: det.id_registro_falta }, { autoCommit: false }
                );
            }

            // Si es descuento por Préstamo (DED06), sellar la cuota pendiente más antigua
            if (det.id_deduccion === 'DED06') {
                await conn.execute(
                    `UPDATE DETALLE_PRESTAMO SET estado = 'PAGADO'
                     WHERE id_detalle = (
                        SELECT MIN(id_detalle) FROM DETALLE_PRESTAMO dp
                        JOIN PRESTAMOS p ON p.id_prestamo = dp.id_prestamo
                        WHERE p.id_empleado = :id_emp AND dp.estado = 'PENDIENTE'
                     )`,
                    { id_emp: id_empleado }, { autoCommit: false }
                );
            }
        }

        await conn.commit();
        return id_nomina;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally { await conn.close(); }
};

// Anular una nómina y liberar registros operativos asociados
const eliminarNomina = async (id_nomina) => {
    const conn = await getConnection();
    try {
        // 1. Obtener datos de la nómina para reversión
        const info = await conn.execute(
            `SELECT id_empleado FROM HISTORICO_NOMINA WHERE id_nomina = :id`,
            { id: id_nomina }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (!info.rows[0]) throw new Error('Nómina no encontrada');
        const id_empleado = info.rows[0].ID_EMPLEADO;

        // 2. Liberar Horas Extra (PAGADO -> APROBADO)
        await conn.execute(
            `UPDATE REGISTRO_HORAS_EXTRA SET estado = 'APROBADO'
             WHERE id_hora_extra IN (SELECT id_hora_extra FROM HISTORICO_PERCEPCIONES_DETALLE WHERE id_nomina = :id AND id_hora_extra IS NOT NULL)`,
            { id: id_nomina }, { autoCommit: false }
        );

        // 3. Liberar Faltas (PAGADO -> APROBADO)
        await conn.execute(
            `UPDATE REGISTRO_FALTAS SET estado = 'APROBADO'
             WHERE id_registro_falta IN (SELECT id_registro_falta FROM HISTORICO_DEDUCCIONES_DETALLE WHERE id_nomina = :id AND id_registro_falta IS NOT NULL)`,
            { id: id_nomina }, { autoCommit: false }
        );

        // 4. Revertir Pago de Préstamo (PAGADO -> PENDIENTE) - La última cuota pagada del empleado
        const hasLoan = await conn.execute(
            `SELECT COUNT(*) as TOTAL FROM HISTORICO_DEDUCCIONES_DETALLE WHERE id_nomina = :id AND id_deduccion = 'DED06'`,
            { id: id_nomina }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (hasLoan.rows[0].TOTAL > 0) {
            await conn.execute(
                `UPDATE DETALLE_PRESTAMO SET estado = 'PENDIENTE'
                 WHERE id_detalle = (
                    SELECT MAX(id_detalle) FROM DETALLE_PRESTAMO dp
                    JOIN PRESTAMOS p ON p.id_prestamo = dp.id_prestamo
                    WHERE p.id_empleado = :id_emp AND dp.estado = 'PAGADO'
                 )`,
                { id_emp: id_empleado }, { autoCommit: false }
            );
        }

        // 5. Eliminar detalles y encabezado
        await conn.execute(`DELETE FROM HISTORICO_PERCEPCIONES_DETALLE WHERE id_nomina = :id`, { id: id_nomina }, { autoCommit: false });
        await conn.execute(`DELETE FROM HISTORICO_DEDUCCIONES_DETALLE WHERE id_nomina = :id`, { id: id_nomina }, { autoCommit: false });
        await conn.execute(`DELETE FROM HISTORICO_NOMINA WHERE id_nomina = :id`, { id: id_nomina }, { autoCommit: false });

        await conn.commit();
        return true;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally { await conn.close(); }
};


// Obtener histórico de nóminas procesadas
const getHistorico = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT hn.id_nomina, hn.id_empleado, e.nombre AS nombre_empleado,
                    p.nombre_puesto, hn.id_periodo,
                    pn.numero_periodo, pn.anio,
                    hn.fecha_pago, hn.total_percepciones,
                    hn.total_deducciones, hn.liquido_a_pagar,
                    hn.estado, hn.observacion, hn.creado_en
             FROM HISTORICO_NOMINA hn
             JOIN EMPLEADO      e  ON e.id_empleado = hn.id_empleado
             JOIN PUESTOS       p  ON p.id_puesto   = e.id_puesto
             JOIN PERIODO_NOMINA pn ON pn.id_periodo = hn.id_periodo
             ORDER BY hn.creado_en DESC`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

// Obtener detalle completo de una nómina para el recibo
const getDetalleNomina = async (id_nomina) => {
    const conn = await getConnection();
    try {
        // Encabezado
        const resHeader = await conn.execute(
            `SELECT hn.id_nomina, hn.fecha_pago, hn.total_percepciones,
                    hn.total_deducciones, hn.liquido_a_pagar, hn.estado, hn.observacion,
                    e.id_empleado, e.nombre AS nombre_empleado, e.correo, e.cuenta_bancaria,
                    p.nombre_puesto, p.sueldo_base,
                    d.nombre_departamento,
                    j.nombre_jornada,
                    pn.numero_periodo, pn.anio, pn.fecha_inicio, pn.fecha_fin
             FROM HISTORICO_NOMINA hn
             JOIN EMPLEADO       e  ON e.id_empleado  = hn.id_empleado
             JOIN PUESTOS        p  ON p.id_puesto    = e.id_puesto
             JOIN DEPARTAMENTOS  d  ON d.id_departamento = p.id_departamento
             JOIN JORNADAS       j  ON j.id_jornada   = e.id_jornada
             JOIN PERIODO_NOMINA pn ON pn.id_periodo  = hn.id_periodo
             WHERE hn.id_nomina = :id`,
            { id: id_nomina },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // Percepciones
        const resPerc = await conn.execute(
            `SELECT hpd.monto, pc.nombre_percepcion,
                    hpd.id_hora_extra, rhe.cantidad, rhe.factor, rhe.fecha AS fecha_he
             FROM HISTORICO_PERCEPCIONES_DETALLE hpd
             JOIN PERCEPCIONES pc ON pc.id_percepcion = hpd.id_percepcion
             LEFT JOIN REGISTRO_HORAS_EXTRA rhe ON rhe.id_hora_extra = hpd.id_hora_extra
             WHERE hpd.id_nomina = :id`,
            { id: id_nomina },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // Deducciones
        const resDed = await conn.execute(
            `SELECT hdd.monto, dc.nombre_deduccion,
                    hdd.id_registro_falta, rf.fecha AS fecha_falta, f.descripcion AS tipo_falta
             FROM HISTORICO_DEDUCCIONES_DETALLE hdd
             JOIN DEDUCCIONES dc ON dc.id_deduccion = hdd.id_deduccion
             LEFT JOIN REGISTRO_FALTAS rf ON rf.id_registro_falta = hdd.id_registro_falta
             LEFT JOIN FALTAS f ON f.id_falta = rf.id_falta
             WHERE hdd.id_nomina = :id`,
            { id: id_nomina },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        return {
            encabezado: resHeader.rows[0] || null,
            percepciones: resPerc.rows,
            deducciones: resDed.rows
        };
    } finally { await conn.close(); }
};

// Obtener todos los empleados ACTIVOS para cálculo masivo
const getAllEmpleadosActivos = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT e.id_empleado, e.nombre, e.correo, e.cuenta_bancaria,
                    e.porcentaje_pago_comision, e.estado,
                    p.id_puesto, p.nombre_puesto, p.sueldo_base,
                    j.id_jornada, j.nombre_jornada, j.horas_diarias,
                    d.nombre_departamento
             FROM EMPLEADO e
             JOIN PUESTOS      p ON p.id_puesto      = e.id_puesto
             JOIN JORNADAS     j ON j.id_jornada     = e.id_jornada
             JOIN DEPARTAMENTOS d ON d.id_departamento = p.id_departamento
             WHERE e.estado = 'ACTIVO'
             ORDER BY e.id_empleado`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

module.exports = {
    getDatosEmpleado,
    getHorasExtra,
    getFaltas,
    getOCrearPeriodo,
    getNominaExistente,
    getPrestamoPendiente,
    getSeguroActivo,
    procesarNomina,
    getHistorico,
    getDetalleNomina,
    getAllEmpleadosActivos
};