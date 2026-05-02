const PDFDocument = require('pdfkit');
const { success, error } = require('../../helpers/response');
const model = require('./igss.model');

// GET /api/igss/preview/:id_periodo
const getIGSSPreview = async (req, res) => {
    try {
        const data = await model.getIGSSPreview(req.params.id_periodo);
        const empleados = data.map(e => ({
            ...e,
            IGSS_BASE: parseFloat((Number(e.SUELDO_BASE) + Number(e.HORAS_EXTRA_MONTO)).toFixed(2))
        }));
        const totalIGSS = empleados.reduce((acc, e) => acc + Number(e.IGSS_MONTO), 0);
        return success(res, { empleados, totalIGSS: parseFloat(totalIGSS.toFixed(2)) });
    } catch (err) {
        return error(res, 'Error al obtener preview IGSS', 500, err.message);
    }
};

// GET /api/igss/estado/:id_periodo
const getEstadoIGSS = async (req, res) => {
    try {
        const estado = await model.getEstadoIGSS(req.params.id_periodo);
        return success(res, estado);
    } catch (err) {
        return error(res, 'Error al obtener estado IGSS', 500, err.message);
    }
};

// POST /api/igss/pagar/:id_periodo
const pagarIGSS = async (req, res) => {
    try {
        const { id_periodo } = req.params;

        const nominaOk = await model.validarNominaPagada(id_periodo);
        if (!nominaOk)
            return error(res, 'La nómina no está completamente pagada para este período', 400);

        const yaPagado = await model.getEstadoIGSS(id_periodo);
        if (yaPagado.pagado)
            return error(res, 'El IGSS ya fue pagado para este período', 400);

        const result = await model.pagarIGSS(id_periodo);
        return success(res, result, 'IGSS pagado correctamente');
    } catch (err) {
        return error(res, err.message || 'Error al pagar IGSS', 400, err.message);
    }
};

// GET /api/igss/comprobante/:id_periodo  (JSON)
const getComprobanteIGSS = async (req, res) => {
    try {
        const data = await model.getComprobanteIGSS(req.params.id_periodo);
        return success(res, data);
    } catch (err) {
        return error(res, 'Error al obtener comprobante IGSS', 500, err.message);
    }
};

// GET /api/igss/comprobante-pdf/:id_periodo
const getComprobanteIGSSPDF = async (req, res) => {
    try {
        const { id_periodo } = req.params;
        const comprobante = await model.getComprobanteIGSS(id_periodo);

        const total = Number(comprobante.pago.TOTAL);
        const fecha = comprobante.pago.FECHA_PAGO
            ? new Date(comprobante.pago.FECHA_PAGO).toLocaleDateString('es-GT')
            : new Date().toLocaleDateString('es-GT');

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=comprobante_igss_${id_periodo}.pdf`);
        doc.pipe(res);

        // Encabezado
        doc.fontSize(18).text('COMPROBANTE DE PAGO IGSS', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#555555').text('Instituto Guatemalteco de Seguridad Social', { align: 'center' });
        doc.fillColor('black').moveDown(1.5);

        doc.fontSize(12).text(`Período: ${id_periodo}`).text(`Fecha de pago: ${fecha}`);
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1.5);

        // Tabla detalle
        let y = doc.y;
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Empleado',       50, y);
        doc.text('No. Afiliación', 220, y);
        doc.text('Base IGSS',      360, y);
        doc.text('IGSS (4.83%)',   460, y);
        y += 20;
        doc.font('Helvetica');

        for (const row of comprobante.detalle) {
            const base = Number(row.SUELDO_BASE || 0) + Number(row.HORAS_EXTRA_MONTO || 0);
            doc.text(row.EMPLEADO, 50, y, { width: 165 });
            doc.text(row.NO_AFILIACION_IGSS || '—', 220, y);
            doc.text(`Q ${base.toFixed(2)}`, 360, y);
            doc.text(`Q ${Number(row.IGSS_MONTO).toFixed(2)}`, 460, y);
            y += 17;
            if (y > 700) { doc.addPage(); y = 50; }
        }

        // Reposicionar cursor al final de la tabla manual
        doc.text('', 50, y + 15);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1.5);
        doc.font('Helvetica-Bold').fontSize(14).text('TOTAL PAGADO:', { align: 'center' });
        doc.moveDown(0.3);
        doc.font('Helvetica').fontSize(22).fillColor('green').text(`Q ${total.toFixed(2)}`, { align: 'center' });
        doc.fillColor('black').moveDown(1.5);
        doc.fontSize(30).fillColor('green').text('PAGADO', { align: 'center' });
        doc.fillColor('black').moveDown(1);
        doc.fontSize(10).text('Este documento certifica el pago de cuotas IGSS del empleador al Instituto Guatemalteco de Seguridad Social.', { align: 'center' });
        doc.end();
    } catch (err) {
        if (!res.headersSent) return error(res, 'Error al generar comprobante PDF IGSS', 500, err.message);
    }
};

module.exports = { getIGSSPreview, getEstadoIGSS, pagarIGSS, getComprobanteIGSS, getComprobanteIGSSPDF };
