import React, { useState, useEffect } from 'react';

const TablaMotivoBaja = ({ onEdit, onDelete, onBaja }) => {
    const [datos, setDatos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const cargarDatos = async () => {
            try {
                const res = await fetch('http://localhost:4000/api/motivo-baja', {
                    signal: controller.signal
                });

                const data = await res.json();

                if (data.ok) {
                    setDatos(data.data);
                } else {
                    setError('Error al cargar datos');
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error(err);
                    setError('Error de conexión');
                }
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
        return () => controller.abort();
    }, []);

    if (loading) return <div style={{ padding: '20px' }}>Cargando datos...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

    const thStyle = { padding: '12px', textAlign: 'left' };
    const tdStyle = { padding: '12px', borderBottom: '1px solid #eee' };

    const btnBase = {
        border: 'none',
        padding: '6px 10px',
        borderRadius: '6px',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '13px'
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '15px' }}>Motivos de Baja</h2>

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
                        <th style={thStyle}>ID</th>
                        <th style={thStyle}>Motivo</th>
                        <th style={thStyle}>Estado</th>

                        {(onEdit || onDelete || onBaja) && (
                            <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
                        )}
                    </tr>
                </thead>

                <tbody>
                    {datos.length > 0 ? (
                        datos.map(m => (
                            <tr key={m.ID_MOTIVO_BAJA} style={{ borderBottom: '1px solid #eee' }}>
                                
                                <td style={{ ...tdStyle, color: '#3b82f6', fontWeight: 'bold' }}>
                                    {m.ID_MOTIVO_BAJA}
                                </td>

                                <td style={{ ...tdStyle, fontWeight: '600' }}>
                                    {m.DESCRIPCION}
                                </td>

                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '5px 10px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        backgroundColor: m.ESTADO?.toUpperCase() === 'ACTIVO'
                                            ? '#22c55e'
                                            : '#ef4444',
                                        color: '#fff'
                                    }}>
                                        {m.ESTADO}
                                    </span>
                                </td>

                                {(onEdit || onDelete || onBaja) && (
                                    <td style={{
                                        ...tdStyle,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}>
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(m)}
                                                style={{ ...btnBase, background: '#3b82f6' }}
                                            >
                                                Editar
                                            </button>
                                        )}

                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(m.ID_MOTIVO_BAJA)}
                                                style={{ ...btnBase, background: '#ef4444' }}
                                            >
                                                Eliminar
                                            </button>
                                        )}

                                        {onBaja && (
                                            <button
                                                onClick={() => onBaja(m.ID_MOTIVO_BAJA)}
                                                style={{ ...btnBase, background: '#f59e0b' }}
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
                                colSpan={onEdit || onDelete || onBaja ? 4 : 3}
                                style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}
                            >
                                No hay motivos de baja
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TablaMotivoBaja;