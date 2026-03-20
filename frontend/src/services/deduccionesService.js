import api from './api';
export const getDeducciones = () => api.get('/deducciones');
export const getDeduccionById = (id) => api.get(`/deducciones/${id}`);
export const createDeduccion = (data) => api.post('/deducciones', data);
export const updateDeduccion = (id, data) => api.put(`/deducciones/${id}`, data);
export const deleteDeduccion = (id) => api.delete(`/deducciones/${id}`);