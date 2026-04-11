import api from './api';

// Obtener vista previa del cálculo para un empleado en un mes/año
export const getVistaPreviaNomina = (id_empleado, anio, mes) =>
    api.get(`/nomina/empleado/${id_empleado}`, { params: { anio, mes } });

// Procesar y guardar la nómina (realizar el pago)
export const procesarNomina = (data) => api.post('/nomina/procesar', data);

// Obtener histórico de todas las nóminas procesadas
export const getHistoricoNomina = () => api.get('/nomina/historico');

// Obtener detalle completo de una nómina para el recibo
export const getDetalleNomina = (id_nomina) => api.get(`/nomina/historico/${id_nomina}`);

// Procesar nómina para todos los empleados activos de un período
export const procesarNominaTodos = (data) => api.post('/nomina/procesar-todos', data);