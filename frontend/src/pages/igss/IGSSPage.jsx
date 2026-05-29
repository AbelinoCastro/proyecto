import { useEffect, useState } from 'react';
import { getPeriodos } from '../../services/periodosService';
import {
    getIGSSPreview, getEstadoIGSS, pagarIGSS,
    urlComprobantePDF
} from '../../services/igssService';

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

const IGSSPage = () => {
    const [periodos, setPeriodos]           = useState([]);
    const [periodo, setPeriodo]             = useState('');
    const [estadoPeriodo, setEstadoPeriodo] = useState('');
    const [pagado, setPagado]               = useState(false);
    const [preview, setPreview]             = useState([]);
    const [totalIGSS, setTotalIGSS]         = useState(0);
    const [totalEmpleado, setTotalEmpleado] = useState(0);
    const [totalPatronal, setTotalPatronal] = useState(0);
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
            .catch(() => showToast('Error al cargar períodos', 'error'));
    }, []);

    useEffect(() => {
        if (!periodo) return;
        getEstadoIGSS(periodo)
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
        if (!periodo) return showToast('Selecciona un período', 'error');
        setLoading(true);
        try {
            const res = await getIGSSPreview(periodo);
            const d = res.data?.data || {};
            setPreview(d.empleados || []);
            setTotalIGSS(d.totalIGSS || 0);
            setTotalEmpleado(d.totalEmpleado || 0);
            setTotalPatronal(d.totalPatronal || 0);
        } catch {
            showToast('Error al obtener datos IGSS', 'error');
        } finally { setLoading(false); }
    };

    const handlePagar = async () => {
        if (!periodo) return;
        if (!window.confirm('¿Confirma el pago de IGSS para este período? Esta acción no se puede deshacer.')) return;
        setLoading(true);
        try {
            await pagarIGSS(periodo);
            setPagado(true);
            setPreview([]);
            showToast('IGSS pagado correctamente');
        } catch (err) {
            showToast(err.response?.data?.message || 'Error al pagar IGSS', 'error');
        } finally { setLoading(false); }
    };

    const canAction = estadoPeriodo !== 'ABIERTO' && !pagado;
    const labelCls = "text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block opacity-60";
    const inputCls = "bg-[#0b0b0b] border border-white/5 rounded-xl px-4 py-3 text-[12px] text-white outline-none focus:border-[#C5A028]/30 transition-all w-full shadow-inner";

    return (
        <div className="max-w-[1450px] mx-auto py-10 px-8 animate-in fade-in duration-1000 min-h-screen">
            {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}

            <div className="mb-12">
                <p className="text-[#C5A028] text-[10px] font-black uppercase tracking-[0.4em] mb-3 opacity-60">Validación de Aportes de Ley</p>
                <h1 className="font-serif-title text-6xl text-white tracking-tighter leading-none">IGSS — Seguro Social</h1>
                <p className="text-gray-600 text-[13px] mt-4 font-medium max-w-2xl leading-relaxed">
                    Validación y pago de cuotas IGSS (4.83%) por período de nómina. Asegure la integridad de los aportes laborales y patronales.
                </p>
            </div>

            <div className="luxury-card p-10 space-y-10 border-t-2 border-t-[#C5A028]/30 shadow-2xl">

                {/* Selector período original logic */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <div>
                        <label className={labelCls}>Período</label>
                        <select
                            value={periodo}
                            onChange={handleChangePeriodo}
                            className={inputCls}
                        >
                            <option value="">Seleccione período</option>
                            {periodos.map(p => (
                                <option key={p.ID_PERIODO} value={p.ID_PERIODO}>
                                    {p.NUMERO_PERIODO}/{p.ANIO} — {p.ESTADO}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-3 bg-[#0b0b0b] border border-white/5 px-6 py-3 rounded-xl h-[46px]">
                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Estado:</span>
                        {estadoPeriodo === 'ABIERTO' ? (
                            <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse">Nómina Abierta</span>
                        ) : pagado ? (
                            <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">IGSS Pagado</span>
                        ) : estadoPeriodo ? (
                            <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">IGSS Pendiente</span>
                        ) : (
                            <span className="text-gray-700 text-[10px] font-black uppercase tracking-widest">—</span>
                        )}
                    </div>
                </div>

                {/* Acciones original icons/logic */}
                <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
                    <button
                        onClick={handlePreview}
                        disabled={!canAction || loading}
                        className="gold-button !bg-blue-600/10 !text-blue-400 border border-blue-500/20 text-[10px] px-6 py-3 shadow-xl disabled:opacity-20 flex items-center gap-2"
                    >
                        {loading ? '...' : '📋'} Ver desglose IGSS
                    </button>
                    <button
                        onClick={handlePagar}
                        disabled={!canAction || loading}
                        className="gold-button !bg-amber-600/10 !text-amber-500 border border-amber-500/20 text-[10px] px-6 py-3 shadow-xl disabled:opacity-20 flex items-center gap-2"
                    >
                        💳 Registrar Pago IGSS
                    </button>
                    <button
                        onClick={() => periodo && window.open(urlComprobantePDF(periodo))}
                        disabled={!pagado}
                        className="gold-button !bg-purple-700/10 !text-purple-400 border border-purple-500/20 text-[10px] px-6 py-3 shadow-xl disabled:opacity-20 flex items-center gap-2"
                    >
                        🧾 Comprobante PDF
                    </button>
                </div>

                {estadoPeriodo === 'ABIERTO' && (
                    <div className="bg-amber-500/5 border border-amber-500/20 text-amber-400/80 px-6 py-4 rounded-2xl text-[12px] font-medium flex items-center gap-3">
                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        La nómina del período seleccionado aún está abierta. Cierra el período antes de registrar el pago IGSS.
                    </div>
                )}

                {/* Info rate original content */}
                <div className="bg-[#0b0b0b] border border-white/5 rounded-2xl px-6 py-4 text-[11px] text-gray-500 leading-relaxed font-medium">
                    Cuota laboral (empleado): <span className="text-white font-bold">4.83%</span> · Cuota patronal (empresa): <span className="text-white font-bold">10.67%</span> sobre salario base + horas extra.
                    La Bonificación Incentivo (Q250) <span className="text-[#C5A028] font-bold">no está sujeta a IGSS</span> (Decreto 78-89).
                </div>

                {/* Tabla original logic/columns */}
                {preview.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-white/[0.04] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <table className="w-full text-[12px] text-left border-collapse">
                            <thead className="bg-white/[0.01] border-b border-white/[0.04]">
                                <tr>
                                    <th className="px-6 py-5 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Empleado</th>
                                    <th className="px-6 py-5 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">No. Afiliación</th>
                                    <th className="px-6 py-5 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-right">Base IGSS</th>
                                    <th className="px-6 py-5 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-right">Empleado 4.83%</th>
                                    <th className="px-6 py-5 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-right">Patrono 10.67%</th>
                                    <th className="px-6 py-5 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {preview.map((emp, i) => (
                                    <tr key={i} className="hover:bg-white/[0.015] transition-colors">
                                        <td className="px-6 py-4 text-white font-bold">{emp.EMPLEADO}</td>
                                        <td className="px-6 py-4 text-gray-600 font-black tracking-widest text-[10px]">{emp.NO_AFILIACION_IGSS || '—'}</td>
                                        <td className="px-6 py-4 text-right text-gray-400 font-medium">Q {Number(emp.IGSS_BASE || 0).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-blue-400 font-bold">Q {Number(emp.IGSS_EMPLEADO || emp.IGSS_MONTO || 0).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-amber-500/80 font-bold">Q {Number(emp.IGSS_PATRONAL || 0).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-emerald-500 font-black tracking-tighter text-[13px]">Q {Number(emp.IGSS_TOTAL || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals section original logic/mapping */}
                        <div className="px-8 py-8 bg-[#0b0b0b] border-t border-white/[0.04] flex flex-col gap-4">
                            <div className="flex justify-end gap-10 items-center">
                                <span className="text-gray-600 text-[9px] font-black uppercase tracking-widest">Total cuota empleado (4.83%):</span>
                                <span className="text-blue-400 font-black text-xl tracking-tighter w-40 text-right">Q {Number(totalEmpleado).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-end gap-10 items-center">
                                <span className="text-gray-600 text-[9px] font-black uppercase tracking-widest">Total cuota patronal (10.67%):</span>
                                <span className="text-amber-500/80 font-black text-xl tracking-tighter w-40 text-right">Q {Number(totalPatronal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-end gap-10 items-center pt-4 border-t border-white/5 mt-2">
                                <span className="text-white text-[10px] font-black uppercase tracking-[0.4em]">Total IGSS a liquidar:</span>
                                <span className="text-emerald-400 font-black text-3xl tracking-tighter w-40 text-right">Q {Number(totalIGSS).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-16 flex justify-center opacity-30">
                <p className="text-[9px] font-black text-gray-700 uppercase tracking-[1em]">Auditoría de Seguridad Social NóminaGT</p>
            </div>
        </div>
    );
};

export default IGSSPage;
