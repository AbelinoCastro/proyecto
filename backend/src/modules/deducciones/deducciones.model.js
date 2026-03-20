const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');

const getAll = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT id_deduccion, nombre_deduccion, descripcion_formula FROM DEDUCCIONES ORDER BY id_deduccion`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

const getById = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT id_deduccion, nombre_deduccion, descripcion_formula FROM DEDUCCIONES WHERE id_deduccion = :id`,
            { id }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } finally { await conn.close(); }
};

const create = async ({ id_deduccion, nombre_deduccion, descripcion_formula }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `INSERT INTO DEDUCCIONES (id_deduccion, nombre_deduccion, descripcion_formula) VALUES (:id_deduccion, :nombre_deduccion, :descripcion_formula)`,
            { id_deduccion, nombre_deduccion, descripcion_formula: descripcion_formula || null },
            { autoCommit: true }
        );
        return await getById(id_deduccion);
    } finally { await conn.close(); }
};

const update = async (id, { nombre_deduccion, descripcion_formula }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `UPDATE DEDUCCIONES SET nombre_deduccion = :nombre_deduccion, descripcion_formula = :descripcion_formula WHERE id_deduccion = :id`,
            { nombre_deduccion, descripcion_formula: descripcion_formula || null, id },
            { autoCommit: true }
        );
        return await getById(id);
    } finally { await conn.close(); }
};

const remove = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(`DELETE FROM DEDUCCIONES WHERE id_deduccion = :id`, { id }, { autoCommit: true });
        return result.rowsAffected;
    } finally { await conn.close(); }
};

module.exports = { getAll, getById, create, update, remove };