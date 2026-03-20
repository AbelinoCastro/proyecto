const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');

const getAll = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT e.id_empleado, e.nombre, e.fecha_nacimiento, e.genero, e.nacionalidad,
              e.no_afiliacion_igss, e.no_dpi_permiso, e.fecha_inicio, e.fecha_fin,
              e.id_puesto, p.nombre_puesto, e.correo, e.telefono, e.cuenta_bancaria,
              e.estado, e.porcentaje_pago_comision, e.id_jornada, j.nombre_jornada,
              e.id_motivo_baja, m.descripcion AS motivo_baja
       FROM EMPLEADO e
       JOIN PUESTOS p   ON e.id_puesto     = p.id_puesto
       JOIN JORNADAS j  ON e.id_jornada    = j.id_jornada
       LEFT JOIN MOTIVO_BAJA m ON e.id_motivo_baja = m.id_motivo_baja
       ORDER BY e.id_empleado`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

const getById = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT e.id_empleado, e.nombre, e.fecha_nacimiento, e.genero, e.nacionalidad,
              e.no_afiliacion_igss, e.no_dpi_permiso, e.fecha_inicio, e.fecha_fin,
              e.id_puesto, p.nombre_puesto, e.correo, e.telefono, e.cuenta_bancaria,
              e.estado, e.porcentaje_pago_comision, e.id_jornada, j.nombre_jornada,
              e.id_motivo_baja, m.descripcion AS motivo_baja
       FROM EMPLEADO e
       JOIN PUESTOS p   ON e.id_puesto     = p.id_puesto
       JOIN JORNADAS j  ON e.id_jornada    = j.id_jornada
       LEFT JOIN MOTIVO_BAJA m ON e.id_motivo_baja = m.id_motivo_baja
       WHERE e.id_empleado = :id`,
            { id }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } finally { await conn.close(); }
};

const create = async ({ nombre, fecha_nacimiento, genero, nacionalidad, no_afiliacion_igss,
    no_dpi_permiso, fecha_inicio, id_puesto, id_jornada, correo, telefono, cuenta_bancaria,
    estado, porcentaje_pago_comision }) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `INSERT INTO EMPLEADO (nombre, fecha_nacimiento, genero, nacionalidad, no_afiliacion_igss,
        no_dpi_permiso, fecha_inicio, id_puesto, id_jornada, correo, telefono, cuenta_bancaria,
        estado, porcentaje_pago_comision)
       VALUES (:nombre, TO_DATE(:fecha_nacimiento,'YYYY-MM-DD'), :genero, :nacionalidad,
        :no_afiliacion_igss, :no_dpi_permiso, TO_DATE(:fecha_inicio,'YYYY-MM-DD'),
        :id_puesto, :id_jornada, :correo, :telefono, :cuenta_bancaria, :estado, :porcentaje_pago_comision)
       RETURNING id_empleado INTO :id_empleado`,
            {
                nombre, fecha_nacimiento, genero, nacionalidad, no_afiliacion_igss, no_dpi_permiso,
                fecha_inicio, id_puesto, id_jornada,
                correo: correo || null, telefono: telefono || null, cuenta_bancaria: cuenta_bancaria || null,
                estado: estado || 'ACTIVO', porcentaje_pago_comision: porcentaje_pago_comision || 0,
                id_empleado: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            { autoCommit: true }
        );
        return await getById(result.outBinds.id_empleado[0]);
    } finally { await conn.close(); }
};

const update = async (id, { nombre, genero, nacionalidad, no_afiliacion_igss, no_dpi_permiso,
    id_puesto, id_jornada, correo, telefono, cuenta_bancaria, estado, porcentaje_pago_comision }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `UPDATE EMPLEADO SET nombre = :nombre, genero = :genero, nacionalidad = :nacionalidad,
        no_afiliacion_igss = :no_afiliacion_igss, no_dpi_permiso = :no_dpi_permiso,
        id_puesto = :id_puesto, id_jornada = :id_jornada, correo = :correo,
        telefono = :telefono, cuenta_bancaria = :cuenta_bancaria, estado = :estado,
        porcentaje_pago_comision = :porcentaje_pago_comision
       WHERE id_empleado = :id`,
            {
                nombre, genero, nacionalidad, no_afiliacion_igss, no_dpi_permiso,
                id_puesto, id_jornada,
                correo: correo || null, telefono: telefono || null, cuenta_bancaria: cuenta_bancaria || null,
                estado, porcentaje_pago_comision: porcentaje_pago_comision || 0, id
            },
            { autoCommit: true }
        );
        return await getById(id);
    } finally { await conn.close(); }
};

const darBaja = async (id, { id_motivo_baja, fecha_fin }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `UPDATE EMPLEADO SET estado = 'INACTIVO', id_motivo_baja = :id_motivo_baja,
        fecha_fin = TO_DATE(:fecha_fin,'YYYY-MM-DD') WHERE id_empleado = :id`,
            { id_motivo_baja, fecha_fin, id },
            { autoCommit: true }
        );
        return await getById(id);
    } finally { await conn.close(); }
};

const remove = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `DELETE FROM EMPLEADO WHERE id_empleado = :id`, { id }, { autoCommit: true }
        );
        return result.rowsAffected;
    } finally { await conn.close(); }
};

const changeEstado = async (id, estado) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `UPDATE EMPLEADO SET estado = :estado WHERE id_empleado = :id`,
            { estado, id }, { autoCommit: true }
        );
        return result.rowsAffected;
    } finally { await conn.close(); }
};

module.exports = { getAll, getById, create, update, darBaja, changeEstado, remove };