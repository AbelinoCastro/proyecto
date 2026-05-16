const PDFDocument = require('pdfkit');
const { success, error } = require('../../helpers/response');
const model = require('./igss.model');

const IGSS_EMPLEADO_PCT = 4.83;
const IGSS_PATRONO_PCT  = 10.67;

// GET /api/igss/preview/:id_periodo
const getIGSSPreview = async (req, res) => {
    try {
        const data = await model.getIGSSPreview(req.params.id_periodo);
        const empleados = data.map(e => {
            const base = parseFloat((Number(e.SUELDO_BASE) + Number(e.HORAS_EXTRA_MONTO)).toFixed(2));
            const igss_patronal = parseFloat((base * IGSS_PATRONO_PCT / 100).toFixed(2));
            const igss_empleado = parseFloat(Number(e.IGSS_MONTO).toFixed(2));
            return {
                ...e,
                IGSS_BASE:      base,
                IGSS_EMPLEADO:  igss_empleado,
                IGSS_PATRONAL:  igss_patronal,
                IGSS_TOTAL:     parseFloat((igss_empleado + igss_patronal).toFixed(2)),
            };
        });
        const totalEmpleado = parseFloat(empleados.reduce((a, e) => a + e.IGSS_EMPLEADO, 0).toFixed(2));
        const totalPatronal = parseFloat(empleados.reduce((a, e) => a + e.IGSS_PATRONAL, 0).toFixed(2));
        const totalIGSS     = parseFloat((totalEmpleado + totalPatronal).toFixed(2));
        return success(res, {
            empleados,
            totalEmpleado,
            totalPatronal,
            totalIGSS,
            porcentajes: { empleado: IGSS_EMPLEADO_PCT, patrono: IGSS_PATRONO_PCT },
        });
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

        // Recalcular totales con empleado + patrono
        let totalEmpleado = 0;
        let totalPatronal = 0;
        const detalle = comprobante.detalle.map(row => {
            const base       = Number(row.SUELDO_BASE || 0) + Number(row.HORAS_EXTRA_MONTO || 0);
            const empleado   = Number(row.IGSS_MONTO || 0);
            const patronal   = parseFloat((base * IGSS_PATRONO_PCT / 100).toFixed(2));
            totalEmpleado   += empleado;
            totalPatronal   += patronal;
            return { ...row, BASE: base, EMPLEADO: empleado, PATRONAL: patronal, SUBTOTAL: empleado + patronal };
        });
        const total = parseFloat((totalEmpleado + totalPatronal).toFixed(2));
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

        // Tabla detalle con 6 columnas
        let y = doc.y;
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('Empleado',     50, y, { width: 110 });
        doc.text('Afiliación',   165, y, { width: 70 });
        doc.text('Base',         245, y, { width: 60, align: 'right' });
        doc.text('Emp. 4.83%',   310, y, { width: 70, align: 'right' });
        doc.text('Pat. 10.67%',  385, y, { width: 75, align: 'right' });
        doc.text('Total',        465, y, { width: 80, align: 'right' });
        y += 18;
        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 4;
        doc.font('Helvetica').fontSize(9);

        for (const row of detalle) {
            doc.text(row.EMPLEADO,                            50,  y, { width: 110 });
            doc.text(row.NO_AFILIACION_IGSS || '—',           165, y, { width: 70 });
            doc.text(`Q ${row.BASE.toFixed(2)}`,              245, y, { width: 60,  align: 'right' });
            doc.text(`Q ${row.EMPLEADO.toFixed(2)}`,          310, y, { width: 70,  align: 'right' });
            doc.text(`Q ${row.PATRONAL.toFixed(2)}`,          385, y, { width: 75,  align: 'right' });
            doc.text(`Q ${row.SUBTOTAL.toFixed(2)}`,          465, y, { width: 80,  align: 'right' });
            y += 15;
            if (y > 700) { doc.addPage(); y = 50; }
        }

        // Totales
        doc.text('', 50, y + 15);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        doc.font('Helvetica-Bold').fontSize(11);
        doc.text(`Total cuota laboral (empleado 4.83%):`, 50, doc.y, { continued: true });
        doc.text(` Q ${totalEmpleado.toFixed(2)}`, { align: 'right' });
        doc.text(`Total cuota patronal (empresa 10.67%):`, 50, doc.y, { continued: true });
        doc.text(` Q ${totalPatronal.toFixed(2)}`, { align: 'right' });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.8);

        doc.fontSize(14).text('TOTAL PAGADO AL IGSS:', { align: 'center' });
        doc.moveDown(0.3);
        doc.font('Helvetica').fontSize(22).fillColor('green').text(`Q ${total.toFixed(2)}`, { align: 'center' });
        doc.fillColor('black').moveDown(1.5);
        doc.fontSize(30).fillColor('green').text('PAGADO', { align: 'center' });
        doc.fillColor('black').moveDown(1);
        doc.fontSize(10).text('Este documento certifica el pago de cuotas IGSS (laboral y patronal) al Instituto Guatemalteco de Seguridad Social.', { align: 'center' });
        doc.end();
    } catch (err) {
        if (!res.headersSent) return error(res, 'Error al generar comprobante PDF IGSS', 500, err.message);
    }
};

module.exports = { getIGSSPreview, getEstadoIGSS, pagarIGSS, getComprobanteIGSS, getComprobanteIGSSPDF };
