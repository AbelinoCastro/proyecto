// src/pages/Dashboard/Dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  // Opciones del menú según requerimientos
  const modules = [
    { id: 1, title: 'Administrar Catálogos', icon: '👥', path: '/colaboradores', desc: 'Gestión de empleados, puestos y departamentos.' },
    { id: 2, title: 'Registrar Horas Extras', icon: '⏱️', path: '/horas-extra', desc: 'Control y autorización de tiempo extraordinario.' },
    { id: 3, title: 'Registrar Faltas', icon: '❌', path: '/asistencia', desc: 'Control de incidencias, faltas y permisos.' },
    { id: 4, title: 'Calcular Nómina', icon: '🧮', path: '/nomina', desc: 'Procesamiento de pagos, percepciones y deducciones.' },
    { id: 5, title: 'Ver Historial de Nómina', icon: '📜', path: '/auditoria', desc: 'Consulta de recibos y auditoría de pagos realizados.' }
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div className="header-text">
          <h1>Dashboard de Recursos Humanos</h1>
          <p>Bienvenido Abelino, selecciona una acción del menú principal</p>
        </div>
      </div>

      <div className="premium-grid">
        {modules.map((mod) => (
          <div key={mod.id} className="premium-card" onClick={() => navigate(mod.path)}>
            <div className="card-header">
              <span className="card-icon">{mod.icon}</span>
              <div className="card-status-dot"></div>
            </div>
            <div className="card-body">
              <h3>{mod.title}</h3>
              <p>{mod.desc}</p>
            </div>
            <div className="card-footer">
              <span>Gestionar Módulo</span>
              <span className="action-arrow">→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;