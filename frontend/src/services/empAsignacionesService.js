import api from './api';

export const getDeduccionesEmpleado = (id_empleado) =>
    api.get(`/emp-asignaciones/empleado/${id_empleado}/deducciones`);
export const createDeduccionEmpleado = (data) =>
    api.post('/emp-asignaciones/deducciones', data);
export const updateDeduccionEmpleado = (id, data) =>
    api.put(`/emp-asignaciones/deducciones/${id}`, data);
export const deleteDeduccionEmpleado = (id) =>
    api.delete(`/emp-asignaciones/deducciones/${id}`);

export const getPercepcionesEmpleado = (id_empleado) =>
    api.get(`/emp-asignaciones/empleado/${id_empleado}/percepciones`);
export const createPercepcionEmpleado = (data) =>
    api.post('/emp-asignaciones/percepciones', data);
export const updatePercepcionEmpleado = (id, data) =>
    api.put(`/emp-asignaciones/percepciones/${id}`, data);
export const deletePercepcionEmpleado = (id) =>
    api.delete(`/emp-asignaciones/percepciones/${id}`);
