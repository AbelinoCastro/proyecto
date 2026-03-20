import api from './api';
export const getPuestos = () => api.get('/puestos');
export const getPuestoById = (id) => api.get(`/puestos/${id}`);
export const createPuesto = (data) => api.post('/puestos', data);
export const updatePuesto = (id, data) => api.put(`/puestos/${id}`, data);
export const deletePuesto = (id) => api.delete(`/puestos/${id}`);