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
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in fade-in slide-in-from-bottom-4
            ${tipo === 'ok' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
            {msg}
        </div>
    );
};

const Modal = ({ titulo, children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity">
        <div className="bg-[#121621] border border-white/5 rounded-[28px] shadow-2xl p-8 w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-white text-xl font-extrabold tracking-tight">{titulo}</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-4xl leading-none">&times;</button>
            </div>
            {children}
        </div>
    </div>
);

const inputCls  = 'bg-[#0b0e14] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none w-full focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-700';
const selectCls = 'bg-[#0b0e14] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none w-full focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer appearance-none';

const IconBox = ({ type, name }) => {
    const isDed = type === 'ded';
    const bgColor = isDed ? 'bg-rose-500/10' : 'bg-emerald-500/10';
    const textColor = isDed ? 'text-rose-500' : 'text-emerald-500';

    return (
        <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center font-bold text-sm ${textColor}`}>
            {name.substring(0, 2).toUpperCase()}
        </div>
    );
};

const TablaAsignaciones = ({ filas, idKey, nombreKey, onToggle, onDelete, type }) => {
    const isDed = type === 'ded';
    const accentColor = isDed ? 'text-rose-400' : 'text-emerald-400';

    if (!filas.length)
        return (
            <div className="flex flex-col items-center justify-center py-16 border border-white/5 bg-white/[0.01] rounded-[24px]">
                <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em]">Sin registros activos</p>
            </div>
        );

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
                <thead>
                    <tr className="text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                        <th className="pb-5 pl-2">Concepto</th>
                        <th className="pb-5">Descripción</th>
                        <th className="pb-5 text-right">Monto</th>
                        <th className="pb-5 text-center">Estado</th>
                        <th className="pb-5 text-right pr-2">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {filas.map(fila => {
                        const id  = fila[idKey];
                        const nom = fila[nombreKey];
                        const mnt = fila['MONTO'];
                        const act = fila['ACTIVO'];

                        return (
                            <tr key={id} className="group hover:bg-white/[0.01] transition-colors">
                                <td className="py-6 pl-2">
                                    <div className="flex items-center gap-4">
                                        <IconBox type={type} name={nom} />
                                        <span className="font-extrabold text-white/90 text-sm tracking-tight">{nom}</span>
                                    </div>
                                </td>
                                <td className="py-6">
                                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Asignación Fija</span>
                                </td>
                                <td className={`py-6 text-right font-mono font-black text-base ${accentColor}`}>
                                    {formatQ(mnt)}
                                </td>
                                <td className="py-6 text-center">
                                    <button
                                        onClick={() => onToggle(id, mnt, act)}
                                        className={`text-[9px] px-3 py-1.5 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 mx-auto transition-all ${
                                            act === 'S'
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                                        }`}
                                    >
                                        <div className={`w-1 h-1 rounded-full ${act === 'S' ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                                        {act === 'S' ? 'Activo' : 'Inactivo'}
                                    </button>
                                </td>
                                <td className="py-6 text-right pr-2">
                                    <button
                                        onClick={() => onDelete(id)}
                                        className="w-9 h-9 rounded-xl hover:bg-rose-500/10 text-gray-600 hover:text-rose-500 transition-all flex items-center justify-center font-bold text-xs"
                                        title="Eliminar"
                                    >
                                        DEL
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
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
        if (!formDed.id_deduccion || !formDed.monto) return showToast('Completa los campos', 'err');
        setGuardando(true);
        try {
            await createDeduccionEmpleado({ id_empleado: idEmpleado, id_deduccion: formDed.id_deduccion, monto: formDed.monto });
            showToast('Asignación exitosa');
            setModalDed(false);
            setFormDed({ id_deduccion: '', monto: '' });
            cargarAsignaciones(idEmpleado);
        } catch (err) { showToast('Error al procesar', 'err'); }
        finally { setGuardando(false); }
    };

    const handleCrearPer = async () => {
        if (!formPer.id_percepcion || !formPer.monto) return showToast('Completa los campos', 'err');
        setGuardando(true);
        try {
            await createPercepcionEmpleado({ id_empleado: idEmpleado, id_percepcion: formPer.id_percepcion, monto: formPer.monto });
            showToast('Asignación exitosa');
            setModalPer(false);
            setFormPer({ id_percepcion: '', monto: '' });
            cargarAsignaciones(idEmpleado);
        } catch (err) { showToast('Error al procesar', 'err'); }
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
        if (!window.confirm('¿Confirmar eliminación?')) return;
        try { await deleteDeduccionEmpleado(id); showToast('Registro eliminado'); cargarAsignaciones(idEmpleado); }
        catch { showToast('Error al eliminar', 'err'); }
    };

    const handleDeletePer = async (id) => {
        if (!window.confirm('¿Confirmar eliminación?')) return;
        try { await deletePercepcionEmpleado(id); showToast('Registro eliminado'); cargarAsignaciones(idEmpleado); }
        catch { showToast('Error al eliminar', 'err'); }
    };

    const empSeleccionado = empleados.find(e => String(e.ID_EMPLEADO) === String(idEmpleado));
    const totalDed = deducciones.filter(d => d.ACTIVO === 'S').reduce((s, d) => s + parseFloat(d.MONTO), 0);
    const totalPer = percepciones.filter(p => p.ACTIVO === 'S').reduce((s, p) => s + parseFloat(p.MONTO), 0);
    const totalNeto = totalPer - totalDed;

    return (
        <div className="bg-[#0b0e14] min-h-screen text-white font-sans overflow-x-hidden">
            {toast && <Toast msg={toast.msg} tipo={toast.tipo} onClose={() => setToast(null)} />}

            <div className="max-w-[1300px] mx-auto p-6 md:p-8">
                {/* Header Section */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
                    <div className="flex items-center gap-5">
                        <div className="w-11 h-11 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center font-bold text-blue-500">AS</div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-white/95">Asignaciones</h1>
                            <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.15em] mt-1">Configuración de Beneficios y Descuentos Fijos</p>
                        </div>
                    </div>

                    <div className="w-full lg:w-[400px] relative">
                        <div className="absolute inset-y-0 left-5 flex items-center text-gray-600 pointer-events-none text-xs font-bold">USUARIO</div>
                        <select
                            className={selectCls + ' !pl-20 !pr-10 !bg-[#121621] shadow-2xl border-white/5'}
                            value={idEmpleado}
                            onChange={e => handleSelectEmpleado(e.target.value)}
                        >
                            <option value="">Seleccionar colaborador...</option>
                            {empleados.map(emp => <option key={emp.ID_EMPLEADO} value={emp.ID_EMPLEADO}>{emp.NOMBRE}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-5 flex items-center text-gray-700 pointer-events-none text-[8px]">▼</div>
                    </div>
                </header>

                {idEmpleado ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Summary Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
                            {/* Profile Widget */}
                            <div className="lg:col-span-8 bg-[#121621] border border-white/5 rounded-[32px] p-8 flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden">
                                <div className="absolute -right-16 -top-16 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />

                                <div className="w-24 h-24 bg-blue-600 rounded-[24px] flex items-center justify-center text-3xl font-black shadow-2xl shadow-blue-600/20 text-white shrink-0">
                                    {empSeleccionado?.NOMBRE?.charAt(0)}
                                </div>

                                <div className="text-center sm:text-left flex-1">
                                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight">{empSeleccionado?.NOMBRE}</h2>
                                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                        <span className="bg-blue-500/10 text-blue-400 text-[9px] font-black px-3 py-1.5 rounded-xl border border-blue-500/20 uppercase tracking-widest">{empSeleccionado?.NOMBRE_PUESTO}</span>
                                        <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-3 py-1.5 rounded-xl border border-emerald-500/20 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                                            Activo
                                        </span>
                                    </div>
                                    <p className="mt-5 text-[9px] font-bold text-gray-600 uppercase tracking-wider">Conceptos aplicados automáticamente cada mes</p>
                                </div>

                                <div className="flex gap-4 sm:ml-auto">
                                    <div className="text-center px-4">
                                        <div className="text-xl font-black text-white">{deducciones.length}</div>
                                        <div className="text-[8px] font-black text-rose-500/50 uppercase tracking-widest mt-1 underline decoration-2 underline-offset-4 decoration-rose-500/30">Deducciones</div>
                                    </div>
                                    <div className="text-center px-4 border-l border-white/5">
                                        <div className="text-xl font-black text-white">{percepciones.length}</div>
                                        <div className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest mt-1 underline decoration-2 underline-offset-4 decoration-emerald-500/30">Percepciones</div>
                                    </div>
                                </div>
                            </div>

                            {/* Net Balance Widget */}
                            <div className="lg:col-span-4 bg-[#121621] border border-white/5 rounded-[32px] p-8 flex flex-col justify-center relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent rounded-[32px]" />
                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">Balance de Asignaciones</p>
                                <div className={`text-3xl font-black tracking-tighter ${totalNeto < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {totalNeto < 0 ? '- ' : '+ '}{formatQ(Math.abs(totalNeto))}
                                </div>
                                <div className="flex justify-between mt-4 pt-4 border-t border-white/5">
                                    <span className="text-[8px] font-bold text-emerald-500/40 uppercase">Ingresos {formatQ(totalPer)}</span>
                                    <span className="text-[8px] font-bold text-rose-500/40 uppercase">Descuentos {formatQ(totalDed)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Totals Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <div className="bg-[#121621] border border-white/5 rounded-3xl p-6 flex items-center gap-5">
                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center font-bold text-rose-500 text-xs">DE</div>
                                <div>
                                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Deducciones</p>
                                    <p className="text-xl font-black text-rose-400 font-mono tracking-tighter">{formatQ(totalDed)}</p>
                                </div>
                            </div>
                            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center">
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Liquido Neto</p>
                                <p className={`text-2xl font-black tracking-tighter mt-1 ${totalNeto < 0 ? 'text-white' : 'text-emerald-400'}`}>
                                    {totalNeto < 0 ? '- ' : ''}{formatQ(Math.abs(totalNeto))}
                                </p>
                            </div>
                            <div className="bg-[#121621] border border-white/5 rounded-3xl p-6 flex items-center gap-5">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-500 text-xs">PE</div>
                                <div>
                                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Percepciones</p>
                                    <p className="text-xl font-black text-emerald-400 font-mono tracking-tighter">{formatQ(totalPer)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tables Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Deductions Card */}
                            <div className="bg-[#121621] border border-white/5 rounded-[36px] p-8 shadow-2xl overflow-hidden flex flex-col">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-[10px] font-black text-rose-500/70 uppercase tracking-[0.3em] pl-2">Deducciones Fijas</h3>
                                    <button
                                        onClick={() => setModalDed(true)}
                                        className="bg-[#121621] border border-rose-500/20 text-rose-400 text-[9px] font-black px-5 py-2.5 rounded-xl hover:bg-rose-500 hover:text-white transition-all uppercase tracking-widest shadow-xl shadow-rose-500/5"
                                    >
                                        + Agregar
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <TablaAsignaciones filas={deducciones} idKey="ID_EMP_DEDUCCION" nombreKey="NOMBRE_DEDUCCION" onToggle={handleToggleDed} onDelete={handleDeleteDed} type="ded" />
                                </div>
                                {deducciones.length > 0 && (
                                    <div className="mt-8 p-6 bg-rose-500/[0.02] rounded-2xl border border-rose-500/10 flex justify-between items-center">
                                        <span className="text-[8px] font-black text-rose-500/30 uppercase tracking-widest">Subtotal Deducciones</span>
                                        <span className="text-2xl font-black text-rose-400 font-mono tracking-tighter">{formatQ(totalDed)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Perceptions Card */}
                            <div className="bg-[#121621] border border-white/5 rounded-[36px] p-8 shadow-2xl overflow-hidden flex flex-col">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-[10px] font-black text-emerald-500/70 uppercase tracking-[0.3em] pl-2">Percepciones Fijas</h3>
                                    <button
                                        onClick={() => setModalPer(true)}
                                        className="bg-[#121621] border border-emerald-500/20 text-emerald-400 text-[9px] font-black px-5 py-2.5 rounded-xl hover:bg-emerald-500 hover:text-white transition-all uppercase tracking-widest shadow-xl shadow-emerald-500/5"
                                    >
                                        + Agregar
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <TablaAsignaciones filas={percepciones} idKey="ID_EMP_PERCEPCION" nombreKey="NOMBRE_PERCEPCION" onToggle={handleTogglePer} onDelete={handleDeletePer} type="per" />
                                </div>
                                {percepciones.length > 0 && (
                                    <div className="mt-8 p-6 bg-emerald-500/[0.02] rounded-2xl border border-emerald-500/10 flex justify-between items-center">
                                        <span className="text-[8px] font-black text-emerald-500/30 uppercase tracking-widest">Subtotal Percepciones</span>
                                        <span className="text-2xl font-black text-emerald-400 font-mono tracking-tighter">{formatQ(totalPer)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom Hint */}
                        <div className="mt-16 flex items-center justify-center gap-2 text-gray-700">
                            <div className="w-1 h-1 bg-gray-800 rounded-full" />
                            <p className="text-[9px] font-bold uppercase tracking-widest">Cambios sincronizados con el motor de cálculo de planilla</p>
                            <div className="w-1 h-1 bg-gray-800 rounded-full" />
                        </div>
                    </div>
                ) : (
                    <div className="h-[450px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[48px] opacity-20">
                        <h2 className="text-2xl font-black uppercase tracking-[0.4em] text-white">Selección Requerida</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest mt-4">Cargar perfil de colaborador para gestionar sus cuentas</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {modalDed && (
                <Modal titulo="Agregar Deducción" onClose={() => setModalDed(false)}>
                    <div className="flex flex-col gap-6">
                        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Empleado</p>
                            <p className="text-white font-extrabold text-sm">{empSeleccionado?.NOMBRE}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3 block">Tipo de Concepto</label>
                            <select className={selectCls} value={formDed.id_deduccion} onChange={e => setFormDed(f => ({ ...f, id_deduccion: e.target.value }))}>
                                <option value="">Seleccionar...</option>
                                {dedCatalogo
                                    .filter(d => {
                                        const nom = d.NOMBRE_DEDUCCION.toUpperCase();
                                        const excluidos = ['IGSS', 'ISR', 'SEGURO', 'INASISTENCIA', 'SÉPTIMO', 'SEPTIMO', 'PRÉSTAMO', 'PRESTAMO'];
                                        return !excluidos.some(p => nom.includes(p));
                                    })
                                    .map(d => <option key={d.ID_DEDUCCION} value={d.ID_DEDUCCION}>{d.NOMBRE_DEDUCCION}</option>)
                                }
                            </select>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3 block">Monto Mensual</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 font-black text-xs">Q</span>
                                <input type="number" step="0.01" className={inputCls + ' pl-12'} placeholder="0.00" value={formDed.monto} onChange={e => setFormDed(f => ({ ...f, monto: e.target.value }))} />
                            </div>
                        </div>
                        <button
                            onClick={handleCrearDed}
                            disabled={guardando}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all uppercase tracking-widest disabled:opacity-50 text-xs mt-2"
                        >
                            {guardando ? 'Procesando...' : 'Guardar Asignación'}
                        </button>
                    </div>
                </Modal>
            )}

            {modalPer && (
                <Modal titulo="Agregar Percepción" onClose={() => setModalPer(false)}>
                    <div className="flex flex-col gap-6">
                        <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Empleado</p>
                            <p className="text-white font-extrabold text-sm">{empSeleccionado?.NOMBRE}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3 block">Tipo de Concepto</label>
                            <select className={selectCls} value={formPer.id_percepcion} onChange={e => setFormPer(f => ({ ...f, id_percepcion: e.target.value }))}>
                                <option value="">Seleccionar...</option>
                                {perCatalogo.map(p => <option key={p.ID_PERCEPCION} value={p.ID_PERCEPCION}>{p.NOMBRE_PERCEPCION}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3 block">Monto Mensual</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 font-black text-xs">Q</span>
                                <input type="number" step="0.01" className={inputCls + ' pl-12'} placeholder="0.00" value={formPer.monto} onChange={e => setFormPer(f => ({ ...f, monto: e.target.value }))} />
                            </div>
                        </div>
                        <button
                            onClick={handleCrearPer}
                            disabled={guardando}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all uppercase tracking-widest disabled:opacity-50 text-xs mt-2"
                        >
                            {guardando ? 'Procesando...' : 'Guardar Asignación'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AsignacionesPage;
