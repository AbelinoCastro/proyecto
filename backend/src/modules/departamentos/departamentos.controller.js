const model = require('./departamentos.model');
const { success, error } = require('../../helpers/response');

const getAll = async (req, res) => {
    try {
        return success(res, await model.getAll());
    } catch (err) { return error(res, 'Error al obtener departamentos', 500, err.message); }
};

const getById = async (req, res) => {
    try {
        const data = await model.getById(req.params.id);
        if (!data) return error(res, 'Departamento no encontrado', 404);
        return success(res, data);
    } catch (err) { return error(res, 'Error al obtener departamento', 500, err.message); }
};

const create = async (req, res) => {
    try {
        const { id_departamento, nombre_departamento, descripcion, estado } = req.body;
        if (!id_departamento || !nombre_departamento) return error(res, 'id_departamento y nombre_departamento son requeridos', 400);
        return success(res, await model.create({ id_departamento, nombre_departamento, descripcion, estado }), 'Departamento creado', 201);
    } catch (err) {
        if (err.errorNum === 1) return error(res, 'El id_departamento ya existe', 400);
        return error(res, 'Error al crear departamento', 500, err.message);
    }
};

const update = async (req, res) => {
    try {
        const existing = await model.getById(req.params.id);
        if (!existing) return error(res, 'Departamento no encontrado', 404);
        const { nombre_departamento, descripcion, estado } = req.body;
        if (!nombre_departamento) return error(res, 'nombre_departamento es requerido', 400);
        return success(res, await model.update(req.params.id, { nombre_departamento, descripcion, estado }), 'Departamento actualizado');
    } catch (err) { return error(res, 'Error al actualizar departamento', 500, err.message); }
};

const remove = async (req, res) => {
    try {
        const rows = await model.remove(req.params.id);
        if (rows === 0) return error(res, 'Departamento no encontrado', 404);
        return success(res, null, 'Departamento eliminado');
    } catch (err) {
        if (err.errorNum === 2292) return error(res, 'No se puede eliminar, tiene puestos asignados', 400);
        return error(res, 'Error al eliminar', 500, err.message);
    }
};

const changeEstado = async (req, res) => {
    try {
        const { estado } = req.body;
        if (!estado) return error(res, 'estado es requerido', 400);
        return success(res, await model.changeEstado(req.params.id, estado), 'Estado actualizado');
    } catch (err) { return error(res, 'Error al actualizar estado', 500, err.message); }
};

module.exports = { getAll, getById, create, update, remove, changeEstado };