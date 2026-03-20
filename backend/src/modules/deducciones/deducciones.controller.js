const model = require('./deducciones.model');
const { success, error } = require('../../helpers/response');

const getAll = async (req, res) => {
    try { return success(res, await model.getAll()); }
    catch (err) { return error(res, 'Error al obtener deducciones', 500, err.message); }
};

const getById = async (req, res) => {
    try {
        const data = await model.getById(req.params.id);
        if (!data) return error(res, 'Deducción no encontrada', 404);
        return success(res, data);
    } catch (err) { return error(res, 'Error al obtener deducción', 500, err.message); }
};

const create = async (req, res) => {
    try {
        const { id_deduccion, nombre_deduccion, descripcion_formula } = req.body;
        if (!id_deduccion || !nombre_deduccion) return error(res, 'id_deduccion y nombre_deduccion son requeridos', 400);
        return success(res, await model.create({ id_deduccion, nombre_deduccion, descripcion_formula }), 'Deducción creada', 201);
    } catch (err) {
        if (err.errorNum === 1) return error(res, 'El id_deduccion ya existe', 400);
        return error(res, 'Error al crear deducción', 500, err.message);
    }
};

const update = async (req, res) => {
    try {
        const existing = await model.getById(req.params.id);
        if (!existing) return error(res, 'Deducción no encontrada', 404);
        const { nombre_deduccion, descripcion_formula } = req.body;
        if (!nombre_deduccion) return error(res, 'nombre_deduccion es requerido', 400);
        return success(res, await model.update(req.params.id, { nombre_deduccion, descripcion_formula }), 'Deducción actualizada');
    } catch (err) { return error(res, 'Error al actualizar deducción', 500, err.message); }
};

const remove = async (req, res) => {
    try {
        const rows = await model.remove(req.params.id);
        if (rows === 0) return error(res, 'Deducción no encontrada', 404);
        return success(res, null, 'Deducción eliminada');
    } catch (err) { return error(res, 'Error al eliminar', 500, err.message); }
};

module.exports = { getAll, getById, create, update, remove };