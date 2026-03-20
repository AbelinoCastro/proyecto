import api from './api';

export const getTiposUsuario = () => api.get('/tipo-usuario');
export const getTipoUsuarioById = (id) => api.get(`/tipo-usuario/${id}`);
export const createTipoUsuario = (data) => api.post('/tipo-usuario', data);
export const updateTipoUsuario = (id, data) => api.put(`/tipo-usuario/${id}`, data);
export const cambiarEstadoTipo = (id, data) => api.patch(`/tipo-usuario/${id}/estado`, data);
export const deleteTipoUsuario = (id) => api.delete(`/tipo-usuario/${id}`);