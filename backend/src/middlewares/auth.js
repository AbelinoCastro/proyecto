const jwt = require('jsonwebtoken');
const { error } = require('../helpers/response');
const { getConnection } = require('../config/db');
const oracledb = require('oracledb');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('❌ JWT_SECRET no está definido en .env. La app no puede arrancar de forma segura.');
    process.exit(1);
}

// Genera un JWT con la información del usuario
const signToken = (payload) =>
    jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

// Middleware: requiere JWT válido en Authorization: Bearer <token>
const authRequired = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return error(res, 'Token requerido', 401);
    }
    try {
        const token = auth.slice(7);
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return error(res, 'Token inválido o expirado', 401);
    }
};

// Middleware: verifica que el rol del usuario tenga un permiso específico en un módulo
// accion = 'VER' | 'CREAR' | 'EDITAR' | 'ELIMINAR'
const permRequired = (id_modulo, accion = 'VER') => async (req, res, next) => {
    try {
        if (!req.user?.rol) return error(res, 'No autenticado', 401);
        // Admin siempre pasa
        if (req.user.rol === 'ADM') return next();

        const conn = await getConnection();
        try {
            const col = `PUEDE_${accion}`;
            const result = await conn.execute(
                `SELECT ${col} AS PERMITIDO
                 FROM PERMISOS_TIPO_USUARIO
                 WHERE ID_TIPO_USUARIO = :rol AND ID_MODULO = :mod`,
                { rol: req.user.rol, mod: id_modulo },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            if (!result.rows.length || result.rows[0].PERMITIDO !== 1) {
                return error(res, `No tienes permiso para ${accion} en ${id_modulo}`, 403);
            }
            next();
        } finally { await conn.close(); }
    } catch (err) {
        return error(res, 'Error al validar permisos', 500, err.message);
    }
};

module.exports = { signToken, authRequired, permRequired, JWT_SECRET };
