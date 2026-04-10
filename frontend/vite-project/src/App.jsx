import { useEffect, useState, useCallback } from "react";
import "./App.css";

const API_URL = "http://localhost:3000";

function App() {
  const [vista, setVista] = useState("departamentos");
  const [datos, setDatos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 5;

  const [form, setForm] = useState({ 
    id: "", nombre: "", descripcion: "", estado: "ACTIVO",
    inicio: "", fin: "", horas: "", pagado: "N"
  });

  const cargarDatos = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/${vista}`);
      const data = await res.json();
      setDatos(data);
    } catch (err) {
      console.error("Error al conectar:", err);
    }
  }, [vista]);

  useEffect(() => {
    const inicializar = async () => {
      await cargarDatos();
      setSeleccionado(null);
      setPaginaActual(1);
    };
    inicializar();
  }, [cargarDatos]);

  const configVistas = {
    departamentos: {
      titulo: "Gestión de Departamentos",
      idKey: "ID_DEPARTAMENTO",
      columnas: ["ID_DEPARTAMENTO", "NOMBRE_DEPARTAMENTO", "DESCRIPCION", "ESTADO"]
    },
    jornadas: {
      titulo: "Jornadas Laborales",
      idKey: "ID_JORNADA",
      columnas: ["ID_JORNADA", "NOMBRE_JORNADA", "DESCRIPCION", "HORA_INICIO", "HORA_FIN", "HORAS_DIARIAS"]
    },
    faltas: {
      titulo: "Faltas y Asistencias",
      idKey: "ID_FALTA",
      columnas: ["ID_FALTA", "DESCRIPCION", "ES_PAGADO"]
    }
  };

  const ultimoIndice = paginaActual * registrosPorPagina;
  const primerIndice = ultimoIndice - registrosPorPagina;
  const registrosVisibles = datos.slice(primerIndice, ultimoIndice);

  const abrirModalNuevo = () => {
    setSeleccionado(null);
    setForm({ 
      id: "", nombre: "", descripcion: "", estado: "ACTIVO",
      inicio: "", fin: "", horas: "", pagado: "N"
    });
    setMostrarModal(true);
  };

  const prepararEdicion = () => {
    if (!seleccionado) return;
    const idKey = configVistas[vista].idKey;
    setForm({
      id: seleccionado[idKey],
      nombre: seleccionado.NOMBRE_DEPARTAMENTO || seleccionado.NOMBRE_JORNADA || "",
      descripcion: seleccionado.DESCRIPCION || "",
      estado: seleccionado.ESTADO || "ACTIVO",
      inicio: seleccionado.HORA_INICIO || "",
      fin: seleccionado.HORA_FIN || "",
      horas: seleccionado.HORAS_DIARIAS || "",
      pagado: seleccionado.ES_PAGADO || "N"
    });
    setMostrarModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const idKey = configVistas[vista].idKey;
    const metodo = seleccionado ? "PUT" : "POST";
    const url = seleccionado ? `${API_URL}/${vista}/${seleccionado[idKey]}` : `${API_URL}/${vista}`;

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form), 
      });
      if (res.ok) {
        alert(seleccionado ? "Registro actualizado exitosamente" : "Registro creado exitosamente");
        setMostrarModal(false);
        cargarDatos();
      } else {
        const errorData = await res.json();
        alert("Error: " + (errorData.detalle || errorData.mensaje || "Error desconocido"));
      }
    } catch (err) {
      console.error("Error al guardar:", err);
    }
  };

  const handleDelete = async () => {
    if (!seleccionado) return;
    const idKey = configVistas[vista].idKey;
    const id = seleccionado[idKey];
    if (window.confirm(`¿Seguro que quieres eliminar el registro ${id}?`)) {
      try {
        const res = await fetch(`${API_URL}/${vista}/${id}`, { method: "DELETE" });
        if (res.ok) {
          alert("Registro eliminado");
          setSeleccionado(null);
          cargarDatos();
        }
      } catch (err) {
        console.error("Error al eliminar:", err);
      }
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="brand"><h2>SISTEMA NOMINA</h2></div>
        <nav>
          <ul>
            <li className={vista === "departamentos" ? "active" : ""} onClick={() => setVista("departamentos")}>Departamentos</li>
            <li className={vista === "jornadas" ? "active" : ""} onClick={() => setVista("jornadas")}>Jornadas</li>
            <li className={vista === "faltas" ? "active" : ""} onClick={() => setVista("faltas")}>Faltas</li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h1>{configVistas[vista].titulo}</h1>
        </header>

        <div className="action-bar">
          <button className="btn btn-create" onClick={abrirModalNuevo}>+ Nuevo Registro</button>
          <button className="btn btn-dark" onClick={prepararEdicion} disabled={!seleccionado}>Actualizar</button>
          <button className="btn btn-delete" onClick={handleDelete} disabled={!seleccionado}>Eliminar</button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Sel.</th>
                {configVistas[vista].columnas.map(col => <th key={col}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {registrosVisibles.map((item) => {
                const idKey = configVistas[vista].idKey;
                const idItem = item[idKey];
                const isSelected = seleccionado && idItem === seleccionado[idKey];
                return (
                  <tr key={idItem} className={isSelected ? "selected" : ""} onClick={() => setSeleccionado(item)}>
                    <td><input type="checkbox" checked={!!isSelected} readOnly /></td>
                    {configVistas[vista].columnas.map(col => (
                      <td key={col}>
                        {col === 'ES_PAGADO' || col === 'ESTADO' ? (
                          <span className={`badge ${item[col] === 'S' || item[col] === 'ACTIVO' ? 'bg-success' : 'bg-danger'}`}>
                            {item[col]}
                          </span>
                        ) : item[col]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button className="btn-page" onClick={() => setPaginaActual(p => Math.max(p - 1, 1))} disabled={paginaActual === 1}>Anterior</button>
          <span className="page-info"> Página {paginaActual} </span>
          <button className="btn-page" onClick={() => setPaginaActual(p => p + 1)} disabled={ultimoIndice >= datos.length}>Siguiente</button>
        </div>
      </main>

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{seleccionado ? "Editar" : "Nuevo"} {vista}</h3>
            <form onSubmit={handleSave}>
              
              {/* LÓGICA CORREGIDA: OCULTAR ID EN FALTAS */}
              {vista !== "faltas" && (
                <div className="form-group">
                  <label>ID / Código</label>
                  <input 
                    type="number" 
                    value={form.id} 
                    onChange={(e) => setForm({...form, id: e.target.value})} 
                    disabled={!!seleccionado} 
                    required 
                  />
                </div>
              )}

              {vista !== "faltas" && (
                <div className="form-group">
                  <label>Nombre</label>
                  <input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} required />
                </div>
              )}

              <div className="form-group">
                <label>Descripción</label>
                <textarea value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} required />
              </div>

              {vista === "departamentos" && (
                <div className="form-group">
                  <label>Estado</label>
                  <select value={form.estado} onChange={(e) => setForm({...form, estado: e.target.value})}>
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </div>
              )}

              {vista === "jornadas" && (
                <div className="form-row">
                  <div className="form-group"><label>H. Inicio</label><input type="text" value={form.inicio} onChange={(e) => setForm({...form, inicio: e.target.value})} /></div>
                  <div className="form-group"><label>H. Fin</label><input type="text" value={form.fin} onChange={(e) => setForm({...form, fin: e.target.value})} /></div>
                  <div className="form-group"><label>Horas Diarias</label><input type="number" value={form.horas} onChange={(e) => setForm({...form, horas: e.target.value})} /></div>
                </div>
              )}

              {vista === "faltas" && (
                <div className="form-group">
                  <label>¿Es Pagada?</label>
                  <select value={form.pagado} onChange={(e) => setForm({...form, pagado: e.target.value})}>
                    <option value="S">S (SÍ)</option>
                    <option value="N">N (NO)</option>
                  </select>
                </div>
              )}

              <div className="modal-buttons">
                <button type="button" onClick={() => setMostrarModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;