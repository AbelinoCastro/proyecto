const API_BASE = 'http://localhost:4000/api';

// URL para descarga directa del Excel
export const urlFormatoUnico = (id_empleado, anio) =>
    `${API_BASE}/formato-salarios/${id_empleado}?anio=${anio}`;
