import React, { useState, useEffect } from 'react';

const TablaTipoUsuario = ({ onEdit, onDelete, onBaja }) => {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const cargarDatos = async () => {
            try {
                setCargando(true);

                const res = await fetch('http://localhost:4000/api/tipo-usuario', {
                    signal: controller.signal
                });

                const data = await res.json();

                if (data.ok) {
                    setDatos(data.data);
                } else {
                    setError('Error al cargar roles');
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

    if (cargando) return <div style={{ padding: '20px' }}>Cargando roles...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '15px' }}>Gestión de Roles</h2>

            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: '#fff',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <thead>
                    <tr style={{ backgroundColor: '#1e293b', color: '#fff' }}>
                        <th style={{ padding: '12px' }}>ID</th>
                        <th style={{ padding: '12px' }}>Rol</th>
                        <th style={{ padding: '12px' }}>Estado</th>

                        {(onEdit || onDelete || onBaja) && (
                            <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
                        )}
                    </tr>
                </thead>

                <tbody>
                    {datos.length === 0 ? (
                        <tr>
                            <td colSpan={onEdit || onDelete || onBaja ? 4 : 3} style={{ padding: '12px', textAlign: 'center' }}>
                                No hay datos
                            </td>
                        </tr>
                    ) : (
                        datos.map((item) => (
                            <tr key={item.ID_TIPO_USUARIO} style={{ borderBottom: '1px solid #eee' }}>
                                
                                <td style={{ padding: '12px', fontWeight: '600', color: '#3b82f6' }}>
                                    {item.ID_TIPO_USUARIO}
                                </td>

                                <td style={{ padding: '12px' }}>
                                    <div style={{ fontWeight: '600' }}>
                                        {item.NOMBRE || item.DESCRIPCION}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                                        {item.COMENTARIO || 'Acceso al sistema'}
                                    </div>
                                </td>

                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        padding: '5px 10px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        backgroundColor: item.ESTADO === 'ACTIVO' ? '#22c55e' : '#ef4444',
                                        color: '#fff'
                                    }}>
                                        {item.ESTADO || 'ACTIVO'}
                                    </span>
                                </td>

                                {(onEdit || onDelete || onBaja) && (
                                    <td style={{
                                        padding: '12px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}>
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(item)}
                                                style={{ background: '#3b82f6', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}
                                            >
                                                Editar
                                            </button>
                                        )}

                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(item.ID_TIPO_USUARIO)}
                                                style={{ background: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}
                                            >
                                                Eliminar
                                            </button>
                                        )}

                                        {onBaja && (
                                            <button
                                                onClick={() => onBaja(item.ID_TIPO_USUARIO)}
                                                style={{ background: '#f59e0b', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}
                                            >
                                                Dar de Baja
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TablaTipoUsuario;