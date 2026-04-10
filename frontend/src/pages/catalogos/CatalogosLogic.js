import { API_BASE } from './TablaGenerica';

// Mapa de id-catálogo → segmento de ruta backend real
export const rutasAPI = {
    empleados:     'empleado',
    usuarios:      'usuarios',
    tipos:         'tipo-usuario',
    departamentos: 'departamentos',
    puestos:       'puestos',
    jornadas:      'jornadas',
    percepciones:  'percepciones',
    deducciones:   'deducciones',
    faltas:        'faltas',
    motivos:       'motivo-baja',
};

/**
 * Crea (POST) o actualiza (PUT) un registro.
 */
export const apiGuardar = async (tabActiva, formData, editandoId = null) => {
    const endpoint = rutasAPI[tabActiva];
    const metodo   = editandoId ? 'PUT' : 'POST';
    const url      = editandoId
        ? `${API_BASE}/${endpoint}/${editandoId}`
        : `${API_BASE}/${endpoint}`;

    try {
        const res  = await fetch(url, {
            method:  metodo,
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(formData),
        });
        const data = await res.json();
        return res.ok ? { ok: true, ...data } : { ok: false, msg: data.message || `Error ${res.status}` };
    } catch {
        return { ok: false, msg: 'Sin conexión con el servidor' };
    }
};

/**
 * Elimina físicamente un registro.
 */
export const apiEliminar = async (tabActiva, id) => {
    const endpoint = rutasAPI[tabActiva];
    try {
        const res  = await fetch(`${API_BASE}/${endpoint}/${id}`, {
            method: 'DELETE',
        });
        const data = await res.json();
        return res.ok ? { ok: true, ...data } : { ok: false, msg: data.message || 'No se pudo eliminar' };
    } catch {
        return { ok: false, msg: 'Error de red al eliminar' };
    }
};

/**
 * Da de baja un empleado (PATCH /empleado/:id/baja).
 * Solo aplica a catálogos con acciones.bajar = true.
 */
export const apiBaja = async (tabActiva, id) => {
    const endpoint = rutasAPI[tabActiva];
    const url = `${API_BASE}/${endpoint}/${id}/baja`;
    try {
        const res  = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        const data = await res.json();
        return res.ok ? { ok: true, ...data } : { ok: false, msg: data.message || 'No se pudo procesar la baja' };
    } catch {
        return { ok: false, msg: 'Error de red al dar de baja' };
    }
};

/**
 * Activa o desactiva un registro (PATCH /:id/estado).
 * Aplica a: empleados, usuarios, tipos, departamentos, motivos.
 */
export const apiToggleEstado = async (tabActiva, id, nuevoEstado) => {
    const endpoint = rutasAPI[tabActiva];
    try {
        const res  = await fetch(`${API_BASE}/${endpoint}/${id}/estado`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ estado: nuevoEstado }),
        });
        const data = await res.json();
        return res.ok ? { ok: true, ...data } : { ok: false, msg: data.message || 'No se pudo cambiar el estado' };
    } catch {
        return { ok: false, msg: 'Error de red al cambiar estado' };
    }
};
