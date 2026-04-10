// src/pages/PlaceholderPage.jsx
import React from 'react';

const PlaceholderPage = ({ title }) => (
  <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '20px' }}>
    <h2 style={{ color: '#4e73df' }}>{title}</h2>
    <p style={{ color: '#a0aec0', marginTop: '10px' }}>Este módulo está actualmente en desarrollo.</p>
    <img src="https://illustrations.popsy.co/gray/work-from-home.svg" alt="dev" style={{ width: '300px', marginTop: '20px' }} />
  </div>
);

export default PlaceholderPage;