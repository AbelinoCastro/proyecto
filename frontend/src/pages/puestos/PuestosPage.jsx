import { useEffect, useState } from 'react';
import { getPuestos, createPuesto, updatePuesto, deletePuesto } from '../../services/puestosService';
import { getDepartamentos } from '../../services/departamentosService';

const PuestosPage = () => {
    const [datos, setDatos] = useState([]);
    const [departamentos, setDepto] = useState([]);
    const [buscar, setBuscar] = useState('');
    const [selected, setSelected] = useState(null);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({ id_puesto: '', nombre_puesto: '', id_departamento: '', descripcion: '', sueldo_base: '' });
    const [error, setError] = useState('');

    const cargar = async () => {
        const [resPuestos, resDepto] = await Promise.all([getPuestos(), getDepartamentos()]);
        setDatos(resPuestos.data.data);
        setDepto(resDepto.data.data);
    };
    useEffect(() => { cargar(); }, []);

    const filtrados = datos.filter(d =>
        d.NOMBRE_PUESTO.toLowerCase().includes(buscar.toLowerCase()) ||
        d.NOMBRE_DEPARTAMENTO.toLowerCase().includes(buscar.toLowerCase())
    );

    const abrirCreate = () => { setForm({ id_puesto: '', nombre_puesto: '', id_departamento: '', descripcion: '', sueldo_base: '' }); setError(''); setModal('create'); };
    const abrirUpdate = () => {
        if (!selected) return;
        setForm({ id_puesto: selected.ID_PUESTO, nombre_puesto: selected.NOMBRE_PUESTO, id_departamento: selected.ID_DEPARTAMENTO, descripcion: selected.DESCRIPCION || '', sueldo_base: selected.SUELDO_BASE });
        setError(''); setModal('update');
    };

    const guardar = async () => {
        try {
            if (modal === 'create') await createPuesto(form);
            else await updatePuesto(selected.ID_PUESTO, form);
            setModal(null); setSelected(null); cargar();
        } catch (err) { setError(err.response?.data?.message || 'Error al guardar'); }
    };

    const eliminar = async () => {
        if (!selected || !window.confirm(`¿Eliminar "${selected.NOMBRE_PUESTO}"?`)) return;
        try { await deletePuesto(selected.ID_PUESTO); setSelected(null); cargar(); }
        catch (err) { alert(err.response?.data?.message || 'Error al eliminar'); }
    };

    return (
        <div className="text-white">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold">Puestos</h1>
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
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">DEPARTAMENTO</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">SUELDO BASE</th>
                    </tr></thead>
                    <tbody>
                        {filtrados.map(item => (
                            <tr key={item.ID_PUESTO} onClick={() => setSelected(selected?.ID_PUESTO === item.ID_PUESTO ? null : item)} className={`border-b border-white/5 cursor-pointer transition-colors ${selected?.ID_PUESTO === item.ID_PUESTO ? 'bg-blue-600/20' : 'hover:bg-white/5'}`}>
                                <td className="px-4 py-3"><input type="checkbox" readOnly checked={selected?.ID_PUESTO === item.ID_PUESTO} className="accent-blue-500" /></td>
                                <td className="px-4 py-3 text-gray-300">{item.ID_PUESTO}</td>
                                <td className="px-4 py-3 font-medium">{item.NOMBRE_PUESTO}</td>
                                <td className="px-4 py-3 text-gray-400">{item.NOMBRE_DEPARTAMENTO}</td>
                                <td className="px-4 py-3 text-gray-400">Q {Number(item.SUELDO_BASE).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                        {filtrados.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Sin resultados</td></tr>}
                    </tbody>
                </table>
            </div>

            {(modal === 'create' || modal === 'update') && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-[#121621] rounded-xl border border-white/5 p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-4">{modal === 'create' ? 'Crear Puesto' : 'Actualizar Puesto'}</h2>
                        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                        <div className="flex flex-col gap-3">
                            {modal === 'create' && (
                                <div>
                                    <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">ID Puesto *</label>
                                    <input
                                        className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none w-full"
                                        placeholder="Ej: P0004 (5 caracteres alfanuméricos)"
                                        maxLength={10}
                                        value={form.id_puesto}
                                        onChange={e => setForm({ ...form, id_puesto: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            )}
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Nombre del puesto *</label>
                                <input
                                    className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none w-full"
                                    placeholder="Ej: Gerente de Ventas, Contador, Asistente"
                                    maxLength={80}
                                    value={form.nombre_puesto}
                                    onChange={e => setForm({ ...form, nombre_puesto: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Departamento *</label>
                                <select
                                    className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none w-full"
                                    value={form.id_departamento}
                                    onChange={e => setForm({ ...form, id_departamento: e.target.value })}
                                >
                                    <option value="">Selecciona departamento</option>
                                    {departamentos.map(d => <option key={d.ID_DEPARTAMENTO} value={d.ID_DEPARTAMENTO}>{d.NOMBRE_DEPARTAMENTO}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Descripción</label>
                                <input
                                    className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none w-full"
                                    placeholder="Ej: Responsable del área de ventas regionales"
                                    maxLength={200}
                                    value={form.descripcion}
                                    onChange={e => setForm({ ...form, descripcion: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Sueldo base (Q) *</label>
                                <input
                                    type="number" min="0" step="0.01"
                                    className="bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none w-full"
                                    placeholder="Ej: 5000.00"
                                    value={form.sueldo_base}
                                    onChange={e => setForm({ ...form, sueldo_base: e.target.value })}
                                    title="Sueldo mensual base en quetzales"
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

export default PuestosPage;