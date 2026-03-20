const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');

const getAll = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT p.id_puesto, p.nombre_puesto, p.id_departamento, d.nombre_departamento, p.descripcion, p.sueldo_base
       FROM PUESTOS p JOIN DEPARTAMENTOS d ON p.id_departamento = d.id_departamento ORDER BY p.id_puesto`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

const getById = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT p.id_puesto, p.nombre_puesto, p.id_departamento, d.nombre_departamento, p.descripcion, p.sueldo_base
       FROM PUESTOS p JOIN DEPARTAMENTOS d ON p.id_departamento = d.id_departamento WHERE p.id_puesto = :id`,
            { id }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } finally { await conn.close(); }
};

const create = async ({ id_puesto, nombre_puesto, id_departamento, descripcion, sueldo_base }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `INSERT INTO PUESTOS (id_puesto, nombre_puesto, id_departamento, descripcion, sueldo_base)
       VALUES (:id_puesto, :nombre_puesto, :id_departamento, :descripcion, :sueldo_base)`,
            { id_puesto, nombre_puesto, id_departamento, descripcion: descripcion || null, sueldo_base },
            { autoCommit: true }
        );
        return await getById(id_puesto);
    } finally { await conn.close(); }
};

const update = async (id, { nombre_puesto, id_departamento, descripcion, sueldo_base }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `UPDATE PUESTOS SET nombre_puesto = :nombre_puesto, id_departamento = :id_departamento,
       descripcion = :descripcion, sueldo_base = :sueldo_base WHERE id_puesto = :id`,
            { nombre_puesto, id_departamento, descripcion: descripcion || null, sueldo_base, id },
            { autoCommit: true }
        );
        return await getById(id);
    } finally { await conn.close(); }
};

const remove = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(`DELETE FROM PUESTOS WHERE id_puesto = :id`, { id }, { autoCommit: true });
        return result.rowsAffected;
    } finally { await conn.close(); }
};

module.exports = { getAll, getById, create, update, remove };