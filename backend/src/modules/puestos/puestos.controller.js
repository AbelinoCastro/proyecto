const model = require('./puestos.model');
const { success, error } = require('../../helpers/response');

const getAll = async (req, res) => {
    try { return success(res, await model.getAll()); }
    catch (err) { return error(res, 'Error al obtener puestos', 500, err.message); }
};

const getById = async (req, res) => {
    try {
        const data = await model.getById(req.params.id);
        if (!data) return error(res, 'Puesto no encontrado', 404);
        return success(res, data);
    } catch (err) { return error(res, 'Error al obtener puesto', 500, err.message); }
};

const create = async (req, res) => {
    try {
        const { id_puesto, nombre_puesto, id_departamento, descripcion, sueldo_base } = req.body;
        if (!id_puesto || !nombre_puesto || !id_departamento || !sueldo_base) return error(res, 'id_puesto, nombre_puesto, id_departamento y sueldo_base son requeridos', 400);
        return success(res, await model.create({ id_puesto, nombre_puesto, id_departamento, descripcion, sueldo_base }), 'Puesto creado', 201);
    } catch (err) {
        if (err.errorNum === 1) return error(res, 'El id_puesto ya existe', 400);
        if (err.errorNum === 2291) return error(res, 'El id_departamento no existe', 400);
        return error(res, 'Error al crear puesto', 500, err.message);
    }
};

const update = async (req, res) => {
    try {
        const existing = await model.getById(req.params.id);
        if (!existing) return error(res, 'Puesto no encontrado', 404);
        const { nombre_puesto, id_departamento, descripcion, sueldo_base } = req.body;
        if (!nombre_puesto || !id_departamento || !sueldo_base) return error(res, 'nombre_puesto, id_departamento y sueldo_base son requeridos', 400);
        return success(res, await model.update(req.params.id, { nombre_puesto, id_departamento, descripcion, sueldo_base }), 'Puesto actualizado');
    } catch (err) { return error(res, 'Error al actualizar puesto', 500, err.message); }
};

const remove = async (req, res) => {
    try {
        const rows = await model.remove(req.params.id);
        if (rows === 0) return error(res, 'Puesto no encontrado', 404);
        return success(res, null, 'Puesto eliminado');
    } catch (err) {
        if (err.errorNum === 2292) return error(res, 'No se puede eliminar, tiene empleados asignados', 400);
        return error(res, 'Error al eliminar', 500, err.message);
    }
};

module.exports = { getAll, getById, create, update, remove };