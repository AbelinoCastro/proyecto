import api from './api';

export const getPeriodos = () => api.get('/periodos');
export const verificarPeriodo = (mes, anio) => api.get('/periodos/verificar', { params: { mes, anio } });
export const createPeriodo = (data) => api.post('/periodos', data);
export const cambiarEstadoPeriodo = (id, estado) => api.patch(`/periodos/${id}/estado`, { estado });