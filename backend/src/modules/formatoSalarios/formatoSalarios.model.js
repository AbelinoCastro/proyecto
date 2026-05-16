const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');

// Datos del patrono (entidad)
const getPatrono = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT razon_social, direccion, nit, numero_patronal
             FROM PATRONO
             ORDER BY id_patrono FETCH FIRST 1 ROW ONLY`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } finally { await conn.close(); }
};

// Datos completos del empleado
const getEmpleado = async (id_empleado) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT e.id_empleado, e.nombre, e.fecha_nacimiento, e.genero, e.nacionalidad,
                    e.no_afiliacion_igss, e.no_dpi_permiso, e.fecha_inicio, e.fecha_fin,
                    p.nombre_puesto
             FROM EMPLEADO e
             JOIN PUESTOS p ON p.id_puesto = e.id_puesto
             WHERE e.id_empleado = :id`,
            { id: id_empleado },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } finally { await conn.close(); }
};

// Todas las nóminas PAGADAS del empleado en el año + detalle de percepciones/deducciones
const getNominasPagadasAnio = async (id_empleado, anio) => {
    const conn = await getConnection();
    try {
        const resNominas = await conn.execute(
            `SELECT hn.id_nomina, hn.fecha_pago, hn.total_percepciones,
                    hn.total_deducciones, hn.liquido_a_pagar, hn.observacion,
                    pn.numero_periodo, pn.anio, pn.fecha_inicio AS periodo_inicio,
                    pn.fecha_fin AS periodo_fin,
                    p.sueldo_base
             FROM HISTORICO_NOMINA hn
             JOIN PERIODO_NOMINA pn ON pn.id_periodo = hn.id_periodo
             JOIN EMPLEADO e        ON e.id_empleado = hn.id_empleado
             JOIN PUESTOS p         ON p.id_puesto    = e.id_puesto
             WHERE hn.id_empleado = :id
               AND hn.estado      = 'PAGADO'
               AND pn.anio        = :anio
             ORDER BY pn.numero_periodo`,
            { id: id_empleado, anio },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const nominas = resNominas.rows;
        if (nominas.length === 0) return [];

        const ids = nominas.map(n => n.ID_NOMINA);
        const binds = {};
        const placeholders = ids.map((id, i) => { binds[`id${i}`] = id; return `:id${i}`; }).join(',');

        // Percepciones
        const resPerc = await conn.execute(
            `SELECT hpd.id_nomina, hpd.monto, pc.id_percepcion, pc.nombre_percepcion,
                    rhe.cantidad AS he_cantidad, rhe.factor AS he_factor
             FROM HISTORICO_PERCEPCIONES_DETALLE hpd
             JOIN PERCEPCIONES pc ON pc.id_percepcion = hpd.id_percepcion
             LEFT JOIN REGISTRO_HORAS_EXTRA rhe ON rhe.id_hora_extra = hpd.id_hora_extra
             WHERE hpd.id_nomina IN (${placeholders})`,
            binds, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // Deducciones
        const resDed = await conn.execute(
            `SELECT hdd.id_nomina, hdd.monto, d.id_deduccion, d.nombre_deduccion
             FROM HISTORICO_DEDUCCIONES_DETALLE hdd
             JOIN DEDUCCIONES d ON d.id_deduccion = hdd.id_deduccion
             WHERE hdd.id_nomina IN (${placeholders})`,
            binds, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // Agrupar percepciones y deducciones por nómina
        return nominas.map(n => ({
            ...n,
            PERCEPCIONES: resPerc.rows.filter(p => p.ID_NOMINA === n.ID_NOMINA),
            DEDUCCIONES:  resDed.rows.filter(d => d.ID_NOMINA  === n.ID_NOMINA),
        }));
    } finally { await conn.close(); }
};

module.exports = { getPatrono, getEmpleado, getNominasPagadasAnio };
