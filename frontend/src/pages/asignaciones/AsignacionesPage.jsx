import { useEffect, useState } from 'react';
import { getEmpleados } from '../../services/empleadoService';
import { getDeducciones } from '../../services/deduccionesService';
import { getPercepciones } from '../../services/percepcionesService';
import {
    getDeduccionesEmpleado, createDeduccionEmpleado, updateDeduccionEmpleado, deleteDeduccionEmpleado,
    getPercepcionesEmpleado, createPercepcionEmpleado, updatePercepcionEmpleado, deletePercepcionEmpleado
} from '../../services/empAsignacionesService';

const formatQ = (n) =>
    `Q ${parseFloat(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Toast = ({ msg, tipo, onClose }) => {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);
    return (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium
            ${tipo === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            {msg}
        </div>
    );
};

const Modal = ({ titulo, children, onClose }) => (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
        <div className="bg-[#1a1f2e] border border-white/10 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">{titulo}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
            </div>
            {children}
        </div>
    </div>
);

const inputCls  = 'bg-[#131720] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none w-full';
const selectCls = 'bg-[#131720] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none w-full';

const TablaAsignaciones = ({ filas, idKey, nombreKey, onToggle, onDelete }) => {
    if (!filas.length)
        return <p className="text-gray-500 text-sm py-4 text-center">Sin registros</p>;
    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="text-gray-400 text-xs uppercase">
                    <th className="text-left pb-2">Nombre</th>
                    <th className="text-right pb-2">Monto</th>
                    <th className="text-center pb-2">Estado</th>
                    <th className="pb-2" />
                </tr>
            </thead>
            <tbody>
                {filas.map(fila => {
                    const id  = fila[idKey];
                    const nom = fila[nombreKey];
                    const mnt = fila['MONTO'];
                    const act = fila['ACTIVO'];
                    return (
                        <tr key={id} className="border-t border-white/5">
                            <td className="py-2 text-white">{nom}</td>
                            <td className="py-2 text-right text-emerald-400">{formatQ(mnt)}</td>
                            <td className="py-2 text-center">
                                <button
                                    onClick={() => onToggle(id, mnt, act)}
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        act === 'S' ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
                                    }`}
                                >
                                    {act === 'S' ? 'Activo' : 'Inactivo'}
                                </button>
                            </td>
                            <td className="py-2 text-right">
                                <button
                                    onClick={() => onDelete(id)}
                                    className="text-red-400 hover:text-red-300 text-xs"
                                >
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

