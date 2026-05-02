const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { success, error } = require('../../helpers/response');
const model = require('./sat.model');

// GET /api/sat/isr-preview/:id_periodo
const getISRPreview = async (req, res) => {
    try {
        const { id_periodo } = req.params;
        const data = await model.obtenerISRPreview(id_periodo);

        const empleados = data.map(emp => {
            const percepciones = Number(emp.TOTAL_PERCEPCIONES) || 0;
            const igss = Number(emp.IGSS) || 0;
            return {
                nombre: emp.EMPLEADO,
                percepciones,
                igss,
                base_isr: parseFloat((percepciones - igss).toFixed(2)),
                isr: Number(emp.ISR_RETENIDO) || 0
            };
        });

        const totalISR = empleados.reduce((acc, e) => acc + e.isr, 0);
        return success(res, { empleados, totalISR });
    } catch (err) {
        return error(res, 'Error al obtener preview ISR', 500, err.message);
    }
};

// GET /api/sat/isr-estado/:id_periodo
const getEstadoISR = async (req, res) => {
    try {
        const estado = await model.getEstadoISR(req.params.id_periodo);
        return success(res, estado);
    } catch (err) {
        return error(res, 'Error al obtener estado ISR', 500, err.message);
    }
};

// POST /api/sat/pagar-isr/:id_periodo
const pagarISR = async (req, res) => {
    try {
        const { id_periodo } = req.params;
        const yaPagado = await model.getEstadoISR(id_periodo);
        if (yaPagado.pagado)
            return error(res, 'El ISR ya fue pagado para este período', 400);

        const result = await model.pagarISR(id_periodo);
        return success(res, result, 'ISR pagado correctamente');
    } catch (err) {
        return error(res, err.message || 'Error al pagar ISR', 400, err.message);
    }
};

// GET /api/sat/isr-comprobante/:id_periodo  (JSON)
const getComprobanteISR = async (req, res) => {
    try {
        const data = await model.getComprobanteISR(req.params.id_periodo);
        return success(res, data);
    } catch (err) {
        return error(res, 'Error al obtener comprobante ISR', 500, err.message);
    }
};

