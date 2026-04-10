import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import './App.css';

// --- ÚNICO AÑADIDO: TU NUEVA PÁGINA ---
import CatalogosPage from './modules/Catalogos/CatalogosPage';

const PagePlaceholder = ({ title }) => {
  const navigate = useNavigate();
  return (
    <div style={{ 
      padding: '4rem', background: '#fff', borderRadius: '20px', 
      textAlign: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', marginTop: '20px'
    }}>
      <h2 style={{ fontSize: '2.2rem', color: '#1a202c', fontWeight: '800' }}>Módulo: {title}</h2>
      <p style={{ color: '#718096', margin: '1.5rem 0 2.5rem', fontSize: '1.1rem' }}>
        Esta sección está siendo implementada por el equipo de ingeniería.
      </p>
      <button 
        style={{ 
          padding: '12px 28px', background: '#4e73df', color: '#fff', 
          border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700'
        }}
        onClick={() => navigate('/')}
      >
        ⬅ Volver al Dashboard Central
      </button>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          
          {/* CAMBIO AQUÍ: En lugar de PagePlaceholder, cargamos CatalogosPage */}
          <Route path="/colaboradores" element={<CatalogosPage />} /> 

          <Route path="/asistencia" element={<PagePlaceholder title="Control de Asistencia" />} />
          <Route path="/horas-extra" element={<PagePlaceholder title="Horas Extraordinarias" />} />
          <Route path="/nomina" element={<PagePlaceholder title="Procesamiento de Nómina" />} />
          <Route path="/auditoria" element={<PagePlaceholder title="Auditoría de Pagos" />} />
          <Route path="*" element={<PagePlaceholder title="Recurso No Encontrado" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;