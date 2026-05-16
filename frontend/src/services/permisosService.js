import api from './api';

export const getModulos    = () => api.get('/permisos/modulos');
export const getRoles      = () => api.get('/permisos/roles');
export const getPermisos   = () => api.get('/permisos');
export const updatePermiso = (data) => api.put('/permisos', data);
