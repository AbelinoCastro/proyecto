import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const menuItems = [
    { path: '/calcular-nomina', label: 'Calcular Nómina' },
    { path: '/periodos', label: 'Períodos' },
    { path: '/horasextra', label: 'Horas Extra' },
    { path: '/registro-faltas', label: 'Registro Faltas' },
    { path: '/empleado', label: 'Empleados' },
    { path: '/departamentos', label: 'Departamentos' },
    { path: '/jornadas', label: 'Jornadas' },
    { path: '/puestos', label: 'Puestos' },
    { path: '/percepciones', label: 'Percepciones' },
    { path: '/deducciones', label: 'Deducciones' },
    { path: '/faltas', label: 'Faltas' },
    { path: '/motivo-baja', label: 'Motivo Baja' },
    { path: '/usuarios', label: 'Usuarios' },
    { path: '/tipo-usuario', label: 'Tipo Usuario' },
];

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside className={`min-h-screen bg-[#1a1f2e] flex flex-col justify-between py-6 px-4 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
            <div>
                {/* Logo / botón colapsar */}
                <div
                    className="flex items-center gap-3 mb-8 px-2 cursor-pointer"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <div className="bg-blue-600 p-2 rounded-lg shrink-0">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </div>
                    {!collapsed && <span className="text-white font-semibold text-lg">Panel</span>}
                </div>

                {/* Menu */}
                <nav className="flex flex-col gap-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            title={item.label}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${isActive
                                    ? 'bg-blue-600 text-white font-medium'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                            {!collapsed && item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Usuario bottom */}
            <div className={`flex items-center gap-3 px-2 ${collapsed ? 'justify-center' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    GR
                </div>
                {!collapsed && <span className="text-gray-400 text-sm">Gerardo R.</span>}
            </div>
        </aside>
    );
};

export default Sidebar;