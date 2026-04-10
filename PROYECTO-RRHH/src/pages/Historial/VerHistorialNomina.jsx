import React, { useState, useEffect } from 'react';
import './Historial.css';

const VerHistorialNomina = () => {
  const [empleados, setEmpleados] = useState([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState('');
  const [historial, setHistorial] = useState([]);

  // 1. CONEXIÓN INICIAL: Traer empleados reales para el buscador
  useEffect(() => {
    // Aquí llamas a tu API que usa la Wallet
    fetch('/api/empleados')
      .then(res => res.json())
      .then(data => setEmpleados(data));
  }, []);

  // 2. CONEXIÓN DINÁMICA: Traer historial cuando cambie el empleado
  const handleEmpleadoChange = (e) => {
    const id = e.target.value;
    setSelectedEmpleado(id);
    
    // Solo consulta si hay un ID seleccionado
    if(id) {
      fetch(`/api/historico-nomina/${id}`)
        .then(res => res.json())
        .then(data => setHistorial(data));
    }
  };

  return (
    <div className="historial-container">
      <h2>Auditoría de Pagos Anteriores</h2>
      
      {/* Buscador de Empleados Reales */}
      <div className="filter-section">
        <label>Seleccione Colaborador:</label>
        <select value={selectedEmpleado} onChange={handleEmpleadoChange}>
          <option value="">-- Seleccione un empleado --</option>
          {empleados.map(emp => (
            <option key={emp.ID_EMPLEADO} value={emp.ID_EMPLEADO}>
              {emp.NOMBRE_COMPLETO}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla que se llena con los datos de tus compañeros */}
      <table className="tabla-historial">
        <thead>
          <tr>
            <th>ID Pago</th>
            <th>Fecha de Proceso</th>
            <th>Monto Líquido</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {historial.length > 0 ? (
            historial.map((pago) => (
              <tr key={pago.ID_NOMINA}>
                <td>{pago.ID_NOMINA}</td>
                <td>{new Date(pago.FECHA_PAGO).toLocaleDateString()}</td>
                <td>Q {pago.LIQUIDO_A_PAGAR.toFixed(2)}</td>
                <td><span className={`badge ${pago.ESTADO}`}>{pago.ESTADO}</span></td>
                <td>
                  <button className="btn-ver">Ver Boleta Completa</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">Seleccione un empleado para ver datos reales</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default VerHistorialNomina;