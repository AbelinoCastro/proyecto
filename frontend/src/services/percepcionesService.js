import api from './api';
export const getPercepciones = () => api.get('/percepciones');
export const getPercepcionById = (id) => api.get(`/percepciones/${encodeURIComponent(id)}`);
export const createPercepcion = (data) => api.post('/percepciones', data);
export const updatePercepcion = (id, data) => api.put(`/percepciones/${encodeURIComponent(id)}`, data);
export const deletePercepcion = (id) => api.delete(`/percepciones/${encodeURIComponent(id)}`);
