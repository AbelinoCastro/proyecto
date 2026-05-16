const oracledb = require('oracledb');
const { getConnection } = require('../../config/db');
const { success, error } = require('../../helpers/response');

// GET /api/permisos/modulos
const getModulos = async (req, res) => {
    try {
        const conn = await getConnection();
        try {
            const r = await conn.execute(
                `SELECT id_modulo, nombre, ruta, icono, orden
                 FROM MODULOS ORDER BY orden`,
                [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            return success(res, r.rows);
        } finally { await conn.close(); }
    } catch (err) { return error(res, 'Error al obtener módulos', 500, err.message); }
};

// GET /api/permisos/roles
const getRoles = async (req, res) => {
    try {
        const conn = await getConnection();
        try {
            const r = await conn.execute(
                `SELECT id_tipo_usuario, nombre FROM TIPO_USUARIO ORDER BY id_tipo_usuario`,
                [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            return success(res, r.rows);
        } finally { await conn.close(); }
    } catch (err) { return error(res, 'Error al obtener roles', 500, err.message); }
};

// GET /api/permisos — devuelve matriz completa de permisos por rol
const getPermisos = async (req, res) => {
    try {
        const conn = await getConnection();
        try {
            const r = await conn.execute(
                `SELECT id_tipo_usuario, id_modulo, puede_ver, puede_crear, puede_editar, puede_eliminar
                 FROM PERMISOS_TIPO_USUARIO`,
                [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            return success(res, r.rows);
        } finally { await conn.close(); }
    } catch (err) { return error(res, 'Error al obtener permisos', 500, err.message); }
};

// PUT /api/permisos  body: { id_tipo_usuario, id_modulo, puede_ver, puede_crear, puede_editar, puede_eliminar }
const updatePermiso = async (req, res) => {
    try {
        const { id_tipo_usuario, id_modulo, puede_ver, puede_crear, puede_editar, puede_eliminar } = req.body;
        if (!id_tipo_usuario || !id_modulo)
            return error(res, 'id_tipo_usuario e id_modulo son requeridos', 400);

        const conn = await getConnection();
        try {
            await conn.execute(
                `MERGE INTO PERMISOS_TIPO_USUARIO p
                 USING (SELECT :rol AS rol, :mod AS mod FROM dual) src
                 ON (p.id_tipo_usuario = src.rol AND p.id_modulo = src.mod)
                 WHEN MATCHED THEN
                    UPDATE SET puede_ver = :ver, puede_crear = :crear,
                               puede_editar = :editar, puede_eliminar = :eliminar
                 WHEN NOT MATCHED THEN
                    INSERT (id_tipo_usuario, id_modulo, puede_ver, puede_crear, puede_editar, puede_eliminar)
                    VALUES (:rol, :mod, :ver, :crear, :editar, :eliminar)`,
                {
                    rol: id_tipo_usuario,
                    mod: id_modulo,
                    ver:      puede_ver      ? 1 : 0,
                    crear:    puede_crear    ? 1 : 0,
                    editar:   puede_editar   ? 1 : 0,
                    eliminar: puede_eliminar ? 1 : 0,
                },
                { autoCommit: true }
            );
            return success(res, null, 'Permiso actualizado');
        } finally { await conn.close(); }
    } catch (err) { return error(res, 'Error al actualizar permiso', 500, err.message); }
};

module.exports = { getModulos, getRoles, getPermisos, updatePermiso };
