import api from './api';
export const getJornadas = () => api.get('/jornadas');
export const getJornadaById = (id) => api.get(`/jornadas/${id}`);
export const createJornada = (data) => api.post('/jornadas', data);
export const updateJornada = (id, data) => api.put(`/jornadas/${id}`, data);
export const deleteJornada = (id) => api.delete(`/jornadas/${id}`);