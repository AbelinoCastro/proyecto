import React, { useState, useEffect } from 'react';

const TablaDepartamentos = ({ onEdit, onDelete, onBaja }) => {
    const [datos, setDatos] = useState([]);
    const [loading, setLoading] = useState(true);

    const cargarDatos = async () => {
        try {
            const res = await fetch('http://localhost:4000/api/departamentos');
            const resJson = await res.json();

            if (resJson.ok) {
                setDatos(resJson.data);
            }
        } catch (error) {
            console.error("Error al cargar departamentos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    if (loading) return <div style={{ padding: '20px' }}>Cargando departamentos...</div>;

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

                        {(onEdit || onDelete || onBaja) && (
                            <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
                        )}
                    </tr>
                </thead>

                <tbody>
                    {datos.length > 0 ? (
                        datos.map(d => (
                            <tr key={d.ID_DEPARTAMENTO} style={{ borderBottom: '1px solid #eee' }}>

                                <td style={{ ...tdStyle, color: '#3b82f6', fontWeight: 'bold' }}>
                                    {d.ID_DEPARTAMENTO}
                                </td>

                                <td style={{ ...tdStyle, fontWeight: '600' }}>
                                    {d.NOMBRE_DEPARTAMENTO}
                                </td>

                                <td style={tdStyle}>
                                    {d.DESCRIPCION || 'Sin descripción'}
                                </td>

                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '5px 10px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        backgroundColor: d.ESTADO?.toUpperCase() === 'ACTIVO'
                                            ? '#22c55e'
                                            : '#ef4444',
                                        color: '#fff'
                                    }}>
                                        {d.ESTADO}
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

                                        {onBaja && (
                                            <button
                                                onClick={() => onBaja(d.ID_DEPARTAMENTO)}
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
                                colSpan={onEdit || onDelete || onBaja ? 5 : 4}
                                style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}
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