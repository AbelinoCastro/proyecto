import React, { useState, useEffect } from 'react';

const TablaPuestos = ({ onEdit, onDelete, onBaja }) => {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const cargarDatos = async () => {
            try {
                setCargando(true);

                const res = await fetch('http://localhost:4000/api/puestos', {
                    signal: controller.signal
                });

                const data = await res.json();

                if (data.ok) {
                    setDatos(data.data);
                } else {
                    setError('Error al cargar puestos');
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

    if (cargando) return <div style={{ padding: '20px' }}>Cargando puestos...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '15px' }}>Gestión de Puestos</h2>

            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: '#fff',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                borderRadius: '8px',
                overflow: 'hidden',
                fontSize: '13px'
            }}>
                <thead>
                    <tr style={{ backgroundColor: '#1e293b', color: '#fff' }}>
                        <th style={{ padding: '12px' }}>ID</th>
                        <th style={{ padding: '12px' }}>Puesto</th>
                        <th style={{ padding: '12px' }}>Departamento</th>
                        <th style={{ padding: '12px' }}>Sueldo Base</th>

                        {(onEdit || onDelete || onBaja) && (
                            <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
                        )}
                    </tr>
                </thead>

                <tbody>
                    {datos.length === 0 ? (
                        <tr>
                            <td colSpan={onEdit || onDelete || onBaja ? 5 : 4} style={{ padding: '12px', textAlign: 'center' }}>
                                No hay datos
                            </td>
                        </tr>
                    ) : (
                        datos.map((p) => (
                            <tr key={p.ID_PUESTO} style={{ borderBottom: '1px solid #eee' }}>
                                
                                <td style={{ padding: '12px', fontWeight: '600', color: '#3b82f6' }}>
                                    {p.ID_PUESTO}
                                </td>

                                <td style={{ padding: '12px' }}>
                                    <div style={{ fontWeight: '600' }}>
                                        {p.NOMBRE_PUESTO}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                                        {p.DESCRIPCION}
                                    </div>
                                </td>

                                <td style={{ padding: '12px' }}>
                                    {p.ID_DEPARTAMENTO}
                                </td>

                                <td style={{ padding: '12px', fontWeight: '600', color: '#22c55e' }}>
                                    Q {Number(p.SUELDO_BASE).toLocaleString()}
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
                                                onClick={() => onEdit(p)}
                                                style={{ background: '#3b82f6', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}
                                            >
                                                Editar
                                            </button>
                                        )}

                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(p.ID_PUESTO)}
                                                style={{ background: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}
                                            >
                                                Eliminar
                                            </button>
                                        )}

                                        {onBaja && (
                                            <button
                                                onClick={() => onBaja(p.ID_PUESTO)}
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

export default TablaPuestos;