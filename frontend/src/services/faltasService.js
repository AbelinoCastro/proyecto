import api from './api';
export const getFaltas = () => api.get('/faltas');
export const getFaltaById = (id) => api.get(`/faltas/${id}`);
export const createFalta = (data) => api.post('/faltas', data);
export const updateFalta = (id, data) => api.put(`/faltas/${id}`, data);
export const deleteFalta = (id) => api.delete(`/faltas/${id}`);