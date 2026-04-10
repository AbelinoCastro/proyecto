// src/components/Layout/Layout.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();

  // Menú más serio y profesional
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Colaboradores', path: '/colaboradores', icon: '👥' },
    { name: 'Asistencia', path: '/asistencia', icon: '⏱️' },
    { name: 'Nómina', path: '/nomina', icon: '🧮' },
    { name: 'Reportes', path: '/auditoria', icon: '📜' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar Ultra Serio */}
      <aside className="premium-sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">▲</div>
          <div className="brand-info">
            <span className="brand-name">Nomina<span className="brand-accent">Pro</span></span>
            <span className="version-tag">v2.1 Enterprise</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.name}
                  {location.pathname === item.path && <div className="active-indicator" />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout">🔒 Cerrar Sesión Segura</button>
        </div>
      </aside>

      <div className="main-wrapper">
        {/* Topbar Limpio y Organizado */}
        <header className="premium-topbar">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Buscar colaborador, reporte o acción..." />
          </div>
          <div className="topbar-actions">
            <div className="notification-bell">
              🔔
              <span className="badge">3</span>
            </div>
            <div className="divider" />
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">Abelino RRHH</span>
                <span className="user-role">Administrator</span>
              </div>
              <div className="user-avatar">AR</div>
            </div>
          </div>
        </header>

        {/* Único lugar donde se permite scroll vertical */}
        <main className="content-container">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;