// GET /api/sat/isr-preview-pdf/:id_periodo
const getISRPreviewPDF = async (req, res) => {
    try {
        const { id_periodo } = req.params;
        const data = await model.obtenerISRPreview(id_periodo);

        const empleados = data.map(emp => {
            const percepciones = Number(emp.TOTAL_PERCEPCIONES) || 0;
            const igss = Number(emp.IGSS) || 0;
            return { nombre: emp.EMPLEADO, base_isr: percepciones - igss, isr: Number(emp.ISR_RETENIDO) || 0 };
        });

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=preview_isr_${id_periodo}.pdf`);
        doc.pipe(res);

        doc.fontSize(18).text('Reporte de ISR', { align: 'center' }).moveDown();
        doc.fontSize(10).text(`Período: ${id_periodo}`, { align: 'right' }).moveDown();

        let y = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Empleado', 50, y);
        doc.text('Base ISR', 300, y);
        doc.text('ISR', 450, y);
        y += 20;
        doc.font('Helvetica');

        let totalISR = 0;
        for (const emp of empleados) {
            totalISR += emp.isr;
            doc.text(emp.nombre, 50, y);
            doc.text(`Q ${Number(emp.base_isr).toFixed(2)}`, 300, y);
            doc.text(`Q ${Number(emp.isr).toFixed(2)}`, 450, y);
            y += 18;
            if (y > 700) { doc.addPage(); y = 50; }
        }

        doc.moveDown().font('Helvetica-Bold').text(`Total ISR: Q ${totalISR.toFixed(2)}`, { align: 'right' });
        doc.end();
    } catch (err) {
        if (!res.headersSent) return error(res, 'Error generando PDF', 500, err.message);
    }
};

// GET /api/sat/isr-comprobante-pdf/:id_periodo
const getComprobanteISRPDF = async (req, res) => {
    try {
        const { id_periodo } = req.params;
        const comprobante = await model.getComprobanteISR(id_periodo);
        const patrono = await model.getPatronoActivo();

        const empresa = patrono?.RAZON_SOCIAL || 'Empresa';
        const numeroPatronal = patrono?.NUMERO_PATRONAL || 'N/A';
        const total = Number(comprobante.pago.TOTAL);
        const fecha = comprobante.pago.FECHA_PAGO
            ? new Date(comprobante.pago.FECHA_PAGO).toLocaleDateString('es-GT')
            : new Date().toLocaleDateString('es-GT');

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=comprobante_isr_${id_periodo}.pdf`);
        doc.pipe(res);

        doc.fontSize(18).text('COMPROBANTE DE PAGO ISR', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).text(empresa, { align: 'center' });
        doc.text(`Registro Patronal: ${numeroPatronal}`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(12).text(`Período: ${id_periodo}`).text(`Fecha de pago: ${fecha}`);
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(2);

        // Tabla de detalle
        let y = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Empleado', 50, y);
        doc.text('Base ISR', 300, y);
        doc.text('ISR Retenido', 430, y);
        y += 20;
        doc.font('Helvetica');

        for (const row of comprobante.detalle) {
            doc.text(row.NOMBRE, 50, y);
            doc.text(`Q ${Number(row.BASE_ISR).toFixed(2)}`, 300, y);
            doc.text(`Q ${Number(row.ISR_MONTO).toFixed(2)}`, 430, y);
            y += 18;
            if (y > 700) { doc.addPage(); y = 50; }
        }

        doc.moveDown(2);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(2);
        doc.fontSize(14).text('TOTAL PAGADO:', { align: 'center' });
        doc.fontSize(20).fillColor('green').text(`Q ${total.toFixed(2)}`, { align: 'center' });
        doc.fillColor('black').moveDown(2);
        doc.fontSize(30).fillColor('green').text('PAGADO', { align: 'center' });
        doc.fillColor('black').moveDown();
        doc.fontSize(10).text('Este documento certifica que el ISR ha sido pagado ante la SAT.', { align: 'center' });
        doc.end();
    } catch (err) {
        if (!res.headersSent) return error(res, 'Error al generar comprobante PDF', 500, err.message);
    }
};

// GET /api/sat/isr-preview-excel/:id_periodo
const getISRPreviewExcel = async (req, res) => {
    try {
        const { id_periodo } = req.params;
        const data = await model.obtenerISRPreview(id_periodo);
        const totalISR = data.reduce((acc, e) => acc + (Number(e.ISR_RETENIDO) || 0), 0);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Preview ISR');

        sheet.columns = [
            { header: 'Empleado', key: 'nombre', width: 30 },
            { header: 'Percepciones', key: 'percepciones', width: 16 },
            { header: 'IGSS', key: 'igss', width: 14 },
            { header: 'Base ISR', key: 'base_isr', width: 14 },
            { header: 'ISR', key: 'isr', width: 14 }
        ];

        data.forEach(emp => {
            const percepciones = Number(emp.TOTAL_PERCEPCIONES) || 0;
            const igss = Number(emp.IGSS) || 0;
            sheet.addRow({
                nombre: emp.EMPLEADO,
                percepciones,
                igss,
                base_isr: parseFloat((percepciones - igss).toFixed(2)),
                isr: Number(emp.ISR_RETENIDO) || 0
            });
        });

        sheet.addRow({});
        const totalRow = sheet.addRow({ nombre: 'TOTAL', isr: totalISR });
        totalRow.font = { bold: true };
        sheet.getRow(1).font = { bold: true };
        ['percepciones', 'igss', 'base_isr', 'isr'].forEach(k => {
            const col = sheet.getColumn(k);
            col.numFmt = '"Q"#,##0.00';
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=ISR_Preview_${id_periodo}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        return error(res, 'Error generando Excel', 500, err.message);
    }
};

module.exports = {
    getISRPreview,
    getEstadoISR,
    pagarISR,
    getComprobanteISR,
    getISRPreviewPDF,
    getComprobanteISRPDF,
    getISRPreviewExcel
};
