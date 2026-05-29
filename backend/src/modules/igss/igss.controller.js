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

// Helper para formatear moneda Q1,234.56
const fmtQ = (n) => `Q ${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// GET /api/igss/comprobante-pdf/:id_periodo
const getComprobanteIGSSPDF = async (req, res) => {
    try {
        const { id_periodo } = req.params;
        const comprobante = await model.getComprobanteIGSS(id_periodo);

        let totalEmpleado = 0;
        let totalPatronal = 0;
        const detalle = comprobante.detalle.map(row => {
            const base     = Number(row.SUELDO_BASE || 0) + Number(row.HORAS_EXTRA_MONTO || 0);
            const empleado = Number(row.IGSS_MONTO || 0);
            const patronal = parseFloat((base * IGSS_PATRONO_PCT / 100).toFixed(2));
            totalEmpleado += empleado;
            totalPatronal += patronal;
            return { ...row, BASE: base, EMPLEADO: empleado, PATRONAL: patronal, SUBTOTAL: empleado + patronal };
        });
        const total = parseFloat((totalEmpleado + totalPatronal).toFixed(2));
        const fecha = comprobante.pago.FECHA_PAGO
            ? new Date(comprobante.pago.FECHA_PAGO).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: '2-digit' })
            : new Date().toLocaleDateString('es-GT');
        const referencia = `IGSS-${String(id_periodo).padStart(6, '0')}`;

        // Colores
        const GOLD     = '#C5A028';
        const DARK     = '#0f1419';
        const SLATE    = '#1f2937';
        const MUTED    = '#6b7280';
        const LIGHT_BG = '#fafafa';

        const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=Comprobante_IGSS_${id_periodo}.pdf`);
        doc.pipe(res);
        // Si algo falla en el stream, no propagamos el error que rompe el server
        doc.on('error', (e) => console.error('PDF stream error:', e.message));
        res.on('error', (e) => console.error('Response stream error:', e.message));

        const W = doc.page.width;   // 595
        const M = 50;                // margen lateral

        // ═══════════════════ HERO ═══════════════════
        doc.rect(0, 0, W, 130).fill(DARK);
        doc.rect(0, 125, W, 5).fill(GOLD);

        // Brand logo
        doc.fillColor('white').font('Helvetica-Bold').fontSize(28)
           .text('NóminaGT', M, 35, { lineBreak: false });
        doc.fillColor(GOLD).fontSize(28).text('.', M + 145, 35);
        doc.fillColor('#9ca3af').fontSize(8).font('Helvetica').text('ENTERPRISE · v 4.2', M, 70, { characterSpacing: 3 });

        // Doc meta
        doc.fillColor(GOLD).fontSize(8).font('Helvetica-Bold')
           .text('REFERENCIA', W - M - 150, 35, { width: 150, align: 'right', characterSpacing: 2 });
        doc.fillColor('white').fontSize(16).font('Helvetica-Bold')
           .text(referencia, W - M - 150, 50, { width: 150, align: 'right' });
        doc.fillColor('#9ca3af').fontSize(8).font('Helvetica')
           .text(`Período ${id_periodo}`, W - M - 150, 75, { width: 150, align: 'right' });
        doc.text(fecha, W - M - 150, 88, { width: 150, align: 'right' });

        // ═══════════════════ TÍTULO ═══════════════════
        doc.fillColor(DARK).font('Helvetica-Bold').fontSize(24)
           .text('Comprobante de Pago IGSS', M, 160, { align: 'center', width: W - 2 * M });
        doc.fillColor(MUTED).fontSize(9).font('Helvetica')
           .text('Instituto Guatemalteco de Seguridad Social', M, 195, { align: 'center', width: W - 2 * M, characterSpacing: 2 });

        // Línea decorativa
        const lineY = 220;
        doc.moveTo(W / 2 - 30, lineY).lineTo(W / 2 + 30, lineY).lineWidth(2).stroke(GOLD);

        // ═══════════════════ INFO CARDS ═══════════════════
        const cardY = 245;
        const cardW = (W - 2 * M - 15) / 2;
        const cardH = 70;

        // Card 1
        doc.roundedRect(M, cardY, cardW, cardH, 8).fill(LIGHT_BG);
        doc.rect(M, cardY, 4, cardH).fill(GOLD);
        doc.fillColor(MUTED).fontSize(7).font('Helvetica-Bold')
           .text('TIPO DE CONTRIBUCIÓN', M + 16, cardY + 14, { characterSpacing: 2 });
        doc.fillColor(DARK).fontSize(13).font('Helvetica-Bold')
           .text('Cuota Laboral y Patronal', M + 16, cardY + 30);
        doc.fillColor(MUTED).fontSize(8).font('Helvetica')
           .text('Decreto 78-89 · Bonificación exenta', M + 16, cardY + 50);

        // Card 2
        const c2x = M + cardW + 15;
        doc.roundedRect(c2x, cardY, cardW, cardH, 8).fill(LIGHT_BG);
        doc.rect(c2x, cardY, 4, cardH).fill(GOLD);
        doc.fillColor(MUTED).fontSize(7).font('Helvetica-Bold')
           .text('EMPLEADOS CONTRIBUYENTES', c2x + 16, cardY + 14, { characterSpacing: 2 });
        doc.fillColor(DARK).fontSize(13).font('Helvetica-Bold')
           .text(`${detalle.length} colaboradores`, c2x + 16, cardY + 30);
        doc.fillColor(MUTED).fontSize(8).font('Helvetica')
           .text('Procesados vía sistema NóminaGT', c2x + 16, cardY + 50);

        // ═══════════════════ TABLA ═══════════════════
        let y = cardY + cardH + 30;

        // Header tabla
        doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11)
           .text('Detalle por Colaborador', M, y);
        y += 22;

        // Cabecera columnas con fondo
        doc.rect(M, y, W - 2 * M, 22).fill(DARK);
        doc.fillColor(GOLD).fontSize(7).font('Helvetica-Bold');
        doc.text('EMPLEADO',    M + 10,  y + 8, { width: 130, characterSpacing: 1.5 });
        doc.text('AFILIACIÓN',  M + 145, y + 8, { width: 65,  characterSpacing: 1.5 });
        doc.text('BASE',        M + 215, y + 8, { width: 60,  align: 'right', characterSpacing: 1.5 });
        doc.text('EMP. 4.83%',  M + 280, y + 8, { width: 70,  align: 'right', characterSpacing: 1.5 });
        doc.text('PAT. 10.67%', M + 355, y + 8, { width: 70,  align: 'right', characterSpacing: 1.5 });
        doc.text('TOTAL',       M + 430, y + 8, { width: 65,  align: 'right', characterSpacing: 1.5 });
        y += 22;

        // Filas
        let rowIdx = 0;
        for (const row of detalle) {
            const rowH = 22;
            if (rowIdx % 2 === 0) {
                doc.rect(M, y, W - 2 * M, rowH).fill('#f8f8f8');
            }
            doc.fillColor(DARK).font('Helvetica').fontSize(9);
            doc.text(String(row.EMPLEADO || '').substring(0, 28), M + 10, y + 7, { width: 130, lineBreak: false });
            doc.fillColor(MUTED).font('Helvetica-Oblique').fontSize(8);
            doc.text(String(row.NO_AFILIACION_IGSS || '—'), M + 145, y + 8, { width: 65 });
            doc.fillColor(DARK).font('Helvetica').fontSize(9);
            doc.text(fmtQ(row.BASE),      M + 215, y + 7, { width: 60, align: 'right' });
            doc.fillColor('#2563eb').font('Helvetica-Bold');
            doc.text(fmtQ(row.EMPLEADO),  M + 280, y + 7, { width: 70, align: 'right' });
            doc.fillColor('#d97706');
            doc.text(fmtQ(row.PATRONAL),  M + 355, y + 7, { width: 70, align: 'right' });
            doc.fillColor(DARK);
            doc.text(fmtQ(row.SUBTOTAL),  M + 430, y + 7, { width: 65, align: 'right' });
            y += rowH;
            rowIdx++;
            if (y > 700) {
                doc.addPage();
                y = 50;
            }
        }

        // Total row
        doc.rect(M, y, W - 2 * M, 28).fill(SLATE);
        doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(9);
        doc.text('SUBTOTALES', M + 10, y + 10, { characterSpacing: 1.5 });
        doc.fillColor('white').fontSize(11);
        doc.text(fmtQ(totalEmpleado), M + 280, y + 9, { width: 70, align: 'right' });
        doc.text(fmtQ(totalPatronal), M + 355, y + 9, { width: 70, align: 'right' });
        doc.text(fmtQ(total),         M + 430, y + 9, { width: 65, align: 'right' });
        y += 40;

        // ═══════════════════ TOTAL HERO ═══════════════════
        const totalCardH = 90;
        if (y + totalCardH > 720) { doc.addPage(); y = 50; }

        doc.roundedRect(M, y, W - 2 * M, totalCardH, 12).fill(DARK);
        // Acento dorado
        doc.rect(M, y, 6, totalCardH).fill(GOLD);

        doc.fillColor(GOLD).fontSize(8).font('Helvetica-Bold')
           .text('TOTAL PAGADO AL IGSS', M + 25, y + 18, { characterSpacing: 3 });
        doc.fillColor('#9ca3af').fontSize(9).font('Helvetica')
           .text('Cuotas laboral + patronal del período', M + 25, y + 35);
        doc.fillColor('white').fontSize(28).font('Helvetica-Bold')
           .text(fmtQ(total), M + 25, y + 50, { width: W - 2 * M - 50, align: 'right' });
        y += totalCardH + 15;

        // Sello "PAGADO"
        if (y + 50 > 750) { doc.addPage(); y = 50; }
        doc.fillColor('#10b981').fontSize(36).font('Helvetica-Bold')
           .text('✓ PAGADO', M, y, { align: 'center', width: W - 2 * M, characterSpacing: 4 });
        y += 50;

        // ═══════════════════ FOOTER ═══════════════════
        // Pie de página solo en la última (lo dibujo fijo)
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            // Línea decorativa al pie
            doc.rect(0, 800, W, 42).fill(SLATE);
            doc.fillColor(GOLD).fontSize(7).font('Helvetica-Bold')
               .text('NóminaGT · Enterprise', M, 815, { characterSpacing: 2 });
            doc.fillColor('#9ca3af').fontSize(7).font('Helvetica')
               .text(`Página ${i - range.start + 1} de ${range.count}`, M, 815, { width: W - 2 * M, align: 'center' });
            doc.text(`Generado ${new Date().toLocaleDateString('es-GT')}`, M, 815, { width: W - 2 * M, align: 'right' });
            doc.fillColor('#6b7280').fontSize(6).font('Helvetica-Oblique')
               .text('Este documento certifica el pago de cuotas IGSS (laboral y patronal) ante el Instituto Guatemalteco de Seguridad Social.',
                     M, 828, { width: W - 2 * M, align: 'center' });
        }

        doc.end();
    } catch (err) {
        console.error('Error PDF IGSS:', err);
        if (!res.headersSent) return error(res, 'Error al generar comprobante PDF IGSS', 500, err.message);
    }
};

module.exports = { getIGSSPreview, getEstadoIGSS, pagarIGSS, getComprobanteIGSS, getComprobanteIGSSPDF };
