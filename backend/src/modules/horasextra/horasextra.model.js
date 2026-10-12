const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');

const getAll = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT ID_HORA_EXTRA, ID_EMPLEADO, ID_JORNADA, ID_USUARIO, FECHA, CANTIDAD, FACTOR, JUSTIFICACION, ESTADO, CREADO_EN 
             FROM REGISTRO_HORAS_EXTRA 
             ORDER BY ID_HORA_EXTRA`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

const getById = async (id, connection = null) => {
    const conn = connection || await getConnection();
    try {
        const result = await conn.execute(
            `SELECT ID_HORA_EXTRA, ID_EMPLEADO, ID_JORNADA, ID_USUARIO, FECHA, CANTIDAD, FACTOR, JUSTIFICACION, ESTADO, CREADO_EN 
             FROM REGISTRO_HORAS_EXTRA 
             WHERE ID_HORA_EXTRA = :id`,
            { id }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } finally {
        if (!connection) await conn.close();
    }
};

const create = async ({ id_empleado, id_jornada, id_usuario, fecha, cantidad, factor, justificacion }) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `INSERT INTO REGISTRO_HORAS_EXTRA
             (ID_EMPLEADO, ID_JORNADA, ID_USUARIO, FECHA, CANTIDAD, FACTOR, JUSTIFICACION, ESTADO, CREADO_EN)
             VALUES (:id_empleado, :id_jornada, :id_usuario, TO_DATE(:fecha, 'YYYY-MM-DD'), :cantidad, :factor, :justificacion, 'PENDIENTE', SYSTIMESTAMP)
             RETURNING ID_HORA_EXTRA INTO :id_hora_extra`,
            {
                id_empleado:  Number(id_empleado),
                id_jornada,
                id_usuario:   Number(id_usuario),
                fecha,
                cantidad:     Number(cantidad),
                factor:       parseFloat(factor),
                justificacion: justificacion || null,
                id_hora_extra: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            { autoCommit: true }
        );
        return await getById(result.outBinds.id_hora_extra[0], conn);
    } finally { await conn.close(); }
};

module.exports = { getAll, getById, create };