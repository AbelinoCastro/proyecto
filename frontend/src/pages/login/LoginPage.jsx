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

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0b0e14] p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 mb-4">
                        <span className="text-3xl">💼</span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-white">Gestión de Nómina</h1>
                    <p className="text-sm text-gray-400 mt-1">Inicia sesión para continuar</p>
                </div>

                <form onSubmit={handleSubmit}
                    className="bg-[#121621] border border-white/5 rounded-[28px] shadow-2xl p-8 space-y-5">

                    {error && (
                        <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            ✕ {error}
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 block">
                            Usuario
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required autoFocus
                            className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="admin"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 block">
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={showPwd ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl px-5 py-4 pr-14 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPwd(v => !v)}
                                tabIndex={-1}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors text-xl"
                                title={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {showPwd ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                    >
                        {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {loading ? 'Ingresando...' : 'Iniciar sesión'}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-600 mt-6">
                    Sistema de Gestión de Nómina · {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
