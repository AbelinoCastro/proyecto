const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');

const getAll = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT id_jornada, nombre_jornada, descripcion, hora_inicio, hora_fin, horas_diarias FROM JORNADAS ORDER BY id_jornada`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

const getById = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT id_jornada, nombre_jornada, descripcion, hora_inicio, hora_fin, horas_diarias FROM JORNADAS WHERE id_jornada = :id`,
            { id }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } finally { await conn.close(); }
};

const create = async ({ id_jornada, nombre_jornada, descripcion, hora_inicio, hora_fin, horas_diarias }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `INSERT INTO JORNADAS (id_jornada, nombre_jornada, descripcion, hora_inicio, hora_fin, horas_diarias)
       VALUES (:id_jornada, :nombre_jornada, :descripcion, :hora_inicio, :hora_fin, :horas_diarias)`,
            { id_jornada, nombre_jornada, descripcion: descripcion || null, hora_inicio: hora_inicio || null, hora_fin: hora_fin || null, horas_diarias },
            { autoCommit: true }
        );
        return await getById(id_jornada);
    } finally { await conn.close(); }
};

const update = async (id, { nombre_jornada, descripcion, hora_inicio, hora_fin, horas_diarias }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `UPDATE JORNADAS SET nombre_jornada = :nombre_jornada, descripcion = :descripcion,
       hora_inicio = :hora_inicio, hora_fin = :hora_fin, horas_diarias = :horas_diarias
       WHERE id_jornada = :id`,
            { nombre_jornada, descripcion: descripcion || null, hora_inicio: hora_inicio || null, hora_fin: hora_fin || null, horas_diarias, id },
            { autoCommit: true }
        );
        return await getById(id);
    } finally { await conn.close(); }
};

const remove = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(`DELETE FROM JORNADAS WHERE id_jornada = :id`, { id }, { autoCommit: true });
        return result.rowsAffected;
    } finally { await conn.close(); }
};

module.exports = { getAll, getById, create, update, remove };