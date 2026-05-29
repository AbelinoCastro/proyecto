import { useEffect, useState } from 'react';
import { getFaltas, createFalta, updateFalta, deleteFalta } from '../../services/faltasService';

const FaltasPage = () => {
    const [datos, setDatos] = useState([]);
    const [buscar, setBuscar] = useState('');
    const [selected, setSelected] = useState(null);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({ descripcion: '', es_pagado: 'N' });
    const [error, setError] = useState('');

    const cargar = async () => { const res = await getFaltas(); setDatos(res.data.data); };
    useEffect(() => { cargar(); }, []);

    const filtrados = datos.filter(d => d.DESCRIPCION.toLowerCase().includes(buscar.toLowerCase()));

    const abrirCreate = () => { setForm({ descripcion: '', es_pagado: 'N' }); setError(''); setModal('create'); };
    const abrirUpdate = () => { if (!selected) return; setForm({ descripcion: selected.DESCRIPCION, es_pagado: selected.ES_PAGADO }); setError(''); setModal('update'); };

    const guardar = async () => {
        try {
            if (modal === 'create') await createFalta(form);
            else await updateFalta(selected.ID_FALTA, form);
            setModal(null); setSelected(null); cargar();
        } catch (err) { setError(err.response?.data?.message || 'Error al guardar'); }
    };

    const eliminar = async () => {
        if (!selected || !window.confirm(`¿Eliminar la falta "${selected.DESCRIPCION}"?\n\nNo podrás eliminarla si ya está registrada en algún empleado.`)) return;
        try { await deleteFalta(selected.ID_FALTA); setSelected(null); cargar(); }
        catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.details || '';
            if (msg.includes('FK') || msg.includes('child') || msg.includes('integrity') || err.response?.status === 500) {
                alert(`No se puede eliminar "${selected.DESCRIPCION}" porque está siendo usada en registros de faltas o nóminas.`);
            } else {
                alert(msg || 'Error al eliminar');
            }
        }
    };

    return (
        <div className="text-white">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold">Faltas</h1>
                <div className="flex items-center gap-2 bg-[#121621] border border-white/5 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-48" placeholder="Buscar..." value={buscar} onChange={e => setBuscar(e.target.value)} />
                </div>
            </div>
            <div className="flex gap-2 mb-4">
                <button onClick={abrirCreate} className="px-4 py-2 bg-[#121621] border border-white/5 rounded-lg text-sm hover:bg-white/10 transition flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>Crear</button>
                <button onClick={abrirUpdate} disabled={!selected} className="px-4 py-2 bg-[#121621] border border-white/5 rounded-lg text-sm hover:bg-white/10 transition disabled:opacity-40 flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>Editar</button>
                <button onClick={eliminar} disabled={!selected} className="px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition disabled:opacity-40 flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M14 7V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v3"/></svg>Eliminar</button>
            </div>
            <div className="bg-[#121621] rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/5">
                        <th className="w-10 px-4 py-3"></th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">ID</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">DESCRIPCIÓN</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">ES PAGADO</th>
                    </tr></thead>
                    <tbody>
                        {filtrados.map(item => (
                            <tr key={item.ID_FALTA} onClick={() => setSelected(selected?.ID_FALTA === item.ID_FALTA ? null : item)} className={`border-b border-white/5 cursor-pointer transition-colors ${selected?.ID_FALTA === item.ID_FALTA ? 'bg-blue-600/20' : 'hover:bg-white/5'}`}>
                                <td className="px-4 py-3"><input type="checkbox" readOnly checked={selected?.ID_FALTA === item.ID_FALTA} className="accent-blue-500" /></td>
                                <td className="px-4 py-3 text-gray-300">{item.ID_FALTA}</td>
                                <td className="px-4 py-3 font-medium">{item.DESCRIPCION}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.ES_PAGADO === 'S' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                        {item.ES_PAGADO === 'S' ? 'Sí' : 'No'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filtrados.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Sin resultados</td></tr>}
                    </tbody>
                </table>
            </div>
            {(modal === 'create' || modal === 'update') && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-[#121621] rounded-xl border border-white/5 p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-4">{modal === 'create' ? 'Crear Falta' : 'Actualizar Falta'}</h2>
                        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Descripción *</label>
                                <input
                                    className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none w-full"
                                    placeholder="Ej: Falta justificada por enfermedad"
                                    maxLength={100}
                                    value={form.descripcion}
                                    onChange={e => setForm({ ...form, descripcion: e.target.value })}
                                    onInput={(e) => { e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,]/g, '').slice(0, 100); }}
                                    title="Sin caracteres especiales"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">¿Genera pago?</label>
                                <select
                                    className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none w-full"
                                    value={form.es_pagado}
                                    onChange={e => setForm({ ...form, es_pagado: e.target.value })}
                                    title="Si se marca No, se descontará el día"
                                >
                                    <option value="N">No (se descuenta)</option>
                                    <option value="S">Sí (pagado)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">Cancelar</button>
                            <button onClick={guardar} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition">Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FaltasPage;