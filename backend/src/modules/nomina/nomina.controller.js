const model = require('./nomina.model');
const periodoModel = require('../periodo/periodo.model');
const asignacionesModel = require('../empAsignaciones/empAsignaciones.model');
const { success, error } = require('../../helpers/response');

const BONIFICACION_INCENTIVO = 250;    // Q250 fijo por ley (PER02) — exento de IGSS, gravado ISR
const IGSS_EMPLEADO_PCT      = 4.83;  // 4.83% sobre sueldo_base + horas_extra (Decreto 78-89 excluye bonif)
const IGSS_PATRONO_PCT       = 10.67; // 10.67% cuota patronal IGSS (la paga la empresa, no se descuenta al empleado)
const ISR_EXENCION_ANUAL     = 48000; // Deducción personal anual Q48,000 (Decreto 10-2012)
const ISR_TRAMO1_LIMITE      = 300000; // Primer tramo: hasta Q300,000 → 5%
const ISR_TRAMO1_PCT         = 5;
const ISR_TRAMO2_PCT         = 7;     // Segundo tramo: exceso de Q300,000 → 7%

const calcularISRMensual = (total_percepciones_mes, igss_mes) => {
    const base_anual = (total_percepciones_mes * 12) - (igss_mes * 12) - ISR_EXENCION_ANUAL;
    if (base_anual <= 0) return 0;
    const isr_anual = base_anual <= ISR_TRAMO1_LIMITE
        ? base_anual * ISR_TRAMO1_PCT / 100
        : (ISR_TRAMO1_LIMITE * ISR_TRAMO1_PCT / 100) + ((base_anual - ISR_TRAMO1_LIMITE) * ISR_TRAMO2_PCT / 100);
    return parseFloat((isr_anual / 12).toFixed(2));
};

