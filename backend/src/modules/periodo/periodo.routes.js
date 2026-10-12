const { Router } = require('express');
const ctrl = require('./periodo.controller');

const router = Router();

router.get('/', ctrl.getAll);       // listar todos
router.get('/verificar', ctrl.verificar);    // verificar si existe mes/año
router.post('/', ctrl.create);       // crear período
router.patch('/:id/estado', ctrl.cambiarEstado); // abrir o cerrar
router.delete('/:id', ctrl.remove);              // eliminar

module.exports = router;