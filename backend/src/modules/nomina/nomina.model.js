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

// Guardar la nómina procesada con todos sus detalles
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

        // 2. Insertar detalles de percepciones
        for (const det of detalles_percepciones) {
            await conn.execute(
                `INSERT INTO HISTORICO_PERCEPCIONES_DETALLE
                    (id_nomina, id_percepcion, id_hora_extra, monto)
                 VALUES (:id_nomina, :id_percepcion, :id_hora_extra, :monto)`,
                {
                    id_nomina,
                    id_percepcion: det.id_percepcion,
                    id_hora_extra: det.id_hora_extra || null,
                    monto: det.monto
                },
                { autoCommit: false }
            );
        }

        // 3. Insertar detalles de deducciones
        for (const det of detalles_deducciones) {
            await conn.execute(
                `INSERT INTO HISTORICO_DEDUCCIONES_DETALLE
                    (id_nomina, id_deduccion, id_registro_falta, monto)
                 VALUES (:id_nomina, :id_deduccion, :id_registro_falta, :monto)`,
                {
                    id_nomina,
                    id_deduccion: det.id_deduccion,
                    id_registro_falta: det.id_registro_falta || null,
                    monto: det.monto
                },
                { autoCommit: false }
            );
        }

        await conn.commit();
        return id_nomina;
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
    procesarNomina,
    getHistorico,
    getDetalleNomina,
    getAllEmpleadosActivos
};