// GET /api/nomina/empleado/:id?anio=2026&mes=3
const getVistaPrevia = async (req, res) => {
    try {
        const id_empleado = req.params.id;
        const anio = parseInt(req.query.anio) || new Date().getFullYear();
        const mes  = parseInt(req.query.mes)  || new Date().getMonth() + 1;

        const periodo = await periodoModel.getByMesAnio(mes, anio);
        if (!periodo)
            return error(res, `No existe período de nómina para ${mes}/${anio}. Debe crearlo antes de calcular.`, 404);
        if (periodo.ESTADO === 'CERRADO')
            return error(res, `El período ${mes}/${anio} está CERRADO. Debe abrirlo antes de calcular.`, 400);

        const empleado = await model.getDatosEmpleado(id_empleado);
        if (!empleado) return error(res, 'Empleado no encontrado o inactivo', 404);

        const nominaExistente = await model.getNominaExistente(id_empleado, periodo.ID_PERIODO);
        if (nominaExistente)
            return error(res, `${empleado.NOMBRE} ya tiene nómina procesada para ${mes}/${anio}`, 400);

        const horasExtra     = await model.getHorasExtra(id_empleado, anio, mes);
        const faltas         = await model.getFaltas(id_empleado, anio, mes);
        const dedEmp         = await asignacionesModel.getDeduccionesActivasByEmpleado(id_empleado);
        const perEmp         = await asignacionesModel.getPercepcionesActivasByEmpleado(id_empleado);
        const prestamo_monto = await model.getPrestamoPendiente(id_empleado);
        const seguro_monto   = await model.getSeguroActivo(id_empleado);

        const sueldo_base   = parseFloat(empleado.SUELDO_BASE);
        const horas_diarias = parseFloat(empleado.HORAS_DIARIAS);
        const valor_hora    = sueldo_base / 30 / horas_diarias;
        const valor_dia     = sueldo_base / 30;

        // ── PERCEPCIONES ───────────────────────────────────────────
        const detalleHorasExtra = horasExtra.map(he => ({
            id_hora_extra: he.ID_HORA_EXTRA,
            fecha: he.FECHA,
            cantidad: parseFloat(he.CANTIDAD),
            factor: parseFloat(he.FACTOR),
            jornada: he.NOMBRE_JORNADA,
            monto: parseFloat((valor_hora * parseFloat(he.CANTIDAD) * parseFloat(he.FACTOR)).toFixed(2))
        }));
        const total_horas_extra = detalleHorasExtra.reduce((s, he) => s + he.monto, 0);

        const percepcionesEmpleado = perEmp.map(p => ({
            id_percepcion: p.ID_PERCEPCION,
            nombre: p.NOMBRE_PERCEPCION,
            monto: parseFloat(p.MONTO)
        }));
        const total_percepciones_emp = percepcionesEmpleado.reduce((s, p) => s + p.monto, 0);

        const total_percepciones = parseFloat(
            (sueldo_base + BONIFICACION_INCENTIVO + total_horas_extra + total_percepciones_emp).toFixed(2)
        );

        // ── DEDUCCIONES ────────────────────────────────────────────
        // IGSS: base = sueldo_base + horas_extra (Bonificación Incentivo excluida por Decreto 78-89)
        const igss_base     = parseFloat((sueldo_base + total_horas_extra).toFixed(2));
        const igss_monto    = parseFloat((igss_base * IGSS_EMPLEADO_PCT / 100).toFixed(2));
        const igss_patronal = parseFloat((igss_base * IGSS_PATRONO_PCT / 100).toFixed(2));
        // ISR: base anual = (percepciones × 12) − (IGSS × 12) − Q48,000; tramos 5%/7%
        const isr_base_anual = parseFloat(((total_percepciones * 12) - (igss_monto * 12) - ISR_EXENCION_ANUAL).toFixed(2));
        const isr_monto      = calcularISRMensual(total_percepciones, igss_monto);

        const detalleFaltas = faltas.map(f => ({
            id_registro_falta: f.ID_REGISTRO_FALTA,
            fecha: f.FECHA,
            tipo_falta: f.TIPO_FALTA,
            es_pagado: f.ES_PAGADO,
            descuenta: f.ES_PAGADO === 'N',
            monto: f.ES_PAGADO === 'N' ? parseFloat(valor_dia.toFixed(2)) : 0
        }));
        const total_descuento_faltas = detalleFaltas
            .filter(f => f.descuenta)
            .reduce((s, f) => s + f.monto, 0);

        const deduccionesEmpleado = dedEmp.map(d => ({
            id_deduccion: d.ID_DEDUCCION,
            nombre: d.NOMBRE_DEDUCCION,
            monto: parseFloat(d.MONTO)
        }));

        // Agregar préstamo y seguro automáticamente si el empleado los tiene activos
        if (prestamo_monto > 0) {
            deduccionesEmpleado.push({
                id_deduccion: 'DED06',
                nombre: 'Préstamo Bantrab',
                monto: prestamo_monto
            });
        }
        if (seguro_monto > 0) {
            deduccionesEmpleado.push({
                id_deduccion: 'DED04',
                nombre: 'Seguro Médico',
                monto: seguro_monto
            });
        }

        const total_deducciones_emp = deduccionesEmpleado.reduce((s, d) => s + d.monto, 0);

        const total_deducciones = parseFloat(
            (igss_monto + isr_monto + total_descuento_faltas + total_deducciones_emp).toFixed(2)
        );

        const liquido_a_pagar = parseFloat((total_percepciones - total_deducciones).toFixed(2));

        return success(res, {
            empleado, periodo,
            calculo: {
                sueldo_base,
                bonificacion_incentivo: BONIFICACION_INCENTIVO,
                valor_hora: parseFloat(valor_hora.toFixed(4)),
                valor_dia: parseFloat(valor_dia.toFixed(4)),
                horas_extra: detalleHorasExtra,
                total_horas_extra: parseFloat(total_horas_extra.toFixed(2)),
                percepciones_empleado: percepcionesEmpleado,
                total_percepciones_emp: parseFloat(total_percepciones_emp.toFixed(2)),
                total_percepciones,
                igss_porcentaje: IGSS_EMPLEADO_PCT,
                igss_patronal_porcentaje: IGSS_PATRONO_PCT,
                igss_base,
                igss_monto,
                igss_patronal,
                isr_base_anual: parseFloat(isr_base_anual.toFixed(2)),
                isr_monto,
                prestamo_monto,
                seguro_monto,
                faltas: detalleFaltas,
                total_descuento_faltas: parseFloat(total_descuento_faltas.toFixed(2)),
                deducciones_empleado: deduccionesEmpleado,
                total_deducciones_emp: parseFloat(total_deducciones_emp.toFixed(2)),
                total_deducciones,
                liquido_a_pagar
            }
        });
    } catch (err) {
        return error(res, 'Error al obtener vista previa', 500, err.message);
    }
};

