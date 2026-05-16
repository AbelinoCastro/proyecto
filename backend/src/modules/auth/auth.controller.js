const bcrypt = require('bcrypt');
const oracledb = require('oracledb');
const { getConnection } = require('../../config/db');
const { signToken } = require('../../middlewares/auth');
const { success, error } = require('../../helpers/response');

// POST /api/auth/login  { username, password }
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return error(res, 'Usuario y contraseña requeridos', 400);

        const conn = await getConnection();
        try {
            const result = await conn.execute(
                `SELECT u.id_usuario, u.username, u.password_hash, u.estado,
                        u.id_tipo_usuario, t.nombre AS rol_nombre,
                        u.id_empleado, e.nombre AS nombre_empleado
                 FROM USUARIOS u
                 JOIN TIPO_USUARIO t ON t.id_tipo_usuario = u.id_tipo_usuario
                 LEFT JOIN EMPLEADO e ON e.id_empleado = u.id_empleado
                 WHERE LOWER(u.username) = LOWER(:username)`,
                { username },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            const usr = result.rows[0];
            if (!usr) return error(res, 'Credenciales inválidas', 401);
            if (usr.ESTADO !== 'ACTIVO') return error(res, 'Usuario inactivo', 403);

            const ok = await bcrypt.compare(password, usr.PASSWORD_HASH);
            if (!ok) return error(res, 'Credenciales inválidas', 401);

            // Obtener permisos del rol
            const perms = await conn.execute(
                `SELECT p.id_modulo, m.nombre, m.ruta, m.icono, m.orden,
                        p.puede_ver, p.puede_crear, p.puede_editar, p.puede_eliminar
                 FROM PERMISOS_TIPO_USUARIO p
                 JOIN MODULOS m ON m.id_modulo = p.id_modulo
                 WHERE p.id_tipo_usuario = :rol AND p.puede_ver = 1
                 ORDER BY m.orden`,
                { rol: usr.ID_TIPO_USUARIO },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            const token = signToken({
                id: usr.ID_USUARIO,
                username: usr.USERNAME,
                rol: usr.ID_TIPO_USUARIO,
                id_empleado: usr.ID_EMPLEADO,
            });

            return success(res, {
                token,
                user: {
                    id: usr.ID_USUARIO,
                    username: usr.USERNAME,
                    rol: usr.ID_TIPO_USUARIO,
                    rol_nombre: usr.ROL_NOMBRE,
                    id_empleado: usr.ID_EMPLEADO,
                    nombre_empleado: usr.NOMBRE_EMPLEADO,
                },
                permisos: perms.rows,
            }, 'Inicio de sesión exitoso');
        } finally { await conn.close(); }
    } catch (err) {
        return error(res, 'Error al iniciar sesión', 500, err.message);
    }
};

// GET /api/auth/me — devuelve usuario actual + permisos
const me = async (req, res) => {
    try {
        const conn = await getConnection();
        try {
            const userRes = await conn.execute(
                `SELECT u.id_usuario, u.username, u.id_tipo_usuario, t.nombre AS rol_nombre,
                        u.id_empleado, e.nombre AS nombre_empleado
                 FROM USUARIOS u
                 JOIN TIPO_USUARIO t ON t.id_tipo_usuario = u.id_tipo_usuario
                 LEFT JOIN EMPLEADO e ON e.id_empleado = u.id_empleado
                 WHERE u.id_usuario = :id AND u.estado = 'ACTIVO'`,
                { id: req.user.id },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            const usr = userRes.rows[0];
            if (!usr) return error(res, 'Usuario no encontrado', 404);

            const perms = await conn.execute(
                `SELECT p.id_modulo, m.nombre, m.ruta, m.icono, m.orden,
                        p.puede_ver, p.puede_crear, p.puede_editar, p.puede_eliminar
                 FROM PERMISOS_TIPO_USUARIO p
                 JOIN MODULOS m ON m.id_modulo = p.id_modulo
                 WHERE p.id_tipo_usuario = :rol AND p.puede_ver = 1
                 ORDER BY m.orden`,
                { rol: usr.ID_TIPO_USUARIO },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            return success(res, {
                user: {
                    id: usr.ID_USUARIO,
                    username: usr.USERNAME,
                    rol: usr.ID_TIPO_USUARIO,
                    rol_nombre: usr.ROL_NOMBRE,
                    id_empleado: usr.ID_EMPLEADO,
                    nombre_empleado: usr.NOMBRE_EMPLEADO,
                },
                permisos: perms.rows,
            });
        } finally { await conn.close(); }
    } catch (err) {
        return error(res, 'Error al obtener usuario', 500, err.message);
    }
};

module.exports = { login, me };
