const { Router } = require('express');
const { getModulos, getRoles, getPermisos, updatePermiso } = require('./permisos.controller');
const { authRequired, permRequired } = require('../../middlewares/auth');

const router = Router();

// Todas requieren admin (permiso EDITAR sobre módulo PERMISOS)
router.use(authRequired);
router.get('/modulos', getModulos);
router.get('/roles',   getRoles);
router.get('/',        getPermisos);
router.put('/',        permRequired('PERMISOS', 'EDITAR'), updatePermiso);

module.exports = router;