// POST /api/nomina/procesar
const procesarNomina = async (req, res) => {
    try {
        const {
            id_empleado, id_periodo,
            sueldo_base, bonificacion_incentivo, igss_monto, isr_monto,
            horas_extra, faltas,
            percepciones_empleado, deducciones_empleado,
            total_percepciones, total_deducciones, liquido_a_pagar,
            observacion
        } = req.body;

        if (!id_empleado || !id_periodo)
            return error(res, 'id_empleado e id_periodo son requeridos', 400);

        const existe = await model.getNominaExistente(id_empleado, id_periodo);
        if (existe) return error(res, 'Ya existe una nómina procesada para este empleado y período', 400);

        const fecha_pago = new Date().toISOString().slice(0, 10);

        // Percepciones
        const detalles_percepciones = [
            { id_percepcion: 'PER01', id_hora_extra: null, monto: parseFloat(sueldo_base) },
            { id_percepcion: 'PER02', id_hora_extra: null, monto: parseFloat(bonificacion_incentivo || BONIFICACION_INCENTIVO) }
        ];
        if (horas_extra?.length > 0) {
            horas_extra.forEach(he => detalles_percepciones.push({
                id_percepcion: 'PER05',
                id_hora_extra: he.id_hora_extra,
                monto: parseFloat(he.monto)
            }));
        }
        if (percepciones_empleado?.length > 0) {
            percepciones_empleado.forEach(p => detalles_percepciones.push({
                id_percepcion: p.id_percepcion,
                id_hora_extra: null,
                monto: parseFloat(p.monto)
            }));
        }

        // Deducciones
        const detalles_deducciones = [
            { id_deduccion: 'DED01', id_registro_falta: null, monto: parseFloat(igss_monto || 0) },
            { id_deduccion: 'DED02', id_registro_falta: null, monto: parseFloat(isr_monto  || 0) }
        ];
        if (faltas?.length > 0) {
            faltas.filter(f => f.descuenta).forEach(f => detalles_deducciones.push({
                id_deduccion: 'DED07',
                id_registro_falta: f.id_registro_falta,
                monto: parseFloat(f.monto)
            }));
        }
        if (deducciones_empleado?.length > 0) {
            deducciones_empleado.forEach(d => detalles_deducciones.push({
                id_deduccion: d.id_deduccion,
                id_registro_falta: null,
                monto: parseFloat(d.monto)
            }));
        }

        const id_nomina = await model.procesarNomina({
            id_empleado, id_periodo, fecha_pago,
            total_percepciones: parseFloat(total_percepciones),
            total_deducciones: parseFloat(total_deducciones),
            liquido_a_pagar: parseFloat(liquido_a_pagar),
            observacion,
            detalles_percepciones,
            detalles_deducciones
        });

        const fecha = new Date();
        const referencia = `REF-${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}-${String(id_nomina).padStart(4, '0')}`;

        return success(res, { id_nomina, referencia, fecha_pago, liquido_a_pagar },
            'Nómina procesada y pago registrado correctamente', 201);

    } catch (err) {
        return error(res, 'Error al procesar nómina', 500, err.message);
    }
};

// GET /api/nomina/historico
const getHistorico = async (req, res) => {
    try {
        return success(res, await model.getHistorico());
    } catch (err) { return error(res, 'Error al obtener histórico', 500, err.message); }
};

// GET /api/nomina/historico/:id
const getDetalleNomina = async (req, res) => {
    try {
        const data = await model.getDetalleNomina(req.params.id);
        if (!data.encabezado) return error(res, 'Nómina no encontrada', 404);
        return success(res, data);
    } catch (err) { return error(res, 'Error al obtener detalle de nómina', 500, err.message); }
};

