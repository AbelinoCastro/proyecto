const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');

const getAll = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT id_falta, descripcion, es_pagado FROM FALTAS ORDER BY id_falta`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

const getById = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT id_falta, descripcion, es_pagado FROM FALTAS WHERE id_falta = :id`,
            { id }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } finally { await conn.close(); }
};

const create = async ({ descripcion, es_pagado }) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `INSERT INTO FALTAS (descripcion, es_pagado) VALUES (:descripcion, :es_pagado) RETURNING id_falta INTO :id_falta`,
            { descripcion, es_pagado: es_pagado || 'N', id_falta: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
            { autoCommit: true }
        );
        return await getById(result.outBinds.id_falta[0]);
    } finally { await conn.close(); }
};

const update = async (id, { descripcion, es_pagado }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `UPDATE FALTAS SET descripcion = :descripcion, es_pagado = :es_pagado WHERE id_falta = :id`,
            { descripcion, es_pagado, id },
            { autoCommit: true }
        );
        return await getById(id);
    } finally { await conn.close(); }
};

const remove = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(`DELETE FROM FALTAS WHERE id_falta = :id`, { id }, { autoCommit: true });
        return result.rowsAffected;
    } finally { await conn.close(); }
};

module.exports = { getAll, getById, create, update, remove };