import React, { useState, useEffect } from "react";
import axios from "axios";

const RegistroHorasExtra = () => {
  const [horasExtra, setHorasExtra] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id_empleado: "",
    id_jornada: "",
    id_usuario: "",
    fecha: "",
    cantidad: "",
    factor: "",
    justificacion: ""
  });

  const [empleados, setEmpleados] = useState([]);
  const [jornadas, setJornadas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    fetchHorasExtra();

    axios.get("http://localhost:4000/api/empleado").then(res => {
      setEmpleados(Array.isArray(res.data.data) ? res.data.data : []);
    });

    axios.get("http://localhost:4000/api/jornadas").then(res => {
      setJornadas(Array.isArray(res.data.data) ? res.data.data : []);
    });

    axios.get("http://localhost:4000/api/usuarios").then(res => {
      setUsuarios(Array.isArray(res.data.data) ? res.data.data : []);
    });
  }, []);

  const fetchHorasExtra = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/horasextra");
      setHorasExtra(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al obtener horas extra", error);
    }
  };

  const actualizarEstado = async (idHoraExtra, nuevoEstado) => {
  try {
    await axios.put(`http://localhost:4000/api/horasextra/${idHoraExtra}`, {
      estado: nuevoEstado
    });
    alert(`✅ Estado actualizado a ${nuevoEstado}`);
    fetchHorasExtra(); // refresca la tabla
  } catch (error) {
    console.error("Error al actualizar estado", error);
    alert("❌ No se pudo actualizar el estado");
  } 
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log("Cambio en formulario:", name, value);
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔹 Validación de campos vacíos
    if (!formData.id_empleado || !formData.id_jornada || !formData.id_usuario ||
        !formData.fecha || !formData.cantidad || !formData.factor || !formData.justificacion) {
      alert("⚠️ Por favor complete todos los campos antes de guardar.");
      return;
    }

    try {
      const payload = {
        id_empleado: formData.id_empleado,
        id_jornada: formData.id_jornada,
        id_usuario: formData.id_usuario,
        fecha: formData.fecha,
        cantidad: formData.cantidad,
        factor: formData.factor,
        justificacion: formData.justificacion
      };

      console.log("Payload enviado:", payload);
      await axios.post("http://localhost:4000/api/horasextra", payload);

      alert("✅ Registro guardado correctamente.");
      setShowModal(false);
      fetchHorasExtra();
    } catch (error) {
      console.error("Error al crear registro", error);
      alert("❌ Ocurrió un error al guardar el registro.");
    }
  };

  return (
    <div className="p-6 bg-[#1a1f2e] min-h-screen text-white">
      <h1 className="text-xl font-bold mb-4">Registro de Horas Extra</h1>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Registrar horas extras
        </button>
      </div>

      <table className="w-full border-collapse bg-[#2a2f45] shadow rounded-lg text-white text-sm">
        <thead>
          <tr className="bg-[#1f2437] text-left">
            <th className="p-2">Empleado</th>
            <th className="p-2">Jornada</th>
            <th className="p-2">Usuario</th>
            <th className="p-2">Fecha</th>
            <th className="p-2">Cantidad</th>
            <th className="p-2">Pagar como</th>
            <th className="p-2">Justificación</th>
            <th className="p-2">Estado</th>
            <th className="p-2">Acciones</th>
          </tr>
        </thead>
             <tbody>
    {horasExtra.map((h) => {
    const empleado = empleados.find(e => e.ID_EMPLEADO === h.ID_EMPLEADO);
    const jornada = jornadas.find(j => j.ID_JORNADA === h.ID_JORNADA);
    const usuario = usuarios.find(u => u.ID_USUARIO === h.ID_USUARIO);

    return (
      <tr key={h.ID_HORA_EXTRA} className="border-t border-gray-600">
        <td className="p-2">{empleado ? empleado.NOMBRE : h.ID_EMPLEADO}</td>
        <td className="p-2">{jornada ? (jornada.NOMBRE_JORNADA || jornada.DESCRIPCION) : h.ID_JORNADA}</td>
        <td className="p-2">{usuario ? usuario.USERNAME : h.ID_USUARIO}</td>
        <td className="p-2">{new Date(h.FECHA).toLocaleDateString()}</td>
        <td className="p-2 text-center">{h.CANTIDAD}</td>
        <td className="p-2">
          {h.FACTOR === 1.5 ? "Extras (x1.5)" : h.FACTOR === 2 ? "Asueto (x2)" : h.FACTOR}
        </td>
        <td className="p-2">{h.JUSTIFICACION}</td>

        {/* Nueva columna Estado */}
        <td className="p-2 text-sm">{h.ESTADO.charAt(0) + h.ESTADO.slice(1).toLowerCase()}</td>

        {/* Nueva columna Acciones */}
        <td className="p-2 flex gap-2">
          <button
            onClick={() => actualizarEstado(h.ID_HORA_EXTRA, "APROBADO")}
            className="px-3 py-1 rounded-full bg-green-600 text-green-100 text-xs font-medium hover:bg-green-700 transition"
          >
            Aprobar
          </button>
          <button
            onClick={() => actualizarEstado(h.ID_HORA_EXTRA, "RECHAZADO")}
              className="px-3 py-1 rounded-full bg-red-600 text-red-100 text-xs font-medium hover:bg-red-700 transition"
            >
            Rechazar
          </button>
        </td>
      </tr>
    );
  })}
</tbody>
      </table>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-[#1a1f2e] p-6 rounded-lg w-96 text-white">
            <h2 className="text-lg font-bold mb-4">Registrar Horas Extra</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">

              {/* Select Empleado */}
              <select
                name="id_empleado"
                value={formData.id_empleado}
                onChange={handleChange}
                className="border border-gray-600 bg-[#2a2f45] text-white px-3 py-2 rounded-lg"
              >
                <option value="">Seleccione empleado</option>
                {Array.isArray(empleados) && empleados.map(e => (
                  <option key={e.ID_EMPLEADO} value={e.ID_EMPLEADO}>
                    {e.NOMBRE}
                  </option>
                ))}
              </select>

              {/* Select Jornada */}
              <select
                name="id_jornada"
                value={formData.id_jornada}
                onChange={handleChange}
                className="border border-gray-600 bg-[#2a2f45] text-white px-3 py-2 rounded-lg"
              >
                <option value="">Seleccione jornada</option>
                {Array.isArray(jornadas) && jornadas.map(j => (
                  <option key={j.ID_JORNADA} value={j.ID_JORNADA}>
                    {j.NOMBRE_JORNADA || j.DESCRIPCION}
                  </option>
                ))}
              </select>

              {/* Select Usuario */}
              <select
                name="id_usuario"
                value={formData.id_usuario}
                onChange={handleChange}
                className="border border-gray-600 bg-[#2a2f45] text-white px-3 py-2 rounded-lg"
              >
                <option value="">Usuario que registra</option>
                {Array.isArray(usuarios) && usuarios.map(u => (
                  <option key={u.ID_USUARIO} value={u.ID_USUARIO}>
                    {u.USERNAME} - {u.EMPLEADO}
                  </option>
                ))}
              </select>

              {/* Select Factor */}
              <select
                name="factor"
                value={formData.factor}
                onChange={handleChange}
                className="border border-gray-600 bg-[#2a2f45] text-white px-3 py-2 rounded-lg"
              >
                <option value="">Pagar horas como</option>
                <option value="1.5">Extra</option>
                <option value="2.0">Asueto</option>
              </select>

              {/* Otros campos */}
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                className="border border-gray-600 bg-[#2a2f45] text-white px-3 py-2 rounded-lg"
              />
              <input
                type="number"
                step="0.01"
                name="cantidad"
                placeholder="Cantidad de horas"
                value={formData.cantidad}
                onChange={handleChange}
                className="border border-gray-600 bg-[#2a2f45] text-white px-3 py-2 rounded-lg"
              />
              <input
                type="text"
                name="justificacion"
                placeholder="Justificación"
                value={formData.justificacion}
                onChange={handleChange}
                className="border border-gray-600 bg-[#2a2f45] text-white px-3 py-2 rounded-lg"
              />

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-600 px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
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