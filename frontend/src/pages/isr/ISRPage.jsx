import { useEffect, useState } from 'react';
import { getPeriodos } from '../../services/periodosService';
import {
    getISRPreview, getEstadoISR, pagarISR,
    urlPreviewPDF, urlComprobantePDF, urlPreviewExcel
} from '../../services/satService';

const ISRPage = () => {
    const [periodos, setPeriodos]       = useState([]);
    const [periodo, setPeriodo]         = useState('');
    const [estadoPeriodo, setEstadoPeriodo] = useState('');
    const [pagado, setPagado]           = useState(false);
    const [preview, setPreview]         = useState([]);
    const [totalISR, setTotalISR]       = useState(0);
    const [loading, setLoading]         = useState(false);
    const [toast, setToast]             = useState(null);

    const showToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 3500);
    };

    // Cargar períodos al montar
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

    // Cargar estado ISR cuando cambia el período
    useEffect(() => {
        if (!periodo) return;
        getEstadoISR(periodo)
            .then(res => setPagado(res.data?.data?.pagado || false))
            .catch(() => {});
    }, [periodo]);

    const handleChangePeriodo = (e) => {
        const id = e.target.value;
        setPeriodo(id);
        const p = periodos.find(x => x.ID_PERIODO == id);
        setEstadoPeriodo(p?.ESTADO || '');
        setPreview([]);
    };

    const handlePreview = async () => {
        if (!periodo) return showToast('Selecciona un período', 'error');
        setLoading(true);
        try {
            const res = await getISRPreview(periodo);
            const d = res.data?.data || {};
            setPreview(d.empleados || []);
            setTotalISR(d.totalISR || 0);
        } catch {
            showToast('Error al obtener preview ISR', 'error');
        } finally { setLoading(false); }
    };

    const handlePagar = async () => {
        if (!periodo) return;
        if (!window.confirm('¿Confirma el pago de ISR para este período? Esta acción no se puede deshacer.')) return;
        setLoading(true);
        try {
            await pagarISR(periodo);
            setPagado(true);
            setPreview([]);
            showToast('ISR pagado correctamente');
        } catch (err) {
            showToast(err.response?.data?.message || 'Error al pagar ISR', 'error');
        } finally { setLoading(false); }
    };

    const canAction = estadoPeriodo !== 'ABIERTO' && !pagado;

    return (
        <div className="p-6 text-slate-100 min-h-screen bg-[#131720]">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
                    ${toast.tipo === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">ISR — Impuesto Sobre la Renta</h1>
                <p className="text-slate-400 text-sm mt-1">Retención y pago ante la SAT por período de nómina</p>
            </div>

            <div className="bg-[#1a1f2e] rounded-2xl border border-slate-700/60 p-6 max-w-5xl space-y-6">

                {/* Selector de período */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Período</label>
                        <select
                            value={periodo}
                            onChange={handleChangePeriodo}
                            className="w-full bg-[#131720] border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Seleccione período</option>
                            {periodos.map(p => (
                                <option key={p.ID_PERIODO} value={p.ID_PERIODO}>
                                    {p.NUMERO_PERIODO}/{p.ANIO} — {p.ESTADO}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-sm">Estado:</span>
                        {estadoPeriodo === 'ABIERTO' ? (
                            <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold">Nómina Abierta</span>
                        ) : pagado ? (
                            <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">ISR Pagado</span>
                        ) : estadoPeriodo ? (
                            <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">ISR Pendiente</span>
                        ) : (
                            <span className="text-slate-500 text-sm">—</span>
                        )}
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handlePreview}
                        disabled={!canAction || loading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                    >
                        {loading ? '...' : '📊'} Preview ISR
                    </button>
                    <button
                        onClick={() => periodo && window.open(urlPreviewExcel(periodo))}
                        disabled={!canAction}
                        className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                    >
                        📥 Excel
                    </button>
                    <button
                        onClick={() => periodo && window.open(urlPreviewPDF(periodo))}
                        disabled={!canAction}
                        className="flex items-center gap-2 bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                    >
                        📄 PDF Preview
                    </button>
                    <button
                        onClick={handlePagar}
                        disabled={!canAction || loading}
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                    >
                        💰 Pagar ISR
                    </button>
                    <button
                        onClick={() => periodo && window.open(urlComprobantePDF(periodo))}
                        disabled={!pagado}
                        className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                    >
                        🧾 Comprobante PDF
                    </button>
                </div>

                {/* Alerta nómina abierta */}
                {estadoPeriodo === 'ABIERTO' && (
                    <div className="bg-amber-500/10 border border-amber-500/40 text-amber-300 px-4 py-3 rounded-xl text-sm">
                        La nómina del período seleccionado aún está abierta. Cierra el período antes de procesar el ISR.
                    </div>
                )}

                {/* Nota metodológica */}
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-xs text-slate-400 leading-relaxed">
                    <span className="text-white font-semibold">Cálculo ISR (Decreto 10-2012):</span>{' '}
                    Base anual = (Percepciones × 12) − (IGSS × 12) − Q48,000.
                    Tramos: <span className="text-white">5%</span> hasta Q300,000 · <span className="text-white">7%</span> sobre el exceso.
                    ISR mensual = ISR anual ÷ 12.
                </div>

                {/* Tabla preview */}
                {preview.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-slate-700/60">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-800/80 text-slate-300 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-4 py-3">Empleado</th>
                                    <th className="px-4 py-3 text-right">Percepciones/mes</th>
                                    <th className="px-4 py-3 text-right">IGSS/mes</th>
                                    <th className="px-4 py-3 text-right">Base neta/mes</th>
                                    <th className="px-4 py-3 text-right">Base anual gravable</th>
                                    <th className="px-4 py-3 text-right">ISR mensual</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {preview.map((emp, i) => {
                                    const baseAnual = (emp.base_isr * 12) - 48000;
                                    return (
                                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-4 py-2.5 text-slate-200">{emp.nombre}</td>
                                            <td className="px-4 py-2.5 text-right text-slate-300">Q {Number(emp.percepciones).toFixed(2)}</td>
                                            <td className="px-4 py-2.5 text-right text-slate-300">Q {Number(emp.igss).toFixed(2)}</td>
                                            <td className="px-4 py-2.5 text-right text-slate-400">Q {Number(emp.base_isr).toFixed(2)}</td>
                                            <td className="px-4 py-2.5 text-right text-slate-400">
                                                {baseAnual > 0 ? `Q ${baseAnual.toFixed(2)}` : <span className="text-slate-600">Exento</span>}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-semibold text-amber-400">Q {Number(emp.isr).toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="px-4 py-3 bg-slate-800/50 flex justify-end gap-4 text-sm font-semibold">
                            <span className="text-slate-400">Total ISR mensual:</span>
                            <span className="text-amber-400">Q {Number(totalISR).toFixed(2)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ISRPage;
