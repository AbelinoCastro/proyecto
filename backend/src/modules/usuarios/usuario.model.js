const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');
const bcrypt = require('bcrypt');
require('dotenv').config();

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

const getAll = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT u.id_usuario, u.id_tipo_usuario, t.nombre AS tipo_usuario,
              u.id_empleado, e.nombre AS empleado,
              u.username, u.estado, u.creado_en
       FROM USUARIOS u
       JOIN TIPO_USUARIO t ON u.id_tipo_usuario = t.id_tipo_usuario
       JOIN EMPLEADO e     ON u.id_empleado     = e.id_empleado
       ORDER BY u.id_usuario`,
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
            `SELECT u.id_usuario, u.id_tipo_usuario, t.nombre AS tipo_usuario,
              u.id_empleado, e.nombre AS empleado,
              u.username, u.estado, u.creado_en
       FROM USUARIOS u
       JOIN TIPO_USUARIO t ON u.id_tipo_usuario = t.id_tipo_usuario
       JOIN EMPLEADO e     ON u.id_empleado     = e.id_empleado
       WHERE u.id_usuario = :id`,
            { id },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } finally {
        await conn.close();
    }
};

const create = async ({ id_tipo_usuario, id_empleado, username, password }) => {
    const conn = await getConnection();
    try {
        const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const result = await conn.execute(
            `INSERT INTO USUARIOS (id_tipo_usuario, id_empleado, username, password_hash, estado)
       VALUES (:id_tipo_usuario, :id_empleado, :username, :password_hash, 'ACTIVO')
       RETURNING id_usuario INTO :id_usuario`,
            {
                id_tipo_usuario,
                id_empleado,
                username,
                password_hash,
                id_usuario: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            { autoCommit: true }
        );
        const newId = result.outBinds.id_usuario[0];
        return await getById(newId);
    } finally {
        await conn.close();
    }
};

const update = async (id, { id_tipo_usuario, username }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `UPDATE USUARIOS SET id_tipo_usuario = :id_tipo_usuario, username = :username
       WHERE id_usuario = :id`,
            { id_tipo_usuario, username, id },
            { autoCommit: true }
        );
        return await getById(id);
    } finally {
        await conn.close();
    }
};

const changePassword = async (id, newPassword) => {
    const conn = await getConnection();
    try {
        const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        const result = await conn.execute(
            `UPDATE USUARIOS SET password_hash = :password_hash WHERE id_usuario = :id`,
            { password_hash, id },
            { autoCommit: true }
        );
        return result.rowsAffected;
    } finally {
        await conn.close();
    }
};

const changeEstado = async (id, estado) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `UPDATE USUARIOS SET estado = :estado WHERE id_usuario = :id`,
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
            `DELETE FROM USUARIOS WHERE id_usuario = :id`,
            { id },
            { autoCommit: true }
        );
        return result.rowsAffected;
    } finally {
        await conn.close();
    }
};

module.exports = { getAll, getById, create, update, changePassword, changeEstado, remove };