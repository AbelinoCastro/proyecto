const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');

// ──────────────────────────────────────────────
// DEDUCCIONES POR EMPLEADO
// ──────────────────────────────────────────────

const getDeduccionesByEmpleado = async (id_empleado) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT ed.id_emp_deduccion, ed.id_empleado, ed.id_deduccion,
                    d.nombre_deduccion, ed.monto, ed.activo, ed.creado_en
             FROM EMPLEADO_DEDUCCIONES ed
             JOIN DEDUCCIONES d ON d.id_deduccion = ed.id_deduccion
             WHERE ed.id_empleado = :id
             ORDER BY ed.creado_en`,
            { id: Number(id_empleado) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

const createDeduccion = async ({ id_empleado, id_deduccion, monto }) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `INSERT INTO EMPLEADO_DEDUCCIONES (id_empleado, id_deduccion, monto)
             VALUES (:id_empleado, :id_deduccion, :monto)
             RETURNING id_emp_deduccion INTO :id`,
            {
                id_empleado: Number(id_empleado),
                id_deduccion,
                monto: parseFloat(monto),
                id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            { autoCommit: true }
        );
        return { id_emp_deduccion: result.outBinds.id[0] };
    } finally { await conn.close(); }
};

const updateDeduccion = async (id, { monto, activo }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `UPDATE EMPLEADO_DEDUCCIONES SET monto = :monto, activo = :activo
             WHERE id_emp_deduccion = :id`,
            { monto: parseFloat(monto), activo, id: Number(id) },
            { autoCommit: true }
        );
    } finally { await conn.close(); }
};

const removeDeduccion = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `DELETE FROM EMPLEADO_DEDUCCIONES WHERE id_emp_deduccion = :id`,
            { id: Number(id) },
            { autoCommit: true }
        );
        return result.rowsAffected;
    } finally { await conn.close(); }
};

// ──────────────────────────────────────────────
// PERCEPCIONES POR EMPLEADO
// ──────────────────────────────────────────────

const getPercepcionesByEmpleado = async (id_empleado) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT ep.id_emp_percepcion, ep.id_empleado, ep.id_percepcion,
                    p.nombre_percepcion, ep.monto, ep.activo, ep.creado_en
             FROM EMPLEADO_PERCEPCIONES ep
             JOIN PERCEPCIONES p ON p.id_percepcion = ep.id_percepcion
             WHERE ep.id_empleado = :id
             ORDER BY ep.creado_en`,
            { id: Number(id_empleado) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

const createPercepcion = async ({ id_empleado, id_percepcion, monto }) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `INSERT INTO EMPLEADO_PERCEPCIONES (id_empleado, id_percepcion, monto)
             VALUES (:id_empleado, :id_percepcion, :monto)
             RETURNING id_emp_percepcion INTO :id`,
            {
                id_empleado: Number(id_empleado),
                id_percepcion,
                monto: parseFloat(monto),
                id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            { autoCommit: true }
        );
        return { id_emp_percepcion: result.outBinds.id[0] };
    } finally { await conn.close(); }
};

const updatePercepcion = async (id, { monto, activo }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `UPDATE EMPLEADO_PERCEPCIONES SET monto = :monto, activo = :activo
             WHERE id_emp_percepcion = :id`,
            { monto: parseFloat(monto), activo, id: Number(id) },
            { autoCommit: true }
        );
    } finally { await conn.close(); }
};

const removePercepcion = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `DELETE FROM EMPLEADO_PERCEPCIONES WHERE id_emp_percepcion = :id`,
            { id: Number(id) },
            { autoCommit: true }
        );
        return result.rowsAffected;
    } finally { await conn.close(); }
};

// ──────────────────────────────────────────────
// LECTURA PARA NÓMINA (solo activos)
// ──────────────────────────────────────────────

const getDeduccionesActivasByEmpleado = async (id_empleado) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT ed.id_deduccion, d.nombre_deduccion, ed.monto
             FROM EMPLEADO_DEDUCCIONES ed
             JOIN DEDUCCIONES d ON d.id_deduccion = ed.id_deduccion
             WHERE ed.id_empleado = :id AND ed.activo = 'S'`,
            { id: Number(id_empleado) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

const getPercepcionesActivasByEmpleado = async (id_empleado) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT ep.id_percepcion, p.nombre_percepcion, ep.monto
             FROM EMPLEADO_PERCEPCIONES ep
             JOIN PERCEPCIONES p ON p.id_percepcion = ep.id_percepcion
             WHERE ep.id_empleado = :id AND ep.activo = 'S'`,
            { id: Number(id_empleado) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

module.exports = {
    getDeduccionesByEmpleado, createDeduccion, updateDeduccion, removeDeduccion,
    getPercepcionesByEmpleado, createPercepcion, updatePercepcion, removePercepcion,
    getDeduccionesActivasByEmpleado, getPercepcionesActivasByEmpleado
};
