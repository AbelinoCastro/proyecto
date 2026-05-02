import api from './api';

export const getISRPreview      = (id_periodo) => api.get(`/sat/isr-preview/${id_periodo}`);
export const getEstadoISR       = (id_periodo) => api.get(`/sat/isr-estado/${id_periodo}`);
export const pagarISR           = (id_periodo) => api.post(`/sat/pagar-isr/${id_periodo}`);
export const getComprobanteISR  = (id_periodo) => api.get(`/sat/isr-comprobante/${id_periodo}`);

const BASE = 'http://localhost:4000/api';
// PDF/Excel — abrir en nueva pestaña directamente
export const urlPreviewPDF      = (id_periodo) => `${BASE}/sat/isr-preview-pdf/${id_periodo}`;
export const urlComprobantePDF  = (id_periodo) => `${BASE}/sat/isr-comprobante-pdf/${id_periodo}`;
export const urlPreviewExcel    = (id_periodo) => `${BASE}/sat/isr-preview-excel/${id_periodo}`;
