import { useState, useEffect } from 'react';

export const API_BASE = 'http://localhost:4000/api';

export const EstadoBadge = ({ value }) => {
    const upper = value?.toUpperCase();
    const color =
        upper === 'ACTIVO'     ? 'bg-green-500/20 text-green-400' :
        upper === 'INACTIVO'   ? 'bg-red-500/20 text-red-400'    :
        upper === 'SUSPENDIDO' ? 'bg-yellow-500/20 text-yellow-400' :
                                 'bg-gray-500/20 text-gray-400';
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
            {value || '—'}
        </span>
    );
};

const TablaGenerica = ({
    url,
    columns,
    rowKey,
    onEdit,
    onDelete,
    onBaja,
    onToggle,
    onDarBaja,
    emptyText = 'No hay registros',
}) => {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const cargar = async () => {
            try {
                setCargando(true);
                const res = await fetch(url, { signal: controller.signal });
                const data = await res.json();
                if (data.ok) setDatos(data.data);
                else setError('Error al cargar datos');
            } catch (err) {
                if (err.name !== 'AbortError') setError('Error de conexión');
            } finally {
                setCargando(false);
            }
        };

        cargar();
        return () => controller.abort();
    }, [url]);

    if (cargando) return (
        <div className="flex items-center justify-center py-10 text-gray-400 text-sm gap-2">
            <span className="animate-spin">⏳</span> Cargando...
        </div>
    );

    if (error) return (
        <div className="py-10 text-center text-red-400 text-sm">{error}</div>
    );

    const hasActions = onEdit || onDelete || onBaja || onToggle || onDarBaja;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-slate-800/80 text-gray-300 text-left">
                        {columns.map((col) => (
                            <th key={col.key} className="px-4 py-3 font-semibold tracking-wide">
                                {col.label}
                            </th>
                        ))}
                        {hasActions && (
                            <th className="px-4 py-3 font-semibold text-center">Acciones</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {datos.length > 0 ? (
                        datos.map((row) => (
                            <tr
                                key={row[rowKey]}
                                className="border-t border-white/5 hover:bg-white/5 transition-colors"
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={`px-4 py-3 ${col.className ?? 'text-gray-300'}`}
                                    >
                                        {col.render
                                            ? col.render(row[col.key], row)
                                            : (row[col.key] ?? '—')}
                                    </td>
                                ))}
                                {hasActions && (
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center gap-2">
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(row)}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors"
                                                >
                                                    Editar
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(row[rowKey])}
                                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md transition-colors"
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                            {onBaja && (
                                                <button
                                                    onClick={() => onBaja(row[rowKey])}
                                                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded-md transition-colors"
                                                >
                                                    Dar de Baja
                                                </button>
                                            )}
                                            {onDarBaja && (
                                                <button
                                                    onClick={() => onDarBaja(row[rowKey])}
                                                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded-md transition-colors"
                                                >
                                                    Dar de Baja
                                                </button>
                                            )}
                                            {onToggle && (() => {
                                                const activo = row['ESTADO']?.toUpperCase() === 'ACTIVO';
                                                return (
                                                    <button
                                                        onClick={() => onToggle(row[rowKey], activo ? 'INACTIVO' : 'ACTIVO')}
                                                        className={`px-3 py-1 text-white text-xs rounded-md transition-colors ${
                                                            activo
                                                                ? 'bg-yellow-600 hover:bg-yellow-700'
                                                                : 'bg-green-600 hover:bg-green-700'
                                                        }`}
                                                    >
                                                        {activo ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={columns.length + (hasActions ? 1 : 0)}
                                className="px-4 py-12 text-center text-gray-500"
                            >
                                {emptyText}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TablaGenerica;
