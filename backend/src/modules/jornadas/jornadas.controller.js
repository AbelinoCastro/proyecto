const model = require('./jornadas.model');
const { success, error } = require('../../helpers/response');

const getAll = async (req, res) => {
    try { return success(res, await model.getAll()); }
    catch (err) { return error(res, 'Error al obtener jornadas', 500, err.message); }
};

const getById = async (req, res) => {
    try {
        const data = await model.getById(req.params.id);
        if (!data) return error(res, 'Jornada no encontrada', 404);
        return success(res, data);
    } catch (err) { return error(res, 'Error al obtener jornada', 500, err.message); }
};

const create = async (req, res) => {
    try {
        const { id_jornada, nombre_jornada, descripcion, hora_inicio, hora_fin, horas_diarias } = req.body;
        if (!id_jornada || !nombre_jornada || !horas_diarias) return error(res, 'id_jornada, nombre_jornada y horas_diarias son requeridos', 400);
        return success(res, await model.create({ id_jornada, nombre_jornada, descripcion, hora_inicio, hora_fin, horas_diarias }), 'Jornada creada', 201);
    } catch (err) {
        if (err.errorNum === 1) return error(res, 'El id_jornada ya existe', 400);
        return error(res, 'Error al crear jornada', 500, err.message);
    }
};

const update = async (req, res) => {
    try {
        const existing = await model.getById(req.params.id);
        if (!existing) return error(res, 'Jornada no encontrada', 404);
        const { nombre_jornada, descripcion, hora_inicio, hora_fin, horas_diarias } = req.body;
        if (!nombre_jornada || !horas_diarias) return error(res, 'nombre_jornada y horas_diarias son requeridos', 400);
        return success(res, await model.update(req.params.id, { nombre_jornada, descripcion, hora_inicio, hora_fin, horas_diarias }), 'Jornada actualizada');
    } catch (err) { return error(res, 'Error al actualizar jornada', 500, err.message); }
};

const remove = async (req, res) => {
    try {
        const rows = await model.remove(req.params.id);
        if (rows === 0) return error(res, 'Jornada no encontrada', 404);
        return success(res, null, 'Jornada eliminada');
    } catch (err) {
        if (err.errorNum === 2292) return error(res, 'No se puede eliminar, tiene empleados asignados', 400);
        return error(res, 'Error al eliminar', 500, err.message);
    }
};

module.exports = { getAll, getById, create, update, remove };