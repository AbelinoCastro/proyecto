const model = require('./tipoUsuario.model');
const { success, error } = require('../../helpers/response');

const getAll = async (req, res) => {
    try {
        const data = await model.getAll();
        return success(res, data);
    } catch (err) {
        return error(res, 'Error al obtener tipos de usuario', 500, err.message);
    }
};

const getById = async (req, res) => {
    try {
        const data = await model.getById(req.params.id);
        if (!data) return error(res, 'Tipo de usuario no encontrado', 404);
        return success(res, data);
    } catch (err) {
        return error(res, 'Error al obtener tipo de usuario', 500, err.message);
    }
};

const create = async (req, res) => {
    try {
        const { id_tipo_usuario, nombre, descripcion, estado } = req.body;
        if (!id_tipo_usuario || !nombre) {
            return error(res, 'id_tipo_usuario y nombre son requeridos', 400);
        }
        const data = await model.create({ id_tipo_usuario, nombre, descripcion, estado });
        return success(res, data, 'Tipo de usuario creado', 201);
    } catch (err) {
        if (err.errorNum === 1) return error(res, 'El id_tipo_usuario ya existe', 400);
        return error(res, 'Error al crear tipo de usuario', 500, err.message);
    }
};

const update = async (req, res) => {
    try {
        const existing = await model.getById(req.params.id);
        if (!existing) return error(res, 'Tipo de usuario no encontrado', 404);
        const { nombre, descripcion, estado } = req.body;
        if (!nombre) return error(res, 'nombre es requerido', 400);
        const data = await model.update(req.params.id, { nombre, descripcion, estado });
        return success(res, data, 'Tipo de usuario actualizado');
    } catch (err) {
        return error(res, 'Error al actualizar tipo de usuario', 500, err.message);
    }
};

const changeEstado = async (req, res) => {
    try {
        const { estado } = req.body;
        if (!['ACTIVO', 'INACTIVO'].includes(estado)) {
            return error(res, 'Estado debe ser ACTIVO o INACTIVO', 400);
        }
        const rows = await model.changeEstado(req.params.id, estado);
        if (rows === 0) return error(res, 'Tipo de usuario no encontrado', 404);
        return success(res, null, `Estado cambiado a ${estado}`);
    } catch (err) {
        return error(res, 'Error al cambiar estado', 500, err.message);
    }
};

const remove = async (req, res) => {
    try {
        const rows = await model.remove(req.params.id);
        if (rows === 0) return error(res, 'Tipo de usuario no encontrado', 404);
        return success(res, null, 'Tipo de usuario eliminado');
    } catch (err) {
        if (err.errorNum === 2292) return error(res, 'No se puede eliminar, tiene usuarios asignados', 400);
        return error(res, 'Error al eliminar', 500, err.message);
    }
};

module.exports = { getAll, getById, create, update, changeEstado, remove };