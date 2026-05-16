import api from './api';

export const login = (username, password) =>
    api.post('/auth/login', { username, password });

export const getMe = () => api.get('/auth/me');
