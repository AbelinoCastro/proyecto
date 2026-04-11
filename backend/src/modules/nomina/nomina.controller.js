const model = require('./nomina.model');
const periodoModel = require('../periodo/periodo.model');
const asignacionesModel = require('../empAsignaciones/empAsignaciones.model');
const { success, error } = require('../../helpers/response');

const BONIFICACION_INCENTIVO = 250;   // Q250 fijo por ley (PER02)
const IGSS_EMPLEADO_PCT      = 4.83;  // 4.83% sobre sueldo base (DED01)

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

        const horasExtra = await model.getHorasExtra(id_empleado, anio, mes);
        const faltas     = await model.getFaltas(id_empleado, anio, mes);
        const dedEmp     = await asignacionesModel.getDeduccionesActivasByEmpleado(id_empleado);
        const perEmp     = await asignacionesModel.getPercepcionesActivasByEmpleado(id_empleado);

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
        const igss_monto = parseFloat((sueldo_base * IGSS_EMPLEADO_PCT / 100).toFixed(2));

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
        const total_deducciones_emp = deduccionesEmpleado.reduce((s, d) => s + d.monto, 0);

        const total_deducciones = parseFloat(
            (igss_monto + total_descuento_faltas + total_deducciones_emp).toFixed(2)
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
                igss_monto,
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
            sueldo_base, bonificacion_incentivo, igss_monto,
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
            { id_deduccion: 'DED01', id_registro_falta: null, monto: parseFloat(igss_monto || 0) }
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

                // Deducciones
                const igss_monto = parseFloat((sueldo_base * IGSS_EMPLEADO_PCT / 100).toFixed(2));
                const faltasDesc = faltas.filter(f => f.ES_PAGADO === 'N');
                const total_faltas = parseFloat((faltasDesc.length * valor_dia).toFixed(2));
                const dedEmpArr = dedEmp.map(d => ({ id_deduccion: d.ID_DEDUCCION, monto: parseFloat(d.MONTO) }));
                const total_ded_emp = dedEmpArr.reduce((s, d) => s + d.monto, 0);
                const total_deducciones = parseFloat((igss_monto + total_faltas + total_ded_emp).toFixed(2));

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
