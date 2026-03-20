const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');

const getAll = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT id_departamento, nombre_departamento, descripcion, estado FROM DEPARTAMENTOS ORDER BY id_departamento`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

const getById = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT id_departamento, nombre_departamento, descripcion, estado FROM DEPARTAMENTOS WHERE id_departamento = :id`,
            { id }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } finally { await conn.close(); }
};

const create = async ({ id_departamento, nombre_departamento, descripcion, estado }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `INSERT INTO DEPARTAMENTOS (id_departamento, nombre_departamento, descripcion, estado)
       VALUES (:id_departamento, :nombre_departamento, :descripcion, :estado)`,
            { id_departamento, nombre_departamento, descripcion: descripcion || null, estado: estado || 'ACTIVO' },
            { autoCommit: true }
        );
        return await getById(id_departamento);
    } finally { await conn.close(); }
};

const update = async (id, { nombre_departamento, descripcion, estado }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `UPDATE DEPARTAMENTOS SET nombre_departamento = :nombre_departamento, descripcion = :descripcion, estado = :estado
       WHERE id_departamento = :id`,
            { nombre_departamento, descripcion: descripcion || null, estado, id },
            { autoCommit: true }
        );
        return await getById(id);
    } finally { await conn.close(); }
};

const remove = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `DELETE FROM DEPARTAMENTOS WHERE id_departamento = :id`,
            { id }, { autoCommit: true }
        );
        return result.rowsAffected;
    } finally { await conn.close(); }
};

module.exports = { getAll, getById, create, update, remove };