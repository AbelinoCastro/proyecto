import React, { useState, useEffect } from 'react';

// ✔ Ahora incluye onBaja
const TablaFaltas = ({ onEdit, onDelete, onBaja }) => {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const cargarDatos = async () => {
            try {
                setCargando(true);
                const res = await fetch('http://localhost:4000/api/faltas', {
                    signal: controller.signal
                });
                const data = await res.json();

                if (data.ok) {
                    setDatos(data.data);
                } else {
                    setError('Error al cargar faltas');
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error("Error en Faltas:", err);
                    setError('Error de conexión');
                }
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
        return () => controller.abort();
    }, []);

    if (cargando) return <div style={{ padding: '20px' }}>Cargando faltas...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

    const thStyle = { padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' };
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
        <div style={{ padding: '10px' }}>
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: '#fff',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <thead>
                    <tr style={{ backgroundColor: '#1e293b', color: '#fff' }}>
                        <th style={thStyle}>ID</th>
                        <th style={thStyle}>Tipo de Falta</th>
                        <th style={thStyle}>Condición</th>

                        {(onEdit || onDelete || onBaja) && (
                            <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
                        )}
                    </tr>
                </thead>

                <tbody>
                    {datos.length > 0 ? (
                        datos.map(f => (
                            <tr key={f.ID_FALTA}>
                                <td style={{ ...tdStyle, color: '#3b82f6', fontWeight: 'bold' }}>
                                    {String(f.ID_FALTA).padStart(2, '0')}
                                </td>

                                <td style={{ ...tdStyle, fontWeight: '600' }}>
                                    {f.DESCRIPCION}
                                </td>

                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '5px 10px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        backgroundColor: f.ES_PAGADO === 'S' ? '#dcfce7' : '#fee2e2',
                                        color: f.ES_PAGADO === 'S' ? '#166534' : '#991b1b'
                                    }}>
                                        {f.ES_PAGADO === 'S' ? '💰 Pagado' : '🚫 No Pagado'}
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
                                                onClick={() => onEdit(f)}
                                                style={{ ...btnBase, background: '#3b82f6' }}
                                            >
                                                Editar
                                            </button>
                                        )}

                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(f.ID_FALTA)}
                                                style={{ ...btnBase, background: '#ef4444' }}
                                            >
                                                Eliminar
                                            </button>
                                        )}

                                        {onBaja && (
                                            <button
                                                onClick={() => onBaja(f.ID_FALTA)}
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
                                No hay faltas registradas
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TablaFaltas;