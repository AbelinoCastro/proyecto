export const rutasAPI = {
    empleados:    'empleados',
    usuarios:     'usuarios',
    tipos:        'tipos-usuario',
    departamentos: 'departamentos',
    puestos:      'puestos',
    jornadas:     'jornadas',
    percepciones: 'percepciones',
    deducciones:  'deducciones',
    faltas:       'faltas',
    motivos:      'motivos-baja'
};
 
/**
 * Guarda o actualiza un registro en el catálogo activo.
 * - Si editandoId es null  → POST (crear)
 * - Si editandoId tiene valor → PUT (actualizar)
 */
export const apiGuardar = async (tabActiva, formData, editandoId = null) => {
    const endpoint = rutasAPI[tabActiva];
    const metodo   = editandoId ? 'PUT' : 'POST';
    const url      = editandoId
        ? `http://localhost:4000/api/${endpoint}/${editandoId}`
        : `http://localhost:4000/api/${endpoint}`;
 
    try {
        const res  = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'Accept':       'application/json'
            },
            body: JSON.stringify(formData)
        });
        const data = await res.json();
 
        if (res.ok) return { ok: true, ...data };
 
        return { ok: false, msg: data.msg || `Error ${res.status}: Fallo en la operación` };
 
    } catch (error) {
        console.error('Error en apiGuardar:', error);
        return { ok: false, msg: 'No hay conexión con el servidor' };
    }
};
 
/**
 * Elimina físicamente un registro por su ID.
 * Solo se llama en catálogos donde acciones.eliminar = true.
 */
export const apiEliminar = async (tabActiva, id) => {
    const endpoint = rutasAPI[tabActiva];
    try {
        const res  = await fetch(`http://localhost:4000/api/${endpoint}/${id}`, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
 
        if (res.ok) return { ok: true, ...data };
 
        return { ok: false, msg: data.msg || 'No se pudo eliminar el registro' };
 
    } catch (error) {
        console.error('Error en apiEliminar:', error);
        return { ok: false, msg: 'Error de red al intentar eliminar' };
    }
};
 
/**
 * Da de baja un empleado o usuario SIN eliminarlo físicamente.
 * Llama al endpoint PUT /api/{tabla}/baja/{id}
 * El backend debe cambiar el estado a 'I' (inactivo) o 'BAJA'.
 *
 * Solo se llama en catálogos donde acciones.bajar = true
 * (actualmente: empleados y usuarios).
 */
export const apiBaja = async (tabActiva, id) => {
    const endpoint = rutasAPI[tabActiva];
    try {
        const res  = await fetch(`http://localhost:4000/api/${endpoint}/baja/${id}`, {
            method: 'PUT',
            headers: { 'Accept': 'application/json' }
        });
        const data = await res.json();
 
        if (res.ok) return { ok: true, ...data };
 
        return { ok: false, msg: data.msg || 'No se pudo procesar la baja' };
 
    } catch (error) {
        console.error('Error en apiBaja:', error);
        return { ok: false, msg: 'Error de red al intentar dar de baja' };
    }
};