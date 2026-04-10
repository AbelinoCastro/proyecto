const model = require('./motivoBaja.model');
const { success, error } = require('../../helpers/response');

const getAll = async (req, res) => {
    try { return success(res, await model.getAll()); }
    catch (err) { return error(res, 'Error al obtener motivos de baja', 500, err.message); }
};

const getById = async (req, res) => {
    try {
        const data = await model.getById(req.params.id);
        if (!data) return error(res, 'Motivo de baja no encontrado', 404);
        return success(res, data);
    } catch (err) { return error(res, 'Error al obtener motivo de baja', 500, err.message); }
};

const create = async (req, res) => {
    try {
        const { id_motivo_baja, descripcion, estado } = req.body;
        if (!id_motivo_baja || !descripcion) return error(res, 'id_motivo_baja y descripcion son requeridos', 400);
        return success(res, await model.create({ id_motivo_baja, descripcion, estado }), 'Motivo de baja creado', 201);
    } catch (err) {
        if (err.errorNum === 1) return error(res, 'El id_motivo_baja ya existe', 400);
        return error(res, 'Error al crear motivo de baja', 500, err.message);
    }
};

const update = async (req, res) => {
    try {
        const existing = await model.getById(req.params.id);
        if (!existing) return error(res, 'Motivo de baja no encontrado', 404);
        const { descripcion, estado } = req.body;
        if (!descripcion) return error(res, 'descripcion es requerida', 400);
        return success(res, await model.update(req.params.id, { descripcion, estado }), 'Motivo de baja actualizado');
    } catch (err) { return error(res, 'Error al actualizar motivo de baja', 500, err.message); }
};

const remove = async (req, res) => {
    try {
        const rows = await model.remove(req.params.id);
        if (rows === 0) return error(res, 'Motivo de baja no encontrado', 404);
        return success(res, null, 'Motivo de baja eliminado');
    } catch (err) { return error(res, 'Error al eliminar', 500, err.message); }
};

const changeEstado = async (req, res) => {
    try {
        const { estado } = req.body;
        if (!estado) return error(res, 'estado es requerido', 400);
        return success(res, await model.changeEstado(req.params.id, estado), 'Estado actualizado');
    } catch (err) { return error(res, 'Error al actualizar estado', 500, err.message); }
};

module.exports = { getAll, getById, create, update, remove, changeEstado };