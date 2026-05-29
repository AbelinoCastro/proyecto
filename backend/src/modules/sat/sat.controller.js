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
        const totalISR = empleados.reduce((s, e) => s + e.isr, 0);

        const GOLD = '#C5A028', DARK = '#0f1419', SLATE = '#1f2937', MUTED = '#6b7280';

        const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=Preview_ISR_${id_periodo}.pdf`);
        doc.pipe(res);

        const W = doc.page.width;
        const M = 50;

        // Hero
        doc.rect(0, 0, W, 110).fill(DARK);
        doc.rect(0, 105, W, 5).fill(GOLD);
        doc.fillColor('white').font('Helvetica-Bold').fontSize(24).text('NóminaGT', M, 32, { lineBreak: false });
        doc.fillColor(GOLD).fontSize(24).text('.', M + 125, 32);
        doc.fillColor('#9ca3af').fontSize(7).font('Helvetica').text('ENTERPRISE · v 4.2', M, 62, { characterSpacing: 3 });

        doc.fillColor(GOLD).fontSize(7).font('Helvetica-Bold')
           .text('PREVIEW', W - M - 100, 32, { width: 100, align: 'right', characterSpacing: 2 });
        doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
           .text(`Período ${id_periodo}`, W - M - 100, 47, { width: 100, align: 'right' });

        // Título
        doc.fillColor(DARK).font('Helvetica-Bold').fontSize(20)
           .text('Reporte de Cálculo ISR', M, 135, { align: 'center', width: W - 2 * M });
        doc.fillColor(MUTED).fontSize(8).font('Helvetica')
           .text('Previo a liquidación · No constituye comprobante de pago', M, 162, { align: 'center', width: W - 2 * M, characterSpacing: 2 });

        // Tabla
        let y = 195;
        doc.rect(M, y, W - 2 * M, 22).fill(DARK);
        doc.fillColor(GOLD).fontSize(7).font('Helvetica-Bold');
        doc.text('EMPLEADO',       M + 10,  y + 8, { width: 220, characterSpacing: 1.5 });
        doc.text('BASE GRAVABLE',  M + 240, y + 8, { width: 120, align: 'right', characterSpacing: 1.5 });
        doc.text('ISR MENSUAL',    M + 370, y + 8, { width: 125, align: 'right', characterSpacing: 1.5 });
        y += 22;

        let rowIdx = 0;
        for (const emp of empleados) {
            if (rowIdx % 2 === 0) doc.rect(M, y, W - 2 * M, 22).fill('#f8f8f8');
            doc.fillColor(DARK).font('Helvetica').fontSize(9);
            doc.text((emp.nombre || '').substring(0, 42), M + 10, y + 7, { width: 220, lineBreak: false });
            doc.text(fmtQ(emp.base_isr), M + 240, y + 7, { width: 120, align: 'right' });
            doc.fillColor('#d97706').font('Helvetica-Bold');
            doc.text(fmtQ(emp.isr), M + 370, y + 7, { width: 125, align: 'right' });
            y += 22;
            rowIdx++;
            if (y > 700) { doc.addPage(); y = 50; }
        }

        y += 20;
        doc.roundedRect(M, y, W - 2 * M, 70, 12).fill(DARK);
        doc.rect(M, y, 6, 70).fill(GOLD);
        doc.fillColor(GOLD).fontSize(8).font('Helvetica-Bold')
           .text('TOTAL ISR ESTIMADO DEL PERÍODO', M + 25, y + 15, { characterSpacing: 3 });
        doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
           .text(fmtQ(totalISR), M + 25, y + 32, { width: W - 2 * M - 50, align: 'right' });

        // Footer
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc.rect(0, 800, W, 42).fill(SLATE);
            doc.fillColor(GOLD).fontSize(7).font('Helvetica-Bold')
               .text('NóminaGT · Enterprise', M, 815, { characterSpacing: 2 });
            doc.fillColor('#9ca3af').fontSize(7).font('Helvetica')
               .text(`Página ${i - range.start + 1} de ${range.count}`, M, 815, { width: W - 2 * M, align: 'center' });
            doc.text(`Generado ${new Date().toLocaleDateString('es-GT')}`, M, 815, { width: W - 2 * M, align: 'right' });
        }

        doc.end();
    } catch (err) {
        if (!res.headersSent) return error(res, 'Error generando PDF', 500, err.message);
    }
};

const fmtQ = (n) => `Q ${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// GET /api/sat/isr-comprobante-pdf/:id_periodo
const getComprobanteISRPDF = async (req, res) => {
    try {
        const { id_periodo } = req.params;
        const comprobante = await model.getComprobanteISR(id_periodo);
        const patrono = await model.getPatronoActivo();

        const empresa = patrono?.RAZON_SOCIAL || 'Empresa';
        const nit = patrono?.NIT || 'N/A';
        const numeroPatronal = patrono?.NUMERO_PATRONAL || 'N/A';
        const total = Number(comprobante.pago.TOTAL);
        const fecha = comprobante.pago.FECHA_PAGO
            ? new Date(comprobante.pago.FECHA_PAGO).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: '2-digit' })
            : new Date().toLocaleDateString('es-GT');
        const referencia = `ISR-${String(id_periodo).padStart(6, '0')}`;

        // Colores
        const GOLD     = '#C5A028';
        const DARK     = '#0f1419';
        const SLATE    = '#1f2937';
        const MUTED    = '#6b7280';
        const LIGHT_BG = '#fafafa';

        const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=Comprobante_ISR_${id_periodo}.pdf`);
        doc.pipe(res);

        const W = doc.page.width;
        const M = 50;

        // ═══════════════════ HERO ═══════════════════
        doc.rect(0, 0, W, 130).fill(DARK);
        doc.rect(0, 125, W, 5).fill(GOLD);

        doc.fillColor('white').font('Helvetica-Bold').fontSize(28).text('NóminaGT', M, 35, { lineBreak: false });
        doc.fillColor(GOLD).fontSize(28).text('.', M + 145, 35);
        doc.fillColor('#9ca3af').fontSize(8).font('Helvetica').text('ENTERPRISE · v 4.2', M, 70, { characterSpacing: 3 });

        doc.fillColor(GOLD).fontSize(8).font('Helvetica-Bold')
           .text('REFERENCIA', W - M - 150, 35, { width: 150, align: 'right', characterSpacing: 2 });
        doc.fillColor('white').fontSize(16).font('Helvetica-Bold')
           .text(referencia, W - M - 150, 50, { width: 150, align: 'right' });
        doc.fillColor('#9ca3af').fontSize(8).font('Helvetica')
           .text(`Período ${id_periodo}`, W - M - 150, 75, { width: 150, align: 'right' });
        doc.text(fecha, W - M - 150, 88, { width: 150, align: 'right' });

        // ═══════════════════ TÍTULO ═══════════════════
        doc.fillColor(DARK).font('Helvetica-Bold').fontSize(24)
           .text('Comprobante de Retención ISR', M, 160, { align: 'center', width: W - 2 * M });
        doc.fillColor(MUTED).fontSize(9).font('Helvetica')
           .text('Superintendencia de Administración Tributaria · SAT', M, 195, { align: 'center', width: W - 2 * M, characterSpacing: 2 });

        const lineY = 220;
        doc.moveTo(W / 2 - 30, lineY).lineTo(W / 2 + 30, lineY).lineWidth(2).stroke(GOLD);

        // ═══════════════════ INFO CARDS (entidad) ═══════════════════
        const cardY = 245;
        const cardW = (W - 2 * M - 15) / 2;
        const cardH = 75;

        // Card empresa
        doc.roundedRect(M, cardY, cardW, cardH, 8).fill(LIGHT_BG);
        doc.rect(M, cardY, 4, cardH).fill(GOLD);
        doc.fillColor(MUTED).fontSize(7).font('Helvetica-Bold')
           .text('AGENTE RETENEDOR', M + 16, cardY + 14, { characterSpacing: 2 });
        doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold')
           .text(empresa.substring(0, 38), M + 16, cardY + 30, { width: cardW - 30 });
        doc.fillColor(MUTED).fontSize(8).font('Helvetica')
           .text(`NIT: ${nit} · Patronal: ${numeroPatronal}`, M + 16, cardY + 52);

        // Card resumen
        const c2x = M + cardW + 15;
        doc.roundedRect(c2x, cardY, cardW, cardH, 8).fill(LIGHT_BG);
        doc.rect(c2x, cardY, 4, cardH).fill(GOLD);
        doc.fillColor(MUTED).fontSize(7).font('Helvetica-Bold')
           .text('EMPLEADOS GRAVADOS', c2x + 16, cardY + 14, { characterSpacing: 2 });
        doc.fillColor(DARK).fontSize(13).font('Helvetica-Bold')
           .text(`${comprobante.detalle.length} colaboradores`, c2x + 16, cardY + 30);
        doc.fillColor(MUTED).fontSize(8).font('Helvetica')
           .text('Retención sobre planilla mensual', c2x + 16, cardY + 52);

        // ═══════════════════ TABLA ═══════════════════
        let y = cardY + cardH + 30;

        doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11)
           .text('Detalle de Retenciones', M, y);
        y += 22;

        doc.rect(M, y, W - 2 * M, 22).fill(DARK);
        doc.fillColor(GOLD).fontSize(7).font('Helvetica-Bold');
        doc.text('EMPLEADO',      M + 10,  y + 8, { width: 200, characterSpacing: 1.5 });
        doc.text('BASE GRAVABLE', M + 230, y + 8, { width: 120, align: 'right', characterSpacing: 1.5 });
        doc.text('ISR RETENIDO',  M + 360, y + 8, { width: 135, align: 'right', characterSpacing: 1.5 });
        y += 22;

        let rowIdx = 0;
        for (const row of comprobante.detalle) {
            const rowH = 22;
            if (rowIdx % 2 === 0) {
                doc.rect(M, y, W - 2 * M, rowH).fill('#f8f8f8');
            }
            doc.fillColor(DARK).font('Helvetica').fontSize(9);
            doc.text((row.NOMBRE || '').substring(0, 40), M + 10, y + 7, { width: 200, lineBreak: false });
            doc.text(fmtQ(row.BASE_ISR), M + 230, y + 7, { width: 120, align: 'right' });
            doc.fillColor('#d97706').font('Helvetica-Bold');
            doc.text(fmtQ(row.ISR_MONTO), M + 360, y + 7, { width: 135, align: 'right' });
            y += rowH;
            rowIdx++;
            if (y > 700) { doc.addPage(); y = 50; }
        }

        y += 10;

        // ═══════════════════ TOTAL HERO ═══════════════════
        const totalCardH = 90;
        if (y + totalCardH > 720) { doc.addPage(); y = 50; }

        doc.roundedRect(M, y, W - 2 * M, totalCardH, 12).fill(DARK);
        doc.rect(M, y, 6, totalCardH).fill(GOLD);

        doc.fillColor(GOLD).fontSize(8).font('Helvetica-Bold')
           .text('TOTAL ISR RETENIDO Y PAGADO A SAT', M + 25, y + 18, { characterSpacing: 3 });
        doc.fillColor('#9ca3af').fontSize(9).font('Helvetica')
           .text('Decreto 10-2012 · Régimen de personas en relación de dependencia', M + 25, y + 35);
        doc.fillColor('white').fontSize(28).font('Helvetica-Bold')
           .text(fmtQ(total), M + 25, y + 50, { width: W - 2 * M - 50, align: 'right' });
        y += totalCardH + 15;

        // Sello PAGADO
        if (y + 50 > 750) { doc.addPage(); y = 50; }
        doc.fillColor('#10b981').fontSize(36).font('Helvetica-Bold')
           .text('✓ PAGADO', M, y, { align: 'center', width: W - 2 * M, characterSpacing: 4 });

        // ═══════════════════ FOOTER ═══════════════════
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc.rect(0, 800, W, 42).fill(SLATE);
            doc.fillColor(GOLD).fontSize(7).font('Helvetica-Bold')
               .text('NóminaGT · Enterprise', M, 815, { characterSpacing: 2 });
            doc.fillColor('#9ca3af').fontSize(7).font('Helvetica')
               .text(`Página ${i - range.start + 1} de ${range.count}`, M, 815, { width: W - 2 * M, align: 'center' });
            doc.text(`Generado ${new Date().toLocaleDateString('es-GT')}`, M, 815, { width: W - 2 * M, align: 'right' });
            doc.fillColor('#6b7280').fontSize(6).font('Helvetica-Oblique')
               .text('Este documento certifica que el ISR ha sido retenido y pagado ante la Superintendencia de Administración Tributaria (SAT).',
                     M, 828, { width: W - 2 * M, align: 'center' });
        }

        doc.end();
    } catch (err) {
        console.error('Error PDF ISR:', err);
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
