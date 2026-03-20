import { useEffect, useState } from 'react';
import { getEmpleados, createEmpleado, updateEmpleado, darBajaEmpleado, cambiarEstadoEmpleado, deleteEmpleado } from '../../services/empleadoService';
import { getPuestos } from '../../services/puestosService';
import { getJornadas } from '../../services/jornadasService';
import { getMotivosBaja } from '../../services/motivoBajaService';
import EstadoBadge from '../../components/EstadoBadge';

const formatFecha = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const EmpleadoPage = () => {
    const [datos, setDatos] = useState([]);
    const [puestos, setPuestos] = useState([]);
    const [jornadas, setJornadas] = useState([]);
    const [motivos, setMotivos] = useState([]);
    const [buscar, setBuscar] = useState('');
    const [selected, setSelected] = useState(null);
    const [modal, setModal] = useState(null);
    const [error, setError] = useState('');

    const formInicial = { nombre: '', fecha_nacimiento: '', genero: 'M', nacionalidad: 'Guatemalteca', no_afiliacion_igss: '', no_dpi_permiso: '', fecha_inicio: '', id_puesto: '', id_jornada: '', correo: '', telefono: '', cuenta_bancaria: '', estado: 'ACTIVO', porcentaje_pago_comision: 0 };
    const [form, setForm] = useState(formInicial);
    const [formBaja, setFormBaja] = useState({ id_motivo_baja: '', fecha_fin: '' });

    const cargar = async () => {
        const [resEmp, resPuestos, resJornadas, resMotivos] = await Promise.all([
            getEmpleados(), getPuestos(), getJornadas(), getMotivosBaja()
        ]);
        setDatos(resEmp.data.data);
        setPuestos(resPuestos.data.data);
        setJornadas(resJornadas.data.data);
        setMotivos(resMotivos.data.data);
    };
    useEffect(() => { cargar(); }, []);

    const filtrados = datos.filter(d =>
        d.NOMBRE.toLowerCase().includes(buscar.toLowerCase()) ||
        d.NO_DPI_PERMISO.toLowerCase().includes(buscar.toLowerCase())
    );

    const abrirCreate = () => { setForm(formInicial); setError(''); setModal('create'); };
    const abrirUpdate = () => {
        if (!selected) return;
        setForm({
            nombre: selected.NOMBRE, fecha_nacimiento: '', genero: selected.GENERO,
            nacionalidad: selected.NACIONALIDAD, no_afiliacion_igss: selected.NO_AFILIACION_IGSS,
            no_dpi_permiso: selected.NO_DPI_PERMISO, fecha_inicio: '',
            id_puesto: selected.ID_PUESTO, id_jornada: selected.ID_JORNADA,
            correo: selected.CORREO || '', telefono: selected.TELEFONO || '',
            cuenta_bancaria: selected.CUENTA_BANCARIA || '', estado: selected.ESTADO,
            porcentaje_pago_comision: selected.PORCENTAJE_PAGO_COMISION
        });
        setError(''); setModal('update');
    };

    const guardar = async () => {
        try {
            if (modal === 'create') await createEmpleado(form);
            else await updateEmpleado(selected.ID_EMPLEADO, form);
            setModal(null); setSelected(null); cargar();
        } catch (err) { setError(err.response?.data?.message || 'Error al guardar'); }
    };

    const darBaja = async () => {
        try {
            await darBajaEmpleado(selected.ID_EMPLEADO, formBaja);
            setModal(null); setSelected(null); cargar();
        } catch (err) { setError(err.response?.data?.message || 'Error al dar de baja'); }
    };

    const eliminar = async () => {
        if (!selected || !window.confirm(`¿Eliminar a "${selected.NOMBRE}"?`)) return;
        try { await deleteEmpleado(selected.ID_EMPLEADO); setSelected(null); cargar(); }
        catch (err) { alert(err.response?.data?.message || 'Error al eliminar'); }
    };

    const inputCls = "bg-[#131720] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none";
    const selectCls = "bg-[#131720] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none";

    const cambiarEstado = async (nuevoEstado) => {
        try {
            await cambiarEstadoEmpleado(selected.ID_EMPLEADO, { estado: nuevoEstado });
            setModal(null); setSelected(null); cargar();
        } catch (err) { setError(err.response?.data?.message || 'Error'); }
    };

    return (
        <div className="text-white">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold">Empleados</h1>
                <div className="flex items-center gap-2 bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-48" placeholder="Buscar..." value={buscar} onChange={e => setBuscar(e.target.value)} />
                </div>
            </div>
            <div className="flex gap-2 mb-4">
                <button onClick={abrirCreate} className="px-4 py-2 bg-[#1a1f2e] border border-white/10 rounded-lg text-sm hover:bg-white/10 transition">+ Create</button>
                <button onClick={abrirUpdate} disabled={!selected} className="px-4 py-2 bg-[#1a1f2e] border border-white/10 rounded-lg text-sm hover:bg-white/10 transition disabled:opacity-40">Update</button>
                <button onClick={() => { if (selected) { setFormBaja({ id_motivo_baja: '', fecha_fin: '' }); setError(''); setModal('baja'); } }} disabled={!selected} className="px-4 py-2 bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 rounded-lg text-sm hover:bg-yellow-600/30 transition disabled:opacity-40">Dar Baja</button>
                <button onClick={() => { if (selected) { setError(''); setModal('estado'); } }} disabled={!selected} className="px-4 py-2 bg-[#1a1f2e] border border-white/10 rounded-lg text-sm hover:bg-white/10 transition disabled:opacity-40">Estado</button>
                <button onClick={eliminar} disabled={!selected} className="px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition disabled:opacity-40">Delete</button>
            </div>
            <div className="bg-[#1a1f2e] rounded-xl border border-white/10 overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/10">
                        <th className="w-10 px-4 py-3"></th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">ID</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">NOMBRE</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">DPI</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">PUESTO</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">JORNADA</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">INICIO</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">ESTADO</th>
                    </tr></thead>
                    <tbody>
                        {filtrados.map(item => (
                            <tr key={item.ID_EMPLEADO} onClick={() => setSelected(selected?.ID_EMPLEADO === item.ID_EMPLEADO ? null : item)} className={`border-b border-white/5 cursor-pointer transition-colors ${selected?.ID_EMPLEADO === item.ID_EMPLEADO ? 'bg-blue-600/20' : 'hover:bg-white/5'}`}>
                                <td className="px-4 py-3"><input type="checkbox" readOnly checked={selected?.ID_EMPLEADO === item.ID_EMPLEADO} className="accent-blue-500" /></td>
                                <td className="px-4 py-3 text-gray-300">{item.ID_EMPLEADO}</td>
                                <td className="px-4 py-3 font-medium whitespace-nowrap">{item.NOMBRE}</td>
                                <td className="px-4 py-3 text-gray-400">{item.NO_DPI_PERMISO}</td>
                                <td className="px-4 py-3 text-gray-400">{item.NOMBRE_PUESTO}</td>
                                <td className="px-4 py-3 text-gray-400">{item.NOMBRE_JORNADA}</td>
                                <td className="px-4 py-3 text-gray-400">{formatFecha(item.FECHA_INICIO)}</td>
                                <td className="px-4 py-3"><EstadoBadge estado={item.ESTADO} /></td>
                            </tr>
                        ))}
                        {filtrados.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Sin resultados</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Modal Create / Update */}
            {(modal === 'create' || modal === 'update') && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto py-8">
                    <div className="bg-[#1a1f2e] rounded-xl border border-white/10 p-6 w-full max-w-lg">
                        <h2 className="text-lg font-semibold mb-4">{modal === 'create' ? 'Crear Empleado' : 'Actualizar Empleado'}</h2>
                        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                        <div className="flex flex-col gap-3">
                            <input className={inputCls} placeholder="Nombre completo" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-400 mb-1 block">Fecha nacimiento</label>
                                    <input type="date" className={inputCls + ' w-full'} value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-400 mb-1 block">Fecha inicio</label>
                                    <input type="date" className={inputCls + ' w-full'} value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <select className={selectCls + ' flex-1'} value={form.genero} onChange={e => setForm({ ...form, genero: e.target.value })}>
                                    <option value="M">Masculino</option>
                                    <option value="F">Femenino</option>
                                    <option value="O">Otro</option>
                                </select>
                                <input className={inputCls + ' flex-1'} placeholder="Nacionalidad" value={form.nacionalidad} onChange={e => setForm({ ...form, nacionalidad: e.target.value })} />
                            </div>
                            <div className="flex gap-2">
                                <input className={inputCls + ' flex-1'} placeholder="No. IGSS" value={form.no_afiliacion_igss} onChange={e => setForm({ ...form, no_afiliacion_igss: e.target.value })} />
                                <input className={inputCls + ' flex-1'} placeholder="No. DPI" value={form.no_dpi_permiso} onChange={e => setForm({ ...form, no_dpi_permiso: e.target.value })} />
                            </div>
                            <select className={selectCls} value={form.id_puesto} onChange={e => setForm({ ...form, id_puesto: e.target.value })}>
                                <option value="">Selecciona puesto</option>
                                {puestos.map(p => <option key={p.ID_PUESTO} value={p.ID_PUESTO}>{p.NOMBRE_PUESTO}</option>)}
                            </select>
                            <select className={selectCls} value={form.id_jornada} onChange={e => setForm({ ...form, id_jornada: e.target.value })}>
                                <option value="">Selecciona jornada</option>
                                {jornadas.map(j => <option key={j.ID_JORNADA} value={j.ID_JORNADA}>{j.NOMBRE_JORNADA}</option>)}
                            </select>
                            <input className={inputCls} placeholder="Correo (opcional)" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} />
                            <input className={inputCls} placeholder="Teléfono (opcional)" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
                            <input className={inputCls} placeholder="Cuenta bancaria (opcional)" value={form.cuenta_bancaria} onChange={e => setForm({ ...form, cuenta_bancaria: e.target.value })} />
                            <input type="number" className={inputCls} placeholder="% Comisión (0)" value={form.porcentaje_pago_comision} onChange={e => setForm({ ...form, porcentaje_pago_comision: e.target.value })} />
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">Cancelar</button>
                            <button onClick={guardar} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Dar Baja */}
            {modal === 'baja' && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-[#1a1f2e] rounded-xl border border-white/10 p-6 w-full max-w-sm">
                        <h2 className="text-lg font-semibold mb-2">Dar de Baja</h2>
                        <p className="text-gray-400 text-sm mb-4">Empleado: <span className="text-white font-medium">{selected?.NOMBRE}</span></p>
                        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                        <div className="flex flex-col gap-3">
                            <select className={selectCls} value={formBaja.id_motivo_baja} onChange={e => setFormBaja({ ...formBaja, id_motivo_baja: e.target.value })}>
                                <option value="">Selecciona motivo</option>
                                {motivos.map(m => <option key={m.ID_MOTIVO_BAJA} value={m.ID_MOTIVO_BAJA}>{m.DESCRIPCION}</option>)}
                            </select>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Fecha de baja</label>
                                <input type="date" className={inputCls + ' w-full'} value={formBaja.fecha_fin} onChange={e => setFormBaja({ ...formBaja, fecha_fin: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">Cancelar</button>
                            <button onClick={darBaja} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition">Confirmar Baja</button>
                        </div>
                    </div>
                </div>
            )}

            {modal === 'estado' && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-[#1a1f2e] rounded-xl border border-white/10 p-6 w-full max-w-sm">
                        <h2 className="text-lg font-semibold mb-2">Cambiar Estado</h2>
                        <p className="text-gray-400 text-sm mb-4">Empleado: <span className="text-white font-medium">{selected?.NOMBRE}</span></p>
                        <div className="flex flex-col gap-2">
                            {['ACTIVO', 'INACTIVO', 'SUSPENDIDO'].map(e => (
                                <button key={e} onClick={() => cambiarEstado(e)} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${selected?.ESTADO === e ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}>
                                    {e}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end mt-4">
                            <button onClick={() => setModal(null)} className="text-sm text-gray-400 hover:text-white transition">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmpleadoPage;