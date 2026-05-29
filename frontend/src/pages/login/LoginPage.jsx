import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate  = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd]   = useState(false);
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    const labelCls = "text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block opacity-60";
    const inputCls = "bg-[#0b0b0b] border border-white/5 rounded-xl px-4 py-3.5 text-[13px] text-white outline-none focus:border-[#C5A028]/40 transition-all w-full shadow-inner";

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 relative overflow-hidden">
            {/* Fondo decorativo */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#C5A028]/5 via-transparent to-blue-500/5 pointer-events-none" />
            <div className="absolute top-10 left-10 w-72 h-72 bg-[#C5A028]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-in fade-in duration-1000">

                {/* Encabezado corporativo */}
                <div className="text-center mb-10">
                    <p className="text-[#C5A028] text-[10px] font-black uppercase tracking-[0.4em] mb-3 opacity-60">
                        Plataforma Corporativa
                    </p>
                    <h1 className="font-serif-title text-5xl text-white tracking-tighter leading-none mb-3">
                        Gestión de Nómina
                    </h1>
                    <p className="text-gray-600 text-[12px] font-medium tracking-wide">
                        Acceso restringido · Solo personal autorizado
                    </p>
                </div>

                {/* Tarjeta luxury */}
                <form onSubmit={handleSubmit}
                    className="luxury-card p-10 space-y-6 border-t-2 border-t-[#C5A028]/30 shadow-2xl bg-[#111112]">

                    {/* Sub-encabezado */}
                    <div className="pb-4 border-b border-white/5">
                        <p className="text-[#C5A028] text-[9px] font-black uppercase tracking-[0.3em] opacity-70 mb-1">
                            Autenticación
                        </p>
                        <h2 className="text-white text-lg font-bold tracking-tight">Iniciar Sesión</h2>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="px-4 py-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-[12px] flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center border border-red-500/30 shrink-0 text-red-400 font-black">✕</div>
                            <span className="font-bold">{error}</span>
                        </div>
                    )}

                    {/* Usuario */}
                    <div>
                        <label className={labelCls}>Identificador de Usuario</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required autoFocus
                            placeholder="Tu usuario"
                            className={inputCls}
                        />
                    </div>

                    {/* Contraseña */}
                    <div>
                        <label className={labelCls}>Clave de Acceso</label>
                        <div className="relative">
                            <input
                                type={showPwd ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className={inputCls + ' pr-12'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPwd(v => !v)}
                                tabIndex={-1}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-white/5 text-gray-500 hover:text-[#C5A028] transition-colors flex items-center justify-center"
                                title={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {showPwd ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Botón */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-[#C5A028] hover:bg-[#D4B040] disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#C5A028]/20"
                    >
                        {loading && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                        {loading ? 'Validando...' : 'Acceder al Sistema'}
                    </button>

                    {/* Footer del card */}
                    <p className="text-center text-[10px] text-gray-600 font-medium uppercase tracking-widest pt-2">
                        Sesión protegida · TLS 1.3
                    </p>
                </form>

                {/* Pie corporativo */}
                <div className="text-center mt-8">
                    <p className="text-gray-700 text-[10px] font-medium uppercase tracking-widest">
                        Sistema de Gestión de Nómina · v Beta 2.0
                    </p>
                    <p className="text-gray-800 text-[9px] mt-1 tracking-widest">
                        © {new Date().getFullYear()} · Todos los derechos reservados
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
