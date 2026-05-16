const ExcelJS = require('exceljs');
const model = require('./formatoSalarios.model');
const { error } = require('../../helpers/response');

// Mapeo de percepciones del catálogo a columnas del formato oficial
const MAP_PER = {
    PER01: 'SUELDO_BASE',       // Salario Ordinario
    PER05: 'HORAS_EXTRA',       // Salario Extraordinario
    PER06: 'AGUINALDO',         // Bonificación anual 42-32 / Aguinaldo D.76-78
    PER07: 'BONO14',            // Bonificación anual 42-32
    PER02: 'BONIF_INCENTIVO',   // Bonificación Incentivo D.37-2001
    PER08: 'VACACIONES',        // Vacaciones
    // Cualquier otra cae en OTROS_SALARIOS
};

const MAP_DED = {
    DED01: 'IGSS',
    DED02: 'ISR',
    // Cualquier otra cae en OTRAS_DED
};

const calcularEdad = (fechaNac) => {
    if (!fechaNac) return '';
    const hoy = new Date();
    const nac = new Date(fechaNac);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
};

const fmtFecha = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
};

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// GET /api/formato-salarios/:id_empleado?anio=2026
const generarFormato = async (req, res) => {
    try {
        const id_empleado = req.params.id_empleado;
        const anio = parseInt(req.query.anio) || new Date().getFullYear();

        const [patrono, empleado, nominas] = await Promise.all([
            model.getPatrono(),
            model.getEmpleado(id_empleado),
            model.getNominasPagadasAnio(id_empleado, anio),
        ]);

        if (!empleado) return error(res, 'Empleado no encontrado', 404);
        if (nominas.length === 0) return error(res, 'No hay nóminas pagadas para este empleado en el año seleccionado', 400);

        // Procesar cada nómina y agruparla por columnas del formato
        const filas = nominas.map((n, idx) => {
            const fila = {
                NO_PAGO: idx + 1,
                PERIODO: `${MESES[(n.NUMERO_PERIODO || 1) - 1]} ${n.ANIO}`,
                SALARIO_QTZ: Number(n.SUELDO_BASE || 0),
                DIAS_TRABAJADOS: 30,
                HORAS_ORD: 0,
                HORAS_EXT: 0,
                SUELDO_BASE: 0,
                HORAS_EXTRA: 0,
                OTROS_SALARIOS: 0,
                SEPTIMOS_ASUETOS: 0,
                VACACIONES: 0,
                SALARIO_TOTAL: Number(n.TOTAL_PERCEPCIONES || 0),
                IGSS: 0,
                ISR: 0,
                OTRAS_DED: 0,
                TOTAL_DED: Number(n.TOTAL_DEDUCCIONES || 0),
                AGUINALDO: 0,
                BONO14: 0,
                BONIF_INCENTIVO: 0,
                DEVOLUCIONES: 0,
                SALARIO_LIQUIDO: Number(n.LIQUIDO_A_PAGAR || 0),
                REFERENCIA: `REF-${String(n.ID_NOMINA).padStart(4, '0')}`,
                OBSERVACIONES: n.OBSERVACION || '',
            };

            // Sumar percepciones por columna
            for (const p of n.PERCEPCIONES) {
                const col = MAP_PER[p.ID_PERCEPCION] || 'OTROS_SALARIOS';
                fila[col] = (fila[col] || 0) + Number(p.MONTO || 0);
                if (p.ID_PERCEPCION === 'PER05' && p.HE_CANTIDAD) {
                    fila.HORAS_EXT += Number(p.HE_CANTIDAD);
                }
            }

            // Sumar deducciones por columna
            for (const d of n.DEDUCCIONES) {
                const col = MAP_DED[d.ID_DEDUCCION] || 'OTRAS_DED';
                fila[col] = (fila[col] || 0) + Number(d.MONTO || 0);
            }

            return fila;
        });

        // Generar Excel
        const wb = new ExcelJS.Workbook();
        wb.creator = 'Sistema Nómina';
        const ws = wb.addWorksheet('Formato Único de Salarios', {
            pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
            properties: { defaultRowHeight: 18 },
        });

        // Anchos de columnas
        ws.columns = [
            { width: 6 },   // A No. Pago
            { width: 14 },  // B Período
            { width: 13 },  // C Salario Quetzales
            { width: 8 },   // D Días
            { width: 9 },   // E Horas Ord
            { width: 9 },   // F Horas Ext
            { width: 11 },  // G Sueldo base
            { width: 11 },  // H Extraordinario
            { width: 11 },  // I Otros salarios
            { width: 11 },  // J Séptimos/asuetos
            { width: 11 },  // K Vacaciones
            { width: 12 },  // L Salario Total
            { width: 11 },  // M IGSS
            { width: 11 },  // N ISR
            { width: 11 },  // O Otras Ded
            { width: 12 },  // P Total Ded
            { width: 12 },  // Q Aguinaldo
            { width: 12 },  // R Bonif Incentivo
            { width: 12 },  // S Devoluciones
            { width: 13 },  // T Salario Líquido
            { width: 14 },  // U Firma/Boleta
            { width: 20 },  // V Observaciones
        ];

        // ====== ENCABEZADO ======
        ws.getCell('A1').value = 'Modelo del Formato Único de Salarios.';
        ws.getCell('A1').font = { size: 9, italic: true };

        ws.getCell('U2').value = `Folio No. _______`;
        ws.getCell('U2').font = { size: 10 };

        ws.mergeCells('A4:V4');
        ws.getCell('A4').value = `ENTIDAD   (Razón Social)   ${patrono?.RAZON_SOCIAL || ''}`;
        ws.getCell('A4').font = { bold: true, size: 12 };
        ws.getCell('A4').alignment = { horizontal: 'center' };

        ws.mergeCells('A5:V5');
        ws.getCell('A5').value = `NIT  ${patrono?.NIT || '—'}`;
        ws.getCell('A5').font = { bold: true, size: 11 };
        ws.getCell('A5').alignment = { horizontal: 'center' };

        ws.mergeCells('A6:V7');
        ws.getCell('A6').value = 'LIBRO COMPUTARIZADO PARA LA OPERACIÓN DE SALARIOS DE TRABAJADORES PERMANENTES, AUTORIZADO POR EL MINISTERIO DE TRABAJO Y PREVISIÓN SOCIAL, FUNDAMENTO LEGAL: ARTÍCULOS 102 DEL DECRETO No.1441 Y 2 DEL ACUERDO MINISTERIAL No.124-2019';
        ws.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        ws.getCell('A6').font = { size: 9 };

        // Datos del trabajador (fila 9)
        const datosTrabajador = [
            { label: 'Nombre del trabajador',  value: empleado.NOMBRE,             cols: 'A9:E9'  },
            { label: 'Edad',                   value: calcularEdad(empleado.FECHA_NACIMIENTO), cols: 'F9:H9'  },
            { label: 'Género',                 value: empleado.GENERO || '',       cols: 'I9:L9'  },
            { label: 'Nacionalidad',           value: empleado.NACIONALIDAD || '', cols: 'M9:Q9'  },
            { label: 'Ocupación o puesto que desempeña', value: empleado.NOMBRE_PUESTO || '', cols: 'R9:V9' },
        ];

        ws.getRow(9).height = 36;
        datosTrabajador.forEach(d => {
            ws.mergeCells(d.cols);
            const c = ws.getCell(d.cols.split(':')[0]);
            c.value = { richText: [
                { text: d.label + '\n', font: { size: 8, color: { argb: 'FF666666' } } },
                { text: String(d.value), font: { size: 10, bold: true } }
            ]};
            c.alignment = { vertical: 'middle', wrapText: true };
            c.border = { bottom: { style: 'thin' } };
        });

        const datosLaborales = [
            { label: 'No. de afiliación al IGSS', value: empleado.NO_AFILIACION_IGSS || '', cols: 'A11:E11' },
            { label: 'No. DPI ó permiso de trabajo', value: empleado.NO_DPI_PERMISO || '', cols: 'F11:K11' },
            { label: 'Inicio de relación laboral', value: fmtFecha(empleado.FECHA_INICIO), cols: 'L11:Q11' },
            { label: 'Fecha de finalización de relación laboral', value: fmtFecha(empleado.FECHA_FIN) || 'Vigente', cols: 'R11:V11' },
        ];

        ws.getRow(11).height = 36;
        datosLaborales.forEach(d => {
            ws.mergeCells(d.cols);
            const c = ws.getCell(d.cols.split(':')[0]);
            c.value = { richText: [
                { text: d.label + '\n', font: { size: 8, color: { argb: 'FF666666' } } },
                { text: String(d.value), font: { size: 10, bold: true } }
            ]};
            c.alignment = { vertical: 'middle', wrapText: true };
            c.border = { bottom: { style: 'thin' } };
        });

        // ====== ENCABEZADO TABLA (filas 13-14) ======
        const headerRow1 = ws.getRow(13);
        const headerRow2 = ws.getRow(14);
        headerRow1.height = 32;
        headerRow2.height = 32;

        const headerStyle = {
            font: { bold: true, size: 8 },
            alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } },
            border: {
                top:    { style: 'thin' },
                bottom: { style: 'thin' },
                left:   { style: 'thin' },
                right:  { style: 'thin' }
            }
        };

        // Encabezados simples (combina filas 13 y 14)
        const simples = [
            ['A', 'No. de Pago'],
            ['B', 'Período de trabajo'],
            ['C', 'Salario en Quetzales'],
            ['D', 'Días trabajados'],
            ['L', 'SALARIO TOTAL'],
            ['Q', 'Bonificación anual 42-32, Aguinaldo Decreto 76-78'],
            ['R', 'Bonificación Incentivo Decreto 37-2001'],
            ['S', 'Devoluciones I.S.R. y otras'],
            ['T', 'Salario Líquido'],
            ['U', 'Firma o número de boleta de pago / váucher'],
            ['V', 'Observaciones'],
        ];
        simples.forEach(([col, label]) => {
            ws.mergeCells(`${col}13:${col}14`);
            const c = ws.getCell(`${col}13`);
            c.value = label;
            Object.assign(c, headerStyle);
            c.font = headerStyle.font;
            c.alignment = headerStyle.alignment;
            c.fill = headerStyle.fill;
            c.border = headerStyle.border;
        });

        // Grupos
        ws.mergeCells('E13:F13'); ws.getCell('E13').value = 'HORAS TRABAJADAS';
        ws.mergeCells('G13:K13'); ws.getCell('G13').value = 'SALARIO DEVENGADO';
        ws.mergeCells('M13:P13'); ws.getCell('M13').value = 'DEDUCCIONES LEGALES';
        ['E13','G13','M13'].forEach(addr => {
            const c = ws.getCell(addr);
            c.font = headerStyle.font;
            c.alignment = headerStyle.alignment;
            c.fill = headerStyle.fill;
            c.border = headerStyle.border;
        });

        // Subcolumnas
        const subs = [
            ['E14','Ordinarias'], ['F14','Extraordinarias'],
            ['G14','Ordinario'],  ['H14','Extraordinario'], ['I14','Otros salarios'],
            ['J14','Séptimos y asuetos'], ['K14','Vacaciones'],
            ['M14','Cuota laboral IGSS'], ['N14','Descuentos ISR'], ['O14','Otras Deducciones'], ['P14','TOTAL'],
        ];
        subs.forEach(([addr, label]) => {
            const c = ws.getCell(addr);
            c.value = label;
            c.font = headerStyle.font;
            c.alignment = headerStyle.alignment;
            c.fill = headerStyle.fill;
            c.border = headerStyle.border;
        });

        // ====== FILAS DE DATOS ======
        const startRow = 15;
        const moneyFmt = '"Q "#,##0.00';
        const rowBorder = {
            top:    { style: 'thin' }, bottom: { style: 'thin' },
            left:   { style: 'thin' }, right:  { style: 'thin' }
        };

        filas.forEach((f, i) => {
            const r = startRow + i;
            const row = ws.getRow(r);
            row.height = 20;
            const data = [
                f.NO_PAGO, f.PERIODO, f.SALARIO_QTZ, f.DIAS_TRABAJADOS,
                f.HORAS_ORD, f.HORAS_EXT,
                f.SUELDO_BASE, f.HORAS_EXTRA, f.OTROS_SALARIOS, f.SEPTIMOS_ASUETOS, f.VACACIONES,
                f.SALARIO_TOTAL,
                f.IGSS, f.ISR, f.OTRAS_DED, f.TOTAL_DED,
                (f.AGUINALDO + f.BONO14),
                f.BONIF_INCENTIVO,
                f.DEVOLUCIONES,
                f.SALARIO_LIQUIDO,
                f.REFERENCIA,
                f.OBSERVACIONES,
            ];
            data.forEach((v, idx) => {
                const cell = row.getCell(idx + 1);
                cell.value = v;
                cell.border = rowBorder;
                cell.alignment = { vertical: 'middle', horizontal: idx === 0 || idx === 1 || idx >= 20 ? 'center' : 'right' };
                // Aplicar formato moneda para columnas numéricas
                if ([2, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].includes(idx)) {
                    cell.numFmt = moneyFmt;
                }
            });
        });

        // Fila de totales
        const totRow = startRow + filas.length;
        const totals = [
            'TOTALES', '', '', '',
            '', '',
            filas.reduce((s,f) => s + f.SUELDO_BASE, 0),
            filas.reduce((s,f) => s + f.HORAS_EXTRA, 0),
            filas.reduce((s,f) => s + f.OTROS_SALARIOS, 0),
            filas.reduce((s,f) => s + f.SEPTIMOS_ASUETOS, 0),
            filas.reduce((s,f) => s + f.VACACIONES, 0),
            filas.reduce((s,f) => s + f.SALARIO_TOTAL, 0),
            filas.reduce((s,f) => s + f.IGSS, 0),
            filas.reduce((s,f) => s + f.ISR, 0),
            filas.reduce((s,f) => s + f.OTRAS_DED, 0),
            filas.reduce((s,f) => s + f.TOTAL_DED, 0),
            filas.reduce((s,f) => s + f.AGUINALDO + f.BONO14, 0),
            filas.reduce((s,f) => s + f.BONIF_INCENTIVO, 0),
            filas.reduce((s,f) => s + f.DEVOLUCIONES, 0),
            filas.reduce((s,f) => s + f.SALARIO_LIQUIDO, 0),
            '', '',
        ];
        const tot = ws.getRow(totRow);
        tot.height = 22;
        totals.forEach((v, idx) => {
            const cell = tot.getCell(idx + 1);
            cell.value = v;
            cell.border = rowBorder;
            cell.font = { bold: true, size: 9 };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4CC' } };
            cell.alignment = { vertical: 'middle', horizontal: idx === 0 ? 'center' : 'right' };
            if ([6,7,8,9,10,11,12,13,14,15,16,17,18,19].includes(idx)) cell.numFmt = moneyFmt;
        });
        ws.mergeCells(`A${totRow}:F${totRow}`);

        // Pie con fecha de generación
        ws.getCell(`A${totRow + 2}`).value = `Generado el ${new Date().toLocaleDateString('es-GT')}`;
        ws.getCell(`A${totRow + 2}`).font = { italic: true, size: 9, color: { argb: 'FF666666' } };

        // Enviar archivo
        const nombreArchivo = `Formato_Unico_${empleado.NOMBRE.replace(/\s+/g, '_')}_${anio}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        await wb.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('generarFormato error:', err);
        if (!res.headersSent) return error(res, 'Error al generar formato', 500, err.message);
    }
};

module.exports = { generarFormato };
