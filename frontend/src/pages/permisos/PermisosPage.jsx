import { useEffect, useState } from 'react';
import { getModulos, getRoles, getPermisos, updatePermiso } from '../../services/permisosService';

const ACCIONES = [
    { key: 'PUEDE_VER',      label: 'Vista',      short: 'V', icon: '👁️' },
    { key: 'PUEDE_CREAR',    label: 'Escritura',  short: 'C', icon: '✍️' },
    { key: 'PUEDE_EDITAR',   label: 'Edición',    short: 'E', icon: '✏️' },
    { key: 'PUEDE_ELIMINAR', label: 'Revocación', short: 'X', icon: '🗑️' },
];

const Toast = ({ mensaje, tipo, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border animate-in slide-in-from-right-10 duration-500 ${
      tipo === 'error' ? 'bg-red-950/60 border-red-500/40 text-red-100' : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-100'
    } backdrop-blur-xl`}>
      <div className="flex flex-col">
        <span className="text-[12px] font-bold">{mensaje}</span>
      </div>
    </div>
  );
};

const PermisosPage = () => {
    const [modulos, setModulos]   = useState([]);
    const [roles, setRoles]       = useState([]);
    const [permisos, setPermisos] = useState({});
    const [loading, setLoading]   = useState(true);
    const [toast, setToast]       = useState(null);

    const cargar = async () => {
        setLoading(true);
        try {
            const [m, r, p] = await Promise.all([getModulos(), getRoles(), getPermisos()]);
            setModulos(m.data.data || []);
            setRoles((r.data.data || []).filter(x => x.ID_TIPO_USUARIO !== 'ADM'));
            const map = {};
            (p.data.data || []).forEach(row => {
                map[`${row.ID_TIPO_USUARIO}_${row.ID_MODULO}`] = {
                    PUEDE_VER:      row.PUEDE_VER === 1,
                    PUEDE_CREAR:    row.PUEDE_CREAR === 1,
                    PUEDE_EDITAR:   row.PUEDE_EDITAR === 1,
                    PUEDE_ELIMINAR: row.PUEDE_ELIMINAR === 1,
                };
            });
            setPermisos(map);
        } catch { setToast({ mensaje: 'Error de sincronización', tipo: 'error' }); }
        finally { setLoading(false); }
    };

    useEffect(() => { cargar(); }, []);

    const toggle = async (rol, mod, accion) => {
        const key = `${rol}_${mod}`;
        const current = permisos[key] || { PUEDE_VER: false, PUEDE_CREAR: false, PUEDE_EDITAR: false, PUEDE_ELIMINAR: false };
        const updated = { ...current, [accion]: !current[accion] };
        setPermisos({ ...permisos, [key]: updated });
        try {
            await updatePermiso({
                id_tipo_usuario: rol, id_modulo: mod,
                puede_ver: updated.PUEDE_VER, puede_crear: updated.PUEDE_CREAR,
                puede_editar: updated.PUEDE_EDITAR, puede_eliminar: updated.PUEDE_ELIMINAR,
            });
            setToast({ mensaje: 'Acceso actualizado', tipo: 'exito' });
        } catch {
            setPermisos({ ...permisos, [key]: current });
            setToast({ mensaje: 'Error al actualizar', tipo: 'error' });
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-[#C5A028]/20 border-t-[#C5A028] rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-[1300px] mx-auto py-6 px-6 animate-in fade-in duration-700">
            {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}

            {/* Header Compacto */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <p className="text-[#C5A028] text-[9px] font-black uppercase tracking-[0.4em] mb-2 opacity-60">Privilegios de Sistema</p>
                    <h1 className="font-serif-title text-4xl text-white tracking-tight leading-none">Matriz de Permisos</h1>
                </div>
                <div className="flex items-center gap-4 bg-[#111112] border border-white/5 px-6 py-3 rounded-2xl shadow-lg">
                    <div className="text-right">
                        <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest opacity-60">Roles</p>
                        <p className="text-white font-black text-xl leading-none">{roles.length}</p>
                    </div>
                    <div className="w-[1px] h-8 bg-white/5"></div>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </div>
            </div>

            {/* Matriz Compacta y Optimizada */}
            <div className="luxury-card overflow-hidden shadow-2xl border-white/[0.04]">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                                <th className="px-6 py-5 text-[8px] font-black text-gray-500 uppercase tracking-[0.3em] w-[200px] sticky left-0 bg-[#121214] z-20">Módulo Operativo</th>
                                {roles.map(r => (
                                    <th key={r.ID_TIPO_USUARIO} colSpan={4} className="text-center px-2 py-4 border-l border-white/[0.03]">
                                        <p className="text-[#C5A028] text-[9px] font-black uppercase tracking-[0.1em] truncate" title={r.NOMBRE}>{r.NOMBRE}</p>
                                    </th>
                                ))}
                            </tr>
                            <tr className="border-b border-white/[0.04] bg-white/[0.005]">
                                <th className="sticky left-0 bg-[#121214] z-20"></th>
                                {roles.map(r => (
                                    ACCIONES.map(a => (
                                        <th key={`${r.ID_TIPO_USUARIO}_${a.key}`}
                                            className="text-center p-2 text-[7.5px] font-black text-gray-600 border-l border-white/[0.01]"
                                            title={a.label}>
                                            {a.short}
                                        </th>
                                    ))
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {modulos.map(m => (
                                <tr key={m.ID_MODULO} className="hover:bg-white/[0.01] transition-all group">
                                    <td className="px-6 py-4 sticky left-0 bg-[#121214] group-hover:bg-[#1a1a1c] z-10 transition-colors">
                                        <p className="text-white font-bold text-[11.5px] tracking-tight truncate">{m.NOMBRE}</p>
                                    </td>
                                    {roles.map(r => (
                                        ACCIONES.map(a => {
                                            const key = `${r.ID_TIPO_USUARIO}_${m.ID_MODULO}`;
                                            const checked = permisos[key]?.[a.key] || false;
                                            return (
                                                <td key={`${r.ID_TIPO_USUARIO}_${m.ID_MODULO}_${a.key}`}
                                                    className="text-center py-4 px-1 border-l border-white/[0.01]">
                                                    <button
                                                        onClick={() => toggle(r.ID_TIPO_USUARIO, m.ID_MODULO, a.key)}
                                                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200 border mx-auto ${
                                                            checked
                                                            ? 'bg-[#C5A028] border-[#C5A028] shadow-[0_0_10px_rgba(197,160,40,0.2)]'
                                                            : 'bg-[#0b0b0b] border-white/5 hover:border-[#C5A028]/30'
                                                        }`}
                                                    >
                                                        {checked && (
                                                            <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </td>
                                            );
                                        })
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Glosario Compacto */}
            <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 opacity-50">
                {ACCIONES.map(a => (
                    <div key={a.key} className="flex items-center gap-2">
                        <span className="text-white font-black text-[9px] uppercase tracking-widest">{a.short}:</span>
                        <span className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">{a.label}</span>
                    </div>
                ))}
            </div>

            <div className="mt-12 flex justify-center opacity-20">
                <p className="text-[8px] font-black text-gray-700 uppercase tracking-[0.8em]">Security Matrix NóminaGT Enterprise</p>
            </div>
        </div>
    );
};

export default PermisosPage;
