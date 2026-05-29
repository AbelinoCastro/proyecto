import { useEffect, useState } from 'react';
import { getJornadas, createJornada, updateJornada, deleteJornada } from '../../services/jornadasService';

const JornadasPage = () => {
    const [datos, setDatos] = useState([]);
    const [buscar, setBuscar] = useState('');
    const [selected, setSelected] = useState(null);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({ id_jornada: '', nombre_jornada: '', descripcion: '', hora_inicio: '', hora_fin: '', horas_diarias: '' });
    const [error, setError] = useState('');

    const cargar = async () => { const res = await getJornadas(); setDatos(res.data.data); };
    useEffect(() => { cargar(); }, []);

    const filtrados = datos.filter(d => d.NOMBRE_JORNADA.toLowerCase().includes(buscar.toLowerCase()));

    const abrirCreate = () => { setForm({ id_jornada: '', nombre_jornada: '', descripcion: '', hora_inicio: '', hora_fin: '', horas_diarias: '' }); setError(''); setModal('create'); };
    const abrirUpdate = () => { if (!selected) return; setForm({ id_jornada: selected.ID_JORNADA, nombre_jornada: selected.NOMBRE_JORNADA, descripcion: selected.DESCRIPCION || '', hora_inicio: selected.HORA_INICIO || '', hora_fin: selected.HORA_FIN || '', horas_diarias: selected.HORAS_DIARIAS }); setError(''); setModal('update'); };

    const guardar = async () => {
        try {
            if (modal === 'create') await createJornada(form);
            else await updateJornada(selected.ID_JORNADA, form);
            setModal(null); setSelected(null); cargar();
        } catch (err) { setError(err.response?.data?.message || 'Error al guardar'); }
    };

    const eliminar = async () => {
        if (!selected || !window.confirm(`¿Eliminar "${selected.NOMBRE_JORNADA}"?`)) return;
        try { await deleteJornada(selected.ID_JORNADA); setSelected(null); cargar(); }
        catch (err) { alert(err.response?.data?.message || 'Error al eliminar'); }
    };

    return (
        <div className="text-white">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold">Jornadas</h1>
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
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">NOMBRE</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">INICIO</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">FIN</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">HORAS</th>
                    </tr></thead>
                    <tbody>
                        {filtrados.map(item => (
                            <tr key={item.ID_JORNADA} onClick={() => setSelected(selected?.ID_JORNADA === item.ID_JORNADA ? null : item)} className={`border-b border-white/5 cursor-pointer transition-colors ${selected?.ID_JORNADA === item.ID_JORNADA ? 'bg-blue-600/20' : 'hover:bg-white/5'}`}>
                                <td className="px-4 py-3"><input type="checkbox" readOnly checked={selected?.ID_JORNADA === item.ID_JORNADA} className="accent-blue-500" /></td>
                                <td className="px-4 py-3 text-gray-300">{item.ID_JORNADA}</td>
                                <td className="px-4 py-3 font-medium">{item.NOMBRE_JORNADA}</td>
                                <td className="px-4 py-3 text-gray-400">{item.HORA_INICIO || '—'}</td>
                                <td className="px-4 py-3 text-gray-400">{item.HORA_FIN || '—'}</td>
                                <td className="px-4 py-3 text-gray-400">{item.HORAS_DIARIAS}</td>
                            </tr>
                        ))}
                        {filtrados.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Sin resultados</td></tr>}
                    </tbody>
                </table>
            </div>

            {(modal === 'create' || modal === 'update') && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-[#121621] rounded-xl border border-white/5 p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-4">{modal === 'create' ? 'Crear Jornada' : 'Actualizar Jornada'}</h2>
                        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                        <div className="flex flex-col gap-3">
                            {modal === 'create' && (
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">ID Jornada</label>
                                    <input
                                        className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none w-full"
                                        placeholder="Ej: J1, J2 (máx 10 caracteres)"
                                        maxLength={10}
                                        value={form.id_jornada}
                                        onChange={e => setForm({ ...form, id_jornada: e.target.value.toUpperCase() })}
                                        onInput={(e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10); }}
                                        title="Solo letras y números, ej: J1"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Nombre *</label>
                                <input
                                    className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none w-full"
                                    placeholder="Ej: Matutina, Vespertina, Nocturna"
                                    maxLength={50}
                                    value={form.nombre_jornada}
                                    onChange={e => setForm({ ...form, nombre_jornada: e.target.value })}
                                    onInput={(e) => { e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').slice(0, 50); }}
                                    title="Solo letras y espacios"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Descripción</label>
                                <input
                                    className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none w-full"
                                    placeholder="Ej: Turno laboral de mañana"
                                    maxLength={200}
                                    value={form.descripcion}
                                    onChange={e => setForm({ ...form, descripcion: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Hora inicio</label>
                                    <input
                                        type="time"
                                        className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none w-full"
                                        value={form.hora_inicio}
                                        onChange={e => setForm({ ...form, hora_inicio: e.target.value })}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Hora fin</label>
                                    <input
                                        type="time"
                                        className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none w-full"
                                        value={form.hora_fin}
                                        onChange={e => setForm({ ...form, hora_fin: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Horas diarias *</label>
                                <input
                                    type="number" min="1" max="12" step="0.5"
                                    className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none w-full"
                                    placeholder="Ej: 8 (entre 1 y 12)"
                                    value={form.horas_diarias}
                                    onChange={e => setForm({ ...form, horas_diarias: e.target.value })}
                                    title="Horas por jornada (1-12)"
                                />
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

export default JornadasPage;