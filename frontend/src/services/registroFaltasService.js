import api from './api';

// 🔹 obtener listado
export const getRegistroFaltas = () => 
  api.get('/registro-faltas');

// 🔹 crear (ya lo tienes)
export const createRegistroFalta = (data) => 
  api.post('/registro-faltas', data);