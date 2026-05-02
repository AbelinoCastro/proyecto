const model = require('./polizaSeguros.model');
const { success, error } = require('../../helpers/response');

const getPolicies = async (req, res) => {
    try {
        return success(res, await model.getAll());
    } catch (err) { return error(res, 'Error al obtener pólizas', 500, err.message); }
};

const getPolicy = async (req, res) => {
    try {
        const data = await model.getById(req.params.id);
        if (!data) return error(res, 'Póliza no encontrada', 404);
        return success(res, data);
    } catch (err) { return error(res, 'Error al obtener póliza', 500, err.message); }
};

const createPolicy = async (req, res) => {
    try {
        const { id_empleado, fecha_inicio_plan, fecha_renovacion, plan, monto_prima, nombre_seguradora, nit_seguradora, direccion_aseguradora, cuenta_bancaria } = req.body;
        if (!id_empleado || !fecha_inicio_plan || !plan || !monto_prima || !nombre_seguradora)
            return error(res, 'Faltan campos requeridos', 400);
        const id = await model.create(req.body);
        return success(res, { id_poliza: id }, 'Póliza creada correctamente', 201);
    } catch (err) { return error(res, 'Error al crear póliza', 500, err.message); }
};

const deletePolicy = async (req, res) => {
    try {
        const rows = await model.remove(req.params.id);
        if (!rows) return error(res, 'Póliza no encontrada', 404);
        return success(res, null, 'Póliza eliminada');
    } catch (err) { return error(res, 'Error al eliminar póliza', 500, err.message); }
};

module.exports = { getPolicies, getPolicy, createPolicy, deletePolicy };
