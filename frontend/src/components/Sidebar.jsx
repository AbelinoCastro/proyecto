import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:4000/api';
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const Icons = {
    Dashboard: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    Catalogos: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
    HorasExtra: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Faltas: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
    Nomina: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    Historico: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    Empleado: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    Seguridad: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    Finanzas: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Periodos: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
};

const menuGroups = [
    {
        group: 'GESTIÓN DE NÓMINA',
        items: [
            { path: '/dashboard',       label: 'Inicio',          icon: <Icons.Dashboard />,  modulo: 'DASHBOARD' },
            { path: '/calcular-nomina', label: 'Calcular Nómina', icon: <Icons.Nomina />,     modulo: 'NOMINA' },
            { path: '/periodos',        label: 'Períodos',        icon: <Icons.Periodos />,   modulo: 'PERIODOS' },
            { path: '/historial',       label: 'Historial',       icon: <Icons.Historico />,  modulo: 'HISTORIAL' },
        ],
    },
    {
        group: 'TALENTO HUMANO',
        items: [
            { path: '/empleado',        label: 'Empleados',       icon: <Icons.Empleado />,   modulo: 'EMPLEADOS' },
            { path: '/registro-faltas', label: 'Control Faltas',  icon: <Icons.Faltas />,     modulo: 'FALTAS' },
            { path: '/horasextra',      label: 'Horas Extra',      icon: <Icons.HorasExtra />, modulo: 'HORASEXTRA' },
            { path: '/asignaciones',    label: 'Asignaciones',    icon: <Icons.Catalogos />,  modulo: 'ASIGNAC' },
        ],
    },
    {
        group: 'FINANZAS & LEGAL',
        items: [
            { path: '/igss',             label: 'IGSS',            icon: <Icons.Seguridad />, modulo: 'IGSS' },
            { path: '/isr',              label: 'ISR',             icon: <Icons.Finanzas />,  modulo: 'ISR' },
            { path: '/prestamos',        label: 'Préstamos',       icon: <Icons.Finanzas />,  modulo: 'PRESTAMOS' },
            { path: '/polizas-seguros',  label: 'Pólizas Seguros',  icon: <Icons.Seguridad />, modulo: 'SEGUROS' },
        ],
    },
    {
        group: 'RECURSOS ADM',
        items: [
            { path: '/reporteria',       label: 'Reportería',       icon: <Icons.Historico />,  modulo: 'REPORTERIA' },
            { path: '/reporteria-cloud', label: 'Reportería Cloud', icon: <Icons.Historico />,  modulo: 'REPORTERIA_CLOUD' },
            { path: '/patrono',          label: 'Patrono',          icon: <Icons.Catalogos />,  modulo: 'PATRONO' },
        ],
    },
    {
        group: 'SISTEMA',
        items: [
            { path: '/usuarios',        label: 'Usuarios',        icon: <Icons.Empleado />,   modulo: 'USUARIOS' },
            { path: '/permisos',        label: 'Permisos',        icon: <Icons.Seguridad />,  modulo: 'PERMISOS' },
            { path: '/catalogos',       label: 'Configuración',   icon: <Icons.Catalogos />,  modulo: 'CATALOGOS' },
        ],
    },
];

