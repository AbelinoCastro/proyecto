import api from './api';

export const getPolizas    = ()      => api.get('/polizas-seguros');
export const getPoliza     = (id)    => api.get(`/polizas-seguros/${id}`);
export const createPoliza  = (data)  => api.post('/polizas-seguros', data);
export const deletePoliza  = (id)    => api.delete(`/polizas-seguros/${id}`);
