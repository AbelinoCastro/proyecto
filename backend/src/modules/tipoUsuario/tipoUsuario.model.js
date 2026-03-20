const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');

const getAll = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT id_tipo_usuario, nombre, descripcion, estado FROM TIPO_USUARIO ORDER BY id_tipo_usuario`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally {
        await conn.close();
    }
};

const getById = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT id_tipo_usuario, nombre, descripcion, estado FROM TIPO_USUARIO WHERE id_tipo_usuario = :id`,
            { id },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } finally {
        await conn.close();
    }
};

const create = async ({ id_tipo_usuario, nombre, descripcion, estado }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `INSERT INTO TIPO_USUARIO (id_tipo_usuario, nombre, descripcion, estado)
       VALUES (:id_tipo_usuario, :nombre, :descripcion, :estado)`,
            { id_tipo_usuario, nombre, descripcion: descripcion || null, estado: estado || 'ACTIVO' },
            { autoCommit: true }
        );
        return await getById(id_tipo_usuario);
    } finally {
        await conn.close();
    }
};

const update = async (id, { nombre, descripcion, estado }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `UPDATE TIPO_USUARIO SET nombre = :nombre, descripcion = :descripcion, estado = :estado
       WHERE id_tipo_usuario = :id`,
            { nombre, descripcion: descripcion || null, estado, id },
            { autoCommit: true }
        );
        return await getById(id);
    } finally {
        await conn.close();
    }
};

const changeEstado = async (id, estado) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `UPDATE TIPO_USUARIO SET estado = :estado WHERE id_tipo_usuario = :id`,
            { estado, id },
            { autoCommit: true }
        );
        return result.rowsAffected;
    } finally {
        await conn.close();
    }
};

const remove = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `DELETE FROM TIPO_USUARIO WHERE id_tipo_usuario = :id`,
            { id },
            { autoCommit: true }
        );
        return result.rowsAffected;
    } finally {
        await conn.close();
    }
};

module.exports = { getAll, getById, create, update, changeEstado, remove };