const Sidebar = () => {
    const { user, logout, can } = useAuth();
    const [periodoActivo, setPeriodoActivo] = useState('Cargando...');
    const iniciales = (user?.username || 'U').slice(0, 2).toUpperCase();

    useEffect(() => {
        // Obtener el periodo real desde la BD
        fetch(`${API}/periodos`)
            .then(r => r.json())
            .then(d => {
                const lista = d.data ?? [];
                const abierto = lista.find(p => p.ESTADO === 'ABIERTO');
                if (abierto) {
                    const mes = MESES[(abierto.NUMERO_PERIODO || 1) - 1];
                    setPeriodoActivo(`${mes} ${abierto.ANIO}`);
                } else {
                    setPeriodoActivo('Sin período');
                }
            })
            .catch(() => setPeriodoActivo('Error'));
    }, []);

    const filteredGroups = menuGroups.map(g => ({
        ...g,
        items: g.items.filter(it => can(it.modulo, 'ver'))
    })).filter(g => g.items.length > 0);

    return (
        <aside className="w-64 h-screen bg-[#080808] border-r border-white/5 flex flex-col p-6 sticky top-0 overflow-hidden animate-in fade-in slide-in-from-left-4 duration-700">

            {/* Header / Logo */}
            <div className="flex items-center gap-4 mb-8 select-none shrink-0 group">
                <div className="w-10 h-10 bg-[#111112] border border-white/10 rounded-xl flex items-center justify-center group-hover:border-[#C5A028]/40 transition-colors">
                    <span className="text-[#C5A028] font-serif-title text-xl font-black">N</span>
                </div>
                <div>
                    <h1 className="text-white font-serif-title text-lg font-black leading-none tracking-tight">NóminaGT</h1>
                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] mt-1">Enterprise · V4.2</p>
                </div>
            </div>

            {/* Período Activo Badge REAL */}
            <div className="bg-[#111112] border border-white/[0.04] rounded-xl p-4 mb-8 shrink-0 shadow-lg">
                <p className="text-[8px] text-gray-600 font-black uppercase tracking-[0.25em] mb-1.5 opacity-60">Período Operativo</p>
                <p className="text-[#C5A028] text-[11px] font-black tracking-widest uppercase">{periodoActivo}</p>
            </div>

            {/* Menú Principal Label con Estilo */}
            <div className="bg-[#C5A028]/5 border border-[#C5A028]/20 rounded-xl p-3 mb-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-[#C5A028] rotate-45"></div>
                    <span className="text-[#C5A028] text-[10px] font-black uppercase tracking-[0.15em]">Menú Principal</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#C5A028] shadow-[0_0_8px_rgba(197,160,40,0.6)] animate-pulse"></div>
            </div>

            {/* Navigation Groups con Scroll Interno Suave */}
            <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-8 pb-10">
                {filteredGroups.map((group, idx) => (
                    <div key={idx} className="animate-in fade-in duration-1000">
                        <div className="flex items-center gap-2 mb-4 px-2">
                            <span className="text-gray-700 text-[9px] font-black uppercase tracking-[0.3em]">{group.group}</span>
                            <div className="flex-1 h-[1px] bg-white/[0.03]"></div>
                        </div>
                        <nav className="space-y-1.5">
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-4 px-3 py-2.5 rounded-xl text-[11.5px] transition-all duration-300 ${isActive
                                            ? 'text-white bg-white/[0.04] border border-white/[0.05] font-bold shadow-xl'
                                            : 'text-gray-500 hover:text-white hover:bg-white/[0.02] hover:translate-x-1'}`
                                    }
                                >
                                    <span className={`shrink-0 transition-colors ${item.path === window.location.pathname ? 'text-[#C5A028]' : 'text-gray-600'}`}>
                                        {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                ))}
            </div>

            {/* User Profile Card (Fixed bottom) */}
            <div className="mt-auto pt-6 border-t border-white/5 shrink-0">
                <div className="bg-[#111112] border border-white/5 rounded-[20px] p-4 flex items-center justify-between group relative overflow-hidden shadow-2xl">
                    <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1c1c1e] to-[#2c2c2e] border border-white/10 flex items-center justify-center text-white text-[10px] font-black shadow-inner">
                            {iniciales}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white text-[11px] font-bold leading-none">{user?.username || 'Usuario'}</span>
                            <span className="text-[9px] text-gray-600 font-bold mt-1.5 uppercase tracking-[0.1em]">{user?.rol_nombre || 'Administrador'}</span>
                        </div>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>

                    <button
                        onClick={logout}
                        className="absolute inset-0 bg-red-600/[0.07] opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"
                        title="Cerrar Sesión"
                    >
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                </div>
            </div>

        </aside>
    );
};

export default Sidebar;
