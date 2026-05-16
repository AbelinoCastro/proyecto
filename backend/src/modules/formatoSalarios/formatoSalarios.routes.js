const { Router } = require('express');
const { generarFormato } = require('./formatoSalarios.controller');

const router = Router();

// GET /api/formato-salarios/:id_empleado?anio=2026
router.get('/:id_empleado', generarFormato);

module.exports = router;
