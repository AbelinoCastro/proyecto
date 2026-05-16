import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, getMe } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser]         = useState(null);
    const [permisos, setPermisos] = useState([]);
    const [loading, setLoading]   = useState(true);

    // Restaurar sesión al cargar
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { setLoading(false); return; }
        getMe()
            .then(res => {
                setUser(res.data.data.user);
                setPermisos(res.data.data.permisos || []);
                localStorage.setItem('user', JSON.stringify(res.data.data.user));
                localStorage.setItem('permisos', JSON.stringify(res.data.data.permisos || []));
            })
            .catch(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('permisos');
            })
            .finally(() => setLoading(false));
    }, []);

    const login = async (username, password) => {
        const res = await loginApi(username, password);
        const { token, user: u, permisos: p } = res.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(u));
        localStorage.setItem('permisos', JSON.stringify(p || []));
        setUser(u);
        setPermisos(p || []);
        return u;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('permisos');
        setUser(null);
        setPermisos([]);
        window.location.href = '/login';
    };

    // Helpers de permisos
    const can = (id_modulo, accion = 'ver') => {
        if (user?.rol === 'ADM') return true;
        const p = permisos.find(x => x.ID_MODULO === id_modulo);
        if (!p) return false;
        return p[`PUEDE_${accion.toUpperCase()}`] === 1;
    };

    return (
        <AuthContext.Provider value={{ user, permisos, loading, login, logout, can }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
