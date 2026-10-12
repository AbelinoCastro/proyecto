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
        ? `${API_BASE}/${endpoint}/${encodeURIComponent(editandoId)}`
        : `${API_BASE}/${endpoint}`;

    try {
        const res  = await fetch(url, {
            method:  metodo,
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(formData),
        });
        const text = await res.text();
        let data = {};
        try { if (text) data = JSON.parse(text); } catch { data = {}; }

        if (res.ok) return { ok: true, ...data };
        return { ok: false, msg: data.message || `Error ${res.status}: No se pudo completar la operación` };
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
        const res  = await fetch(`${API_BASE}/${endpoint}/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });

        // Intentar parsear JSON solo si hay contenido
        const text = await res.text();
        let data = {};
        try { if (text) data = JSON.parse(text); } catch { data = {}; }

        if (res.ok) return { ok: true, ...data };

        // Manejo específico de errores de integridad referencial (Foreign Key / ORA-02292)
        let msg = data.message || data.details || 'No se pudo eliminar';
        const isIntegrityError =
            msg.includes('integrity constraint') ||
            msg.includes('FK_') ||
            msg.includes('child record found') ||
            msg.includes('ORA-02292');

        if (isIntegrityError) {
            msg = "No se puede eliminar este registro porque ya está asociado a otros datos (Nóminas o Contratos). Se recomienda desactivarlo en lugar de eliminarlo.";
        }

        return { ok: false, msg };
    } catch (err) {
        console.error("Error en apiEliminar:", err);
        return { ok: false, msg: 'Error de red o de servidor al intentar eliminar' };
    }
};

/**
 * Da de baja un empleado (PATCH /empleado/:id/baja).
 * Solo aplica a catálogos con acciones.bajar = true.
 */
export const apiBaja = async (tabActiva, id) => {
    const endpoint = rutasAPI[tabActiva];
    const url = `${API_BASE}/${endpoint}/${encodeURIComponent(id)}/baja`;
    try {
        const res  = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        const text = await res.text();
        let data = {};
        try { if (text) data = JSON.parse(text); } catch { data = {}; }

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
        const res  = await fetch(`${API_BASE}/${endpoint}/${encodeURIComponent(id)}/estado`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ estado: nuevoEstado }),
        });
        const text = await res.text();
        let data = {};
        try { if (text) data = JSON.parse(text); } catch { data = {}; }

        return res.ok ? { ok: true, ...data } : { ok: false, msg: data.message || 'No se pudo cambiar el estado' };
    } catch {
        return { ok: false, msg: 'Error de red al cambiar estado' };
    }
};
