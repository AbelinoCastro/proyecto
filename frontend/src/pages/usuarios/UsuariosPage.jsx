import { useEffect, useState } from 'react';
import { getUsuarios, createUsuario, updateUsuario, cambiarPassword, cambiarEstadoUsr } from '../../services/usuarioService';
import { getTiposUsuario } from '../../services/tipoUsuarioService';
import EstadoBadge from '../../components/EstadoBadge';

const UsuariosPage = () => {
    const [datos, setDatos] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [buscar, setBuscar] = useState('');
    const [selected, setSelected] = useState(null);
    const [modal, setModal] = useState(null); // 'create' | 'update' | 'password' | 'estado'
    const [form, setForm] = useState({ id_tipo_usuario: '', id_empleado: '', username: '', password: '' });
    const [error, setError] = useState('');

    const cargar = async () => {
        const [resUsr, resTipo] = await Promise.all([getUsuarios(), getTiposUsuario()]);
        setDatos(resUsr.data.data);
        setTipos(resTipo.data.data);
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
                await cambiarPassword(selected.ID_USUARIO, { password: form.password });
            }
            setModal(null);
            setSelected(null);
            cargar();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar');
        }
    };

    const cambiarEstado = async (nuevoEstado) => {
        try {
            await cambiarEstadoUsr(selected.ID_USUARIO, { estado: nuevoEstado });
            setModal(null);
            setSelected(null);
            cargar();
        } catch (err) {
            setError(err.response?.data?.message || 'Error');
        }
    };

    return (
        <div className="text-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold">Usuarios</h1>
                <div className="flex items-center gap-2 bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-48"
                        placeholder="Buscar..."
                        value={buscar}
                        onChange={e => setBuscar(e.target.value)}
                    />
                </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 mb-4">
                <button onClick={abrirCreate} className="px-4 py-2 bg-[#1a1f2e] border border-white/10 rounded-lg text-sm hover:bg-white/10 transition">+ Create</button>
                <button onClick={abrirUpdate} disabled={!selected} className="px-4 py-2 bg-[#1a1f2e] border border-white/10 rounded-lg text-sm hover:bg-white/10 transition disabled:opacity-40">Update</button>
                <button onClick={abrirPassword} disabled={!selected} className="px-4 py-2 bg-[#1a1f2e] border border-white/10 rounded-lg text-sm hover:bg-white/10 transition disabled:opacity-40">Password</button>
                <button onClick={abrirEstado} disabled={!selected} className="px-4 py-2 bg-[#1a1f2e] border border-white/10 rounded-lg text-sm hover:bg-white/10 transition disabled:opacity-40">Estado</button>
            </div>

            {/* Tabla */}
            <div className="bg-[#1a1f2e] rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="w-10 px-4 py-3"></th>
                            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium tracking-wider">ID</th>
                            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium tracking-wider">USERNAME</th>
                            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium tracking-wider">EMPLEADO</th>
                            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium tracking-wider">TIPO</th>
                            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium tracking-wider">ESTADO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.map((item) => (
                            <tr
                                key={item.ID_USUARIO}
                                onClick={() => setSelected(selected?.ID_USUARIO === item.ID_USUARIO ? null : item)}
                                className={`border-b border-white/5 cursor-pointer transition-colors ${selected?.ID_USUARIO === item.ID_USUARIO ? 'bg-blue-600/20' : 'hover:bg-white/5'
                                    }`}
                            >
                                <td className="px-4 py-3">
                                    <input type="checkbox" readOnly checked={selected?.ID_USUARIO === item.ID_USUARIO} className="accent-blue-500" />
                                </td>
                                <td className="px-4 py-3 text-gray-300">{item.ID_USUARIO}</td>
                                <td className="px-4 py-3 font-medium">{item.USERNAME}</td>
                                <td className="px-4 py-3 text-gray-400">{item.EMPLEADO}</td>
                                <td className="px-4 py-3 text-gray-400">{item.TIPO_USUARIO}</td>
                                <td className="px-4 py-3"><EstadoBadge estado={item.ESTADO} /></td>
                            </tr>
                        ))}
                        {filtrados.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Sin resultados</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Create / Update */}
            {(modal === 'create' || modal === 'update') && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-[#1a1f2e] rounded-xl border border-white/10 p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-4">{modal === 'create' ? 'Crear Usuario' : 'Actualizar Usuario'}</h2>
                        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                        <div className="flex flex-col gap-3">
                            <select
                                className="bg-[#131720] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
                                value={form.id_tipo_usuario}
                                onChange={e => setForm({ ...form, id_tipo_usuario: e.target.value })}
                            >
                                <option value="">Selecciona tipo de usuario</option>
                                {tipos.map(t => (
                                    <option key={t.ID_TIPO_USUARIO} value={t.ID_TIPO_USUARIO}>{t.NOMBRE}</option>
                                ))}
                            </select>
                            {modal === 'create' && (
                                <input
                                    className="bg-[#131720] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
                                    placeholder="ID Empleado"
                                    type="number"
                                    value={form.id_empleado}
                                    onChange={e => setForm({ ...form, id_empleado: e.target.value })}
                                />
                            )}
                            <input
                                className="bg-[#131720] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
                                placeholder="Username"
                                value={form.username}
                                onChange={e => setForm({ ...form, username: e.target.value })}
                            />
                            {modal === 'create' && (
                                <input
                                    className="bg-[#131720] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
                                    placeholder="Contraseña (mínimo 8 caracteres)"
                                    type="password"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                />
                            )}
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">Cancelar</button>
                            <button onClick={guardar} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Password */}
            {modal === 'password' && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-[#1a1f2e] rounded-xl border border-white/10 p-6 w-full max-w-sm">
                        <h2 className="text-lg font-semibold mb-4">Cambiar Contraseña</h2>
                        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                        <input
                            className="w-full bg-[#131720] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
                            placeholder="Nueva contraseña (mínimo 8 caracteres)"
                            type="password"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                        />
                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">Cancelar</button>
                            <button onClick={guardar} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Estado */}
            {modal === 'estado' && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-[#1a1f2e] rounded-xl border border-white/10 p-6 w-full max-w-sm">
                        <h2 className="text-lg font-semibold mb-2">Cambiar Estado</h2>
                        <p className="text-gray-400 text-sm mb-4">Selecciona el nuevo estado para <span className="text-white font-medium">{selected?.USERNAME}</span></p>
                        <div className="flex flex-col gap-2">
                            {['ACTIVO', 'INACTIVO', 'BLOQUEADO'].map(e => (
                                <button
                                    key={e}
                                    onClick={() => cambiarEstado(e)}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${selected?.ESTADO === e ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                                        }`}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end mt-4">
                            <button onClick={() => setModal(null)} className="text-sm text-gray-400 hover:text-white transition">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsuariosPage;