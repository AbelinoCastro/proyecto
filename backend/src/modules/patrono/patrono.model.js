const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');

const getPatrono = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT id_patrono, razon_social, direccion, telefono, numero_patronal, cod_formulario, activo, creado_en
       FROM PATRONO
       ORDER BY id_patrono
       FETCH FIRST 1 ROW ONLY`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } finally {
        await conn.close();
    }
};

const create = async ({ razon_social, direccion, telefono, numero_patronal, cod_formulario }) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `INSERT INTO PATRONO (razon_social, direccion, telefono, numero_patronal, cod_formulario)
       VALUES (:razon_social, :direccion, :telefono, :numero_patronal, :cod_formulario)`,
            {
                razon_social,
                direccion,
                telefono: telefono || null,
                numero_patronal,
                cod_formulario: cod_formulario || null,
            },
            { autoCommit: true }
        );
        return await getPatrono();
    } finally {
        await conn.close();
    }
};

const update = async (id, { razon_social, direccion, telefono, numero_patronal, cod_formulario, activo }) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `UPDATE PATRONO
       SET razon_social    = :razon_social,
           direccion       = :direccion,
           telefono        = :telefono,
           numero_patronal = :numero_patronal,
           cod_formulario  = :cod_formulario,
           activo          = :activo
       WHERE id_patrono = :id`,
            {
                razon_social,
                direccion,
                telefono:       telefono       || null,
                numero_patronal,
                cod_formulario: cod_formulario || null,
                activo:         activo ?? 1,
                id,
            },
            { autoCommit: true }
        );
        if (result.rowsAffected === 0) return null;
        return await getPatrono();
    } finally {
        await conn.close();
    }
};

module.exports = { getPatrono, create, update };