import { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:4000/api';

const inputClass = 'bg-[#131720] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors w-full';

const RegistroHorasExtra = () => {
  const [horasExtra, setHorasExtra]   = useState([]);
  const [empleados,  setEmpleados]    = useState([]);
  const [jornadas,   setJornadas]     = useState([]);
  const [usuarios,   setUsuarios]     = useState([]);
  const [showModal,  setShowModal]    = useState(false);

  const [formData, setFormData] = useState({
    id_empleado: '', id_jornada: '', id_usuario: '',
    fecha: '', cantidad: '', factor: '', justificacion: ''
  });

  useEffect(() => {
    fetchHorasExtra();
    axios.get(`${API}/empleado`).then(r => setEmpleados(r.data.data ?? []));
    axios.get(`${API}/jornadas`).then(r => setJornadas(r.data.data ?? []));
    axios.get(`${API}/usuarios`).then(r => setUsuarios(r.data.data ?? []));
  }, []);

  const fetchHorasExtra = async () => {
    try {
      const r = await axios.get(`${API}/horasextra`);
      setHorasExtra(Array.isArray(r.data) ? r.data : []);
    } catch (e) { console.error(e); }
  };

  const actualizarEstado = async (id, nuevoEstado) => {
    try {
      await axios.put(`${API}/horasextra/${id}`, { estado: nuevoEstado });
      fetchHorasExtra();
    } catch (e) {
      console.error(e);
      alert('Error al actualizar estado');
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id_empleado, id_jornada, id_usuario, fecha, cantidad, factor, justificacion } = formData;
    if (!id_empleado || !id_jornada || !id_usuario || !fecha || !cantidad || !factor || !justificacion) {
      alert('Complete todos los campos');
      return;
    }
    try {
      await axios.post(`${API}/horasextra`, formData);
      setShowModal(false);
      setFormData({ id_empleado: '', id_jornada: '', id_usuario: '', fecha: '', cantidad: '', factor: '', justificacion: '' });
      fetchHorasExtra();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al guardar');
    }
  };

  const nombreEmpleado = (id) => empleados.find(e => e.ID_EMPLEADO === id)?.NOMBRE ?? id;
  const nombreJornada  = (id) => { const j = jornadas.find(j => j.ID_JORNADA === id); return j ? (j.NOMBRE_JORNADA || j.DESCRIPCION) : id; };
  const nombreUsuario  = (id) => usuarios.find(u => u.ID_USUARIO === id)?.USERNAME ?? id;
  const labelFactor    = (f)  => f === 1.5 ? 'Extra (×1.5)' : f === 2 ? 'Asueto (×2)' : f;

  const badgeEstado = (estado) => {
    const map = {
      APROBADO:  'bg-green-500/20 text-green-400',
      RECHAZADO: 'bg-red-500/20 text-red-400',
      PENDIENTE: 'bg-yellow-500/20 text-yellow-400',
    };
    return map[estado] ?? 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="p-6 min-h-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Horas Extra</h1>
          <p className="text-gray-400 text-sm mt-1">Registro y aprobación de horas adicionales</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Registrar horas extra
        </button>
      </div>

      <div className="bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Registros</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80 text-gray-300 text-left">
                <th className="px-4 py-3 font-semibold">Empleado</th>
                <th className="px-4 py-3 font-semibold">Jornada</th>
                <th className="px-4 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold text-center">Horas</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Justificación</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {horasExtra.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    No hay registros de horas extra
                  </td>
                </tr>
              ) : (
                horasExtra.map((h) => (
                  <tr key={h.ID_HORA_EXTRA} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-gray-300">{nombreEmpleado(h.ID_EMPLEADO)}</td>
                    <td className="px-4 py-3 text-gray-300">{nombreJornada(h.ID_JORNADA)}</td>
                    <td className="px-4 py-3 text-gray-300">{nombreUsuario(h.ID_USUARIO)}</td>
                    <td className="px-4 py-3 text-gray-300">{new Date(h.FECHA).toLocaleDateString('es-GT')}</td>
                    <td className="px-4 py-3 text-gray-300 text-center">{h.CANTIDAD}</td>
                    <td className="px-4 py-3 text-gray-300">{labelFactor(h.FACTOR)}</td>
                    <td className="px-4 py-3 text-gray-300">{h.JUSTIFICACION}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeEstado(h.ESTADO)}`}>
                        {h.ESTADO}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => actualizarEstado(h.ID_HORA_EXTRA, 'APROBADO')}
                          className="px-2.5 py-1 rounded-md bg-green-600/20 text-green-400 text-xs hover:bg-green-600/40 transition-colors"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => actualizarEstado(h.ID_HORA_EXTRA, 'RECHAZADO')}
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
          <div className="bg-[#1a1f2e] border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">Registrar Horas Extra</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">

              <select name="id_empleado" value={formData.id_empleado} onChange={handleChange} className={inputClass}>
                <option value="">Seleccione empleado</option>
                {empleados.map(e => <option key={e.ID_EMPLEADO} value={e.ID_EMPLEADO}>{e.NOMBRE}</option>)}
              </select>

              <select name="id_jornada" value={formData.id_jornada} onChange={handleChange} className={inputClass}>
                <option value="">Seleccione jornada</option>
                {jornadas.map(j => <option key={j.ID_JORNADA} value={j.ID_JORNADA}>{j.NOMBRE_JORNADA || j.DESCRIPCION}</option>)}
              </select>

              <select name="id_usuario" value={formData.id_usuario} onChange={handleChange} className={inputClass}>
                <option value="">Usuario que registra</option>
                {usuarios.map(u => <option key={u.ID_USUARIO} value={u.ID_USUARIO}>{u.USERNAME} — {u.EMPLEADO}</option>)}
              </select>

              <select name="factor" value={formData.factor} onChange={handleChange} className={inputClass}>
                <option value="">Pagar horas como</option>
                <option value="1.5">Extra (×1.5)</option>
                <option value="2.0">Asueto (×2)</option>
              </select>

              <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className={inputClass} />

              <input type="number" step="0.01" name="cantidad" placeholder="Cantidad de horas" value={formData.cantidad} onChange={handleChange} className={inputClass} />

              <input type="text" name="justificacion" placeholder="Justificación" value={formData.justificacion} onChange={handleChange} className={inputClass} />

              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroHorasExtra;
