const { Router } = require('express');
const ctrl = require('./registroFaltas.controller');

const router = Router();

router.get('/', ctrl.getAll); // 👈 🔥 AGREGA ESTO
router.post('/', ctrl.create);

module.exports = router;