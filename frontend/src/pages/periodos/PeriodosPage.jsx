import { useEffect, useState } from 'react';
import { getPeriodos, createPeriodo, cambiarEstadoPeriodo, deletePeriodo } from '../../services/periodosService';
import EstadoBadge from '../../components/EstadoBadge';

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const formatFecha = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const PeriodosPage = () => {
    const [periodos, setPeriodos] = useState([]);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({ mes: new Date().getMonth() + 1, anio: new Date().getFullYear() });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const cargar = async () => {
        try {
            const res = await getPeriodos();
            setPeriodos(res.data.data);
        } catch { setError('Error al cargar períodos'); }
    };

    useEffect(() => { cargar(); }, []);

    const handleCrear = async () => {
        setError('');
        setLoading(true);
        try {
            await createPeriodo({ mes: form.mes, anio: form.anio });
            setModal(false);
            cargar();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al crear período');
        } finally { setLoading(false); }
    };

    const handleCambiarEstado = async (periodo, nuevoEstado) => {
        const accion = nuevoEstado === 'CERRADO' ? 'cerrar' : 'abrir';
        if (!window.confirm(`¿Deseas ${accion} el período ${MESES[periodo.NUMERO_PERIODO]} ${periodo.ANIO}?`)) return;
        try {
            await cambiarEstadoPeriodo(periodo.ID_PERIODO, nuevoEstado);
            cargar();
        } catch (err) {
            alert(err.response?.data?.message || `Error al ${accion} período`);
        }
    };

    const handleEliminar = async (periodo) => {
        // Validación de seguridad "discreta": solo eliminar si el usuario confirma dos veces
        // o si es un periodo que no tiene nóminas (el backend ya valida esto)
        if (!window.confirm(`¿Está seguro de eliminar permanentemente el ciclo ${MESES[periodo.NUMERO_PERIODO]} ${periodo.ANIO}?\n\nEsta acción no se puede deshacer.`)) return;

        try {
            await deletePeriodo(periodo.ID_PERIODO);
            cargar();
        } catch (err) {
            alert(err.response?.data?.message || 'No se puede eliminar un periodo con nóminas pagadas.');
        }
    };

    const labelCls = "text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block";
    const inputCls = "bg-[#0b0b0b] border border-white/5 rounded-lg px-4 py-2 text-[13px] text-white outline-none focus:border-[#C5A028]/30 transition-all w-full";

    return (
        <div className="max-w-[1100px] mx-auto py-10 px-6 animate-in fade-in duration-700">

            {/* Header / Titulo */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <p className="text-[#C5A028] text-[10px] font-black uppercase tracking-[0.4em] mb-3 opacity-60">Configuración Cronológica</p>
                    <h1 className="font-serif-title text-5xl text-white tracking-tight">Períodos Operativos</h1>
                </div>
                <button
                    onClick={() => { setModal(true); setError(''); }}
                    className="gold-button text-[11px] uppercase tracking-[0.2em] py-3 shadow-2xl flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                    Nuevo Ciclo de Nómina
                </button>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </div>
            )}

            {/* LISTADO DE PERÍODOS (Más intuitivo y con botones visibles) */}
            <div className="luxury-card overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Mes y Año</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Rango de Fecha</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Estado Actual</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] text-right">Acciones de Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {periodos.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center opacity-30 italic text-sm">No hay períodos registrados.</td>
                                </tr>
                            )}
                            {periodos.map(p => (
                                <tr key={p.ID_PERIODO} className="hover:bg-white/[0.01] transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${p.ESTADO === 'ABIERTO' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-700'}`}></div>
                                            <span className={`text-[14px] font-bold ${p.ESTADO === 'ABIERTO' ? 'text-white' : 'text-gray-500'}`}>
                                                {MESES[p.NUMERO_PERIODO]} {p.ANIO}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-[12px] text-gray-400 font-medium">{formatFecha(p.FECHA_INICIO)} <span className="mx-2 opacity-20">→</span> {formatFecha(p.FECHA_FIN)}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <EstadoBadge estado={p.ESTADO} />
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-3 items-center">
                                            {/* Botón de eliminación discreto (solo icono basura) */}
                                            <button
                                                onClick={() => handleEliminar(p)}
                                                className="p-2.5 text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Eliminar ciclo vacío"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h14" /></svg>
                                            </button>

                                            {p.ESTADO === 'ABIERTO' ? (
                                                <button
                                                    onClick={() => handleCambiarEstado(p, 'CERRADO')}
                                                    className="px-5 py-2 text-[10px] font-black uppercase tracking-widest bg-red-600/10 border border-red-600/20 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-lg flex items-center gap-2"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                                    Cerrar Período
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleCambiarEstado(p, 'ABIERTO')}
                                                    className="px-5 py-2 text-[10px] font-black uppercase tracking-widest bg-emerald-600/10 border border-emerald-600/20 text-emerald-500 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-lg flex items-center gap-2"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>
                                                    Reabrir Período
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CREAR — REFINADO */}
            {modal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="luxury-card w-full max-w-md shadow-2xl border-[#C5A028]/20 animate-in zoom-in-95 duration-500">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <h2 className="text-white text-xs font-black uppercase tracking-[0.3em]">Apertura de Ciclo</h2>
                            <button onClick={() => setModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-10">
                            <div className="space-y-6">
                                <div>
                                    <label className={labelCls}>Mes de Operación</label>
                                    <select className={inputCls} value={form.mes} onChange={e => setForm({ ...form, mes: parseInt(e.target.value) })}>
                                        {MESES.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Año Calendario</label>
                                    <input type="number" className={inputCls} value={form.anio} onChange={e => setForm({ ...form, anio: parseInt(e.target.value) })} min={2020} max={2099} />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-12">
                                <button onClick={() => setModal(false)} className="flex-1 dark-button py-4 text-[10px] uppercase tracking-widest">Descartar</button>
                                <button onClick={handleCrear} disabled={loading} className="flex-1 gold-button py-4 text-[10px] uppercase tracking-widest">{loading ? 'Procesando...' : 'Crear Período'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PeriodosPage;
