import { useEffect, useState } from 'react';
import { getUsuarios, createUsuario, updateUsuario, cambiarPassword, cambiarEstadoUsr } from '../../services/usuarioService';
import { getTiposUsuario } from '../../services/tipoUsuarioService';
import { getEmpleados } from '../../services/empleadoService';
import EstadoBadge from '../../components/EstadoBadge';

const Toast = ({ mensaje, tipo, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-10 right-10 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-10 duration-500 ${
      tipo === 'error' ? 'bg-red-950/60 border-red-500/50 text-red-100' : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-100'
    } backdrop-blur-2xl`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${tipo === 'error' ? 'border-red-500/30' : 'border-emerald-500/30'}`}>
        {tipo === 'error' ? '✕' : '✔'}
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{tipo === 'error' ? 'Sistema / Seguridad' : 'Operación Exitosa'}</span>
        <span className="text-[13px] font-bold">{mensaje}</span>
      </div>
    </div>
  );
};

const UsuariosPage = () => {
    const [datos, setDatos] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [empleados, setEmpleados] = useState([]);
    const [buscar, setBuscar] = useState('');
    const [selected, setSelected] = useState(null);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({ id_tipo_usuario: '', id_empleado: '', username: '', password: '' });
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);

    const cargar = async () => {
        try {
            const [resUsr, resTipo, resEmp] = await Promise.all([getUsuarios(), getTiposUsuario(), getEmpleados()]);
            setDatos(resUsr.data.data);
            setTipos(resTipo.data.data);
            setEmpleados(resEmp.data.data || []);
        } catch (err) {
            setToast({ mensaje: 'Error al sincronizar base de usuarios', tipo: 'error' });
        }
    };

    useEffect(() => { cargar(); }, []);

    const filtrados = datos.filter(d =>
        d.USERNAME.toLowerCase().includes(buscar.toLowerCase()) ||
        d.EMPLEADO?.toLowerCase().includes(buscar.toLowerCase())
    );

    const abrirCreate = () => {
        setForm({ id_tipo_usuario: '', id_empleado: '', username: '', password: '' });
        setError('');
        setModal('create');
    };

    const abrirUpdate = () => {
        if (!selected) return;
        setForm({ id_tipo_usuario: selected.ID_TIPO_USUARIO, username: selected.USERNAME });
        setError('');
        setModal('update');
    };

    const abrirPassword = () => {
        if (!selected) return;
        setForm({ password: '' });
        setError('');
        setModal('password');
    };

    const abrirEstado = () => {
        if (!selected) return;
        setModal('estado');
    };

    const guardar = async () => {
        try {
            if (modal === 'create') {
                await createUsuario(form);
            } else if (modal === 'update') {
                await updateUsuario(selected.ID_USUARIO, { id_tipo_usuario: form.id_tipo_usuario, username: form.username });
            } else if (modal === 'password') {
                if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres');
                await cambiarPassword(selected.ID_USUARIO, { password: form.password });
            }
            setModal(null);
            setSelected(null);
            cargar();
            setToast({ mensaje: 'Cambios aplicados correctamente', tipo: 'exito' });
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar cambios');
        }
    };

    const cambiarEstado = async (nuevoEstado) => {
        try {
            await cambiarEstadoUsr(selected.ID_USUARIO, { estado: nuevoEstado });
            setModal(null);
            setSelected(null);
            cargar();
            setToast({ mensaje: `Estatus actualizado a ${nuevoEstado}`, tipo: 'exito' });
        } catch (err) {
            setError(err.response?.data?.message || 'Error al actualizar estatus');
        }
    };

    const labelCls = "text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block opacity-60";
    const inputCls = "bg-[#0b0b0b] border border-white/5 rounded-xl px-4 py-3 text-[12px] text-white outline-none focus:border-[#C5A028]/30 transition-all w-full shadow-inner";

    return (
        <div className="max-w-[1450px] mx-auto py-10 px-8 animate-in fade-in duration-1000 min-h-screen">
            {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}

            {/* Header Maestro */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-12">
                <div>
                    <p className="text-[#C5A028] text-[10px] font-black uppercase tracking-[0.4em] mb-3 opacity-60">Control de Accesos</p>
                    <h1 className="font-serif-title text-6xl text-white tracking-tighter leading-none">Gestión de Usuarios</h1>
                    <p className="text-gray-600 text-[13px] mt-4 font-medium max-w-2xl leading-relaxed">
                        Administración de credenciales y permisos del sistema. Vincule colaboradores a perfiles
                        operativos y asegure la integridad de los accesos a la plataforma.
                    </p>
                </div>
                <div className="flex items-center gap-6 bg-[#111112] border border-white/5 px-6 py-4 rounded-[28px] shadow-2xl">
                    <div className="text-right border-r border-white/5 pr-6">
                        <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest opacity-60">Usuarios Activos</p>
                        <p className="text-white font-black text-3xl tracking-tighter">{datos.length}</p>
                    </div>
                    <button onClick={abrirCreate} className="gold-button text-[10px] uppercase tracking-[0.2em] py-3.5 px-8 shadow-xl active:scale-95 transition-all">
                        + Registrar Cuenta
                    </button>
                </div>
            </div>

            {/* Barra de Búsqueda y Acciones Rápidas */}
            <div className="luxury-card p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/[0.01]">
                <div className="relative w-full max-w-md group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#C5A028] transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input
                        className="bg-[#0b0b0b] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs text-white placeholder-gray-600 outline-none w-full focus:border-[#C5A028]/30 transition-all"
                        placeholder="Buscar por username o colaborador vinculado..."
                        value={buscar}
                        onChange={e => setBuscar(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    <button onClick={abrirUpdate} disabled={!selected} className="dark-button text-[9px] uppercase tracking-widest px-5 py-2.5 disabled:opacity-20">Editar Cuenta</button>
                    <button onClick={abrirPassword} disabled={!selected} className="dark-button text-[9px] uppercase tracking-widest px-5 py-2.5 disabled:opacity-20 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                        Seguridad
                    </button>
                    <button onClick={abrirEstado} disabled={!selected} className="dark-button text-[9px] uppercase tracking-widest px-5 py-2.5 disabled:opacity-20">Estatus</button>
                </div>
            </div>

            {/* Listado Maestro de Usuarios */}
            <div className="luxury-card overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                                <th className="w-14 px-6 py-6 text-center">
                                    <div className="w-4 h-4 border-2 border-white/10 rounded mx-auto"></div>
                                </th>
                                <th className="px-6 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Identificación de Cuenta</th>
                                <th className="px-6 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Colaborador Vinculado</th>
                                <th className="px-6 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Nivel de Perfil</th>
                                <th className="px-6 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {filtrados.map(item => (
                                <tr
                                    key={item.ID_USUARIO}
                                    onClick={() => setSelected(selected?.ID_USUARIO === item.ID_USUARIO ? null : item)}
                                    className={`group cursor-pointer transition-all duration-300 ${selected?.ID_USUARIO === item.ID_USUARIO ? 'bg-[#C5A028]/5 border-l-2 border-l-[#C5A028]' : 'hover:bg-white/[0.015]'}`}
                                >
                                    <td className="px-6 py-6 text-center">
                                        <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${selected?.ID_USUARIO === item.ID_USUARIO ? 'bg-[#C5A028] border-[#C5A028]' : 'border-white/10 group-hover:border-white/30'}`}>
                                            {selected?.ID_USUARIO === item.ID_USUARIO && <svg className="w-3.5 h-3.5 text-black" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1c1c1e] to-[#2c2c2e] border border-white/5 flex items-center justify-center text-[#C5A028] text-[10px] font-black shadow-inner uppercase">
                                                {item.USERNAME.slice(0, 2)}
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-[14px] tracking-tight">{item.USERNAME}</p>
                                                <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-1">Audit ID: #{item.ID_USUARIO}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <p className="text-gray-300 font-medium text-[12px]">{item.EMPLEADO || '— Sin vínculo —'}</p>
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className="text-[#C5A028] text-[10px] font-black uppercase tracking-widest bg-[#C5A028]/5 px-3 py-1 rounded border border-[#C5A028]/10">{item.TIPO_USUARIO}</span>
                                    </td>
                                    <td className="px-6 py-6">
                                        <EstadoBadge estado={item.ESTADO} />
                                    </td>
                                </tr>
                            ))}
                            {filtrados.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-32 text-center opacity-30 italic text-sm">
                                        No se han localizado cuentas de usuario bajo este criterio.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Registro / Actualización — LUXURY STYLE */}
            {(modal === 'create' || modal === 'update') && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="luxury-card w-full max-w-md shadow-2xl border-[#C5A028]/20 animate-in zoom-in-95 duration-500 overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                            <div>
                                <h2 className="text-white text-xs font-black uppercase tracking-[0.4em]">{modal === 'create' ? 'Nueva Credencial' : 'Edición de Perfil'}</h2>
                                <p className="text-gray-500 text-[10px] font-bold mt-1 uppercase tracking-widest">Protocolo de Seguridad NóminaGT</p>
                            </div>
                            <button onClick={() => setModal(null)} className="text-gray-500 hover:text-white transition-all">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-10 space-y-8">
                            {error && <p className="text-red-400 text-[11px] font-bold uppercase tracking-widest p-4 bg-red-500/5 rounded-xl border border-red-500/10 text-center">{error}</p>}

                            <div className="space-y-6">
                                <div>
                                    <label className={labelCls}>Nivel de Acceso (Tipo)</label>
                                    <select className={inputCls} value={form.id_tipo_usuario} onChange={e => setForm({ ...form, id_tipo_usuario: e.target.value })}>
                                        <option value="">Seleccionar rol del sistema...</option>
                                        {tipos.map(t => <option key={t.ID_TIPO_USUARIO} value={t.ID_TIPO_USUARIO}>{t.NOMBRE}</option>)}
                                    </select>
                                </div>
                                {modal === 'create' && (
                                    <div>
                                        <label className={labelCls}>Colaborador a vincular *</label>
                                        <select
                                            className={inputCls}
                                            value={form.id_empleado}
                                            onChange={e => setForm({ ...form, id_empleado: e.target.value })}
                                        >
                                            <option value="">Selecciona un empleado...</option>
                                            {empleados.map(e => (
                                                <option key={e.ID_EMPLEADO} value={e.ID_EMPLEADO}>
                                                    {e.NOMBRE} {e.NOMBRE_PUESTO ? `— ${e.NOMBRE_PUESTO}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className={labelCls}>Nombre de Identidad (Username) *</label>
                                    <input
                                        className={inputCls}
                                        placeholder="Ej: jmendez (sin espacios, mín 3 caracteres)"
                                        minLength={3} maxLength={30}
                                        value={form.username}
                                        onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                                    />
                                </div>
                                {modal === 'create' && (
                                    <div>
                                        <label className={labelCls}>Clave de Acceso Inicial *</label>
                                        <input
                                            className={inputCls}
                                            placeholder="Mínimo 8 caracteres, mezcla letras y números"
                                            type="password"
                                            minLength={8}
                                            value={form.password}
                                            onChange={e => setForm({ ...form, password: e.target.value })}
                                            title="Mínimo 8 caracteres"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-white/5">
                                <button onClick={() => setModal(null)} className="flex-1 dark-button py-4 text-[10px] uppercase tracking-widest">Cancelar</button>
                                <button onClick={guardar} className="flex-1 gold-button py-4 text-[10px] uppercase tracking-widest shadow-2xl shadow-[#C5A028]/10 font-black">Confirmar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Password — LUXURY STYLE */}
            {modal === 'password' && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="luxury-card w-full max-w-sm shadow-2xl border-blue-500/20 animate-in zoom-in-95 duration-500">
                        <div className="p-8 border-b border-white/5 text-center bg-white/[0.01]">
                            <h2 className="text-white text-xs font-black uppercase tracking-[0.4em]">Certificación de Clave</h2>
                            <p className="text-gray-500 text-[10px] font-bold mt-2 uppercase tracking-widest">Reset de Seguridad para {selected?.USERNAME}</p>
                        </div>
                        <div className="p-10 space-y-8">
                            {error && <p className="text-red-400 text-[11px] font-bold uppercase tracking-widest p-4 bg-red-500/5 rounded-xl border border-red-500/10 text-center">{error}</p>}
                            <div>
                                <label className={labelCls}>Nueva Contraseña Maestra</label>
                                <input className={inputCls} placeholder="Nueva clave (8+ chars)" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setModal(null)} className="flex-1 dark-button py-3.5 text-[10px] uppercase tracking-widest">Cancelar</button>
                                <button onClick={guardar} className="flex-1 bg-blue-600 text-white font-black py-3.5 rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20">Actualizar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Estado — LUXURY STYLE */}
            {modal === 'estado' && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="luxury-card w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden">
                        <div className="p-8 border-b border-white/5 text-center bg-white/[0.01]">
                            <h2 className="text-white text-[10px] font-black uppercase tracking-[0.4em]">Estatus de Cuenta</h2>
                            <p className="text-gray-500 text-[9px] font-bold mt-2 uppercase tracking-widest">{selected?.USERNAME}</p>
                        </div>
                        <div className="p-8 space-y-3">
                            {['ACTIVO', 'INACTIVO', 'BLOQUEADO'].map(e => (
                                <button
                                    key={e}
                                    onClick={() => cambiarEstado(e)}
                                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${selected?.ESTADO === e ? 'bg-[#C5A028] text-black border-[#C5A028]' : 'bg-white/[0.02] text-gray-500 border-white/5 hover:text-white hover:bg-white/[0.05]'}`}
                                >
                                    {e}
                                </button>
                            ))}
                            <button onClick={() => setModal(null)} className="w-full mt-4 text-[9px] font-black text-gray-600 uppercase tracking-widest hover:text-white transition-colors">Descartar</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-20 flex justify-center opacity-30">
                <p className="text-[9px] font-black text-gray-700 uppercase tracking-[1.2em]">Dirección de Ciberseguridad NóminaGT</p>
            </div>
        </div>
    );
};

export default UsuariosPage;
