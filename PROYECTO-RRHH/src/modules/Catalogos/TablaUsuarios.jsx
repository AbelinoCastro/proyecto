
import React, { useState, useEffect } from 'react';
 
// ─────────────────────────────────────────────────────────────────────────────
// TablaUsuarios
//
// Props desde CatalogosPage:
//   onEdit   → abrir modal de edición       ✔ (siempre llega)
//   onDelete → eliminar físicamente         ✘ (llega null — usuarios no se eliminan)
//   onBaja   → dar de baja (estado = 'I')   ✔ (siempre llega)
//
// CAMBIOS RESPECTO A LA VERSIÓN ANTERIOR:
//   ✖ Se eliminó handleEliminar interno — ahora lo maneja CatalogosPage
//   ✖ Se eliminó usuarioSeleccionado y el modal "Ver" — ya no se necesita
//   ✖ Se eliminó el botón "Ver" — el modal de edición cubre esa función
//   ✔ Se agregó onBaja a los props
//   ✔ Los 3 botones son condicionales según el prop que llegue
// ─────────────────────────────────────────────────────────────────────────────
 
const TablaUsuarios = ({ onEdit, onDelete, onBaja }) => {
    const [datos,    setDatos]    = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error,    setError]    = useState(null);
 
    useEffect(() => {
        const controller = new AbortController();
 
        const cargarDatos = async () => {
            try {
                setCargando(true);
                const res  = await fetch('http://localhost:4000/api/usuarios', {
                    signal: controller.signal
                });
                const data = await res.json();
 
                if (data.ok) {
                    setDatos(data.data);
                } else {
                    setError('Error al obtener usuarios');
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error(err);
                    setError('Error de conexión');
                }
            } finally {
                setCargando(false);
            }
        };
 
        cargarDatos();
        return () => controller.abort();
    }, []);
 
    if (cargando) return <div style={{ padding: '20px' }}>Cargando usuarios...</div>;
    if (error)    return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
 
    // ── Estilos reutilizables ──────────────────────────────────────────────
    const thStyle = { padding: '12px', textAlign: 'left' };
    const tdStyle = { padding: '12px', borderBottom: '1px solid #eee' };
    const btnBase = {
        border: 'none', padding: '6px 10px', borderRadius: '6px',
        color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '500'
    };
 
    return (
        <div style={{ padding: '20px' }}>
            <table style={{
                width: '100%', borderCollapse: 'collapse',
                background: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                borderRadius: '8px', overflow: 'hidden'
            }}>
                <thead>
                    <tr style={{ backgroundColor: '#1e293b', color: '#fff' }}>
                        <th style={thStyle}>ID</th>
                        <th style={thStyle}>Usuario</th>
                        <th style={thStyle}>Empleado</th>
                        <th style={thStyle}>Rol</th>
                        <th style={thStyle}>Estado</th>
                        {/* Columna Acciones solo si hay al menos una acción */}
                        {(onEdit || onDelete || onBaja) && (
                            <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
                        )}
                    </tr>
                </thead>
 
                <tbody>
                    {datos.length > 0 ? (
                        datos.map((u) => (
                            <tr key={u.ID_USUARIO} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ ...tdStyle, color: '#3b82f6', fontWeight: 'bold' }}>
                                    #{u.ID_USUARIO}
                                </td>
                                <td style={{ ...tdStyle, fontWeight: '600' }}>
                                    {u.USERNAME}
                                </td>
                                <td style={tdStyle}>
                                    {u.EMPLEADO || '—'}
                                </td>
                                <td style={tdStyle}>
                                    {u.TIPO_USUARIO || '—'}
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                                        backgroundColor: u.ESTADO === 'ACTIVO' ? '#22c55e' : '#ef4444',
                                        color: '#fff'
                                    }}>
                                        {u.ESTADO}
                                    </span>
                                </td>
 
                                {/* ── Celda de acciones ── */}
                                {(onEdit || onDelete || onBaja) && (
                                    <td style={{
                                        ...tdStyle, textAlign: 'center',
                                        display: 'flex', justifyContent: 'center', gap: '6px'
                                    }}>
                                        {/* Editar — ✔ visible para usuarios */}
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(u)}
                                                style={{ ...btnBase, background: '#3b82f6' }}
                                                title="Editar usuario"
                                            >
                                                Editar
                                            </button>
                                        )}
 
                                        {/* Eliminar — ✘ nunca visible para usuarios
                                            CatalogosPage pasa onDelete=null */}
                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(u.ID_USUARIO)}
                                                style={{ ...btnBase, background: '#ef4444' }}
                                                title="Eliminar usuario"
                                            >
                                                Eliminar
                                            </button>
                                        )}
 
                                        {/* Dar de Baja — ✔ visible para usuarios
                                            Cambia estado a 'I', no borra el registro */}
                                        {onBaja && (
                                            <button
                                                onClick={() => onBaja(u.ID_USUARIO)}
                                                style={{ ...btnBase, background: '#f59e0b' }}
                                                title="Dar de baja al usuario"
                                            >
                                                Dar de Baja
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={onEdit || onDelete || onBaja ? 6 : 5}
                                style={{ padding: '40px', textAlign: 'center', color: '#888' }}
                            >
                                No hay usuarios registrados
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
 
export default TablaUsuarios;