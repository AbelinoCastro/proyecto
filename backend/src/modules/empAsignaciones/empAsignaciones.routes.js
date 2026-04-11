const { Router } = require('express');
const ctrl = require('./empAsignaciones.controller');

const router = Router();

router.get('/empleado/:id_empleado/deducciones', ctrl.getDeduccionesByEmpleado);
router.post('/deducciones', ctrl.createDeduccion);
router.put('/deducciones/:id', ctrl.updateDeduccion);
router.delete('/deducciones/:id', ctrl.removeDeduccion);

router.get('/empleado/:id_empleado/percepciones', ctrl.getPercepcionesByEmpleado);
router.post('/percepciones', ctrl.createPercepcion);
router.put('/percepciones/:id', ctrl.updatePercepcion);
router.delete('/percepciones/:id', ctrl.removePercepcion);

module.exports = router;
