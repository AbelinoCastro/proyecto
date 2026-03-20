const { Router } = require('express');
const ctrl = require('./tipoUsuario.controller');

const router = Router();

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/estado', ctrl.changeEstado);
router.delete('/:id', ctrl.remove);

module.exports = router;