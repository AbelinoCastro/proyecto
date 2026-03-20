const model = require('./usuario.model');
const { success, error } = require('../../helpers/response');

const getAll = async (req, res) => {
    try {
        const data = await model.getAll();
        return success(res, data);
    } catch (err) {
        return error(res, 'Error al obtener usuarios', 500, err.message);
    }
};

const getById = async (req, res) => {
    try {
        const data = await model.getById(req.params.id);
        if (!data) return error(res, 'Usuario no encontrado', 404);
        return success(res, data);
    } catch (err) {
        return error(res, 'Error al obtener usuario', 500, err.message);
    }
};

const create = async (req, res) => {
    try {
        const { id_tipo_usuario, id_empleado, username, password } = req.body;
        if (!id_tipo_usuario || !id_empleado || !username || !password) {
            return error(res, 'id_tipo_usuario, id_empleado, username y password son requeridos', 400);
        }
        if (password.length < 8) {
            return error(res, 'La contraseña debe tener al menos 8 caracteres', 400);
        }
        const data = await model.create({ id_tipo_usuario, id_empleado, username, password });
        return success(res, data, 'Usuario creado', 201);
    } catch (err) {
        if (err.errorNum === 1) return error(res, 'El username o empleado ya tiene un usuario asignado', 400);
        if (err.errorNum === 2291) return error(res, 'El id_tipo_usuario o id_empleado no existe', 400);
        return error(res, 'Error al crear usuario', 500, err.message);
    }
};

const update = async (req, res) => {
    try {
        const existing = await model.getById(req.params.id);
        if (!existing) return error(res, 'Usuario no encontrado', 404);
        const { id_tipo_usuario, username } = req.body;
        if (!id_tipo_usuario || !username) {
            return error(res, 'id_tipo_usuario y username son requeridos', 400);
        }
        const data = await model.update(req.params.id, { id_tipo_usuario, username });
        return success(res, data, 'Usuario actualizado');
    } catch (err) {
        if (err.errorNum === 1) return error(res, 'El username ya está en uso', 400);
        return error(res, 'Error al actualizar usuario', 500, err.message);
    }
};

const changePassword = async (req, res) => {
    try {
        const existing = await model.getById(req.params.id);
        if (!existing) return error(res, 'Usuario no encontrado', 404);
        const { password } = req.body;
        if (!password || password.length < 8) {
            return error(res, 'La contraseña debe tener al menos 8 caracteres', 400);
        }
        await model.changePassword(req.params.id, password);
        return success(res, null, 'Contraseña actualizada');
    } catch (err) {
        return error(res, 'Error al cambiar contraseña', 500, err.message);
    }
};

const changeEstado = async (req, res) => {
    try {
        const { estado } = req.body;
        if (!['ACTIVO', 'INACTIVO', 'BLOQUEADO'].includes(estado)) {
            return error(res, 'Estado debe ser ACTIVO, INACTIVO o BLOQUEADO', 400);
        }
        const rows = await model.changeEstado(req.params.id, estado);
        if (rows === 0) return error(res, 'Usuario no encontrado', 404);
        return success(res, null, `Estado cambiado a ${estado}`);
    } catch (err) {
        return error(res, 'Error al cambiar estado', 500, err.message);
    }
};

const remove = async (req, res) => {
    try {
        const rows = await model.remove(req.params.id);
        if (rows === 0) return error(res, 'Usuario no encontrado', 404);
        return success(res, null, 'Usuario eliminado');
    } catch (err) {
        return error(res, 'Error al eliminar', 500, err.message);
    }
};

module.exports = { getAll, getById, create, update, changePassword, changeEstado, remove };