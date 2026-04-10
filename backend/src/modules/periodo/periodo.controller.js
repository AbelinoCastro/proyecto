const model = require('./periodo.model');
const { success, error } = require('../../helpers/response');

// GET /api/periodos
const getAll = async (req, res) => {
    try {
        const data = await model.getAll();
        return success(res, data);
    } catch (err) {
        return error(res, 'Error al obtener períodos', 500, err.message);
    }
};

// GET /api/periodos/verificar?mes=3&anio=2026
// Verifica si existe el período — el frontend lo usa antes de calcular
const verificar = async (req, res) => {
    try {
        const mes = parseInt(req.query.mes);
        const anio = parseInt(req.query.anio);
        if (!mes || !anio) return error(res, 'mes y anio son requeridos', 400);

        const periodo = await model.getByMesAnio(mes, anio);

        if (!periodo) {
            return success(res, { existe: false, periodo: null },
                `No existe período para ${mes}/${anio}`);
        }

        return success(res, { existe: true, periodo },
            periodo.ESTADO === 'CERRADO'
                ? `El período ${mes}/${anio} está CERRADO`
                : `Período ${mes}/${anio} ABIERTO`
        );
    } catch (err) {
        return error(res, 'Error al verificar período', 500, err.message);
    }
};

// POST /api/periodos
// Crea un período nuevo para el mes/año dado
const create = async (req, res) => {
    try {
        const { mes, anio } = req.body;
        if (!mes || !anio) return error(res, 'mes y anio son requeridos', 400);
        if (mes < 1 || mes > 12) return error(res, 'mes debe ser entre 1 y 12', 400);

        const existe = await model.getByMesAnio(mes, anio);
        if (existe) return error(res, `Ya existe un período para ${mes}/${anio}`, 400);

        const data = await model.create(parseInt(mes), parseInt(anio));
        return success(res, data, 'Período creado correctamente', 201);
    } catch (err) {
        if (err.errorNum === 1) return error(res, 'Ya existe un período para ese mes y año', 400);
        return error(res, 'Error al crear período', 500, err.message);
    }
};

// PATCH /api/periodos/:id/estado
// Abre o cierra un período
const cambiarEstado = async (req, res) => {
    try {
        const { estado } = req.body;
        if (!['ABIERTO', 'CERRADO'].includes(estado)) {
            return error(res, 'estado debe ser ABIERTO o CERRADO', 400);
        }
        const data = await model.cambiarEstado(req.params.id, estado);
        if (!data) return error(res, 'Período no encontrado', 404);
        return success(res, data, `Período ${estado.toLowerCase()} correctamente`);
    } catch (err) {
        return error(res, 'Error al cambiar estado del período', 500, err.message);
    }
};

module.exports = { getAll, verificar, create, cambiarEstado };