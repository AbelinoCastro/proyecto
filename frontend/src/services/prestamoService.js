import api from './api';

export const getPrestamos           = ()       => api.get('/prestamos');
export const createPrestamo         = (data)   => api.post('/prestamos', data);
export const getDetallePrestamo     = (id)     => api.get(`/prestamos/${id}/detalles`);
export const procesarPagosMensuales = ()       => api.post('/prestamos/procesar-mensualidad');
export const getUltimoComprobante   = ()       => api.get('/prestamos/ultimo-comprobante');
