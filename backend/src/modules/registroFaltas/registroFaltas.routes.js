const { Router } = require('express');
const ctrl = require('./registroFaltas.controller');

const router = Router();

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.put('/:id', ctrl.updateEstado);

module.exports = router;