import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiereModulo = null, accion = 'ver' }) => {
    const { user, loading, can } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0b0e14]">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

    if (requiereModulo && !can(requiereModulo, accion)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0b0e14]">
                <div className="bg-[#121621] border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
                    <h2 className="text-xl font-bold text-red-400 mb-2">Acceso denegado</h2>
                    <p className="text-gray-400 text-sm">No tienes permisos para acceder a este módulo.</p>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
