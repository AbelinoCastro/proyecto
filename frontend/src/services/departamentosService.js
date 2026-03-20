import api from './api';
export const getDepartamentos = () => api.get('/departamentos');
export const getDepartamentoById = (id) => api.get(`/departamentos/${id}`);
export const createDepartamento = (data) => api.post('/departamentos', data);
export const updateDepartamento = (id, data) => api.put(`/departamentos/${id}`, data);
export const deleteDepartamento = (id) => api.delete(`/departamentos/${id}`);