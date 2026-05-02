const { Router } = require('express');
const { getPatrono, createPatrono, updatePatrono } = require('./patrono.controller');

const router = Router();

router.get('/', getPatrono);
router.post('/', createPatrono);
router.put('/:id', updatePatrono);

module.exports = router;