import { useEffect, useState } from 'react';
import axios from 'axios';
import { getRegistroFaltas, createRegistroFalta } from '../../services/registroFaltasService';
import { getEmpleados } from '../../services/empleadoService';
import { getFaltas } from '../../services/faltasService';

const API = 'http://localhost:4000/api';

const inputClass = 'bg-[#131720] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors w-full';

const Toast = ({ mensaje, tipo, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium text-white max-w-sm ${
      tipo === 'error' ? 'bg-red-600' : 'bg-green-600'
    }`}>
      <span>{tipo === 'error' ? '✖' : '✔'}</span>
      <span className="flex-1">{mensaje}</span>
      <button onClick={onClose} className="text-white/70 hover:text-white text-lg leading-none">×</button>
    </div>
  );
};

const ListadoFaltas = () => {

  const [faltas,     setFaltas]     = useState([]);
  const [empleados,  setEmpleados]  = useState([]);
  const [tiposFalta, setTiposFalta] = useState([]);
  const [usuarios,   setUsuarios]   = useState([]);
  const [showModal,  setShowModal]  = useState(false);
  const [guardando,  setGuardando]  = useState(false);
  const [toast,      setToast]      = useState(null);

  const [form, setForm] = useState({
    id_empleado: '',
    id_falta: '',
    id_usuario: '',
    fecha: '',
    fecha_fin: '',
    justificacion: ''
  });

  const mostrarToast = (mensaje, tipo = 'exito') => setToast({ mensaje, tipo });

  const cargarFaltas = async () => {
    const res = await getRegistroFaltas();
    setFaltas(res.data);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resFaltas, resEmpleados, resTipos, resUsuarios] = await Promise.all([
          getRegistroFaltas(),
          getEmpleados(),
          getFaltas(),
          axios.get(`${API}/usuarios`)
        ]);
        setFaltas(resFaltas.data);
        setEmpleados(resEmpleados.data.data);
        setTiposFalta(resTipos.data.data);
        setUsuarios(resUsuarios.data.data ?? []);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const actualizarEstado = async (id, nuevoEstado) => {
    try {
      await axios.put(`${API}/registro-faltas/${id}`, { estado: nuevoEstado });
      await cargarFaltas();
      mostrarToast(`Falta ${nuevoEstado === 'APROBADO' ? 'aprobada' : 'rechazada'} correctamente.`);
    } catch (e) {
      mostrarToast(e.response?.data?.message || 'Error al actualizar estado', 'error');
    }
  };

  const badgeEstado = (estado) => {
    const map = {
      APROBADO:    'bg-green-500/20 text-green-400',
      RECHAZADO:   'bg-red-500/20 text-red-400',
      PENDIENTE:   'bg-yellow-500/20 text-yellow-400',
      JUSTIFICADO: 'bg-blue-500/20 text-blue-400',
    };
    return map[estado] ?? 'bg-gray-500/20 text-gray-400';
  };

  const guardar = async () => {
    if (!form.id_empleado || !form.id_falta || !form.id_usuario || !form.fecha) {
      mostrarToast('Complete todos los campos obligatorios.', 'error');
      return;
    }
    setGuardando(true);
    try {
      await createRegistroFalta(form);
      setForm({ id_empleado: '', id_falta: '', id_usuario: '', fecha: '', fecha_fin: '', justificacion: '' });
      setShowModal(false);
      await cargarFaltas();
      mostrarToast('Falta registrada correctamente.');
    } catch (error) {
      mostrarToast(error.response?.data?.message || 'Error al registrar la falta.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const formatFecha = (valor) => {
    if (!valor) return '—';
    try { return new Date(valor).toLocaleDateString('es-GT'); }
    catch { return valor; }
  };

  return (
    <div className="p-6 min-h-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Registro de Faltas</h1>
          <p className="text-gray-400 text-sm mt-1">Control de asistencia e incidencias del personal</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Registrar Falta
        </button>
      </div>

      <div className="bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Faltas registradas</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80 text-gray-300 text-left">
                <th className="px-4 py-3 font-semibold">Empleado</th>
                <th className="px-4 py-3 font-semibold">Puesto</th>
                <th className="px-4 py-3 font-semibold">Falta</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">Justificación</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {faltas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    No hay faltas registradas
                  </td>
                </tr>
              ) : (
                faltas.map((f, index) => (
                  <tr key={index} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-gray-300">{f[1]}</td>
                    <td className="px-4 py-3 text-gray-300">{f[2]}</td>
                    <td className="px-4 py-3 text-gray-300">{f[3]}</td>
                    <td className="px-4 py-3 text-gray-300">{formatFecha(f[4])}</td>
                    <td className="px-4 py-3 text-gray-300">{f[5]}</td>
                    <td className="px-4 py-3 text-gray-300">{f[6]}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeEstado(f[7])}`}>
                        {f[7]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => actualizarEstado(f[0], 'APROBADO')}
                          className="px-2.5 py-1 rounded-md bg-green-600/20 text-green-400 text-xs hover:bg-green-600/40 transition-colors"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => actualizarEstado(f[0], 'RECHAZADO')}
                          className="px-2.5 py-1 rounded-md bg-red-600/20 text-red-400 text-xs hover:bg-red-600/40 transition-colors"
                        >
                          Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1f2e] border border-white/10 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">Registrar Falta</h2>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Empleado <span className="text-red-400">*</span></label>
                <select value={form.id_empleado} onChange={(e) => setForm({ ...form, id_empleado: e.target.value })} className={inputClass}>
                  <option value="">Seleccione empleado</option>
                  {empleados.map(e => <option key={e.ID_EMPLEADO} value={e.ID_EMPLEADO}>{e.NOMBRE}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Tipo de falta <span className="text-red-400">*</span></label>
                <select value={form.id_falta} onChange={(e) => setForm({ ...form, id_falta: e.target.value })} className={inputClass}>
                  <option value="">Seleccione tipo de falta</option>
                  {tiposFalta.map(f => <option key={f.ID_FALTA} value={f.ID_FALTA}>{f.DESCRIPCION}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Usuario que registra <span className="text-red-400">*</span></label>
                <select value={form.id_usuario} onChange={(e) => setForm({ ...form, id_usuario: e.target.value })} className={inputClass}>
                  <option value="">Seleccione usuario</option>
                  {usuarios.map(u => <option key={u.ID_USUARIO} value={u.ID_USUARIO}>{u.USERNAME} — {u.EMPLEADO}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Fecha de la falta <span className="text-red-400">*</span></label>
                <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">
                  Fecha fin <span className="text-gray-500 normal-case font-normal">(opcional, para incapacidades)</span>
                </label>
                <input type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Justificación</label>
                <input type="text" placeholder="Descripción o motivo" value={form.justificacion} onChange={(e) => setForm({ ...form, justificacion: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowModal(false)}
                disabled={guardando}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ListadoFaltas;