const AsignacionesPage = () => {
    const [empleados, setEmpleados]       = useState([]);
    const [dedCatalogo, setDedCatalogo]   = useState([]);
    const [perCatalogo, setPerCatalogo]   = useState([]);
    const [idEmpleado, setIdEmpleado]     = useState('');
    const [deducciones, setDeducciones]   = useState([]);
    const [percepciones, setPercepciones] = useState([]);
    const [modalDed, setModalDed]         = useState(false);
    const [modalPer, setModalPer]         = useState(false);
    const [formDed, setFormDed]           = useState({ id_deduccion: '', monto: '' });
    const [formPer, setFormPer]           = useState({ id_percepcion: '', monto: '' });
    const [guardando, setGuardando]       = useState(false);
    const [toast, setToast]               = useState(null);

    const showToast = (msg, tipo = 'ok') => setToast({ msg, tipo });

    useEffect(() => {
        getEmpleados().then(r => setEmpleados(r.data.data || [])).catch(() => showToast('Error al cargar empleados', 'err'));
        getDeducciones().then(r => setDedCatalogo(r.data.data || [])).catch(() => {});
        getPercepciones().then(r => setPerCatalogo(r.data.data || [])).catch(() => {});
    }, []);

    const cargarAsignaciones = async (id) => {
        if (!id) { setDeducciones([]); setPercepciones([]); return; }
        try {
            const [rD, rP] = await Promise.all([getDeduccionesEmpleado(id), getPercepcionesEmpleado(id)]);
            setDeducciones(rD.data.data || []);
            setPercepciones(rP.data.data || []);
        } catch { showToast('Error al cargar asignaciones', 'err'); }
    };

    const handleSelectEmpleado = (id) => { setIdEmpleado(id); cargarAsignaciones(id); };

    const handleCrearDed = async () => {
        if (!formDed.id_deduccion || !formDed.monto) return showToast('Selecciona deducción e ingresa monto', 'err');
        setGuardando(true);
        try {
            await createDeduccionEmpleado({ id_empleado: idEmpleado, id_deduccion: formDed.id_deduccion, monto: formDed.monto });
            showToast('Deducción asignada correctamente');
            setModalDed(false);
            setFormDed({ id_deduccion: '', monto: '' });
            cargarAsignaciones(idEmpleado);
        } catch (err) { showToast(err.response?.data?.message || 'Error al asignar', 'err'); }
        finally { setGuardando(false); }
    };

    const handleCrearPer = async () => {
        if (!formPer.id_percepcion || !formPer.monto) return showToast('Selecciona percepción e ingresa monto', 'err');
        setGuardando(true);
        try {
            await createPercepcionEmpleado({ id_empleado: idEmpleado, id_percepcion: formPer.id_percepcion, monto: formPer.monto });
            showToast('Percepción asignada correctamente');
            setModalPer(false);
            setFormPer({ id_percepcion: '', monto: '' });
            cargarAsignaciones(idEmpleado);
        } catch (err) { showToast(err.response?.data?.message || 'Error al asignar', 'err'); }
        finally { setGuardando(false); }
    };

    const handleToggleDed = async (id, monto, activo) => {
        try { await updateDeduccionEmpleado(id, { monto, activo: activo === 'S' ? 'N' : 'S' }); cargarAsignaciones(idEmpleado); }
        catch { showToast('Error al actualizar', 'err'); }
    };

    const handleTogglePer = async (id, monto, activo) => {
        try { await updatePercepcionEmpleado(id, { monto, activo: activo === 'S' ? 'N' : 'S' }); cargarAsignaciones(idEmpleado); }
        catch { showToast('Error al actualizar', 'err'); }
    };

    const handleDeleteDed = async (id) => {
        if (!window.confirm('¿Eliminar esta deducción?')) return;
        try { await deleteDeduccionEmpleado(id); showToast('Eliminado'); cargarAsignaciones(idEmpleado); }
        catch { showToast('Error al eliminar', 'err'); }
    };

    const handleDeletePer = async (id) => {
        if (!window.confirm('¿Eliminar esta percepción?')) return;
        try { await deletePercepcionEmpleado(id); showToast('Eliminado'); cargarAsignaciones(idEmpleado); }
        catch { showToast('Error al eliminar', 'err'); }
    };

    const empSeleccionado = empleados.find(e => String(e.ID_EMPLEADO) === String(idEmpleado));

    return (
        <div className="text-white">
            {toast && <Toast msg={toast.msg} tipo={toast.tipo} onClose={() => setToast(null)} />}

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold">Asignaciones por Empleado</h1>
                <p className="text-xs text-gray-400">Deducciones y percepciones fijas individuales</p>
            </div>

            <div className="bg-[#1a1f2e] rounded-xl border border-white/10 p-5 mb-4">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Seleccionar empleado</p>
                <select className={selectCls} value={idEmpleado} onChange={e => handleSelectEmpleado(e.target.value)}>
                    <option value="">-- Selecciona un empleado --</option>
                    {empleados.map(emp => (
                        <option key={emp.ID_EMPLEADO} value={emp.ID_EMPLEADO}>
                            {emp.NOMBRE} — {emp.NOMBRE_PUESTO}
                        </option>
                    ))}
                </select>
            </div>

            {!idEmpleado && (
                <div className="text-center py-16 text-gray-500 text-sm">
                    Selecciona un empleado para gestionar sus asignaciones
                </div>
            )}

            {idEmpleado && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Deducciones */}
                    <div className="bg-[#1a1f2e] rounded-xl border border-white/10 p-5">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Deducciones fijas</p>
                            <button onClick={() => setModalDed(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg">+ Agregar</button>
                        </div>
                        <TablaAsignaciones filas={deducciones} idKey="ID_EMP_DEDUCCION" nombreKey="NOMBRE_DEDUCCION" onToggle={handleToggleDed} onDelete={handleDeleteDed} />
                        {deducciones.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-sm">
                                <span className="text-gray-400">Total activo:</span>
                                <span className="text-red-400 font-medium">
                                    {formatQ(deducciones.filter(d => d.ACTIVO === 'S').reduce((s, d) => s + parseFloat(d.MONTO), 0))}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Percepciones */}
                    <div className="bg-[#1a1f2e] rounded-xl border border-white/10 p-5">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Percepciones fijas</p>
                            <button onClick={() => setModalPer(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg">+ Agregar</button>
                        </div>
                        <TablaAsignaciones filas={percepciones} idKey="ID_EMP_PERCEPCION" nombreKey="NOMBRE_PERCEPCION" onToggle={handleTogglePer} onDelete={handleDeletePer} />
                        {percepciones.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-sm">
                                <span className="text-gray-400">Total activo:</span>
                                <span className="text-emerald-400 font-medium">
                                    {formatQ(percepciones.filter(p => p.ACTIVO === 'S').reduce((s, p) => s + parseFloat(p.MONTO), 0))}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal deducción */}
            {modalDed && (
                <Modal titulo="Agregar deducción fija" onClose={() => setModalDed(false)}>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Empleado</label>
                            <input className={inputCls + ' opacity-60'} value={empSeleccionado?.NOMBRE || ''} readOnly />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Deducción</label>
                            <select className={selectCls} value={formDed.id_deduccion} onChange={e => setFormDed(f => ({ ...f, id_deduccion: e.target.value }))}>
                                <option value="">-- Seleccionar --</option>
                                {dedCatalogo.map(d => <option key={d.ID_DEDUCCION} value={d.ID_DEDUCCION}>{d.ID_DEDUCCION} — {d.NOMBRE_DEDUCCION}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Monto (Q)</label>
                            <input type="number" min="0" step="0.01" className={inputCls} placeholder="100.00" value={formDed.monto} onChange={e => setFormDed(f => ({ ...f, monto: e.target.value }))} />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setModalDed(false)} className="flex-1 border border-white/10 text-gray-400 hover:text-white rounded-lg py-2 text-sm">Cancelar</button>
                            <button onClick={handleCrearDed} disabled={guardando} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60">{guardando ? 'Guardando...' : 'Guardar'}</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal percepción */}
            {modalPer && (
                <Modal titulo="Agregar percepción fija" onClose={() => setModalPer(false)}>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Empleado</label>
                            <input className={inputCls + ' opacity-60'} value={empSeleccionado?.NOMBRE || ''} readOnly />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Percepción</label>
                            <select className={selectCls} value={formPer.id_percepcion} onChange={e => setFormPer(f => ({ ...f, id_percepcion: e.target.value }))}>
                                <option value="">-- Seleccionar --</option>
                                {perCatalogo.map(p => <option key={p.ID_PERCEPCION} value={p.ID_PERCEPCION}>{p.ID_PERCEPCION} — {p.NOMBRE_PERCEPCION}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Monto (Q)</label>
                            <input type="number" min="0" step="0.01" className={inputCls} placeholder="125.00" value={formPer.monto} onChange={e => setFormPer(f => ({ ...f, monto: e.target.value }))} />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setModalPer(false)} className="flex-1 border border-white/10 text-gray-400 hover:text-white rounded-lg py-2 text-sm">Cancelar</button>
                            <button onClick={handleCrearPer} disabled={guardando} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60">{guardando ? 'Guardando...' : 'Guardar'}</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AsignacionesPage;
