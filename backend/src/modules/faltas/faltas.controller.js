const model = require('./faltas.model');
const { success, error } = require('../../helpers/response');

const getAll = async (req, res) => {
    try { return success(res, await model.getAll()); }
    catch (err) { return error(res, 'Error al obtener faltas', 500, err.message); }
};

const getById = async (req, res) => {
    try {
        const data = await model.getById(Number(req.params.id));
        if (!data) return error(res, 'Falta no encontrada', 404);
        return success(res, data);
    } catch (err) { return error(res, 'Error al obtener falta', 500, err.message); }
};

const create = async (req, res) => {
    try {
        const { descripcion, es_pagado } = req.body;
        if (!descripcion) return error(res, 'descripcion es requerida', 400);
        if (es_pagado && !['S', 'N'].includes(es_pagado)) return error(res, 'es_pagado debe ser S o N', 400);
        return success(res, await model.create({ descripcion, es_pagado }), 'Falta creada', 201);
    } catch (err) { return error(res, 'Error al crear falta', 500, err.message); }
};

const update = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const existing = await model.getById(id);
        if (!existing) return error(res, 'Falta no encontrada', 404);
        const { descripcion, es_pagado } = req.body;
        if (!descripcion) return error(res, 'descripcion es requerida', 400);
        if (!['S', 'N'].includes(es_pagado)) return error(res, 'es_pagado debe ser S o N', 400);
        return success(res, await model.update(id, { descripcion, es_pagado }), 'Falta actualizada');
    } catch (err) { return error(res, 'Error al actualizar falta', 500, err.message); }
};

const remove = async (req, res) => {
    try {
        const rows = await model.remove(Number(req.params.id));
        if (rows === 0) return error(res, 'Falta no encontrada', 404);
        return success(res, null, 'Falta eliminada');
    } catch (err) { return error(res, 'Error al eliminar', 500, err.message); }
};

module.exports = { getAll, getById, create, update, remove };