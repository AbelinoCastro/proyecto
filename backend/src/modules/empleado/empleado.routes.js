const { Router } = require('express');
const ctrl = require('./empleado.controller');
const router = Router();

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/baja', ctrl.darBaja);
router.delete('/:id', ctrl.remove);
router.patch('/:id/estado', ctrl.changeEstado);

module.exports = router;