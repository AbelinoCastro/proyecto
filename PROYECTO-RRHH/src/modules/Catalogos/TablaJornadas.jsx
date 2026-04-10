import React, { useState, useEffect } from 'react';

const TablaJornadas = ({ onEdit, onDelete, onBaja }) => {
    const [jornadas, setJornadas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const cargarDatos = async () => {
            try {
                setCargando(true);

                const res = await fetch('http://localhost:4000/api/jornadas', {
                    signal: controller.signal
                });

                const data = await res.json();

                if (data.ok) {
                    setJornadas(data.data);
                } else {
                    setError('Error al cargar jornadas');
                }

            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error("Error cargando jornadas:", err);
                    setError('Error de conexión');
                }
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();

        return () => controller.abort();
    }, []);

    if (cargando) return <div style={{ padding: '20px' }}>Cargando jornadas...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '15px' }}>Gestión de Jornadas</h2>

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
                        <th style={{ padding: '12px' }}>Tipo de Jornada</th>
                        <th style={{ padding: '12px' }}>Horas Diarias</th>

                        {(onEdit || onDelete || onBaja) && (
                            <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
                        )}
                    </tr>
                </thead>

                <tbody>
                    {jornadas.length === 0 ? (
                        <tr>
                            <td colSpan={onEdit || onDelete || onBaja ? 4 : 3} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                                No hay jornadas registradas
                            </td>
                        </tr>
                    ) : (
                        jornadas.map((j) => (
                            <tr key={j.ID_JORNADA} style={{ borderBottom: '1px solid #eee' }}>
                                
                                <td style={{ padding: '12px', fontWeight: '600', color: '#3b82f6' }}>
                                    #{j.ID_JORNADA}
                                </td>

                                <td style={{ padding: '12px', fontWeight: '600' }}>
                                    {j.NOMBRE_JORNADA}
                                </td>

                                <td style={{ padding: '12px', color: '#475569' }}>
                                    {j.HORAS_DIARIAS} hrs
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
                                                onClick={() => onEdit(j)}
                                                style={{ background: '#3b82f6', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}
                                            >
                                                Editar
                                            </button>
                                        )}

                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(j.ID_JORNADA)}
                                                style={{ background: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}
                                            >
                                                Eliminar
                                            </button>
                                        )}

                                        {onBaja && (
                                            <button
                                                onClick={() => onBaja(j.ID_JORNADA)}
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

export default TablaJornadas;