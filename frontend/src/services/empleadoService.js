import api from './api';
export const getEmpleados = () => api.get('/empleado');
export const getEmpleadoById = (id) => api.get(`/empleado/${id}`);
export const createEmpleado = (data) => api.post('/empleado', data);
export const updateEmpleado = (id, data) => api.put(`/empleado/${id}`, data);
export const darBajaEmpleado = (id, data) => api.patch(`/empleado/${id}/baja`, data);
export const deleteEmpleado = (id) => api.delete(`/empleado/${id}`);
export const cambiarEstadoEmpleado = (id, data) => api.patch(`/empleado/${id}/estado`, data);