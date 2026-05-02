const express = require('express');
const router  = express.Router();
const ctrl    = require('./polizaSeguros.controller');

router.get('/',     ctrl.getPolicies);
router.get('/:id',  ctrl.getPolicy);
router.post('/',    ctrl.createPolicy);
router.delete('/:id', ctrl.deletePolicy);

module.exports = router;
