const model = require('./empleado.model');
const { success, error } = require('../../helpers/response');

const getAll = async (req, res) => {
    try { return success(res, await model.getAll()); }
    catch (err) { return error(res, 'Error al obtener empleados', 500, err.message); }
};

const getById = async (req, res) => {
    try {
        const data = await model.getById(req.params.id);
        if (!data) return error(res, 'Empleado no encontrado', 404);
        return success(res, data);
    } catch (err) { return error(res, 'Error al obtener empleado', 500, err.message); }
};

const create = async (req, res) => {
    try {
        const { nombre, fecha_nacimiento, genero, nacionalidad, no_afiliacion_igss,
            no_dpi_permiso, fecha_inicio, id_puesto, id_jornada, correo, telefono,
            cuenta_bancaria, estado, porcentaje_pago_comision } = req.body;

        if (!nombre || !fecha_nacimiento || !genero || !nacionalidad || !no_afiliacion_igss ||
            !no_dpi_permiso || !fecha_inicio || !id_puesto || !id_jornada) {
            return error(res, 'nombre, fecha_nacimiento, genero, nacionalidad, no_afiliacion_igss, no_dpi_permiso, fecha_inicio, id_puesto e id_jornada son requeridos', 400);
        }
        if (!['M', 'F', 'O'].includes(genero)) return error(res, 'genero debe ser M, F u O', 400);

        return success(res, await model.create({
            nombre, fecha_nacimiento, genero, nacionalidad, no_afiliacion_igss,
            no_dpi_permiso, fecha_inicio, id_puesto, id_jornada, correo, telefono,
            cuenta_bancaria, estado, porcentaje_pago_comision
        }), 'Empleado creado', 201);
    } catch (err) {
        if (err.errorNum === 1) return error(res, 'El DPI o IGSS ya está registrado', 400);
        if (err.errorNum === 2291) return error(res, 'El id_puesto o id_jornada no existe', 400);
        return error(res, 'Error al crear empleado', 500, err.message);
    }
};

const update = async (req, res) => {
    try {
        const existing = await model.getById(req.params.id);
        if (!existing) return error(res, 'Empleado no encontrado', 404);

        const { nombre, genero, nacionalidad, no_afiliacion_igss, no_dpi_permiso,
            id_puesto, id_jornada, correo, telefono, cuenta_bancaria, estado, porcentaje_pago_comision } = req.body;

        if (!nombre || !genero || !id_puesto || !id_jornada) {
            return error(res, 'nombre, genero, id_puesto e id_jornada son requeridos', 400);
        }
        return success(res, await model.update(req.params.id, {
            nombre, genero, nacionalidad, no_afiliacion_igss, no_dpi_permiso,
            id_puesto, id_jornada, correo, telefono, cuenta_bancaria, estado, porcentaje_pago_comision
        }), 'Empleado actualizado');
    } catch (err) { return error(res, 'Error al actualizar empleado', 500, err.message); }
};

const darBaja = async (req, res) => {
    try {
        const existing = await model.getById(req.params.id);
        if (!existing) return error(res, 'Empleado no encontrado', 404);
        const { id_motivo_baja, fecha_fin } = req.body;
        if (!id_motivo_baja || !fecha_fin) return error(res, 'id_motivo_baja y fecha_fin son requeridos', 400);
        return success(res, await model.darBaja(req.params.id, { id_motivo_baja, fecha_fin }), 'Empleado dado de baja');
    } catch (err) { return error(res, 'Error al dar de baja', 500, err.message); }
};

const remove = async (req, res) => {
    try {
        const rows = await model.remove(req.params.id);
        if (rows === 0) return error(res, 'Empleado no encontrado', 404);
        return success(res, null, 'Empleado eliminado');
    } catch (err) {
        if (err.errorNum === 2292) return error(res, 'No se puede eliminar, tiene registros asociados', 400);
        return error(res, 'Error al eliminar', 500, err.message);
    }
};

const changeEstado = async (req, res) => {
    try {
        const { estado } = req.body;
        if (!['ACTIVO', 'INACTIVO', 'SUSPENDIDO'].includes(estado)) return error(res, 'Estado inválido', 400);
        const rows = await model.changeEstado(Number(req.params.id), estado);
        if (rows === 0) return error(res, 'Empleado no encontrado', 404);
        return success(res, null, `Estado cambiado a ${estado}`);
    } catch (err) { return error(res, 'Error al cambiar estado', 500, err.message); }
};

module.exports = { getAll, getById, create, update, darBaja, changeEstado, remove };