const { success, error } = require('../../helpers/response');
const model = require('./prestamo.model');

// GET /api/prestamos
const getPrestamos = async (req, res) => {
    try {
        return success(res, await model.getAllPrestamos());
    } catch (err) {
        return error(res, 'Error al obtener préstamos', 500, err.message);
    }
};

// POST /api/prestamos
const createPrestamo = async (req, res) => {
    try {
        const data = await model.crearPrestamo(req.body);
        return success(res, data, 'Préstamo creado correctamente', 201);
    } catch (err) {
        return error(res, 'Error al crear préstamo', 500, err.message);
    }
};

// GET /api/prestamos/:id/detalles
const getDetallesPrestamo = async (req, res) => {
    try {
        return success(res, await model.getDetallesPrestamo(req.params.id));
    } catch (err) {
        return error(res, 'Error al obtener detalles del préstamo', 500, err.message);
    }
};

// POST /api/prestamos/procesar-mensualidad
const procesarMensualidad = async (req, res) => {
    try {
        const resultado = await model.procesarPagosMensuales();
        if (resultado)
            return success(res, resultado, 'Cuotas procesadas correctamente');
        return res.json({ ok: false, mensaje: 'No hay cuotas pendientes para procesar' });
    } catch (err) {
        return error(res, 'Error al procesar mensualidades', 500, err.message);
    }
};

// GET /api/prestamos/ultimo-comprobante
const getUltimoComprobante = async (req, res) => {
    try {
        const comprobante = await model.getUltimoComprobante();
        if (comprobante)
            return success(res, comprobante);
        return res.json({ ok: false, mensaje: 'Aún no se ha realizado ningún pago.' });
    } catch (err) {
        return error(res, 'Error al obtener comprobante', 500, err.message);
    }
};

module.exports = { getPrestamos, createPrestamo, getDetallesPrestamo, procesarMensualidad, getUltimoComprobante };
