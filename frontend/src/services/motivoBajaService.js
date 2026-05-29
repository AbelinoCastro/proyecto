import api from './api';
export const getMotivosBaja = () => api.get('/motivo-baja');
export const getMotivoBajaById = (id) => api.get(`/motivo-baja/${encodeURIComponent(id)}`);
export const createMotivoBaja = (data) => api.post('/motivo-baja', data);
export const updateMotivoBaja = (id, data) => api.put(`/motivo-baja/${encodeURIComponent(id)}`, data);
export const deleteMotivoBaja = (id) => api.delete(`/motivo-baja/${encodeURIComponent(id)}`);
