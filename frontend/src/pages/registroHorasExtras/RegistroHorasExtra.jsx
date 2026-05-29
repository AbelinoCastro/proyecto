import { useState, useEffect } from 'react';
import axios from 'axios';
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
        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{tipo === 'error' ? 'Sistema / Alerta' : 'Notificación'}</span>
        <span className="text-[13px] font-bold">{mensaje}</span>
      </div>
    </div>
  );
};

const RegistroHorasExtra = () => {
  const { user } = useAuth();
  const [horasExtra, setHorasExtra] = useState([]);
  const [empleados,  setEmpleados]  = useState([]);
  const [jornadas,   setJornadas]   = useState([]);
  const [showModal,  setShowModal]  = useState(false);
  const [guardando,  setGuardando]  = useState(false);
  const [toast,      setToast]      = useState(null);

  const [formData, setFormData] = useState({
    id_empleado: '', id_jornada: '', id_usuario: '',
    fecha: '', cantidad: '', factor: '', justificacion: ''
  });

  // Auto-asigna el usuario logueado como registrador
  useEffect(() => {
    if (user?.id) setFormData(f => ({ ...f, id_usuario: user.id }));
  }, [user]);

  const mostrarToast = (mensaje, tipo = 'exito') => setToast({ mensaje, tipo });

  const fetchHorasExtra = async () => {
    try {
      const r = await axios.get(`${API}/horasextra`);
      setHorasExtra(Array.isArray(r.data) ? r.data : []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchHorasExtra();
    axios.get(`${API}/empleado`).then(r => setEmpleados(r.data.data ?? []));
    axios.get(`${API}/jornadas`).then(r => setJornadas(r.data.data ?? []));
    // id_usuario se asigna automáticamente desde el usuario logueado
  }, []);

  const actualizarEstado = async (id, nuevoEstado) => {
    try {
      await axios.put(`${API}/horasextra/${id}`, { estado: nuevoEstado });
      await fetchHorasExtra();
      mostrarToast(`Registro actualizado a ${nuevoEstado} correctamente.`);
    } catch (e) {
      mostrarToast(e.response?.data?.message || 'Error al actualizar estado', 'error');
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id_empleado, id_jornada, id_usuario, fecha, cantidad, factor, justificacion } = formData;
    if (!id_empleado || !id_jornada || !id_usuario || !fecha || !cantidad || !factor || !justificacion) {
      mostrarToast('Todos los campos con (*) son obligatorios.', 'error');
      return;
    }
    setGuardando(true);
    try {
      await axios.post(`${API}/horasextra`, formData);
      setShowModal(false);
      setFormData({ id_empleado: '', id_jornada: '', id_usuario: user?.id || '', fecha: '', cantidad: '', factor: '', justificacion: '' });
      await fetchHorasExtra();
      mostrarToast('Horas extra registradas en el flujo operativo.');
    } catch (error) {
      mostrarToast('Error al guardar el registro técnico.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const nombreEmpleado = (id) => empleados.find(e => e.ID_EMPLEADO === id)?.NOMBRE ?? '—';
  const nombreJornada  = (id) => { const j = jornadas.find(j => j.ID_JORNADA === id); return j ? (j.NOMBRE_JORNADA || j.DESCRIPCION) : '—'; };

  const badgeEstado = (estado) => {
    const map = {
      APROBADO:  'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      RECHAZADO: 'bg-red-500/10 text-red-500 border-red-500/20',
      PENDIENTE: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    };
    const cls = map[estado] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    return `px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border ${cls} whitespace-nowrap`;
  };

  const labelCls = "text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block opacity-60";
  const inputCls = "bg-[#0b0b0b] border border-white/5 rounded-xl px-4 py-2.5 text-[12px] text-white outline-none focus:border-[#C5A028]/30 transition-all w-full shadow-inner";

  return (
    <div className="max-w-[1250px] mx-auto py-8 px-6 animate-in fade-in duration-1000">

      {/* Header Compacto */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-14">
        <div className="flex-1">
            <p className="text-[#C5A028] text-[10px] font-black uppercase tracking-[0.5em] mb-3 opacity-70">Operaciones de Tiempo</p>
            <h1 className="font-serif-title text-5xl text-white tracking-tight leading-none">Horas Extra</h1>
            <p className="text-gray-500 text-[12px] mt-5 font-medium max-w-xl leading-relaxed">
                Consola técnica para la gestión de tiempo extraordinario.
                Sincronice el impacto financiero antes de la liquidación final.
            </p>
        </div>
        <div className="flex items-stretch gap-4 bg-[#111112] border border-white/5 p-1.5 rounded-[24px] shadow-2xl">
            <div className="px-6 py-3 flex flex-col justify-center border-r border-white/5 text-center min-w-[120px]">
                <p className="text-gray-600 text-[8px] font-black uppercase tracking-widest mb-1">Registros</p>
                <p className="text-white font-black text-3xl tracking-tighter">{horasExtra.length}</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="gold-button text-[10px] uppercase tracking-[0.2em] px-8 rounded-2xl shadow-2xl"
            >
              + Nueva Solicitud
            </button>
        </div>
      </div>

      {/* Tabla Proporcionada y Sin Cortes */}
      <div className="luxury-card overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
          <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Auditoría de Tiempo Extraordinario</h2>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Sincronizado</span>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-white/[0.04] bg-white/[0.005]">
                <th className="px-6 py-5 text-[8.5px] font-black text-gray-500 uppercase tracking-[0.3em] whitespace-nowrap">Colaborador & Jornada</th>
                <th className="px-6 py-5 text-[8.5px] font-black text-gray-500 uppercase tracking-[0.3em] whitespace-nowrap text-center">Fecha</th>
                <th className="px-6 py-5 text-[8.5px] font-black text-gray-500 uppercase tracking-[0.3em] whitespace-nowrap text-center">Horas</th>
                <th className="px-6 py-5 text-[8.5px] font-black text-gray-500 uppercase tracking-[0.3em] whitespace-nowrap text-center">Factor</th>
                <th className="px-6 py-5 text-[8.5px] font-black text-gray-500 uppercase tracking-[0.3em] whitespace-nowrap">Justificación</th>
                <th className="px-6 py-5 text-[8.5px] font-black text-gray-500 uppercase tracking-[0.3em] whitespace-nowrap text-center">Estado</th>
                <th className="px-6 py-5 text-[8.5px] font-black text-gray-500 uppercase tracking-[0.3em] whitespace-nowrap text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {horasExtra.length === 0 ? (
                <tr><td colSpan={7} className="px-8 py-32 text-center opacity-20 italic text-sm tracking-widest uppercase">Sin registros detectados</td></tr>
              ) : (
                horasExtra.map((h) => (
                  <tr key={h.ID_HORA_EXTRA} className="hover:bg-white/[0.015] transition-all">
                    <td className="px-6 py-6">
                      <p className="text-white font-bold text-[12.5px] tracking-tight whitespace-nowrap">{nombreEmpleado(h.ID_EMPLEADO)}</p>
                      <p className="text-[9px] text-[#C5A028] font-black uppercase tracking-widest mt-1 opacity-60 whitespace-nowrap">{nombreJornada(h.ID_JORNADA)}</p>
                    </td>
                    <td className="px-6 py-6 text-center text-[11px] text-gray-400 font-medium whitespace-nowrap">
                        {new Date(h.FECHA).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-6 text-center">
                        <span className="text-[12px] font-black text-white">{h.CANTIDAD}</span>
                        <span className="text-[9px] text-gray-600 font-bold ml-1 uppercase">Hrs</span>
                    </td>
                    <td className="px-6 py-6 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[9px] font-black ${h.FACTOR === 1.5 ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'} border border-current opacity-60 whitespace-nowrap`}>
                            × {h.FACTOR}
                        </span>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-[11px] text-gray-500 font-medium leading-relaxed italic max-w-[180px] truncate" title={h.JUSTIFICACION}>{h.JUSTIFICACION || '—'}</p>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className={badgeEstado(h.ESTADO)}>{h.ESTADO}</span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex justify-center gap-2">
                        {h.ESTADO === 'PENDIENTE' ? (
                          <>
                            <button onClick={() => actualizarEstado(h.ID_HORA_EXTRA, 'APROBADO')} className="gold-button text-[9px] px-3 py-1.5 rounded-md shadow-lg active:scale-95">Aprobar</button>
                            <button onClick={() => actualizarEstado(h.ID_HORA_EXTRA, 'RECHAZADO')} className="dark-button text-[9px] px-3 py-1.5 rounded-md border-red-500/20 text-red-500 hover:bg-red-500/10 active:scale-95">Rechazar</button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-500/60 text-[9px] font-black uppercase tracking-widest bg-emerald-500/5 px-4 py-1.5 rounded-lg border border-emerald-500/10">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                             Cerrado
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

      {/* Modal Re-estructurado */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="luxury-card w-full max-w-2xl shadow-2xl border-[#C5A028]/20 animate-in zoom-in-95 duration-500">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-white text-xs font-black uppercase tracking-[0.5em]">Registro Técnico de Tiempo</h2>
                <p className="text-gray-500 text-[10px] font-bold mt-2 uppercase tracking-widest">NóminaGT Enterprise Edition</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-all duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                <div className="space-y-6">
                  <div>
                    <label className={labelCls}>Colaborador Beneficiario</label>
                    <select name="id_empleado" value={formData.id_empleado} onChange={handleChange} className={inputCls}>
                      <option value="">Seleccione personal...</option>
                      {empleados.map(e => <option key={e.ID_EMPLEADO} value={e.ID_EMPLEADO}>{e.NOMBRE}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Jornada Aplicable</label>
                    <select name="id_jornada" value={formData.id_jornada} onChange={handleChange} className={inputCls}>
                      <option value="">Seleccione jornada...</option>
                      {jornadas.map(j => <option key={j.ID_JORNADA} value={j.ID_JORNADA}>{j.NOMBRE_JORNADA || j.DESCRIPCION}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>Tipo / Factor</label>
                        <select name="factor" value={formData.factor} onChange={handleChange} className={inputCls}>
                          <option value="">Factor...</option>
                          <option value="1.5">Extra (1.5)</option>
                          <option value="2.0">Asueto (2.0)</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Fecha</label>
                        <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Cantidad Horas</label>
                    <input type="number" step="0.5" name="cantidad" placeholder="0.0" value={formData.cantidad} onChange={handleChange} className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="mb-10">
                  <label className={labelCls}>Justificación Operativa</label>
                  <textarea rows="1" name="justificacion" placeholder="Motivo del registro..." value={formData.justificacion} onChange={handleChange} className={inputCls + " resize-none"} />
              </div>

              <div className="flex gap-4 border-t border-white/5 pt-8">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 dark-button py-3.5 text-[10px] tracking-widest uppercase">Descartar</button>
                <button type="submit" disabled={guardando} className="flex-1 gold-button py-3.5 text-[10px] tracking-widest uppercase shadow-2xl shadow-[#C5A028]/20">Confirmar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  );
};

export default RegistroHorasExtra;
