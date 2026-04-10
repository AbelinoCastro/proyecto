import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MenuPrincipal.css';

const MenuPrincipal = () => {
  const navigate = useNavigate();

  // Simulación de usuario autorizado (Criterio de aceptación 4)
  const user = { role: 'Recursos Humanos' }; 

  const handleNavigation = (path, moduleName) => {
    if (user.role !== 'Recursos Humanos') {
      alert("No tienes permiso para acceder aquí");
      return;
    }
    
    // Registro de acción (Criterio de aceptación 5)
    console.log(`[LOG]: Usuario accedió a ${moduleName} el ${new Date().toLocaleString()}`);
    
    navigate(path);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Panel de Gestión RRHH</h1>
        <p>Bienvenido, Administrador de Nómina</p>
      </header>

      <div className="menu-grid">
        <button className="menu-card" onClick={() => handleNavigation('/admin-catalogos', 'Catálogos')}>
          <span className="icon">📁</span>
          <h3>Administrar Catálogos</h3>
        </button>

        <button className="menu-card" onClick={() => handleNavigation('/registro-horas-extra', 'Horas Extra')}>
          <span className="icon">⏰</span>
          <h3>Registrar Horas Extras</h3>
        </button>

        <button className="menu-card" onClick={() => handleNavigation('/registro-faltas', 'Faltas')}>
          <span className="icon">❌</span>
          <h3>Registrar Faltas</h3>
        </button>

        <button className="menu-card" onClick={() => handleNavigation('/calculo-nomina', 'Cálculo')}>
          <span className="icon">🧮</span>
          <h3>Calcular Nómina</h3>
        </button>

        <button className="menu-card" onClick={() => handleNavigation('/historial-nomina', 'Historial')}>
          <span className="icon">📜</span>
          <h3>Ver Historial de Nómina</h3>
        </button>
      </div>
    </div>
  );
};

export default MenuPrincipal;