// POST /api/nomina/procesar-todos
// Body: { id_periodo, mes, anio }
const procesarTodos = async (req, res) => {
    try {
        const { id_periodo, mes, anio } = req.body;
        if (!id_periodo || !mes || !anio)
            return error(res, 'id_periodo, mes y anio son requeridos', 400);

        const empleados = await model.getAllEmpleadosActivos();
        if (!empleados.length)
            return error(res, 'No hay empleados activos', 404);

        const fecha_pago = new Date().toISOString().slice(0, 10);
        const resultados = [];

        for (const empleado of empleados) {
            const id_empleado = empleado.ID_EMPLEADO;
            try {
                // Saltar si ya tiene nómina en este período
                const existe = await model.getNominaExistente(id_empleado, id_periodo);
                if (existe) {
                    resultados.push({ id_empleado, nombre: empleado.NOMBRE, estado: 'omitido', motivo: 'Ya tiene nómina en este período' });
                    continue;
                }

                const sueldo_base   = parseFloat(empleado.SUELDO_BASE);
                const horas_diarias = parseFloat(empleado.HORAS_DIARIAS);
                const valor_hora    = sueldo_base / 30 / horas_diarias;
                const valor_dia     = sueldo_base / 30;

                const horasExtra = await model.getHorasExtra(id_empleado, anio, mes);
                const faltas     = await model.getFaltas(id_empleado, anio, mes);
                const dedEmp     = await asignacionesModel.getDeduccionesActivasByEmpleado(id_empleado);
                const perEmp     = await asignacionesModel.getPercepcionesActivasByEmpleado(id_empleado);

                // Percepciones
                const detalleHE = horasExtra.map(he => ({
                    id_hora_extra: he.ID_HORA_EXTRA,
                    monto: parseFloat((valor_hora * parseFloat(he.CANTIDAD) * parseFloat(he.FACTOR)).toFixed(2))
                }));
                const total_he = detalleHE.reduce((s, he) => s + he.monto, 0);
                const perEmpArr = perEmp.map(p => ({ id_percepcion: p.ID_PERCEPCION, monto: parseFloat(p.MONTO) }));
                const total_per_emp = perEmpArr.reduce((s, p) => s + p.monto, 0);
                const total_percepciones = parseFloat((sueldo_base + BONIFICACION_INCENTIVO + total_he + total_per_emp).toFixed(2));

                // Deducciones — IGSS base incluye horas_extra, excluye Bonificación Incentivo
                const igss_base   = sueldo_base + total_he;
                const igss_monto  = parseFloat((igss_base * IGSS_EMPLEADO_PCT / 100).toFixed(2));
                const isr_monto   = calcularISRMensual(total_percepciones, igss_monto);
                const faltasDesc = faltas.filter(f => f.ES_PAGADO === 'N');
                const total_faltas = parseFloat((faltasDesc.length * valor_dia).toFixed(2));
                const dedEmpArr = dedEmp.map(d => ({ id_deduccion: d.ID_DEDUCCION, monto: parseFloat(d.MONTO) }));
                const total_ded_emp = dedEmpArr.reduce((s, d) => s + d.monto, 0);
                const total_deducciones = parseFloat((igss_monto + isr_monto + total_faltas + total_ded_emp).toFixed(2));

                const liquido_a_pagar = parseFloat((total_percepciones - total_deducciones).toFixed(2));

                // Detalles para historial
                const detalles_percepciones = [
                    { id_percepcion: 'PER01', id_hora_extra: null, monto: sueldo_base },
                    { id_percepcion: 'PER02', id_hora_extra: null, monto: BONIFICACION_INCENTIVO },
                    ...detalleHE.map(he => ({ id_percepcion: 'PER05', id_hora_extra: he.id_hora_extra, monto: he.monto })),
                    ...perEmpArr.map(p => ({ id_percepcion: p.id_percepcion, id_hora_extra: null, monto: p.monto }))
                ];
                const detalles_deducciones = [
                    { id_deduccion: 'DED01', id_registro_falta: null, monto: igss_monto },
                    { id_deduccion: 'DED02', id_registro_falta: null, monto: isr_monto  },
                    ...faltasDesc.map(f => ({ id_deduccion: 'DED07', id_registro_falta: f.ID_REGISTRO_FALTA, monto: parseFloat(valor_dia.toFixed(2)) })),
                    ...dedEmpArr.map(d => ({ id_deduccion: d.id_deduccion, id_registro_falta: null, monto: d.monto }))
                ];

                const id_nomina = await model.procesarNomina({
                    id_empleado, id_periodo, fecha_pago,
                    total_percepciones, total_deducciones, liquido_a_pagar,
                    observacion: `Nómina masiva mes ${mes}/${anio}`,
                    detalles_percepciones, detalles_deducciones
                });

                resultados.push({ id_empleado, nombre: empleado.NOMBRE, estado: 'procesado', id_nomina, liquido_a_pagar });
            } catch (err) {
                resultados.push({ id_empleado, nombre: empleado.NOMBRE, estado: 'error', motivo: err.message });
            }
        }

        const procesados = resultados.filter(r => r.estado === 'procesado').length;
        const omitidos   = resultados.filter(r => r.estado === 'omitido').length;
        const errores    = resultados.filter(r => r.estado === 'error').length;

        return success(res, { resultados, resumen: { procesados, omitidos, errores } },
            `Proceso completado: ${procesados} procesados, ${omitidos} omitidos, ${errores} errores`);

    } catch (err) {
        return error(res, 'Error en cálculo masivo', 500, err.message);
    }
};

module.exports = { getVistaPrevia, procesarNomina, procesarTodos, getHistorico, getDetalleNomina };
