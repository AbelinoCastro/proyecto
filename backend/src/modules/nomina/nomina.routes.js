const { Router } = require('express');
const ctrl = require('./nomina.controller');

const router = Router();

// Vista previa del cálculo — GET /api/nomina/empleado/:id?anio=2025&mes=3
router.get('/empleado/:id', ctrl.getVistaPrevia);

// Procesar y guardar la nómina — POST /api/nomina/procesar
router.post('/procesar', ctrl.procesarNomina);

// Histórico de nóminas procesadas — GET /api/nomina/historico
router.get('/historico', ctrl.getHistorico);

// Detalle de una nómina para el recibo — GET /api/nomina/historico/:id
router.get('/historico/:id', ctrl.getDetalleNomina);

module.exports = router;