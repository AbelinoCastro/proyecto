const express = require('express');
const router = express.Router();
const ctrl = require('./sat.controller');

router.get('/isr-preview/:id_periodo',       ctrl.getISRPreview);
router.get('/isr-estado/:id_periodo',        ctrl.getEstadoISR);
router.post('/pagar-isr/:id_periodo',        ctrl.pagarISR);
router.get('/isr-comprobante/:id_periodo',   ctrl.getComprobanteISR);
router.get('/isr-preview-pdf/:id_periodo',   ctrl.getISRPreviewPDF);
router.get('/isr-comprobante-pdf/:id_periodo', ctrl.getComprobanteISRPDF);
router.get('/isr-preview-excel/:id_periodo', ctrl.getISRPreviewExcel);

module.exports = router;
