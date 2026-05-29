import { useEffect, useState } from 'react';
import axios from 'axios';
import { getRegistroFaltas, createRegistroFalta } from '../../services/registroFaltasService';
import { getEmpleados } from '../../services/empleadoService';
import { getFaltas } from '../../services/faltasService';
import { useAuth } from '../../context/AuthContext';

const API = 'http://localhost:4000/api';

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
        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{tipo === 'error' ? 'Alerta de Sistema' : 'Operación Exitosa'}</span>
        <span className="text-[13px] font-bold">{mensaje}</span>
      </div>
    </div>
  );
};

const ListadoFaltas = () => {

  const { user } = useAuth();
  const [faltas,     setFaltas]     = useState([]);
  const [empleados,  setEmpleados]  = useState([]);
  const [tiposFalta, setTiposFalta] = useState([]);
  const [showModal,  setShowModal]  = useState(false);
  const [guardando,  setGuardando]  = useState(false);
  const [toast,      setToast]      = useState(null);

  // Auto-asigna el usuario logueado como registrador
  useEffect(() => {
    if (user?.id) setForm(f => ({ ...f, id_usuario: user.id }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [form, setForm] = useState({
    id_empleado: '',
    id_falta: '',
    id_usuario: '',
    fecha: '',
    fecha_fin: '',
    justificacion: ''
  });

  const cargarFaltas = async () => {
    try {
      const res = await getRegistroFaltas();
      setFaltas(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resFaltas, resEmpleados, resTipos] = await Promise.all([
          getRegistroFaltas(),
          getEmpleados(),
          getFaltas(),
        ]);
        setFaltas(resFaltas.data);
        setEmpleados(resEmpleados.data.data);
        setTiposFalta(resTipos.data.data);
      } catch (error) { console.error(error); }
    };
    fetchData();
  }, []);

  const actualizarEstado = async (id, nuevoEstado) => {
    try {
      await axios.put(`${API}/registro-faltas/${id}`, { estado: nuevoEstado });
      await cargarFaltas();
      setToast({ mensaje: `La incidencia ha sido ${nuevoEstado.toLowerCase()} correctamente.`, tipo: 'exito' });
    } catch (e) {
      setToast({ mensaje: 'Error al actualizar el estado de la incidencia.', tipo: 'error' });
    }
  };

  const badgeEstado = (estado) => {
    const map = {
      APROBADO:    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      RECHAZADO:   'bg-red-500/10 text-red-500 border-red-500/20',
      PENDIENTE:   'bg-amber-500/10 text-amber-500 border-amber-500/20',
      JUSTIFICADO: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    };
    const cls = map[estado] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    return `px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${cls} whitespace-nowrap`;
  };

  const guardar = async () => {
    if (!form.id_empleado || !form.id_falta || !form.id_usuario || !form.fecha) {
      setToast({ mensaje: 'Todos los campos marcados con (*) son obligatorios.', tipo: 'error' });
      return;
    }
    setGuardando(true);
    try {
      await createRegistroFalta(form);
      setForm({ id_empleado: '', id_falta: '', id_usuario: '', fecha: '', fecha_fin: '', justificacion: '' });
      setShowModal(false);
      await cargarFaltas();
      setToast({ mensaje: 'Registro de incidencia guardado exitosamente.', tipo: 'exito' });
    } catch (error) {
      setToast({ mensaje: 'Fallo al sincronizar con la base de datos.', tipo: 'error' });
    } finally { setGuardando(false); }
  };

  const formatFecha = (valor) => {
    if (!valor) return null;
    try { return new Date(valor).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return valor; }
  };

  const labelCls = "text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block opacity-60";
  const inputCls = "bg-[#0b0b0b] border border-white/5 rounded-xl px-4 py-3 text-[12px] text-white outline-none focus:border-[#C5A028]/30 transition-all w-full shadow-inner";

  return (
    <div className="max-w-[1550px] mx-auto py-10 px-8 animate-in fade-in duration-1000">

      {/* CABECERA MAESTRA */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-16">
        <div>
            <p className="text-[#C5A028] text-[10px] font-black uppercase tracking-[0.4em] mb-3 opacity-60">Talento Humano & Auditoría</p>
            <h1 className="font-serif-title text-6xl text-white tracking-tighter leading-none">Registro de Faltas</h1>
            <p className="text-gray-600 text-[13px] mt-4 font-medium max-w-2xl leading-relaxed">
                Panel centralizado para el control de incidencias, ausencias e incapacidades.
                Cada registro es vital para la precisión del cálculo de nómina y cumplimiento legal.
            </p>
        </div>
        <div className="flex items-center gap-6 bg-[#111112] border border-white/5 px-8 py-5 rounded-[32px] shadow-2xl">
            <div className="text-right border-r border-white/5 pr-8">
                <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest opacity-60">Volumen de Incidencias</p>
                <p className="text-white font-black text-4xl tracking-tighter">{faltas.length}</p>
            </div>
            <button onClick={() => setShowModal(true)} className="gold-button text-[11px] uppercase tracking-[0.2em] py-4 px-10 shadow-2xl active:scale-95 transition-all">
                + Crear Nueva Incidencia
            </button>
        </div>
      </div>

      {/* LISTADO ORGANIZADO (LOGICA DE CLÚSTER) */}
      <div className="luxury-card overflow-hidden shadow-2xl border-white/[0.04]">
        <div className="px-10 py-8 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
          <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Historial de Ausentismo y Permisos</h2>
          <div className="flex items-center gap-3 bg-blue-500/5 px-4 py-1.5 rounded-full border border-blue-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest">Estado: Sincronizado</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.04] bg-white/[0.005]">
                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] w-[22%]">Colaborador Identificado</th>
                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] w-[18%]">Causa Técnica</th>
                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] w-[15%]">Rango Temporal</th>
                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] w-[15%]">Trazabilidad (Audit)</th>
                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] w-[12%] text-center">Estatus</th>
                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] w-[12%] text-right">Gestión de Ciclo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {faltas.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-32 text-center opacity-20 italic text-sm tracking-[0.2em]">SIN REGISTROS DETECTADOS EN LA BASE DE DATOS</td></tr>
              ) : (
                faltas.map((f, index) => (
                  <tr key={index} className="hover:bg-white/[0.015] transition-all group">
                    {/* Colaborador */}
                    <td className="px-8 py-7">
                      <p className="text-white font-bold text-[14px] tracking-tight">{f[1]}</p>
                      <p className="text-[10px] text-[#C5A028] font-black uppercase tracking-widest mt-1.5 opacity-60">{f[2]}</p>
                    </td>
                    {/* Causa */}
                    <td className="px-8 py-7">
                      <div className="inline-block px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                        <span className="text-[10px] text-gray-200 font-black uppercase tracking-[0.1em] leading-none whitespace-nowrap">{f[3]}</span>
                      </div>
                      <p className="text-[10px] text-gray-600 font-medium mt-2 italic leading-relaxed truncate max-w-[200px]" title={f[6]}>{f[6] || '— Sin justificación —'}</p>
                    </td>
                    {/* Rango Temporal */}
                    <td className="px-8 py-7 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <p className="text-white font-black text-[12px] whitespace-nowrap">{formatFecha(f[4])}</p>
                        {f.FECHA_FIN && <p className="text-gray-600 text-[10px] font-bold uppercase">Fin: {formatFecha(f.FECHA_FIN)}</p>}
                      </div>
                    </td>
                    {/* Trazabilidad */}
                    <td className="px-8 py-7">
                      <p className="text-gray-600 text-[8px] font-black uppercase tracking-widest opacity-60">Auditado por:</p>
                      <p className="text-gray-400 font-bold text-[11px] mt-1 whitespace-nowrap">{f[5]}</p>
                    </td>
                    {/* Estado */}
                    <td className="px-8 py-7 text-center">
                      <span className={badgeEstado(f[7])}>{f[7]}</span>
                    </td>
                    {/* Gestión */}
                    <td className="px-8 py-7 text-right">
                      <div className="flex justify-end gap-3 transition-all duration-300 transform">
                        {f[7] === 'PENDIENTE' ? (
                          <>
                            <button onClick={() => actualizarEstado(f[0], 'APROBADO')} className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all shadow-xl active:scale-90">Autorizar</button>
                            <button onClick={() => actualizarEstado(f[0], 'RECHAZADO')} className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all shadow-xl active:scale-90">Denegar</button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400 text-[9px] font-black uppercase tracking-widest bg-white/[0.04] px-4 py-2 rounded-lg border border-white/10 shadow-inner">
                             <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                             Procesado
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE REGISTRO — RE-ESTRUCTURADO POR LÓGICA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="luxury-card w-full max-w-4xl shadow-[0_0_80px_rgba(0,0,0,0.8)] border-[#C5A028]/20 animate-in zoom-in-95 duration-500 overflow-hidden">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div>
                <h2 className="text-white text-xs font-black uppercase tracking-[0.5em]">Apertura de Expediente de Incidencia</h2>
                <p className="text-gray-500 text-[10px] font-bold mt-2 uppercase tracking-widest">Módulo de Asistencia NóminaGT Enterprise</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:rotate-90 transition-all duration-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                {/* Cluster A: Colaborador y Motivo */}
                <div className="space-y-8">
                  <h4 className="text-[#C5A028] text-[9px] font-black uppercase tracking-[0.4em] mb-4 border-b border-[#C5A028]/10 pb-2">Identificación del Suceso</h4>
                  <div>
                    <label className={labelCls}>Colaborador Implicado <span className="text-red-500">*</span></label>
                    <select value={form.id_empleado} onChange={(e) => setForm({ ...form, id_empleado: e.target.value })} className={inputCls}>
                      <option value="">Seleccione personal del sistema...</option>
                      {empleados.map(e => <option key={e.ID_EMPLEADO} value={e.ID_EMPLEADO}>{e.NOMBRE}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Clasificación de la Falta <span className="text-red-500">*</span></label>
                    <select value={form.id_falta} onChange={(e) => setForm({ ...form, id_falta: e.target.value })} className={inputCls}>
                      <option value="">Seleccione categoría técnica...</option>
                      {tiposFalta.map(f => <option key={f.ID_FALTA} value={f.ID_FALTA}>{f.DESCRIPCION}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Justificación / Nota Técnica</label>
                    <textarea rows="2" placeholder="Describa brevemente el motivo..." value={form.justificacion} onChange={(e) => setForm({ ...form, justificacion: e.target.value })} className={inputCls + " resize-none"} />
                  </div>
                </div>

                {/* Cluster B: Temporalidad y Auditoría */}
                <div className="space-y-8">
                  <h4 className="text-[#C5A028] text-[9px] font-black uppercase tracking-[0.4em] mb-4 border-b border-[#C5A028]/10 pb-2">Rango Cronológico & Certificación</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className={labelCls}>Fecha Inicial <span className="text-red-500">*</span></label>
                        <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Fecha Final</label>
                        <input type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Usuario Certificador</label>
                    <div className={inputCls + " flex items-center gap-2 opacity-70 cursor-not-allowed"}>
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">✓</span>
                      <span>{user?.username || '—'} <span className="text-[10px] opacity-60">(sesión actual)</span></span>
                    </div>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl">
                     <p className="text-[11px] text-amber-500/80 leading-relaxed font-medium">
                        Nota: Los registros aprobados impactarán directamente en el cálculo de deducciones del período fiscal vigente.
                     </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 border-t border-white/5 mt-16 pt-10">
                <button onClick={() => setShowModal(false)} className="flex-1 dark-button py-4 text-[10px] tracking-widest uppercase">Cancelar Trámite</button>
                <button onClick={guardar} disabled={guardando} className="flex-1 gold-button py-4 text-[10px] tracking-widest uppercase shadow-2xl shadow-[#C5A028]/20">{guardando ? 'Sincronizando...' : 'Confirmar Registro de Incidencia'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ListadoFaltas;
