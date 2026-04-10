import { useEffect, useState } from 'react';
import { getRegistroFaltas, createRegistroFalta } from '../../services/registroFaltasService';
import { getEmpleados } from '../../services/empleadoService';
import { getFaltas } from '../../services/faltasService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ListadoFaltas = () => {

  const [faltas, setFaltas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [tiposFalta, setTiposFalta] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    id_empleado: '',
    id_falta: '',
    fecha: '',
    fecha_fin: '',
    justificacion: ''
  });

  // 🔥 CARGA INICIAL
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resFaltas, resEmpleados, resTipos] = await Promise.all([
          getRegistroFaltas(),
          getEmpleados(),
          getFaltas()
        ]);

        setFaltas(resFaltas.data);
        setEmpleados(resEmpleados.data.data);
        setTiposFalta(resTipos.data.data);

      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  // 🔥 GUARDAR
  const guardar = async () => {
    try {
      if (!form.id_empleado || !form.id_falta || !form.fecha) {
        alert('Complete los campos obligatorios');
        return;
      }

      await createRegistroFalta(form);

      alert('Falta registrada');

      setForm({
        id_empleado: '',
        id_falta: '',
        fecha: '',
        fecha_fin: '',
        justificacion: ''
      });

      setShowModal(false);

      // 🔥 refrescar tabla
      const res = await getRegistroFaltas();
      setFaltas(res.data);

    } catch (error) {
      alert(error.response?.data?.message || 'Error');
    }
  };

  // 🔥 PDF
  const generarPDF = () => {
    const doc = new jsPDF();

    autoTable(doc, {
      head: [['Empleado', 'Puesto', 'Falta', 'Fecha', 'Usuario']],
      body: faltas.map(f => [
        f[0],
        f[1],
        f[2],
        f[3],
        f[4]
      ])
    });

    doc.save('faltas.pdf');
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      <div className="bg-white shadow-lg rounded-xl p-6">

        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Listado de Faltas
        </h2>

        <button
          onClick={() => setShowModal(true)}
          className="mb-4 mr-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Registrar Falta
        </button>

        <button
          onClick={generarPDF}
          className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Descargar PDF
        </button>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">

            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-2">Empleado</th>
                <th className="px-4 py-2">Puesto</th>
                <th className="px-4 py-2">Falta</th>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Usuario</th>
                <th className="px-4 py-2">Justificación</th>
                <th className="px-4 py-2">Estado</th>
              </tr>
            </thead>

            <tbody>
              {faltas.map((f, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{f[0]}</td>
                  <td className="px-4 py-2">{f[1]}</td>
                  <td className="px-4 py-2">{f[2]}</td>
                  <td className="px-4 py-2">{f[3]}</td>
                  <td className="px-4 py-2">{f[4]}</td>
                  <td className="px-4 py-2">{f[5]}</td>
                  <td className="px-4 py-2 font-semibold text-yellow-600">
                    {f[6]}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>

      {/* 🔥 MODAL FUERA DE LA TABLA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">

          <div className="bg-white p-6 rounded-xl w-full max-w-md">

            <h2 className="text-xl font-bold mb-4">
              Registrar Falta
            </h2>

            <div className="flex flex-col gap-3">

              <select
                value={form.id_empleado}
                onChange={(e) => setForm({ ...form, id_empleado: e.target.value })}
                className="border p-2 rounded"
              >
                <option value="">Seleccione empleado</option>
                {empleados.map(e => (
                  <option key={e.ID_EMPLEADO} value={e.ID_EMPLEADO}>
                    {e.NOMBRE}
                  </option>
                ))}
              </select>

              <select
                value={form.id_falta}
                onChange={(e) => setForm({ ...form, id_falta: e.target.value })}
                className="border p-2 rounded"
              >
                <option value="">Seleccione falta</option>
                {tiposFalta.map(f => (
                  <option key={f.ID_FALTA} value={f.ID_FALTA}>
                    {f.DESCRIPCION}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="border p-2 rounded"
              />

              <input
                type="date"
                value={form.fecha_fin}
                onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                className="border p-2 rounded"
              />

              <input
                type="text"
                placeholder="Justificación"
                value={form.justificacion}
                onChange={(e) => setForm({ ...form, justificacion: e.target.value })}
                className="border p-2 rounded"
              />

            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button
                onClick={guardar}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Guardar
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default ListadoFaltas;