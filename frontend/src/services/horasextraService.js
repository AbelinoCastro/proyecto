import api from './api';

export const getHorasExtra = () => api.get('/horasextra');
export const createHoraExtra = (data) => api.post('/horasextra', data);
export const updateEstadoHoraExtra = (id, estado) => api.put(`/horasextra/${id}`, { estado });
