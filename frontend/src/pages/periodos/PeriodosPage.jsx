import { useEffect, useState } from 'react';
import { getPeriodos, createPeriodo, cambiarEstadoPeriodo } from '../../services/periodosService';
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

    const inputCls = 'bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none w-full';
    const selectCls = 'bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none w-full';

    return (
        <div className="text-white">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold">Períodos de Nómina</h1>
                <button
                    onClick={() => { setModal(true); setError(''); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
                >
                    + Crear período
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* TABLA */}
            <div className="bg-[#121621] rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Período</th>
                            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Fecha inicio</th>
                            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Fecha fin</th>
                            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Fecha cierre</th>
                            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Estado</th>
                            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {periodos.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                    No hay períodos registrados
                                </td>
                            </tr>
                        )}
                        {periodos.map(p => (
                            <tr key={p.ID_PERIODO} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 font-medium">
                                    {MESES[p.NUMERO_PERIODO]} {p.ANIO}
                                </td>
                                <td className="px-4 py-3 text-gray-400">{formatFecha(p.FECHA_INICIO)}</td>
                                <td className="px-4 py-3 text-gray-400">{formatFecha(p.FECHA_FIN)}</td>
                                <td className="px-4 py-3 text-gray-400">{formatFecha(p.FECHA_CIERRE)}</td>
                                <td className="px-4 py-3">
                                    <EstadoBadge estado={p.ESTADO} />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        {p.ESTADO === 'ABIERTO' && (
                                            <button
                                                onClick={() => handleCambiarEstado(p, 'CERRADO')}
                                                className="px-3 py-1 text-xs bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                                            >
                                                Cerrar
                                            </button>
                                        )}
                                        {p.ESTADO === 'CERRADO' && (
                                            <button
                                                onClick={() => handleCambiarEstado(p, 'ABIERTO')}
                                                className="px-3 py-1 text-xs bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition"
                                            >
                                                Abrir
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL CREAR */}
            {modal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-[#121621] rounded-xl border border-white/5 p-6 w-full max-w-sm">
                        <h2 className="text-lg font-semibold mb-4">Crear período de nómina</h2>
                        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Mes</label>
                                <select
                                    className={selectCls}
                                    value={form.mes}
                                    onChange={e => setForm({ ...form, mes: parseInt(e.target.value) })}
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
                                    value={form.anio}
                                    onChange={e => setForm({ ...form, anio: parseInt(e.target.value) })}
                                    min={2020} max={2099}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            Se creará el período del 01/{String(form.mes).padStart(2, '0')}/{form.anio}
                            al {new Date(form.anio, form.mes, 0).getDate()}/{String(form.mes).padStart(2, '0')}/{form.anio} con estado ABIERTO.
                        </p>
                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">
                                Cancelar
                            </button>
                            <button
                                onClick={handleCrear}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm rounded-lg transition"
                            >
                                {loading ? 'Creando...' : 'Crear período'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PeriodosPage;