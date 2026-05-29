import { useState, useEffect } from 'react';

export const API_BASE = 'http://localhost:4000/api';

export const EstadoBadge = ({ value }) => {
    const upper = value?.toUpperCase();
    if (upper === 'ACTIVO')
        return <span className="bg-[#10b981] text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-tighter">ACTIVO</span>;
    if (upper === 'INACTIVO')
        return <span className="bg-[#ef4444] text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-tighter">INACTIVO</span>;
    return <span className="bg-slate-700 text-gray-300 px-3 py-1 rounded text-[10px] font-black uppercase tracking-tighter">{value || '—'}</span>;
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

    useEffect(() => {
        fetch(url)
            .then(r => r.json())
            .then(data => { if (data.ok) setDatos(data.data); })
            .finally(() => setCargando(false));
    }, [url]);

    if (cargando) return (
        <div className="py-24 text-center">
            <div className="w-8 h-8 border-2 border-[#C5A028]/20 border-t-[#C5A028] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Sincronizando...</p>
        </div>
    );

    const hasActions = onEdit || onDelete || onBaja || onToggle || onDarBaja;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#1a202c] border-b border-white/5">
                        {columns.map((col) => (
                            <th key={col.key} className="px-6 py-4 text-[11px] font-black text-white/50 uppercase tracking-widest">
                                {col.label}
                            </th>
                        ))}
                        {hasActions && <th className="px-6 py-4 text-[11px] font-black text-white/50 uppercase tracking-widest">Acciones</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                    {datos.length > 0 ? (
                        datos.map((row) => (
                            <tr key={row[rowKey]} className="hover:bg-white/[0.01] transition-all duration-200">
                                {columns.map((col) => (
                                    <td key={col.key} className={`px-6 py-4 ${col.className || 'text-gray-300'}`}>
                                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                                    </td>
                                ))}
                                {hasActions && (
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {onEdit && (
                                                <button onClick={() => onEdit(row)} className="px-4 py-2 bg-[#0061f2] hover:bg-blue-600 text-white text-[10px] font-black uppercase rounded shadow-lg transition-all active:scale-95">
                                                    Editar
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button onClick={() => onDelete(row[rowKey])} className="px-4 py-2 bg-[#e81500] hover:bg-red-600 text-white text-[10px] font-black uppercase rounded shadow-lg transition-all active:scale-95">
                                                    Eliminar
                                                </button>
                                            )}
                                            {onDarBaja && (
                                                <button onClick={() => onDarBaja(row[rowKey])} className="px-4 py-2 bg-[#f4a100] hover:bg-orange-600 text-white text-[10px] font-black uppercase leading-tight rounded shadow-lg transition-all active:scale-95">
                                                    Dar de Baja
                                                </button>
                                            )}
                                            {onToggle && (() => {
                                                const activo = row['ESTADO']?.toUpperCase() === 'ACTIVO';
                                                return (
                                                    <button
                                                        onClick={() => onToggle(row[rowKey], activo ? 'INACTIVO' : 'ACTIVO')}
                                                        className={`px-4 py-2 text-[10px] font-black uppercase rounded shadow-lg transition-all active:scale-95 ${
                                                            activo
                                                            ? 'bg-[#C5A028] text-black hover:bg-[#A8871E]'
                                                            : 'bg-emerald-600 text-white hover:bg-emerald-500'
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
                            <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-8 py-24 text-center text-gray-600 uppercase tracking-widest font-black italic opacity-20">
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
