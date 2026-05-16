import { useEffect, useState } from 'react';
import { getPeriodos } from '../../services/periodosService';
import {
    getIGSSPreview, getEstadoIGSS, pagarIGSS,
    urlComprobantePDF
} from '../../services/igssService';

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
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 3500);
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

    return (
        <div className="p-6 text-slate-100 min-h-screen bg-[#0b0e14]">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium
                    ${toast.tipo === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toast.msg}
                </div>
            )}

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">IGSS — Seguro Social</h1>
                <p className="text-slate-400 text-sm mt-1">Validación y pago de cuotas IGSS (4.83%) por período de nómina</p>
            </div>

            <div className="bg-[#121621] rounded-2xl border border-slate-700/60 p-6 max-w-5xl space-y-6">

                {/* Selector período */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Período</label>
                        <select
                            value={periodo}
                            onChange={handleChangePeriodo}
                            className="w-full bg-[#0b0e14] border border-slate-600 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                            <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">IGSS Pagado</span>
                        ) : estadoPeriodo ? (
                            <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">IGSS Pendiente</span>
                        ) : (
                            <span className="text-slate-500 text-sm">—</span>
                        )}
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handlePreview}
                        disabled={!canAction || loading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                    >
                        {loading ? '...' : '📋'} Ver desglose IGSS
                    </button>
                    <button
                        onClick={handlePagar}
                        disabled={!canAction || loading}
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                    >
                        💳 Registrar Pago IGSS
                    </button>
                    <button
                        onClick={() => periodo && window.open(urlComprobantePDF(periodo))}
                        disabled={!pagado}
                        className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                    >
                        🧾 Comprobante PDF
                    </button>
                </div>

                {estadoPeriodo === 'ABIERTO' && (
                    <div className="bg-amber-500/10 border border-amber-500/40 text-amber-300 px-4 py-3 rounded-xl text-sm">
                        La nómina del período seleccionado aún está abierta. Cierra el período antes de registrar el pago IGSS.
                    </div>
                )}

                {/* Info rate */}
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-slate-400">
                    Cuota laboral (empleado): <span className="text-white font-semibold">4.83%</span> · Cuota patronal (empresa): <span className="text-white font-semibold">10.67%</span> sobre salario base + horas extra.
                    La Bonificación Incentivo (Q250) <span className="text-white font-semibold">no está sujeta a IGSS</span> (Decreto 78-89).
                </div>

                {/* Tabla */}
                {preview.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-slate-700/60">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-800/80 text-slate-300 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-4 py-3">Empleado</th>
                                    <th className="px-4 py-3">No. Afiliación</th>
                                    <th className="px-4 py-3 text-right">Base IGSS</th>
                                    <th className="px-4 py-3 text-right">Empleado 4.83%</th>
                                    <th className="px-4 py-3 text-right">Patrono 10.67%</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {preview.map((emp, i) => (
                                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-2.5 text-slate-200">{emp.EMPLEADO}</td>
                                        <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{emp.NO_AFILIACION_IGSS || '—'}</td>
                                        <td className="px-4 py-2.5 text-right text-slate-400">Q {Number(emp.IGSS_BASE || 0).toFixed(2)}</td>
                                        <td className="px-4 py-2.5 text-right text-blue-400 font-semibold">Q {Number(emp.IGSS_EMPLEADO || emp.IGSS_MONTO || 0).toFixed(2)}</td>
                                        <td className="px-4 py-2.5 text-right text-amber-400 font-semibold">Q {Number(emp.IGSS_PATRONAL || 0).toFixed(2)}</td>
                                        <td className="px-4 py-2.5 text-right text-emerald-400 font-bold">Q {Number(emp.IGSS_TOTAL || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="px-4 py-3 bg-slate-800/50 flex flex-col gap-1.5 text-sm">
                            <div className="flex justify-end gap-4">
                                <span className="text-slate-400">Total cuota empleado (4.83%):</span>
                                <span className="text-blue-400 font-semibold w-32 text-right">Q {Number(totalEmpleado).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-end gap-4">
                                <span className="text-slate-400">Total cuota patronal (10.67%):</span>
                                <span className="text-amber-400 font-semibold w-32 text-right">Q {Number(totalPatronal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-end gap-4 pt-1 border-t border-slate-700/60 mt-1">
                                <span className="text-slate-200 font-bold">Total IGSS a pagar:</span>
                                <span className="text-emerald-400 font-bold w-32 text-right">Q {Number(totalIGSS).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IGSSPage;
