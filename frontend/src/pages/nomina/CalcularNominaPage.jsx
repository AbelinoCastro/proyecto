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
    const [errorTipo, setErrorTipo] = useState('');
    const [resultado, setResultado] = useState(null);
    const printRef = useRef();

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

    const labelCls = "text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block";
    const inputCls = "bg-[#0b0b0b] border border-white/5 rounded-lg px-4 py-2.5 text-[13px] text-white outline-none focus:border-[#C5A028]/30 transition-all w-full";

    return (
        <div className="max-w-[1200px] mx-auto py-10 px-6 animate-in fade-in duration-700">

            {/* Header / Titulo */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <p className="text-[#C5A028] text-[10px] font-black uppercase tracking-[0.4em] mb-3 opacity-60">Dirección Financiera</p>
                    <h1 className="font-serif-title text-5xl text-white tracking-tight leading-none">Cálculo de Nómina</h1>
                </div>
                <button
                    onClick={() => { setModalMasivo(true); setResultadoMasivo(null); }}
                    className="gold-button text-[11px] uppercase tracking-[0.2em] py-3 shadow-2xl"
                >
                    Ejecutar Proceso Masivo ⚡
                </button>
            </div>

            {/* SELECCIÓN DE PARÁMETROS */}
            <div className="luxury-card p-10 mb-10 border-t-2 border-t-[#C5A028]/30 shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                    <span className="bg-[#C5A028] text-black w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">1</span>
                    <h2 className="text-white text-xs font-black uppercase tracking-[0.2em]">Configurar Parámetros del Ciclo</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                    <div className="md:col-span-6">
                        <label className={labelCls}>Colaborador</label>
                        <select
                            className={inputCls}
                            value={idEmpleado}
                            onChange={e => { setIdEmpleado(e.target.value); setPreview(null); setResultado(null); setError(''); setErrorTipo(''); }}
                        >
                            <option value="">Seleccionar de la lista operativa...</option>
                            {empleados.map(emp => (
                                <option key={emp.ID_EMPLEADO} value={emp.ID_EMPLEADO}>
                                    {emp.NOMBRE}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-3">
                        <label className={labelCls}>Mes Fiscal</label>
                        <select
                            className={inputCls}
                            value={mes}
                            onChange={e => { setMes(parseInt(e.target.value)); setPreview(null); setResultado(null); setError(''); setErrorTipo(''); }}
                        >
                            {MESES.slice(1).map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-3">
                        <label className={labelCls}>Año Calendario</label>
                        <input
                            type="number"
                            className={inputCls}
                            value={anio}
                            onChange={e => { setAnio(parseInt(e.target.value)); setPreview(null); setResultado(null); setError(''); setErrorTipo(''); }}
                            min={2020} max={2099}
                        />
                    </div>
                </div>

                <div className="mt-10">
                    <button
                        onClick={handleCargar}
                        disabled={!idEmpleado || loadingPreview}
                        className="gold-button w-full md:w-auto px-12 py-3.5 shadow-xl shadow-[#C5A028]/10 disabled:opacity-30 active:scale-95 transition-all text-[11px] uppercase tracking-[0.2em]"
                    >
                        {loadingPreview ? 'Analizando Base de Datos...' : 'Generar Liquidación Individual'}
                    </button>
                </div>
            </div>

            {/* VISTA PREVIA DETALLADA Y PROFESIONAL */}
            {preview && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000" ref={printRef}>

                    <div className="flex items-center gap-3 px-2">
                        <span className="bg-[#C5A028] text-black w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">2</span>
                        <h2 className="text-white text-xs font-black uppercase tracking-[0.2em]">Auditoría y Validación de Datos</h2>
                    </div>

                    <div className="luxury-card overflow-hidden">
                        {/* Header Boleta Real */}
                        <div className="p-10 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-[#0b0b0b] border border-white/5 flex items-center justify-center text-white text-3xl font-black shadow-inner">
                                    {preview.empleado.NOMBRE.slice(0, 1)}
                                </div>
                                <div>
                                    <h2 className="font-serif-title text-4xl text-white tracking-tight leading-none">{preview.empleado.NOMBRE}</h2>
                                    <p className="text-[#C5A028] text-[11px] font-black uppercase tracking-[0.3em] mt-3">{preview.empleado.NOMBRE_PUESTO}</p>
                                    <p className="text-gray-500 text-[10px] font-bold uppercase mt-1 opacity-60">{preview.empleado.NOMBRE_DEPARTAMENTO} · {preview.empleado.NOMBRE_JORNADA}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 px-8 py-4 rounded-[20px]">
                                    <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.25em] mb-1 text-center">Estado del Ciclo</p>
                                    <p className="text-emerald-500 font-black text-base uppercase text-center">{MESES[preview.periodo.NUMERO_PERIODO]} {preview.periodo.ANIO}</p>
                                    <p className="text-emerald-500/40 text-[8px] font-bold uppercase mt-1 text-center tracking-widest">Sincronizado</p>
                                </div>
                            </div>
                        </div>

                        {/* Bases de Cálculo (NO SIMPLIFICADO) */}
                        <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-white/5 border-b border-white/5 bg-white/[0.01]">
                            {[
                                { label: 'Sueldo Base', val: formatQ(preview.calculo.sueldo_base) },
                                { label: 'Base IGSS', val: formatQ(preview.calculo.igss_base) },
                                { label: 'Base ISR Anual', val: formatQ(preview.calculo.isr_base_anual) },
                                { label: 'Valor Jornada', val: formatQ(preview.calculo.valor_dia) },
                                { label: 'Valor Hora', val: formatQ(preview.calculo.valor_hora) },
                            ].map((d, i) => (
                                <div key={i} className="p-6 text-center">
                                    <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.3em] mb-2 opacity-50">{d.label}</p>
                                    <p className="text-white font-black text-[13px] tracking-tight">{d.val}</p>
                                </div>
                            ))}
                        </div>

                        {/* Desglose de Operaciones (Horas Extra y Faltas) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-white/5">
                            <div className="p-8 border-r border-white/5">
                                <h4 className="text-emerald-500/60 text-[9px] font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                    Registro de Tiempo Extraordinario
                                </h4>
                                {preview.calculo.horas_extra.length === 0 ? (
                                    <p className="text-gray-700 italic text-[11px] py-4">No se detectaron horas adicionales en este período.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {preview.calculo.horas_extra.map((he, i) => (
                                            <div key={i} className="flex justify-between items-center text-[12px] p-3 bg-[#0b0b0b] rounded-lg border border-white/[0.02]">
                                                <span className="text-gray-400 font-medium">{formatFecha(he.fecha)} — {he.cantidad}h (x{he.factor})</span>
                                                <span className="text-emerald-500 font-bold">{formatQ(he.monto)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="p-8">
                                <h4 className="text-red-500/60 text-[9px] font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                                    <div className="w-1 h-1 rounded-full bg-red-500"></div>
                                    Control de Inasistencias y Faltas
                                </h4>
                                {preview.calculo.faltas.length === 0 ? (
                                    <p className="text-gray-700 italic text-[11px] py-4">Asistencia completa verificada para el ciclo.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {preview.calculo.faltas.map((f, i) => (
                                            <div key={i} className="flex justify-between items-center text-[12px] p-3 bg-[#0b0b0b] rounded-lg border border-white/[0.02]">
                                                <span className="text-gray-400 font-medium">{formatFecha(f.fecha)} — {f.tipo_falta}</span>
                                                <span className={f.descuenta ? 'text-red-500 font-bold' : 'text-gray-600'}>{f.descuenta ? formatQ(f.monto) : 'Q 0.00'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Liquidación Final (DETALLADA) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            {/* Columna Percepciones */}
                            <div className="p-10 border-r border-white/5 space-y-6 bg-white/[0.005]">
                                <h4 className="text-white text-[10px] font-black uppercase tracking-[0.4em] mb-8">Desglose de Haberes</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-[13px]"><span className="text-gray-500">Sueldo Ordinario Mensual</span><span className="text-white font-bold">{formatQ(preview.calculo.sueldo_base)}</span></div>
                                    <div className="flex justify-between text-[13px]"><span className="text-gray-500">Bonificación de Ley (Decreto 37-2001)</span><span className="text-white font-bold">{formatQ(preview.calculo.bonificacion_incentivo)}</span></div>
                                    {preview.calculo.total_horas_extra > 0 && (
                                        <div className="flex justify-between text-[13px]"><span className="text-gray-500">Subtotal Horas Extraordinarias</span><span className="text-emerald-500 font-bold">{formatQ(preview.calculo.total_horas_extra)}</span></div>
                                    )}
                                    {(preview.calculo.percepciones_empleado || []).map((p, i) => (
                                        <div key={i} className="flex justify-between text-[13px]"><span className="text-gray-500">{p.nombre}</span><span className="text-white font-bold">{formatQ(p.monto)}</span></div>
                                    ))}
                                </div>
                                <div className="flex justify-between pt-6 border-t-2 border-emerald-500/20 mt-10">
                                    <span className="text-[11px] font-black text-white uppercase tracking-widest">Total Bruto Devengado</span>
                                    <span className="text-emerald-500 font-black text-2xl tracking-tighter">{formatQ(preview.calculo.total_percepciones)}</span>
                                </div>
                            </div>

                            {/* Columna Deducciones */}
                            <div className="p-10 space-y-6">
                                <h4 className="text-white text-[10px] font-black uppercase tracking-[0.4em] mb-8">Retenciones y Descuentos</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-[13px]">
                                        <span className="text-gray-500">Cuota Laboral IGSS ({preview.calculo.igss_porcentaje}%)</span>
                                        <span className="text-white font-bold">{formatQ(preview.calculo.igss_monto)}</span>
                                    </div>
                                    <div className="flex justify-between text-[13px]">
                                        <span className="text-gray-500">Retención ISR Asalariados</span>
                                        <span className="text-white font-bold">{preview.calculo.isr_monto > 0 ? formatQ(preview.calculo.isr_monto) : 'Exento'}</span>
                                    </div>
                                    {preview.calculo.total_descuento_faltas > 0 && (
                                        <div className="flex justify-between text-[13px]"><span className="text-gray-500">Descuento por Inasistencias</span><span className="text-red-500 font-bold">{formatQ(preview.calculo.total_descuento_faltas)}</span></div>
                                    )}
                                    {(preview.calculo.deducciones_empleado || []).map((d, i) => (
                                        <div key={i} className="flex justify-between text-[13px]"><span className="text-gray-500">{d.nombre}</span><span className="text-white font-bold">{formatQ(d.monto)}</span></div>
                                    ))}
                                </div>
                                <div className="flex justify-between pt-6 border-t-2 border-red-500/20 mt-10">
                                    <span className="text-[11px] font-black text-white uppercase tracking-widest">Total Deducciones</span>
                                    <span className="text-red-500 font-black text-2xl tracking-tighter">{formatQ(preview.calculo.total_deducciones)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Aportes Patronales (DETALLE ADICIONAL) */}
                        <div className="px-10 py-6 bg-[#0d0d0e] border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Información Complementaria</p>
                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500 text-[11px]">IGSS Patronal ({preview.calculo.igss_patronal_porcentaje}%):</span>
                                    <span className="text-[#C5A028] font-bold text-[11px]">{formatQ(preview.calculo.igss_patronal)}</span>
                                </div>
                                <div className="w-[1px] h-4 bg-white/5"></div>
                                <div className="text-gray-500 text-[10px] italic">Aporte de la empresa (No descontado al colaborador)</div>
                            </div>
                        </div>

                        {/* Neto Final de Impacto */}
                        <div className="bg-[#0b0b0b] p-12 flex flex-col md:flex-row items-center justify-between gap-10 border-t border-white/5 shadow-inner">
                            <div>
                                <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.6em] mb-3 text-center md:text-left">Neto Líquido a Transferir</p>
                                <p className="font-serif-title text-6xl text-white tracking-tighter text-center md:text-left">{formatQ(preview.calculo.liquido_a_pagar)}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                <button
                                    onClick={handleProcesar}
                                    disabled={loadingPago}
                                    className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-xl shadow-2xl shadow-emerald-600/20 disabled:opacity-30 transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    {loadingPago ? 'Confirmando...' : 'Procesar Pago Ahora'}
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-8 py-4 bg-white/[0.03] hover:bg-white/[0.06] text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-xl border border-white/5 transition-all flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                    Imprimir Boleta
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ALERTAS DE ERROR GENERAL */}
            {errorTipo === 'general' && error && (
                <div className="mt-8 p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </div>
            )}

            {/* PAGO EXITOSO */}
            {resultado && (
                <div className="luxury-card p-16 text-center border-emerald-500/20 animate-in zoom-in-95 duration-500 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
                        <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="font-serif-title text-4xl text-white mb-3 tracking-tight">Liquidación Registrada</h3>
                    <p className="text-gray-500 text-sm mb-12">La transacción ha sido procesada exitosamente en el historial del período.</p>
                    <button onClick={() => { setIdEmpleado(''); setPreview(null); setResultado(null); setError(''); setErrorTipo(''); }} className="gold-button mx-auto text-[11px] uppercase tracking-widest px-12 py-4">Nueva Liquidación</button>
                </div>
            )}

            {/* MODAL MASIVO — PROFESIONAL */}
            {modalMasivo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                    <div className="luxury-card w-full max-w-xl shadow-2xl border-[#C5A028]/20 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                            <h3 className="text-white text-xs font-black uppercase tracking-[0.3em]">Cálculo Masivo por Período</h3>
                            <button onClick={() => setModalMasivo(false)} className="text-gray-500 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-10">
                            {!resultadoMasivo && !loadingMasivo && (
                                <>
                                    <p className="text-gray-500 text-[13px] leading-relaxed mb-8">Esta operación generará la liquidación de <strong className="text-white">todos los colaboradores activos</strong> para el ciclo seleccionado.</p>
                                    <div className="space-y-3">
                                        {periodos.length === 0 ? (
                                            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center text-amber-500 text-[10px] font-bold uppercase tracking-widest">No hay períodos operativos disponibles</div>
                                        ) : (
                                            periodos.map(p => (
                                                <button key={p.ID_PERIODO} onClick={() => handleProcesarTodos(p)} className="w-full flex justify-between items-center bg-[#0b0b0b] hover:bg-[#C5A028]/5 border border-white/5 hover:border-[#C5A028]/20 rounded-2xl px-6 py-5 transition-all text-left group">
                                                    <div>
                                                        <p className="text-white font-black text-sm uppercase tracking-widest">{MESES[p.NUMERO_PERIODO]} {p.ANIO}</p>
                                                        <p className="text-[10px] text-gray-600 font-bold mt-1 uppercase tracking-widest">Estado: Abierto</p>
                                                    </div>
                                                    <div className="gold-button text-[9px] py-1 px-4">Procesar Todos</div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                            {loadingMasivo && (
                                <div className="text-center py-10">
                                    <div className="w-12 h-12 border-4 border-[#C5A028]/20 border-t-[#C5A028] rounded-full animate-spin mx-auto mb-6" />
                                    <p className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Procesando Liquidaciones...</p>
                                </div>
                            )}
                            {resultadoMasivo && (
                                <div className="text-center animate-in fade-in duration-700">
                                    <div className="flex justify-center gap-8 mb-12">
                                        <div className="text-center">
                                            <p className="text-3xl font-black text-emerald-500 leading-none">{resultadoMasivo.resumen.procesados}</p>
                                            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-2">Exitosos</p>
                                        </div>
                                        <div className="text-center border-x border-white/5 px-8">
                                            <p className="text-3xl font-black text-amber-500 leading-none">{resultadoMasivo.resumen.omitidos}</p>
                                            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-2">Omitidos</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-3xl font-black text-red-500 leading-none">{resultadoMasivo.resumen.errores}</p>
                                            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-2">Fallidos</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setModalMasivo(false)} className="dark-button mx-auto text-[10px] uppercase tracking-widest px-10">Cerrar Consola</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalcularNominaPage;
