import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmpleados } from '../../services/empleadoService';
import { getVistaPreviaNomina, procesarNomina, procesarNominaTodos } from '../../services/nominaService';
import { getPeriodos } from '../../services/periodosService';

const formatQ = (n) =>
    `Q ${parseFloat(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatFecha = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const CalcularNominaPage = () => {
    const navigate = useNavigate();

    const [empleados, setEmpleados] = useState([]);
    const [idEmpleado, setIdEmpleado] = useState('');
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [preview, setPreview] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [loadingPago, setLoadingPago] = useState(false);
    const [error, setError] = useState('');
    const [errorTipo, setErrorTipo] = useState(''); // 'periodo_no_existe' | 'periodo_cerrado' | 'general'
    const [resultado, setResultado] = useState(null);
    const printRef = useRef();

    // Cálculo masivo
    const [periodos, setPeriodos]           = useState([]);
    const [modalMasivo, setModalMasivo]     = useState(false);
    const [loadingMasivo, setLoadingMasivo] = useState(false);
    const [resultadoMasivo, setResultadoMasivo] = useState(null);

    useEffect(() => {
        getEmpleados()
            .then(r => setEmpleados(r.data.data))
            .catch(() => setError('Error al cargar empleados'));
        getPeriodos()
            .then(r => setPeriodos((r.data.data || []).filter(p => p.ESTADO === 'ABIERTO')))
            .catch(() => {});
    }, []);

    const handleCargar = async () => {
        if (!idEmpleado) return setError('Selecciona un empleado');
        setError('');
        setErrorTipo('');
        setPreview(null);
        setResultado(null);
        setLoadingPreview(true);
        try {
            const res = await getVistaPreviaNomina(idEmpleado, anio, mes);
            setPreview(res.data.data);
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al cargar datos';
            setError(msg);
            // Detectar tipo de error para mostrar acciones específicas
            if (err.response?.status === 404 && msg.includes('No existe período')) {
                setErrorTipo('periodo_no_existe');
            } else if (err.response?.status === 400 && msg.includes('CERRADO')) {
                setErrorTipo('periodo_cerrado');
            } else {
                setErrorTipo('general');
            }
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleProcesar = async () => {
        if (!preview) return;
        if (!window.confirm(
            `¿Confirmar el pago de ${formatQ(preview.calculo.liquido_a_pagar)} para ${preview.empleado.NOMBRE}?`
        )) return;

        setError('');
        setLoadingPago(true);
        try {
            const res = await procesarNomina({
                id_empleado: preview.empleado.ID_EMPLEADO,
                id_periodo: preview.periodo.ID_PERIODO,
                sueldo_base: preview.calculo.sueldo_base,
                bonificacion_incentivo: preview.calculo.bonificacion_incentivo,
                igss_monto: preview.calculo.igss_monto,
                isr_monto: preview.calculo.isr_monto,
                horas_extra: preview.calculo.horas_extra,
                faltas: preview.calculo.faltas,
                percepciones_empleado: preview.calculo.percepciones_empleado,
                deducciones_empleado: preview.calculo.deducciones_empleado,
                total_percepciones: preview.calculo.total_percepciones,
                total_deducciones: preview.calculo.total_deducciones,
                liquido_a_pagar: preview.calculo.liquido_a_pagar,
                observacion: `Nómina ${MESES[mes]} ${anio}`
            });
            setResultado(res.data.data);
            setPreview(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al procesar pago');
            setErrorTipo('general');
        } finally {
            setLoadingPago(false);
        }
    };

    const handleProcesarTodos = async (periodo) => {
        if (!window.confirm(
            `¿Calcular y procesar la nómina de TODOS los empleados activos para ${MESES[periodo.NUMERO_PERIODO]} ${periodo.ANIO}?\n\nEsta acción no se puede deshacer.`
        )) return;
        setLoadingMasivo(true);
        setResultadoMasivo(null);
        try {
            const res = await procesarNominaTodos({
                id_periodo: periodo.ID_PERIODO,
                mes: periodo.NUMERO_PERIODO,
                anio: periodo.ANIO
            });
            setResultadoMasivo(res.data.data);
        } catch (err) {
            setResultadoMasivo({ error: err.response?.data?.message || 'Error en el proceso masivo' });
        } finally {
            setLoadingMasivo(false);
        }
    };

    const inputCls = 'bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none w-full';
    const selectCls = 'bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none w-full';

    return (
        <div className="text-white">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold">Calcular Nómina</h1>
                <button
                    onClick={() => { setModalMasivo(true); setResultadoMasivo(null); }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg font-medium"
                >
                    Calcular todos los empleados
                </button>
            </div>

            {/* PASO 1 — SELECCIÓN */}
            <div className="bg-[#121621] rounded-xl border border-white/5 p-5 mb-4">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-4">
                    Paso 1 — Seleccionar empleado y período
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <label className="text-xs text-gray-400 mb-1 block">Empleado</label>
                        <select
                            className={selectCls}
                            value={idEmpleado}
                            onChange={e => { setIdEmpleado(e.target.value); setPreview(null); setResultado(null); setError(''); setErrorTipo(''); }}
                        >
                            <option value="">Seleccionar empleado...</option>
                            {empleados.map(emp => (
                                <option key={emp.ID_EMPLEADO} value={emp.ID_EMPLEADO}>
                                    {emp.NOMBRE}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Mes</label>
                        <select
                            className={selectCls}
                            value={mes}
                            onChange={e => { setMes(parseInt(e.target.value)); setPreview(null); setResultado(null); setError(''); setErrorTipo(''); }}
                        >
                            {MESES.slice(1).map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Año</label>
                        <input
                            type="number"
                            className={inputCls}
                            value={anio}
                            onChange={e => { setAnio(parseInt(e.target.value)); setPreview(null); setResultado(null); setError(''); setErrorTipo(''); }}
                            min={2020} max={2099}
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <button
                        onClick={handleCargar}
                        disabled={!idEmpleado || loadingPreview}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm rounded-lg transition"
                    >
                        {loadingPreview ? 'Cargando...' : 'Cargar datos'}
                    </button>
                </div>
            </div>

            {/* ALERTAS DE PERÍODO */}
            {errorTipo === 'periodo_no_existe' && (
                <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <p className="text-yellow-400 font-medium text-sm mb-1">Período no encontrado</p>
                    <p className="text-yellow-300/70 text-xs mb-3">
                        No existe un período de nómina para {MESES[mes]} {anio}.
                        Debes crearlo antes de poder calcular.
                    </p>
                    <button
                        onClick={() => navigate('/periodos')}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded-lg transition"
                    >
                        Ir a Períodos → crear el período
                    </button>
                </div>
            )}

            {errorTipo === 'periodo_cerrado' && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-red-400 font-medium text-sm mb-1">Período cerrado</p>
                    <p className="text-red-300/70 text-xs mb-3">
                        El período {MESES[mes]} {anio} está CERRADO.
                        Debes abrirlo nuevamente para poder calcular nóminas.
                    </p>
                    <button
                        onClick={() => navigate('/periodos')}
                        className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-medium rounded-lg transition"
                    >
                        Ir a Períodos → abrir el período
                    </button>
                </div>
            )}

            {errorTipo === 'general' && error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* PASO 2 — VISTA PREVIA */}
            {preview && (
                <div ref={printRef}>
                    <div className="bg-[#121621] rounded-xl border border-white/5 p-5 mb-4">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-4">
                            Paso 2 — Vista previa del cálculo
                        </p>

                        {/* Info período */}
                        <div className="flex items-center gap-2 mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <span className="w-2 h-2 rounded-full bg-green-400 shrink-0"></span>
                            <span className="text-green-400 text-xs">
                                Período {MESES[preview.periodo.NUMERO_PERIODO]} {preview.periodo.ANIO} — ABIERTO
                            </span>
                        </div>

                        {/* Datos del empleado */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                            {[
                                { label: 'Empleado', val: preview.empleado.NOMBRE },
                                { label: 'Puesto', val: preview.empleado.NOMBRE_PUESTO },
                                { label: 'Departamento', val: preview.empleado.NOMBRE_DEPARTAMENTO },
                                { label: 'Jornada', val: preview.empleado.NOMBRE_JORNADA },
                                { label: 'Sueldo base', val: formatQ(preview.calculo.sueldo_base) },
                                { label: 'Valor / hora', val: formatQ(preview.calculo.valor_hora) },
                                { label: 'Valor / día', val: formatQ(preview.calculo.valor_dia) },
                                { label: 'Período', val: `${MESES[mes]} ${anio}` },
                            ].map(({ label, val }) => (
                                <div key={label} className="bg-[#0b0e14] rounded-lg p-3">
                                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                                    <p className="text-sm font-medium">{val}</p>
                                </div>
                            ))}
                        </div>

                        {/* Horas extra */}
                        <div className="mb-5">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                                Horas extra aprobadas
                            </p>
                            {preview.calculo.horas_extra.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">Sin horas extra aprobadas este mes</p>
                            ) : (
                                <div className="bg-[#0b0e14] rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                <th className="text-left py-2 px-4 text-xs text-gray-400 font-medium">Fecha</th>
                                                <th className="text-left py-2 px-4 text-xs text-gray-400 font-medium">Horas</th>
                                                <th className="text-left py-2 px-4 text-xs text-gray-400 font-medium">Factor</th>
                                                <th className="text-right py-2 px-4 text-xs text-gray-400 font-medium">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.calculo.horas_extra.map((he, i) => (
                                                <tr key={i} className="border-b border-white/5">
                                                    <td className="py-2 px-4 text-gray-300">{formatFecha(he.fecha)}</td>
                                                    <td className="py-2 px-4 text-gray-300">{he.cantidad}</td>
                                                    <td className="py-2 px-4">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${he.factor === 2.0 ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                            x{he.factor}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-4 text-right text-green-400">{formatQ(he.monto)}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-white/5">
                                                <td colSpan={3} className="py-2 px-4 text-xs text-gray-400">Subtotal horas extra</td>
                                                <td className="py-2 px-4 text-right text-green-400 font-medium">{formatQ(preview.calculo.total_horas_extra)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Faltas */}
                        <div className="mb-5">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                                Faltas del período
                            </p>
                            {preview.calculo.faltas.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">Sin faltas registradas este mes</p>
                            ) : (
                                <div className="bg-[#0b0e14] rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                <th className="text-left py-2 px-4 text-xs text-gray-400 font-medium">Fecha</th>
                                                <th className="text-left py-2 px-4 text-xs text-gray-400 font-medium">Tipo</th>
                                                <th className="text-left py-2 px-4 text-xs text-gray-400 font-medium">¿Descuenta?</th>
                                                <th className="text-right py-2 px-4 text-xs text-gray-400 font-medium">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.calculo.faltas.map((f, i) => (
                                                <tr key={i} className="border-b border-white/5">
                                                    <td className="py-2 px-4 text-gray-300">{formatFecha(f.fecha)}</td>
                                                    <td className="py-2 px-4 text-gray-300">{f.tipo_falta}</td>
                                                    <td className="py-2 px-4">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${f.descuenta ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                            {f.descuenta ? 'Sí descuenta' : 'No descuenta'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-4 text-right text-red-400">
                                                        {f.descuenta ? formatQ(f.monto) : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-white/5">
                                                <td colSpan={3} className="py-2 px-4 text-xs text-gray-400">Subtotal descuento faltas</td>
                                                <td className="py-2 px-4 text-right text-red-400 font-medium">{formatQ(preview.calculo.total_descuento_faltas)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* PASO 3 — TOTALES Y CONFIRMACIÓN */}
                        <div className="border-t border-white/5 pt-5">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-4">
                                Paso 3 — Resumen y confirmación
                            </p>

                            {/* Desglose percepciones / deducciones */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="bg-[#0b0e14] rounded-lg p-4">
                                    <p className="text-xs text-green-400 font-medium uppercase tracking-wider mb-3">Percepciones</p>
                                    <div className="space-y-1.5 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-400">Sueldo base</span><span className="text-green-400">{formatQ(preview.calculo.sueldo_base)}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-400">Bonificación incentivo</span><span className="text-green-400">{formatQ(preview.calculo.bonificacion_incentivo)}</span></div>
                                        {preview.calculo.total_horas_extra > 0 && (
                                            <div className="flex justify-between"><span className="text-gray-400">Horas extra</span><span className="text-green-400">{formatQ(preview.calculo.total_horas_extra)}</span></div>
                                        )}
                                        {(preview.calculo.percepciones_empleado || []).map((p, i) => (
                                            <div key={i} className="flex justify-between"><span className="text-gray-400">{p.nombre}</span><span className="text-green-400">{formatQ(p.monto)}</span></div>
                                        ))}
                                        <div className="flex justify-between border-t border-white/5 pt-1.5 font-semibold"><span className="text-white">Total</span><span className="text-green-400">{formatQ(preview.calculo.total_percepciones)}</span></div>
                                    </div>
                                </div>
                                <div className="bg-[#0b0e14] rounded-lg p-4">
                                    <p className="text-xs text-red-400 font-medium uppercase tracking-wider mb-3">Deducciones</p>
                                    <div className="space-y-1.5 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">IGSS {preview.calculo.igss_porcentaje}% (base {formatQ(preview.calculo.igss_base)})</span>
                                            <span className="text-red-400">{formatQ(preview.calculo.igss_monto)}</span>
                                        </div>
                                        {preview.calculo.isr_monto > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">ISR SAT (base anual {formatQ(preview.calculo.isr_base_anual)})</span>
                                                <span className="text-red-400">{formatQ(preview.calculo.isr_monto)}</span>
                                            </div>
                                        )}
                                        {preview.calculo.isr_monto === 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">ISR SAT</span>
                                                <span className="text-gray-600">Exento (bajo Q48,000/año)</span>
                                            </div>
                                        )}
                                        {preview.calculo.total_descuento_faltas > 0 && (
                                            <div className="flex justify-between"><span className="text-gray-400">Descuento faltas</span><span className="text-red-400">{formatQ(preview.calculo.total_descuento_faltas)}</span></div>
                                        )}
                                        {(preview.calculo.deducciones_empleado || []).map((d, i) => (
                                            <div key={i} className="flex justify-between"><span className="text-gray-400">{d.nombre}</span><span className="text-red-400">{formatQ(d.monto)}</span></div>
                                        ))}
                                        <div className="flex justify-between border-t border-white/5 pt-1.5 font-semibold"><span className="text-white">Total</span><span className="text-red-400">{formatQ(preview.calculo.total_deducciones)}</span></div>
                                    </div>
                                    {preview.calculo.igss_patronal > 0 && (
                                        <div className="mt-3 pt-3 border-t border-white/5 text-xs">
                                            <div className="flex justify-between text-amber-400/80">
                                                <span>IGSS patronal ({preview.calculo.igss_patronal_porcentaje}%) — paga la empresa</span>
                                                <span className="font-semibold">{formatQ(preview.calculo.igss_patronal)}</span>
                                            </div>
                                            <p className="text-gray-600 mt-0.5">Este aporte no se descuenta al empleado.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-5">
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                                    <p className="text-xs text-green-400 mb-1">Total percepciones</p>
                                    <p className="text-lg font-semibold text-green-400">{formatQ(preview.calculo.total_percepciones)}</p>
                                    <p className="text-xs text-green-400/60 mt-1">Sueldo + bonif + extras</p>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                                    <p className="text-xs text-red-400 mb-1">Total deducciones</p>
                                    <p className="text-lg font-semibold text-red-400">{formatQ(preview.calculo.total_deducciones)}</p>
                                    <p className="text-xs text-red-400/60 mt-1">IGSS + ISR + faltas + otros</p>
                                </div>
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                                    <p className="text-xs text-blue-400 mb-1">Líquido a pagar</p>
                                    <p className="text-xl font-bold text-blue-400">{formatQ(preview.calculo.liquido_a_pagar)}</p>
                                    <p className="text-xs text-blue-400/60 mt-1">Percepciones − Deducciones</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleProcesar}
                                    disabled={loadingPago}
                                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition"
                                >
                                    {loadingPago ? 'Procesando...' : 'Procesar pago / transferencia'}
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-5 py-2.5 bg-[#0b0e14] border border-white/5 hover:bg-white/5 text-white text-sm rounded-lg transition"
                                >
                                    Imprimir boleta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PAGO EXITOSO */}
            {resultado && (
                <div className="bg-[#121621] rounded-xl border border-green-500/30 p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-semibold text-green-400">Pago procesado exitosamente</p>
                            <p className="text-xs text-gray-400">La nómina ha sido registrada en el sistema</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                        {[
                            { label: 'ID Nómina', val: `#${resultado.id_nomina}` },
                            { label: 'Referencia', val: resultado.referencia },
                            { label: 'Fecha pago', val: formatFecha(resultado.fecha_pago) },
                            { label: 'Monto pagado', val: formatQ(resultado.liquido_a_pagar) },
                        ].map(({ label, val }) => (
                            <div key={label} className="bg-[#0b0e14] rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-1">{label}</p>
                                <p className="text-sm font-medium">{val}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => window.print()}
                            className="px-5 py-2.5 bg-[#0b0e14] border border-white/5 hover:bg-white/5 text-white text-sm rounded-lg transition">
                            Imprimir boleta
                        </button>
                        <button
                            onClick={() => { setIdEmpleado(''); setPreview(null); setResultado(null); setError(''); setErrorTipo(''); }}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition">
                            Calcular otra nómina
                        </button>
                    </div>
                </div>
            )}
            {/* MODAL — CÁLCULO MASIVO */}
            {modalMasivo && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
                    <div className="bg-[#121621] border border-white/5 rounded-xl p-6 w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-white font-semibold text-base">Calcular nómina — todos los empleados</h3>
                            <button onClick={() => setModalMasivo(false)} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
                        </div>

                        {!resultadoMasivo && !loadingMasivo && (
                            <>
                                <p className="text-gray-400 text-sm mb-4">
                                    Selecciona el período activo. Se calculará y procesará la nómina de <strong className="text-white">todos los empleados ACTIVOS</strong> de una sola vez. Los empleados que ya tengan nómina en ese período serán omitidos.
                                </p>
                                {periodos.length === 0 ? (
                                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm mb-4">
                                        No hay períodos abiertos. Crea uno desde la sección Períodos.
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2 mb-5">
                                        {periodos.map(p => (
                                            <button
                                                key={p.ID_PERIODO}
                                                onClick={() => handleProcesarTodos(p)}
                                                className="flex justify-between items-center bg-[#0b0e14] hover:bg-white/5 border border-white/5 rounded-lg px-4 py-3 text-left transition"
                                            >
                                                <span className="text-white font-medium">{MESES[p.NUMERO_PERIODO]} {p.ANIO}</span>
                                                <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full">ABIERTO</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {loadingMasivo && (
                            <div className="text-center py-10">
                                <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-gray-400 text-sm">Procesando nóminas... esto puede tardar unos segundos</p>
                            </div>
                        )}

                        {resultadoMasivo && !resultadoMasivo.error && (
                            <>
                                {/* Resumen */}
                                <div className="grid grid-cols-3 gap-3 mb-5">
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-green-400">{resultadoMasivo.resumen.procesados}</p>
                                        <p className="text-xs text-green-400/70">Procesados</p>
                                    </div>
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-yellow-400">{resultadoMasivo.resumen.omitidos}</p>
                                        <p className="text-xs text-yellow-400/70">Ya existían</p>
                                    </div>
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-red-400">{resultadoMasivo.resumen.errores}</p>
                                        <p className="text-xs text-red-400/70">Errores</p>
                                    </div>
                                </div>

                                {/* Detalle */}
                                <div className="max-h-64 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-xs text-gray-400 uppercase">
                                                <th className="text-left pb-2">Empleado</th>
                                                <th className="text-right pb-2">Líquido</th>
                                                <th className="text-center pb-2">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {resultadoMasivo.resultados.map((r, i) => (
                                                <tr key={i} className="border-t border-white/5">
                                                    <td className="py-1.5 text-white text-xs">{r.nombre}</td>
                                                    <td className="py-1.5 text-right text-emerald-400 text-xs">
                                                        {r.liquido_a_pagar ? formatQ(r.liquido_a_pagar) : '—'}
                                                    </td>
                                                    <td className="py-1.5 text-center">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                            r.estado === 'procesado' ? 'bg-green-600/20 text-green-400' :
                                                            r.estado === 'omitido'   ? 'bg-yellow-600/20 text-yellow-400' :
                                                                                       'bg-red-600/20 text-red-400'
                                                        }`}>
                                                            {r.estado}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <button
                                    onClick={() => setModalMasivo(false)}
                                    className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 text-sm font-medium"
                                >
                                    Cerrar
                                </button>
                            </>
                        )}

                        {resultadoMasivo?.error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {resultadoMasivo.error}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalcularNominaPage;