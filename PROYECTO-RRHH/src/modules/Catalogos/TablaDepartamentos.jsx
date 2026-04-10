import React, { useState, useEffect } from 'react';

const TablaDepartamentos = ({ onEdit, onDelete }) => {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const cargarDatos = async () => {
            try {
                setCargando(true);

                const res = await fetch('http://localhost:4000/api/departamentos', {
                    signal: controller.signal
                });

                // 🔍 Ver si responde el servidor
                if (!res.ok) {
                    throw new Error(`Error HTTP: ${res.status}`);
                }

                const data = await res.json();

                // 🔍 Validar estructura
                if (data.ok && Array.isArray(data.data)) {
                    setDatos(data.data);
                } else {
                    console.error("Respuesta inesperada:", data);
                    setError('Datos inválidos del servidor');
                }

            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error("ERROR REAL:", err);
                    setError(err.message);
                }
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
        return () => controller.abort();
    }, []);

    // 🔄 Estados de carga / error
    if (cargando) return <div style={{ padding: '20px' }}>Cargando departamentos...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

    // 🎨 Estilos
    const thStyle = { padding: '12px', textAlign: 'left' };
    const tdStyle = { padding: '12px', borderBottom: '1px solid #eee' };

    const btnBase = {
        border: 'none',
        padding: '6px 10px',
        borderRadius: '6px',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500'
    };

    return (
        <div style={{ padding: '20px' }}>
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
                        <th style={thStyle}>Nombre</th>
                        <th style={thStyle}>Descripción</th>
                        <th style={thStyle}>Estado</th>
                        {(onEdit || onDelete) && (
                            <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
                        )}
                    </tr>
                </thead>

                <tbody>
                    {datos.length > 0 ? (
                        datos.map((d) => (
                            <tr key={d.ID_DEPARTAMENTO}>
                                <td style={{ ...tdStyle, fontWeight: 'bold', color: '#3b82f6' }}>
                                    {String(d.ID_DEPARTAMENTO).padStart(3, '0')}
                                </td>
                                <td style={{ ...tdStyle, fontWeight: '600' }}>
                                    {d.NOMBRE_DEPARTAMENTO}
                                </td>
                                <td style={tdStyle}>
                                    {d.DESCRIPCION || '—'}
                                </td>
                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        backgroundColor: d.ESTADO === 'ACTIVO' ? '#22c55e' : '#ef4444',
                                        color: '#fff'
                                    }}>
                                        {d.ESTADO || 'ACTIVO'}
                                    </span>
                                </td>

                                {(onEdit || onDelete) && (
                                    <td style={{
                                        ...tdStyle,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}>
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(d)}
                                                style={{ ...btnBase, background: '#3b82f6' }}
                                            >
                                                Editar
                                            </button>
                                        )}

                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(d.ID_DEPARTAMENTO)}
                                                style={{ ...btnBase, background: '#ef4444' }}
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={onEdit || onDelete ? 5 : 4}
                                style={{ padding: '40px', textAlign: 'center', color: '#888' }}
                            >
                                No hay departamentos registrados
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TablaDepartamentos;