import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Cada item declara el id_modulo de BD para filtrarlo por permisos
const menuGroups = [
    {
        group: 'Principal',
        items: [
            { path: '/dashboard', label: 'Inicio', icon: '📊', modulo: 'DASHBOARD' },
        ],
    },
    {
        group: 'Nómina',
        items: [
            { path: '/calcular-nomina', label: 'Calcular Nómina', icon: '🧮', modulo: 'NOMINA' },
            { path: '/periodos',        label: 'Períodos',        icon: '📅', modulo: 'PERIODOS' },
            { path: '/historial',       label: 'Historial',       icon: '📜', modulo: 'HISTORIAL' },
        ],
    },
    {
        group: 'Asistencia',
        items: [
            { path: '/horasextra',      label: 'Horas Extra',      icon: '⏱️', modulo: 'HORASEXTRA' },
            { path: '/registro-faltas', label: 'Registro Faltas',  icon: '📋', modulo: 'FALTAS' },
        ],
    },
    {
        group: 'Personal',
        items: [
            { path: '/catalogos',    label: 'Catálogos',    icon: '⚙️', modulo: 'CATALOGOS' },
            { path: '/patrono',      label: 'Patrono',      icon: '🏢', modulo: 'PATRONO' },
            { path: '/empleado',     label: 'Empleados',    icon: '👤', modulo: 'EMPLEADOS' },
            { path: '/asignaciones', label: 'Asignaciones', icon: '🏷️', modulo: 'ASIGNAC' },
        ],
    },
    {
        group: 'Contabilidad',
        items: [
            { path: '/igss',             label: 'IGSS',      icon: '🛡️', modulo: 'IGSS' },
            { path: '/isr',              label: 'ISR',       icon: '🧾', modulo: 'ISR' },
            { path: '/prestamos',        label: 'Préstamos', icon: '💳', modulo: 'PRESTAMOS' },
            { path: '/polizas-seguros',  label: 'Pólizas',   icon: '☂️', modulo: 'SEGUROS' },
        ],
    },
    {
        group: 'Reportería',
        items: [
            { path: '/reporteria', label: 'Reportería', icon: '📊', modulo: 'REPORTERIA' },
        ],
    },
    {
        group: 'Administración',
        items: [
            { path: '/permisos', label: 'Permisos', icon: '🔒', modulo: 'PERMISOS' },
        ],
    },
];

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(true);
    const { user, logout, can } = useAuth();

    const handleNav   = () => setCollapsed(true);
    const handleEnter = () => setCollapsed(false);
    const handleLeave = () => setCollapsed(true);

    // Filtrar grupos por permisos del usuario
    const grupos = menuGroups
        .map(g => ({ ...g, items: g.items.filter(it => can(it.modulo, 'ver')) }))
        .filter(g => g.items.length > 0);

    const iniciales = (user?.username || 'U').slice(0, 2).toUpperCase();

    return (
        <aside
            className={`min-h-screen bg-[#121621] flex flex-col justify-between py-6 overflow-hidden transition-all duration-300 ${collapsed ? 'w-16 px-2' : 'w-64 px-4'}`}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <div>
                <div className="flex items-center gap-3 mb-8 px-2 select-none">
                    <div className="bg-blue-600 p-2 rounded-lg shrink-0">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </div>
                    <div className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'opacity-0 delay-0' : 'opacity-100 delay-150'}`}>
                        <span className="text-white font-bold text-base leading-none">Gestión de Nómina</span>
                        <p className="text-gray-500 text-xs mt-0.5">Beta 2.0</p>
                    </div>
                </div>

                <nav className="flex flex-col gap-4">
                    {grupos.map((grp) => (
                        <div key={grp.group}>
                            <p className={`text-gray-600 text-xs font-semibold uppercase tracking-widest px-2 mb-1 whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'opacity-0 delay-0' : 'opacity-100 delay-150'}`}>
                                {grp.group}
                            </p>
                            <div className="flex flex-col gap-0.5">
                                {grp.items.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        title={item.label}
                                        onClick={handleNav}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                                                ? 'bg-blue-600 text-white font-medium'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'}`
                                        }
                                    >
                                        <span className="text-base shrink-0">{item.icon}</span>
                                        <span className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'opacity-0 delay-0' : 'opacity-100 delay-150'}`}>
                                            {item.label}
                                        </span>
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            {/* Usuario + Logout */}
            <div className={`flex flex-col gap-3 px-2 mt-6 pt-4 border-t border-white/5 ${collapsed ? 'items-center' : ''}`}>
                <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {iniciales}
                    </div>
                    <div className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'opacity-0 delay-0' : 'opacity-100 delay-150'}`}>
                        <p className="text-white text-sm font-medium leading-none">{user?.username || '—'}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{user?.rol_nombre || ''}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    title="Cerrar sesión"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors ${collapsed ? 'justify-center' : ''}`}
                >
                    <span>🚪</span>
                    <span className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'opacity-0 delay-0' : 'opacity-100 delay-150'}`}>
                        Cerrar sesión
                    </span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
