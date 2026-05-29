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

const Toast = ({ mensaje, tipo, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-10 right-10 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-10 duration-500 ${
      tipo === 'error' ? 'bg-red-950/60 border-red-500/50 text-red-100' : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-100'
    } backdrop-blur-2xl`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${tipo === 'error' ? 'border-red-500/30' : 'border-emerald-500/30'}`}>
        {tipo === 'error' ? '✕' : '✔'}
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{tipo === 'error' ? 'Sistema / Error' : 'Operación Exitosa'}</span>
        <span className="text-[13px] font-bold">{mensaje}</span>
      </div>
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

    const showToast = (mensaje, tipo = 'exito') => setToast({ mensaje, tipo });

    useEffect(() => {
        getEmpleados().then(r => setEmpleados(r.data.data || [])).catch(() => showToast('Error al cargar la base de colaboradores', 'error'));
        getDeducciones().then(r => setDedCatalogo(r.data.data || [])).catch(() => {});
        getPercepciones().then(r => setPerCatalogo(r.data.data || [])).catch(() => {});
    }, []);

    const cargarAsignaciones = async (id) => {
        if (!id) { setDeducciones([]); setPercepciones([]); return; }
        try {
            const [rD, rP] = await Promise.all([getDeduccionesEmpleado(id), getPercepcionesEmpleado(id)]);
            setDeducciones(rD.data.data || []);
            setPercepciones(rP.data.data || []);
        } catch { showToast('Fallo al sincronizar asignaciones del perfil', 'error'); }
    };

    const handleSelectEmpleado = (id) => { setIdEmpleado(id); cargarAsignaciones(id); };

    const handleCrearDed = async () => {
        if (!formDed.id_deduccion || !formDed.monto) return showToast('Complete los parámetros del concepto', 'error');
        setGuardando(true);
        try {
            await createDeduccionEmpleado({ id_empleado: idEmpleado, id_deduccion: formDed.id_deduccion, monto: formDed.monto });
            showToast('Deducción asignada formalmente');
            setModalDed(false);
            setFormDed({ id_deduccion: '', monto: '' });
            cargarAsignaciones(idEmpleado);
        } catch (err) { showToast('Error al procesar la vinculación', 'error'); }
        finally { setGuardando(false); }
    };

    const handleCrearPer = async () => {
        if (!formPer.id_percepcion || !formPer.monto) return showToast('Complete los parámetros del concepto', 'error');
        setGuardando(true);
        try {
            await createPercepcionEmpleado({ id_empleado: idEmpleado, id_percepcion: formPer.id_percepcion, monto: formPer.monto });
            showToast('Percepción asignada formalmente');
            setModalPer(false);
            setFormPer({ id_percepcion: '', monto: '' });
            cargarAsignaciones(idEmpleado);
        } catch (err) { showToast('Error al procesar la vinculación', 'error'); }
        finally { setGuardando(false); }
    };

    const handleToggleDed = async (id, monto, activo) => {
        try { await updateDeduccionEmpleado(id, { monto, activo: activo === 'S' ? 'N' : 'S' }); cargarAsignaciones(idEmpleado); }
        catch { showToast('Fallo al actualizar estado del concepto', 'error'); }
    };

    const handleTogglePer = async (id, monto, activo) => {
        try { await updatePercepcionEmpleado(id, { monto, activo: activo === 'S' ? 'N' : 'S' }); cargarAsignaciones(idEmpleado); }
        catch { showToast('Fallo al actualizar estado del concepto', 'error'); }
    };

    const handleDeleteDed = async (id) => {
        if (!window.confirm('¿Confirmar la eliminación permanente de este concepto?')) return;
        try { await deleteDeduccionEmpleado(id); showToast('Registro desvinculado con éxito'); cargarAsignaciones(idEmpleado); }
        catch { showToast('Error al eliminar la asignación', 'error'); }
    };

    const handleDeletePer = async (id) => {
        if (!window.confirm('¿Confirmar la eliminación permanente de este concepto?')) return;
        try { await deletePercepcionEmpleado(id); showToast('Registro desvinculado con éxito'); cargarAsignaciones(idEmpleado); }
        catch { showToast('Error al eliminar la asignación', 'error'); }
    };

    const empSeleccionado = empleados.find(e => String(e.ID_EMPLEADO) === String(idEmpleado));
    const totalDed = deducciones.filter(d => d.ACTIVO === 'S').reduce((s, d) => s + parseFloat(d.MONTO), 0);
    const totalPer = percepciones.filter(p => p.ACTIVO === 'S').reduce((s, p) => s + parseFloat(p.MONTO), 0);
    const totalNeto = totalPer - totalDed;

    const labelCls = "text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block opacity-60";
    const inputCls = "bg-[#0b0b0b] border border-white/5 rounded-xl px-4 py-3 text-[12px] text-white outline-none focus:border-[#C5A028]/30 transition-all w-full shadow-inner";

    return (
        <div className="max-w-[1550px] mx-auto py-8 px-10 animate-in fade-in duration-1000">
            {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}

            {/* Header Maestro Balanceado */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12 mb-16">
                <div className="flex-1">
                    <p className="text-[#C5A028] text-[10px] font-black uppercase tracking-[0.5em] mb-4 opacity-70">Dirección Administrativa</p>
                    <h1 className="font-serif-title text-6xl text-white tracking-tight leading-none">Asignaciones Fijas</h1>
                    <p className="text-gray-500 text-[13px] mt-6 font-medium max-w-xl leading-relaxed opacity-80">
                        Configure beneficios adicionales y retenciones pactadas recurrentes.
                        Mantenga la integridad financiera por perfil de colaborador.
                    </p>
                </div>

                <div className="flex flex-col gap-2 w-full lg:w-[420px] bg-[#111112] border border-white/5 p-4 rounded-[28px] shadow-2xl">
                    <label className="text-[9px] font-black text-[#C5A028] uppercase tracking-[0.3em] ml-4 mb-2">Búsqueda de Perfil Operativo</label>
                    <div className="relative">
                         <select
                            className="w-full bg-[#0b0b0b] border border-white/10 rounded-2xl py-4 pl-6 pr-10 text-[13px] text-white font-bold outline-none cursor-pointer hover:border-[#C5A028]/30 transition-all appearance-none"
                            value={idEmpleado}
                            onChange={e => handleSelectEmpleado(e.target.value)}
                        >
                            <option value="">Seleccionar colaborador del sistema...</option>
                            {empleados.map(emp => <option key={emp.ID_EMPLEADO} value={emp.ID_EMPLEADO}>{emp.NOMBRE}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-5 flex items-center text-[#C5A028] pointer-events-none text-[10px]">▼</div>
                    </div>
                </div>
            </div>

            {idEmpleado ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Nueva Estructura de Widget de Perfil */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                        <div className="lg:col-span-8 luxury-card p-12 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
                            <div className="w-28 h-28 rounded-[32px] bg-gradient-to-tr from-[#0b0b0b] to-[#1a1a1c] border border-white/5 flex items-center justify-center text-[#C5A028] text-4xl font-serif-title font-black shadow-inner shrink-0">
                                {empSeleccionado?.NOMBRE?.slice(0, 1)}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="font-serif-title text-5xl text-white tracking-tight leading-none">{empSeleccionado?.NOMBRE}</h2>
                                <p className="text-[#C5A028] text-[12px] font-black uppercase tracking-[0.4em] mt-4">{empSeleccionado?.NOMBRE_PUESTO}</p>
                                <div className="flex items-center justify-center md:justify-start gap-8 mt-8 border-t border-white/5 pt-8">
                                    <div className="text-center">
                                        <p className="text-white font-black text-2xl tracking-tighter">{percepciones.length}</p>
                                        <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mt-2 opacity-60">Percepciones</p>
                                    </div>
                                    <div className="w-[1px] h-10 bg-white/10"></div>
                                    <div className="text-center">
                                        <p className="text-white font-black text-2xl tracking-tighter">{deducciones.length}</p>
                                        <p className="text-[9px] text-red-500 font-black uppercase tracking-widest mt-2 opacity-60">Deducciones</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Widget Balance Reforzado */}
                        <div className="lg:col-span-4 luxury-card p-12 border-t-2 border-t-[#C5A028]/30 flex flex-col justify-center text-center shadow-2xl">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.5em] mb-4">Ajuste Neto Mensual</p>
                            <p className={`font-serif-title text-5xl tracking-tighter ${totalNeto < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                {totalNeto < 0 ? '- ' : '+ '}{formatQ(Math.abs(totalNeto))}
                            </p>
                            <div className="flex justify-between mt-10 pt-6 border-t border-white/5 px-4 text-[10px] font-black uppercase tracking-widest opacity-40">
                                <span>Ingresos: {formatQ(totalPer)}</span>
                                <span className="w-1 h-1 rounded-full bg-white/20 mt-1.5"></span>
                                <span>Egresos: {formatQ(totalDed)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Listados Maestros con Mejor Distribución */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                        {/* Percepciones */}
                        <div className="luxury-card overflow-hidden">
                            <div className="p-10 border-b border-white/[0.04] bg-white/[0.01] flex justify-between items-center">
                                <div>
                                    <h3 className="text-emerald-500 text-[11px] font-black uppercase tracking-[0.4em]">Ingresos Fijos</h3>
                                    <p className="text-gray-600 text-[9px] font-bold mt-1 uppercase tracking-widest">Beneficios Adicionales</p>
                                </div>
                                <button onClick={() => setModalPer(true)} className="gold-button !bg-emerald-600/10 !text-emerald-500 border border-emerald-500/20 text-[10px] hover:!bg-emerald-600 hover:!text-white transition-all shadow-xl">
                                    + Vincular
                                </button>
                            </div>
                            <div className="p-10 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-gray-600 text-[9px] font-black uppercase tracking-[0.3em] border-b border-white/10">
                                            <th className="pb-5">Concepto</th>
                                            <th className="pb-5 text-right">Monto</th>
                                            <th className="pb-5 text-center">Estatus</th>
                                            <th className="pb-5 text-right">Gestión</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                        {percepciones.map(p => (
                                            <tr key={p.ID_EMP_PERCEPCION} className="group hover:bg-white/[0.015] transition-all">
                                                <td className="py-6 font-bold text-white text-[13px]">{p.NOMBRE_PERCEPCION}</td>
                                                <td className="py-6 text-right font-black text-emerald-500 text-[13px]">{formatQ(p.MONTO)}</td>
                                                <td className="py-6 text-center">
                                                    <button onClick={() => handleTogglePer(p.ID_EMP_PERCEPCION, p.MONTO, p.ACTIVO)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border transition-all ${p.ACTIVO === 'S' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20 opacity-30'}`}>
                                                        {p.ACTIVO === 'S' ? 'Activo' : 'Inactivo'}
                                                    </button>
                                                </td>
                                                <td className="py-6 text-right">
                                                    <button onClick={() => handleDeletePer(p.ID_EMP_PERCEPCION)} className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-600/20 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all mx-auto mr-0">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h14" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {percepciones.length === 0 && <tr><td colSpan={4} className="py-16 text-center opacity-20 italic text-[11px] tracking-[0.3em] uppercase">No hay percepciones asignadas</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Deducciones */}
                        <div className="luxury-card overflow-hidden">
                            <div className="p-10 border-b border-white/[0.04] bg-white/[0.01] flex justify-between items-center">
                                <div>
                                    <h3 className="text-red-500 text-[11px] font-black uppercase tracking-[0.4em]">Descuentos Fijos</h3>
                                    <p className="text-gray-600 text-[9px] font-bold mt-1 uppercase tracking-widest">Retenciones Mensuales</p>
                                </div>
                                <button onClick={() => setModalDed(true)} className="gold-button !bg-red-600/10 !text-red-500 border border-red-500/20 text-[10px] hover:!bg-red-600 hover:!text-white transition-all shadow-xl">
                                    + Vincular
                                </button>
                            </div>
                            <div className="p-10 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-gray-600 text-[9px] font-black uppercase tracking-[0.3em] border-b border-white/10">
                                            <th className="pb-5">Concepto</th>
                                            <th className="pb-5 text-right">Monto</th>
                                            <th className="pb-5 text-center">Estatus</th>
                                            <th className="pb-5 text-right">Gestión</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                        {deducciones.map(d => (
                                            <tr key={d.ID_EMP_DEDUCCION} className="group hover:bg-white/[0.015] transition-all">
                                                <td className="py-6 font-bold text-white text-[13px]">{d.NOMBRE_DEDUCCION}</td>
                                                <td className="py-6 text-right font-black text-red-500 text-[13px]">{formatQ(d.MONTO)}</td>
                                                <td className="py-6 text-center">
                                                    <button onClick={() => handleToggleDed(d.ID_EMP_DEDUCCION, d.MONTO, d.ACTIVO)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border transition-all ${d.ACTIVO === 'S' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20 opacity-30'}`}>
                                                        {d.ACTIVO === 'S' ? 'Activo' : 'Inactivo'}
                                                    </button>
                                                </td>
                                                <td className="py-6 text-right">
                                                    <button onClick={() => handleDeleteDed(d.ID_EMP_DEDUCCION)} className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-600/20 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all mx-auto mr-0">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h14" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {deducciones.length === 0 && <tr><td colSpan={4} className="py-16 text-center opacity-20 italic text-[11px] tracking-[0.3em] uppercase">No hay deducciones asignadas</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            ) : (
                <div className="h-[500px] flex flex-col items-center justify-center luxury-card border-dashed border-white/10 opacity-30 text-center space-y-8 animate-pulse">
                    <div className="w-24 h-24 rounded-full border-2 border-white/5 flex items-center justify-center">
                        <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif-title text-white tracking-widest opacity-80 uppercase">Perfil no identificado</h2>
                        <p className="text-[12px] text-gray-500 font-black uppercase tracking-[0.4em] mt-4">Por favor seleccione un colaborador para auditar sus asignaciones</p>
                    </div>
                </div>
            )}

            {/* Modals Luxury Style */}
            {(modalDed || modalPer) && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="luxury-card w-full max-w-md shadow-[0_0_80px_rgba(0,0,0,0.8)] border-[#C5A028]/20 animate-in zoom-in-95 duration-500 overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                            <h2 className="text-white text-xs font-black uppercase tracking-[0.4em]">{modalDed ? 'Vincular Deducción' : 'Vincular Percepción'}</h2>
                            <button onClick={() => { setModalDed(false); setModalPer(false); }} className="text-gray-500 hover:text-white transition-all hover:rotate-90">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-12 space-y-8">
                            <div className="bg-[#0b0b0b] p-6 rounded-2xl border border-white/[0.03]">
                                <p className={labelCls}>Colaborador afectado</p>
                                <p className="text-white font-bold text-[14px] tracking-tight">{empSeleccionado?.NOMBRE}</p>
                            </div>
                            <div>
                                <label className={labelCls}>Catálogo de Conceptos</label>
                                <select className="w-full bg-[#0b0b0b] border border-white/10 rounded-2xl py-4 px-6 text-[13px] text-white font-bold outline-none cursor-pointer focus:border-[#C5A028]/30 transition-all"
                                    value={modalDed ? formDed.id_deduccion : formPer.id_percepcion}
                                    onChange={e => modalDed ? setFormDed(f => ({ ...f, id_deduccion: e.target.value })) : setFormPer(f => ({ ...f, id_percepcion: e.target.value }))}>
                                    <option value="">Seleccionar del catálogo...</option>
                                    {modalDed ? (
                                        dedCatalogo
                                            .filter(d => {
                                                const nom = d.NOMBRE_DEDUCCION.toUpperCase();
                                                const excluidos = ['IGSS', 'ISR', 'SEGURO', 'INASISTENCIA', 'SÉPTIMO', 'SEPTIMO', 'PRÉSTAMO', 'PRESTAMO'];
                                                return !excluidos.some(p => nom.includes(p));
                                            })
                                            .map(d => <option key={d.ID_DEDUCCION} value={d.ID_DEDUCCION}>{d.NOMBRE_DEDUCCION}</option>)
                                    ) : (
                                        perCatalogo.map(p => <option key={p.ID_PERCEPCION} value={p.ID_PERCEPCION}>{p.NOMBRE_PERCEPCION}</option>)
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Monto Mensual Pactado</label>
                                <div className="relative group">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#C5A028] font-black text-sm tracking-widest">Q</span>
                                    <input type="number" step="0.01" className="w-full bg-[#0b0b0b] border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-[13px] text-white font-bold outline-none focus:border-[#C5A028]/30 transition-all" placeholder="0.00"
                                        value={modalDed ? formDed.monto : formPer.monto}
                                        onChange={e => modalDed ? setFormDed(f => ({ ...f, monto: e.target.value })) : setFormPer(f => ({ ...f, monto: e.target.value }))} />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button onClick={() => { setModalDed(false); setModalPer(false); }} className="flex-1 dark-button py-4 text-[10px] uppercase tracking-widest">Descartar</button>
                                <button onClick={modalDed ? handleCrearDed : handleCrearPer} disabled={guardando} className="flex-1 gold-button py-4 text-[10px] uppercase tracking-widest shadow-2xl shadow-[#C5A028]/10 disabled:opacity-50 font-black">
                                    {guardando ? 'Sincronizando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AsignacionesPage;
