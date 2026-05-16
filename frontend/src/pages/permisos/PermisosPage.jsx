import { useEffect, useState } from 'react';
import { getModulos, getRoles, getPermisos, updatePermiso } from '../../services/permisosService';

const ACCIONES = [
    { key: 'PUEDE_VER',      label: 'Ver',       short: 'V' },
    { key: 'PUEDE_CREAR',    label: 'Crear',     short: 'C' },
    { key: 'PUEDE_EDITAR',   label: 'Editar',    short: 'E' },
    { key: 'PUEDE_ELIMINAR', label: 'Eliminar',  short: 'X' },
];

const PermisosPage = () => {
    const [modulos, setModulos]   = useState([]);
    const [roles, setRoles]       = useState([]);
    const [permisos, setPermisos] = useState({}); // { 'ROL_MOD': { puede_ver, puede_crear, ... } }
    const [loading, setLoading]   = useState(true);
    const [msg, setMsg]           = useState(null);

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
        } catch { setMsg({ type: 'error', text: 'Error al cargar permisos' }); }
        finally { setLoading(false); }
    };

    useEffect(() => { cargar(); }, []);

    const showMsg = (type, text) => {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 3000);
    };

    const toggle = async (rol, mod, accion) => {
        const key = `${rol}_${mod}`;
        const current = permisos[key] || { PUEDE_VER: false, PUEDE_CREAR: false, PUEDE_EDITAR: false, PUEDE_ELIMINAR: false };
        const updated = { ...current, [accion]: !current[accion] };
        setPermisos({ ...permisos, [key]: updated });
        try {
            await updatePermiso({
                id_tipo_usuario: rol,
                id_modulo: mod,
                puede_ver:      updated.PUEDE_VER,
                puede_crear:    updated.PUEDE_CREAR,
                puede_editar:   updated.PUEDE_EDITAR,
                puede_eliminar: updated.PUEDE_ELIMINAR,
            });
            showMsg('success', 'Permiso actualizado');
        } catch {
            // revertir
            setPermisos({ ...permisos, [key]: current });
            showMsg('error', 'Error al actualizar');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Gestión de Permisos</h1>
                <p className="text-sm text-gray-400 mt-1">Define qué puede hacer cada rol en cada módulo. Admin tiene acceso total automáticamente.</p>
            </div>

            {msg && (
                <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold
                    ${msg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                    {msg.text}
                </div>
            )}

            <div className="bg-[#121621] border border-white/5 rounded-2xl overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="text-left p-4 text-xs font-semibold text-gray-400 uppercase">Módulo</th>
                            {roles.map(r => (
                                <th key={r.ID_TIPO_USUARIO} colSpan={4} className="text-center p-4 text-xs font-semibold text-gray-400 uppercase border-l border-white/5">
                                    {r.NOMBRE} <span className="text-gray-600">({r.ID_TIPO_USUARIO})</span>
                                </th>
                            ))}
                        </tr>
                        <tr className="border-b border-white/5 bg-black/20">
                            <th></th>
                            {roles.map(r => (
                                ACCIONES.map(a => (
                                    <th key={`${r.ID_TIPO_USUARIO}_${a.key}`}
                                        className="text-center p-2 text-[10px] font-medium text-gray-500 border-l border-white/5"
                                        title={a.label}>
                                        {a.short}
                                    </th>
                                ))
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {modulos.map(m => (
                            <tr key={m.ID_MODULO} className="border-b border-white/5 hover:bg-white/2">
                                <td className="p-3 text-white font-medium">{m.NOMBRE}</td>
                                {roles.map(r => (
                                    ACCIONES.map(a => {
                                        const key = `${r.ID_TIPO_USUARIO}_${m.ID_MODULO}`;
                                        const checked = permisos[key]?.[a.key] || false;
                                        return (
                                            <td key={`${r.ID_TIPO_USUARIO}_${m.ID_MODULO}_${a.key}`}
                                                className="text-center p-3 border-l border-white/5">
                                                <input type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggle(r.ID_TIPO_USUARIO, m.ID_MODULO, a.key)}
                                                    className="w-4 h-4 accent-blue-500 cursor-pointer" />
                                            </td>
                                        );
                                    })
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex gap-4 text-xs text-gray-500">
                <span><strong>V</strong> = Ver</span>
                <span><strong>C</strong> = Crear</span>
                <span><strong>E</strong> = Editar</span>
                <span><strong>X</strong> = Eliminar</span>
            </div>
        </div>
    );
};

export default PermisosPage;
