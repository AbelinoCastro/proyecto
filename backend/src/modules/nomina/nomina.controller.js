const model = require('./nomina.model');
const periodoModel = require('../periodo/periodo.model');
const { success, error } = require('../../helpers/response');

// GET /api/nomina/empleado/:id?anio=2026&mes=3
const getVistaPrevia = async (req, res) => {
    try {
        const id_empleado = req.params.id;
        const anio = parseInt(req.query.anio) || new Date().getFullYear();
        const mes = parseInt(req.query.mes) || new Date().getMonth() + 1;

        // 1. Verificar que el período exista y esté ABIERTO
        const periodo = await periodoModel.getByMesAnio(mes, anio);

        if (!periodo) {
            // No existe — el frontend mostrará alerta para crearlo
            return error(res, `No existe período de nómina para ${mes}/${anio}. Debe crearlo antes de calcular.`, 404);
        }

        if (periodo.ESTADO === 'CERRADO') {
            return error(res, `El período ${mes}/${anio} está CERRADO. Debe abrirlo antes de calcular.`, 400);
        }

        // 2. Datos del empleado
        const empleado = await model.getDatosEmpleado(id_empleado);
        if (!empleado) return error(res, 'Empleado no encontrado o inactivo', 404);

        // 3. Verificar que no tenga nómina ya procesada para este período
        const nominaExistente = await model.getNominaExistente(id_empleado, periodo.ID_PERIODO);
        if (nominaExistente) {
            return error(res, `${empleado.NOMBRE} ya tiene nómina procesada para ${mes}/${anio}`, 400);
        }

        // 4. Horas extra APROBADAS del mes
        const horasExtra = await model.getHorasExtra(id_empleado, anio, mes);

        // 5. Faltas APROBADAS del mes
        const faltas = await model.getFaltas(id_empleado, anio, mes);

        // 6. Cálculo en backend
        const sueldo_base = parseFloat(empleado.SUELDO_BASE);
        const horas_diarias = parseFloat(empleado.HORAS_DIARIAS);
        const valor_hora = sueldo_base / 30 / horas_diarias;
        const valor_dia = sueldo_base / 30;

        const detalleHorasExtra = horasExtra.map(he => ({
            id_hora_extra: he.ID_HORA_EXTRA,
            fecha: he.FECHA,
            cantidad: parseFloat(he.CANTIDAD),
            factor: parseFloat(he.FACTOR),
            jornada: he.NOMBRE_JORNADA,
            monto: parseFloat((valor_hora * parseFloat(he.CANTIDAD) * parseFloat(he.FACTOR)).toFixed(2))
        }));

        const total_horas_extra = detalleHorasExtra.reduce((s, he) => s + he.monto, 0);

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

        const total_percepciones = parseFloat((sueldo_base + total_horas_extra).toFixed(2));
        const total_deducciones = parseFloat(total_descuento_faltas.toFixed(2));
        const liquido_a_pagar = parseFloat((total_percepciones - total_deducciones).toFixed(2));

        return success(res, {
            empleado, periodo,
            calculo: {
                sueldo_base,
                valor_hora: parseFloat(valor_hora.toFixed(4)),
                valor_dia: parseFloat(valor_dia.toFixed(4)),
                horas_extra: detalleHorasExtra,
                total_horas_extra: parseFloat(total_horas_extra.toFixed(2)),
                faltas: detalleFaltas,
                total_descuento_faltas: parseFloat(total_descuento_faltas.toFixed(2)),
                total_percepciones,
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
            sueldo_base, horas_extra, faltas,
            total_percepciones, total_deducciones, liquido_a_pagar,
            observacion
        } = req.body;

        if (!id_empleado || !id_periodo) {
            return error(res, 'id_empleado e id_periodo son requeridos', 400);
        }

        // Verificar período sigue abierto al momento de procesar
        const periodo = await periodoModel.getByMesAnio(
            req.body.mes, req.body.anio
        );
        // Si no llegan mes/anio en body buscamos por id_periodo
        // La validación principal ya la hizo getVistaPrevia

        const existe = await model.getNominaExistente(id_empleado, id_periodo);
        if (existe) return error(res, 'Ya existe una nómina procesada para este empleado y período', 400);

        const fecha_pago = new Date().toISOString().slice(0, 10);

        const detalles_percepciones = [
            { id_percepcion: 'PER01', id_hora_extra: null, monto: parseFloat(sueldo_base) }
        ];
        if (horas_extra?.length > 0) {
            horas_extra.forEach(he => {
                detalles_percepciones.push({
                    id_percepcion: 'PER05',
                    id_hora_extra: he.id_hora_extra,
                    monto: parseFloat(he.monto)
                });
            });
        }

        const detalles_deducciones = [];
        if (faltas?.length > 0) {
            faltas.filter(f => f.descuenta).forEach(f => {
                detalles_deducciones.push({
                    id_deduccion: 'DED07',
                    id_registro_falta: f.id_registro_falta,
                    monto: parseFloat(f.monto)
                });
            });
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
        const data = await model.getHistorico();
        return success(res, data);
    } catch (err) {
        return error(res, 'Error al obtener histórico', 500, err.message);
    }
};

// GET /api/nomina/historico/:id
const getDetalleNomina = async (req, res) => {
    try {
        const data = await model.getDetalleNomina(req.params.id);
        if (!data.encabezado) return error(res, 'Nómina no encontrada', 404);
        return success(res, data);
    } catch (err) {
        return error(res, 'Error al obtener detalle de nómina', 500, err.message);
    }
};

module.exports = { getVistaPrevia, procesarNomina, getHistorico, getDetalleNomina };