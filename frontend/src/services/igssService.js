import api from './api';

export const getIGSSPreview     = (id_periodo) => api.get(`/igss/preview/${id_periodo}`);
export const getEstadoIGSS      = (id_periodo) => api.get(`/igss/estado/${id_periodo}`);
export const pagarIGSS          = (id_periodo) => api.post(`/igss/pagar/${id_periodo}`);
export const getComprobanteIGSS = (id_periodo) => api.get(`/igss/comprobante/${id_periodo}`);

const BASE = 'http://localhost:4000/api';
// PDF — abrir en nueva pestaña
export const urlComprobantePDF  = (id_periodo) => `${BASE}/igss/comprobante-pdf/${id_periodo}`;
