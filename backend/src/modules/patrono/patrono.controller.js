const { success, error } = require('../../helpers/response');
const model = require('./patrono.model');

const getPatrono = async (req, res) => {
    try {
        const data = await model.getPatrono();
        if (!data) return error(res, 'No hay datos de patrono registrados', 404);
        return success(res, data, 'Patrono obtenido correctamente');
    } catch (err) {
        console.error('getPatrono error:', err);
        return error(res, 'Error al obtener patrono');
    }
};

const createPatrono = async (req, res) => {
    try {
        const existente = await model.getPatrono();
        if (existente) return error(res, 'Ya existe un registro de patrono. Use la opción de editar.', 400);

        const { razon_social, direccion, telefono, numero_patronal, cod_formulario } = req.body;
        if (!razon_social || !direccion || !numero_patronal) {
            return error(res, 'Razón social, dirección y número patronal son requeridos', 400);
        }

        const data = await model.create({ razon_social, direccion, telefono, numero_patronal, cod_formulario });
        return success(res, data, 'Patrono registrado correctamente', 201);
    } catch (err) {
        console.error('createPatrono error:', err);
        return error(res, 'Error al registrar patrono');
    }
};

const updatePatrono = async (req, res) => {
    try {
        const { id } = req.params;
        const { razon_social, direccion, telefono, numero_patronal, cod_formulario } = req.body;

        if (!razon_social || !direccion || !numero_patronal) {
            return error(res, 'Razón social, dirección y número patronal son requeridos', 400);
        }

        const data = await model.update(id, { razon_social, direccion, telefono, numero_patronal, cod_formulario });
        if (!data) return error(res, 'Patrono no encontrado', 404);
        return success(res, data, 'Patrono actualizado correctamente');
    } catch (err) {
        console.error('updatePatrono error:', err);
        return error(res, 'Error al actualizar patrono');
    }
};

module.exports = { getPatrono, createPatrono, updatePatrono };