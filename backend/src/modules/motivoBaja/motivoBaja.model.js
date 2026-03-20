const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');

const getAll = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT id_motivo_baja, descripcion, estado FROM MOTIVO_BAJA ORDER BY id_motivo_baja`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

const getById = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT id_motivo_baja, descripcion, estado FROM MOTIVO_BAJA WHERE id_motivo_baja = :id`,
            { id }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } finally { await conn.close(); }
};

const create = async ({ id_motivo_baja, descripcion, estado }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `INSERT INTO MOTIVO_BAJA (id_motivo_baja, descripcion, estado) VALUES (:id_motivo_baja, :descripcion, :estado)`,
            { id_motivo_baja, descripcion, estado: estado || 'ACTIVO' },
            { autoCommit: true }
        );
        return await getById(id_motivo_baja);
    } finally { await conn.close(); }
};

const update = async (id, { descripcion, estado }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `UPDATE MOTIVO_BAJA SET descripcion = :descripcion, estado = :estado WHERE id_motivo_baja = :id`,
            { descripcion, estado, id },
            { autoCommit: true }
        );
        return await getById(id);
    } finally { await conn.close(); }
};

const remove = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(`DELETE FROM MOTIVO_BAJA WHERE id_motivo_baja = :id`, { id }, { autoCommit: true });
        return result.rowsAffected;
    } finally { await conn.close(); }
};

module.exports = { getAll, getById, create, update, remove };