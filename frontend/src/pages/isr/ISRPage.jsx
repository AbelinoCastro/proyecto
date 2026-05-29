import { useEffect, useState } from 'react';
import { getPeriodos } from '../../services/periodosService';
import {
    getISRPreview, getEstadoISR, pagarISR,
    urlPreviewPDF, urlComprobantePDF, urlPreviewExcel
} from '../../services/satService';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const formatQ = (n) => `Q ${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Toast = ({ mensaje, tipo, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-10 right-10 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-10 duration-500 ${
      tipo === 'error' ? 'bg-red-950/60 border-red-500/50 text-red-100' : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-100'
    } backdrop-blur-2xl`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${tipo === 'error' ? 'border-red-500/30' : 'border-emerald-500/30'}`}>
        {tipo === 'error' ? '✕' : '✔'}
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{tipo === 'error' ? 'Sistema / Alerta' : 'Notificación'}</span>
        <span className="text-[13px] font-bold">{mensaje}</span>
      </div>
    </div>
  );
};

const ISRPage = () => {
    const [periodos, setPeriodos]           = useState([]);
    const [periodo, setPeriodo]             = useState('');
    const [estadoPeriodo, setEstadoPeriodo] = useState('');
    const [pagado, setPagado]               = useState(false);
    const [preview, setPreview]             = useState([]);
    const [totalISR, setTotalISR]       = useState(0);
    const [loading, setLoading]             = useState(false);
    const [toast, setToast]                 = useState(null);

    const showToast = (msg, tipo = 'success') => {
        setToast({ mensaje: msg, tipo });
    };

    useEffect(() => {
        getPeriodos()
            .then(res => {
                const lista = res.data?.data || res.data || [];
                setPeriodos(lista);
                const abierto = lista.find(p => p.ESTADO === 'ABIERTO');
                if (abierto) {
                    setPeriodo(abierto.ID_PERIODO);
                    setEstadoPeriodo(abierto.ESTADO);
                }
            })
            .catch(() => showToast('Error al cargar períodos operativos', 'error'));
    }, []);

    useEffect(() => {
        if (!periodo) return;
        getEstadoISR(periodo)
            .then(res => setPagado(res.data?.data?.pagado || false))
            .catch(() => {});
    }, [periodo]);

    const handleChangePeriodo = (e) => {
        const id = e.target.value;
        setPeriodo(id);
        const p = periodos.find(x => String(x.ID_PERIODO) === String(id));
        setEstadoPeriodo(p?.ESTADO || '');
        setPreview([]);
    };

    const handlePreview = async () => {
        if (!periodo) return showToast('Seleccione un ciclo fiscal', 'error');
        setLoading(true);
        try {
            const res = await getISRPreview(periodo);
            const d = res.data?.data || {};
            setPreview(d.empleados || []);
            setTotalISR(d.totalISR || 0);
        } catch {
            showToast('Fallo al sincronizar datos tributarios', 'error');
        } finally { setLoading(false); }
    };

    const handlePagar = async () => {
        if (!periodo) return;
        if (!window.confirm('¿Confirma la liquidación de ISR para este ciclo operativo? Esta acción es irreversible.')) return;
        setLoading(true);
        try {
            await pagarISR(periodo);
            setPagado(true);
            setPreview([]);
            showToast('Liquidación de ISR procesada con éxito');
        } catch (err) {
            showToast(err.response?.data?.message || 'Error en el proceso de pago SAT', 'error');
        } finally { setLoading(false); }
    };

    const canAction = estadoPeriodo !== 'ABIERTO' && !pagado;
    const labelCls = "text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block opacity-60";
    const inputCls = "bg-[#0b0b0b] border border-white/5 rounded-xl px-4 py-3 text-[12px] text-white outline-none focus:border-[#C5A028]/30 transition-all w-full shadow-inner";

    return (
        <div className="max-w-[1450px] mx-auto py-10 px-8 animate-in fade-in duration-1000 min-h-screen">
            {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}

            {/* Header Maestro */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-12">
                <div>
                    <p className="text-[#C5A028] text-[10px] font-black uppercase tracking-[0.4em] mb-3 opacity-60">Control Tributario & SAT</p>
                    <h1 className="font-serif-title text-6xl text-white tracking-tighter leading-none">ISR — Retención de Ley</h1>
                    <p className="text-gray-600 text-[13px] mt-4 font-medium max-w-2xl leading-relaxed">
                        Administración de retenciones del Impuesto Sobre la Renta (Decreto 10-2012).
                        Monitoree bases gravables anuales y gestione liquidaciones mensuales ante la administración tributaria.
                    </p>
                </div>
                <div className="flex items-center gap-6 bg-[#111112] border border-white/5 px-8 py-4 rounded-[28px] shadow-2xl">
                    <div className="text-right border-r border-white/5 pr-6">
                        <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest opacity-60">Tramos Ley</p>
                        <p className="text-white font-black text-xl tracking-tighter">5% / 7%</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest opacity-60">Exención Anual</p>
                        <p className="text-[#C5A028] font-black text-xl tracking-tighter">Q 48,000</p>
                    </div>
                </div>
            </div>

            {/* Consola de Control */}
            <div className="luxury-card p-10 space-y-10 border-t-2 border-t-[#C5A028]/30 shadow-2xl">

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
                    <div className="md:col-span-5">
                        <label className={labelCls}>Ciclo Fiscal Operativo</label>
                        <select value={periodo} onChange={handleChangePeriodo} className={inputCls}>
                            <option value="">Seleccione un período del sistema...</option>
                            {periodos.map(p => (
                                <option key={p.ID_PERIODO} value={p.ID_PERIODO}>
                                    {MESES[p.NUMERO_PERIODO - 1]} {p.ANIO} — {p.ESTADO}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-3">
                         <label className={labelCls}>Estatus Tributario</label>
                         <div className="h-[46px] flex items-center px-6 rounded-xl bg-[#0b0b0b] border border-white/5">
                            {estadoPeriodo === 'ABIERTO' ? (
                                <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                    Nómina Abierta
                                </span>
                            ) : pagado ? (
                                <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    ISR Liquidado
                                </span>
                            ) : estadoPeriodo ? (
                                <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"></div>
                                    Pendiente Pago
                                </span>
                            ) : (
                                <span className="text-gray-700 text-[10px] font-black uppercase tracking-widest">—</span>
                            )}
                         </div>
                    </div>
                    <div className="md:col-span-4 flex gap-3">
                        <button onClick={handlePreview} disabled={!canAction || loading} className="flex-1 dark-button py-3.5 text-[9px] uppercase tracking-widest disabled:opacity-20 flex items-center justify-center gap-2">
                            <span>📊</span> Preview ISR
                        </button>
                        <button onClick={handlePagar} disabled={!canAction || loading} className="flex-1 gold-button py-3.5 text-[9px] uppercase tracking-widest shadow-xl disabled:opacity-20 flex items-center justify-center gap-2">
                            <span>💰</span> Pagar ISR
                        </button>
                    </div>
                </div>

                {/* Acciones de Reporte Originales */}
                <div className="flex flex-wrap gap-4 pt-6 border-t border-white/5">
                    <button onClick={() => periodo && window.open(urlPreviewExcel(periodo))} disabled={!canAction} className="gold-button !bg-emerald-700/10 !text-emerald-500 border border-emerald-500/20 text-[9px] px-6 py-3 disabled:opacity-20 flex items-center gap-2">
                        <span>📥</span> Exportar Excel
                    </button>
                    <button onClick={() => periodo && window.open(urlPreviewPDF(periodo))} disabled={!canAction} className="gold-button !bg-red-700/10 !text-red-400 border border-red-500/20 text-[9px] px-6 py-3 disabled:opacity-20 flex items-center gap-2">
                        <span>📄</span> Vista Previa PDF
                    </button>
                    <button onClick={() => periodo && window.open(urlComprobantePDF(periodo))} disabled={!pagado} className="gold-button !bg-purple-700/10 !text-purple-400 border border-purple-500/20 text-[9px] px-6 py-3 disabled:opacity-20 flex items-center gap-2">
                        <span>🧾</span> Comprobante Final
                    </button>
                </div>

                {estadoPeriodo === 'ABIERTO' && (
                    <div className="p-6 bg-amber-500/5 border-2 border-amber-500/20 rounded-2xl flex items-center gap-5">
                        <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <p className="text-amber-500/80 text-[12px] font-medium leading-relaxed">
                            El ciclo operativo actual se encuentra **Abierto**. Finalice el proceso de nómina para habilitar la liquidación tributaria ante la SAT.
                        </p>
                    </div>
                )}

                {/* Nota Metodológica Original Restaurada */}
                <div className="p-5 bg-[#0b0b0b] border border-white/5 rounded-2xl">
                    <p className="text-gray-500 text-[11px] leading-relaxed font-medium">
                        <strong className="text-white uppercase tracking-widest text-[9px]">Metodología (Decreto 10-2012):</strong> Base anual = (Percepciones × 12) − (IGSS × 12) − Q48,000. Tramos: 5% hasta Q300,000 y 7% sobre el excedente. Liquidación mensual = ISR anual ÷ 12.
                    </p>
                </div>

                {/* Listado de Retenciones — Detalle Máximo */}
                {preview.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-white/[0.04] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <table className="w-full text-[12px] text-left border-collapse">
                            <thead className="bg-white/[0.01] border-b border-white/[0.04]">
                                <tr>
                                    <th className="px-6 py-5 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Colaborador</th>
                                    <th className="px-6 py-5 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-right">Ingresos/Mes</th>
                                    <th className="px-6 py-5 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-right">IGSS/Mes</th>
                                    <th className="px-6 py-5 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-right">Base Neta/Mes</th>
                                    <th className="px-6 py-5 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-right">Base Gravable Anual</th>
                                    <th className="px-6 py-5 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-right text-amber-500">ISR Mensual</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {preview.map((emp, i) => {
                                    const baseAnual = (emp.base_isr * 12) - 48000;
                                    return (
                                        <tr key={i} className="hover:bg-white/[0.015] transition-colors">
                                            <td className="px-6 py-4 text-white font-bold">{emp.nombre}</td>
                                            <td className="px-6 py-4 text-right text-gray-400 font-medium">{formatQ(emp.percepciones)}</td>
                                            <td className="px-6 py-4 text-right text-gray-400 font-medium">{formatQ(emp.igss)}</td>
                                            <td className="px-6 py-4 text-right text-gray-500 font-bold">{formatQ(emp.base_isr)}</td>
                                            <td className="px-6 py-4 text-right text-gray-600 font-black tracking-tighter">
                                                {baseAnual > 0 ? formatQ(baseAnual) : <span className="text-gray-700 opacity-40 uppercase text-[9px] tracking-widest">Exento</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right text-amber-500 font-black text-[13px] tracking-tighter">{formatQ(emp.isr)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Resumen Final de Impacto Tributario */}
                        <div className="bg-[#0b0b0b] p-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-10">
                            <div>
                                <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.6em] mb-3 text-center md:text-left">Total Retención Proyectada</p>
                                <p className="font-serif-title text-6xl text-white tracking-tighter text-center md:text-left">{formatQ(totalISR)}</p>
                            </div>
                            <div className="bg-[#111112] border border-white/5 px-8 py-5 rounded-[22px] shadow-inner">
                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1 text-center">Cumplimiento SAT</p>
                                <p className="text-emerald-500 font-black text-sm tracking-[0.2em] text-center uppercase">Listo para declarar</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-16 flex justify-center opacity-30">
                <p className="text-[9px] font-black text-gray-700 uppercase tracking-[1em]">Auditoría Tributaria NóminaGT Enterprise</p>
            </div>
        </div>
    );
};

export default ISRPage;
