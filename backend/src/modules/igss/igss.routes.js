const express = require('express');
const router = express.Router();
const ctrl = require('./igss.controller');

router.get('/preview/:id_periodo',          ctrl.getIGSSPreview);
router.get('/estado/:id_periodo',           ctrl.getEstadoIGSS);
router.post('/pagar/:id_periodo',           ctrl.pagarIGSS);
router.get('/comprobante/:id_periodo',      ctrl.getComprobanteIGSS);
router.get('/comprobante-pdf/:id_periodo',  ctrl.getComprobanteIGSSPDF);

module.exports = router;
