const model = require('./empAsignaciones.model');
const { success, error } = require('../../helpers/response');

// ── DEDUCCIONES ──────────────────────────────────────────────

const getDeduccionesByEmpleado = async (req, res) => {
    try {
        return success(res, await model.getDeduccionesByEmpleado(req.params.id_empleado));
    } catch (err) { return error(res, 'Error al obtener deducciones del empleado', 500, err.message); }
};

const createDeduccion = async (req, res) => {
    try {
        const { id_empleado, id_deduccion, monto } = req.body;
        if (!id_empleado || !id_deduccion || monto == null)
            return error(res, 'id_empleado, id_deduccion y monto son requeridos', 400);
        return success(res, await model.createDeduccion({ id_empleado, id_deduccion, monto }), 'Deducción asignada', 201);
    } catch (err) {
        if (err.errorNum === 2291) return error(res, 'Empleado o deducción no existe', 400);
        return error(res, 'Error al asignar deducción', 500, err.message);
    }
};

const updateDeduccion = async (req, res) => {
    try {
        const { monto, activo } = req.body;
        if (monto == null || !activo) return error(res, 'monto y activo son requeridos', 400);
        await model.updateDeduccion(req.params.id, { monto, activo });
        return success(res, null, 'Deducción actualizada');
    } catch (err) { return error(res, 'Error al actualizar deducción', 500, err.message); }
};

const removeDeduccion = async (req, res) => {
    try {
        const rows = await model.removeDeduccion(req.params.id);
        if (rows === 0) return error(res, 'Registro no encontrado', 404);
        return success(res, null, 'Deducción eliminada');
    } catch (err) { return error(res, 'Error al eliminar deducción', 500, err.message); }
};

// ── PERCEPCIONES ─────────────────────────────────────────────

const getPercepcionesByEmpleado = async (req, res) => {
    try {
        return success(res, await model.getPercepcionesByEmpleado(req.params.id_empleado));
    } catch (err) { return error(res, 'Error al obtener percepciones del empleado', 500, err.message); }
};

const createPercepcion = async (req, res) => {
    try {
        const { id_empleado, id_percepcion, monto } = req.body;
        if (!id_empleado || !id_percepcion || monto == null)
            return error(res, 'id_empleado, id_percepcion y monto son requeridos', 400);
        return success(res, await model.createPercepcion({ id_empleado, id_percepcion, monto }), 'Percepción asignada', 201);
    } catch (err) {
        if (err.errorNum === 2291) return error(res, 'Empleado o percepción no existe', 400);
        return error(res, 'Error al asignar percepción', 500, err.message);
    }
};

const updatePercepcion = async (req, res) => {
    try {
        const { monto, activo } = req.body;
        if (monto == null || !activo) return error(res, 'monto y activo son requeridos', 400);
        await model.updatePercepcion(req.params.id, { monto, activo });
        return success(res, null, 'Percepción actualizada');
    } catch (err) { return error(res, 'Error al actualizar percepción', 500, err.message); }
};

const removePercepcion = async (req, res) => {
    try {
        const rows = await model.removePercepcion(req.params.id);
        if (rows === 0) return error(res, 'Registro no encontrado', 404);
        return success(res, null, 'Percepción eliminada');
    } catch (err) { return error(res, 'Error al eliminar percepción', 500, err.message); }
};

module.exports = {
    getDeduccionesByEmpleado, createDeduccion, updateDeduccion, removeDeduccion,
    getPercepcionesByEmpleado, createPercepcion, updatePercepcion, removePercepcion
};
