import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const menuGroups = [
    {
        group: 'Principal',
        items: [
            { path: '/', label: 'Inicio', icon: '📊' },
        ],
    },
    {
        group: 'Nómina',
        items: [
            { path: '/calcular-nomina', label: 'Calcular Nómina', icon: '🧮' },
            { path: '/periodos', label: 'Períodos', icon: '📅' },
            { path: '/historial', label: 'Historial', icon: '📜' },
        ],
    },
    {
        group: 'Asistencia',
        items: [
            { path: '/horasextra', label: 'Horas Extra', icon: '⏱️' },
            { path: '/registro-faltas', label: 'Registro Faltas', icon: '📋' },
        ],
    },
    {
        group: 'Personal',
        items: [
            { path: '/catalogos', label: 'Catálogos', icon: '⚙️' },
            { path: '/asignaciones', label: 'Asignaciones', icon: '🏷️' },
        ],
    },
];

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(true);

    const handleNav = () => setCollapsed(true);
    const handleEnter = () => setCollapsed(false);
    const handleLeave = () => setCollapsed(true);

    return (
        <aside
            className={`min-h-screen bg-[#1a1f2e] flex flex-col justify-between py-6 overflow-hidden transition-all duration-300 ${collapsed ? 'w-16 px-2' : 'w-64 px-4'}`}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <div>
                {/* Logo */}
                <div className="flex items-center gap-3 mb-8 px-2 select-none">
                    <div className="bg-blue-600 p-2 rounded-lg shrink-0">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </div>
                    <div className={`whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'opacity-0 delay-0' : 'opacity-100 delay-150'}`}>
                        <span className="text-white font-bold text-base leading-none">Gestión de Nómina</span>
                        <p className="text-gray-500 text-xs mt-0.5">Alpha 10.0</p>
                    </div>
                </div>

                {/* Grupos de menú */}
                <nav className="flex flex-col gap-4">
                    {menuGroups.map((grp) => (
                        <div key={grp.group}>
                            <p className={`text-gray-600 text-xs font-semibold uppercase tracking-widest px-2 mb-1 whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'opacity-0 delay-0' : 'opacity-100 delay-150'}`}>
                                {grp.group}
                            </p>
                            <div className="flex flex-col gap-0.5">
                                {grp.items.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        end={item.path === '/'}
                                        title={item.label}
                                        onClick={handleNav}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                                                ? 'bg-blue-600 text-white font-medium'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`
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

            {/* Usuario */}
            <div className={`flex items-center gap-3 px-2 ${collapsed ? 'justify-center' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    GR
                </div>
                <span className={`text-gray-400 text-sm whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'opacity-0 delay-0' : 'opacity-100 delay-150'}`}>Gerardo R.</span>
            </div>
        </aside>
    );
};

export default Sidebar;
