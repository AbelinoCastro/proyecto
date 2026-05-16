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
                <button onClick={abrirCreate} className="px-4 py-2 bg-[#121621] border border-white/5 rounded-lg text-sm hover:bg-white/10 transition">+ Create</button>
                <button onClick={abrirUpdate} disabled={!selected} className="px-4 py-2 bg-[#121621] border border-white/5 rounded-lg text-sm hover:bg-white/10 transition disabled:opacity-40">Update</button>
                <button onClick={eliminar} disabled={!selected} className="px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition disabled:opacity-40">Delete</button>
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
                            {modal === 'create' && <input className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none" placeholder="ID (ej: J1)" value={form.id_jornada} onChange={e => setForm({ ...form, id_jornada: e.target.value })} />}
                            <input className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none" placeholder="Nombre" value={form.nombre_jornada} onChange={e => setForm({ ...form, nombre_jornada: e.target.value })} />
                            <input className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none" placeholder="Descripción (opcional)" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                            <div className="flex gap-2">
                                <input className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none flex-1" placeholder="Hora inicio (08:00)" value={form.hora_inicio} onChange={e => setForm({ ...form, hora_inicio: e.target.value })} />
                                <input className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none flex-1" placeholder="Hora fin (17:00)" value={form.hora_fin} onChange={e => setForm({ ...form, hora_fin: e.target.value })} />
                            </div>
                            <input type="number" className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none" placeholder="Horas diarias" value={form.horas_diarias} onChange={e => setForm({ ...form, horas_diarias: e.target.value })} />
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