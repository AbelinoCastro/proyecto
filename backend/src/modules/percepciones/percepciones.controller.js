const model = require('./percepciones.model');
const { success, error } = require('../../helpers/response');

const getAll = async (req, res) => {
    try { return success(res, await model.getAll()); }
    catch (err) { return error(res, 'Error al obtener percepciones', 500, err.message); }
};

const getById = async (req, res) => {
    try {
        const data = await model.getById(req.params.id);
        if (!data) return error(res, 'Percepción no encontrada', 404);
        return success(res, data);
    } catch (err) { return error(res, 'Error al obtener percepción', 500, err.message); }
};

const create = async (req, res) => {
    try {
        const { id_percepcion, nombre_percepcion, descripcion_formula } = req.body;
        if (!id_percepcion || !nombre_percepcion) return error(res, 'id_percepcion y nombre_percepcion son requeridos', 400);
        return success(res, await model.create({ id_percepcion, nombre_percepcion, descripcion_formula }), 'Percepción creada', 201);
    } catch (err) {
        if (err.errorNum === 1) return error(res, 'El id_percepcion ya existe', 400);
        return error(res, 'Error al crear percepción', 500, err.message);
    }
};

const update = async (req, res) => {
    try {
        const existing = await model.getById(req.params.id);
        if (!existing) return error(res, 'Percepción no encontrada', 404);
        const { nombre_percepcion, descripcion_formula } = req.body;
        if (!nombre_percepcion) return error(res, 'nombre_percepcion es requerido', 400);
        return success(res, await model.update(req.params.id, { nombre_percepcion, descripcion_formula }), 'Percepción actualizada');
    } catch (err) { return error(res, 'Error al actualizar percepción', 500, err.message); }
};

const remove = async (req, res) => {
    try {
        const rows = await model.remove(req.params.id);
        if (rows === 0) return error(res, 'Percepción no encontrada', 404);
        return success(res, null, 'Percepción eliminada');
    } catch (err) { return error(res, 'Error al eliminar', 500, err.message); }
};

module.exports = { getAll, getById, create, update, remove };