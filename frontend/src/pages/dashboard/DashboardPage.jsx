import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const API = 'http://localhost:4000/api';
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const modulos = [
    {
        title: 'Calcular Nómina',
        icon: '🧮',
        path: '/calcular-nomina',
        desc: 'Procesa salarios, percepciones y deducciones del período.',
        color: 'from-blue-600/20 to-blue-700/10 border-blue-500/30 hover:border-blue-500/60',
        badge: 'Principal',
        badgeColor: 'bg-blue-500/20 text-blue-400',
    },
    {
        title: 'Períodos',
        icon: '📅',
        path: '/periodos',
        desc: 'Administra los períodos de nómina mensuales.',
        color: 'from-indigo-600/20 to-indigo-700/10 border-indigo-500/30 hover:border-indigo-500/60',
    },
    {
        title: 'Horas Extra',
        icon: '⏱️',
        path: '/horasextra',
        desc: 'Control y aprobación de tiempo extraordinario.',
        color: 'from-yellow-600/20 to-yellow-700/10 border-yellow-500/30 hover:border-yellow-500/60',
    },
    {
        title: 'Registro de Faltas',
        icon: '📋',
        path: '/registro-faltas',
        desc: 'Control de incidencias, faltas y permisos.',
        color: 'from-orange-600/20 to-orange-700/10 border-orange-500/30 hover:border-orange-500/60',
    },
    {
        title: 'Historial de Nómina',
        icon: '📜',
        path: '/historial',
        desc: 'Consulta de recibos y auditoría de pagos anteriores.',
        color: 'from-purple-600/20 to-purple-700/10 border-purple-500/30 hover:border-purple-500/60',
    },
    {
        title: 'Catálogos',
        icon: '⚙️',
        path: '/catalogos',
        desc: 'Administra departamentos, puestos, jornadas y más.',
        color: 'from-slate-600/20 to-slate-700/10 border-slate-500/30 hover:border-slate-500/60',
    },
];

const DashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ empleadosActivos: null, periodoActual: null, totalEmpleados: null, horasPendientes: null });

    useEffect(() => {
        // Empleados activos
        fetch(`${API}/empleado`)
            .then(r => r.json())
            .then(d => {
                const lista = d.data ?? [];
                const activos = lista.filter(e => e.ESTADO === 'ACTIVO').length;
                setStats(s => ({ ...s, empleadosActivos: activos, totalEmpleados: lista.length }));
            }).catch(() => {});

        // Período actual abierto
        fetch(`${API}/periodos`)
            .then(r => r.json())
            .then(d => {
                const lista = d.data ?? [];
                const abierto = lista.find(p => p.ESTADO === 'ABIERTO');
                setStats(s => ({ ...s, periodoActual: abierto ?? null }));
            }).catch(() => {});

        // Horas extra pendientes
        fetch(`${API}/horasextra`)
            .then(r => r.json())
            .then(d => {
                const lista = Array.isArray(d) ? d : (d.data ?? []);
                const pendientes = lista.filter(h => h.ESTADO === 'PENDIENTE').length;
                setStats(s => ({ ...s, horasPendientes: pendientes }));
            }).catch(() => {});
    }, []);

    const periodoLabel = stats.periodoActual
        ? `${MESES[(stats.periodoActual.NUMERO_PERIODO || 1) - 1]} ${stats.periodoActual.ANIO}`
        : null;

    return (
        <div className="p-6 min-h-full">
            {/* Header + tarjetas informativas en la misma fila */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Panel de Gestión</h1>
                    <p className="text-gray-400 mt-1">Selecciona un módulo para comenzar</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    {/* Empleados activos */}
                    <div className="bg-[#1a1f2e] border border-white/10 rounded-xl px-5 py-3 min-w-[150px]">
                        <p className="text-gray-400 text-xs">Empleados activos</p>
                        <p className="text-white text-2xl font-bold mt-0.5">{stats.empleadosActivos ?? '—'}</p>
                    </div>

                    {/* Período actual */}
                    <div className="bg-[#1a1f2e] border border-white/10 rounded-xl px-5 py-3 min-w-[170px]">
                        <p className="text-gray-400 text-xs">Período actual</p>
                        {periodoLabel ? (
                            <>
                                <p className="text-blue-400 font-bold mt-0.5">{periodoLabel} · <span className="text-green-400">ABIERTO</span></p>
                            </>
                        ) : (
                            <p className="text-gray-500 text-sm mt-1">Sin período abierto</p>
                        )}
                    </div>

                    {/* Sistema */}
                    <div className="bg-[#1a1f2e] border border-white/10 rounded-xl px-5 py-3 min-w-[130px]">
                        <p className="text-gray-400 text-xs">Sistema</p>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0"></span>
                            <span className="text-green-400 text-sm font-medium">En línea</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Separador */}
            <div className="border-t border-white/10 mb-6" />

            {/* Grid de módulos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {modulos.map((mod) => (
                    <button
                        key={mod.path}
                        onClick={() => navigate(mod.path)}
                        className={`relative text-left p-5 rounded-xl border bg-gradient-to-br ${mod.color} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group`}
                    >
                        {/* Badge opcional */}
                        {mod.badge && (
                            <span className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium ${mod.badgeColor}`}>
                                {mod.badge}
                            </span>
                        )}

                        {/* Icono */}
                        <div className="text-3xl mb-3">{mod.icon}</div>

                        {/* Título */}
                        <h3 className="text-white font-semibold text-base mb-1 group-hover:text-white">
                            {mod.title}
                        </h3>

                        {/* Descripción */}
                        <p className="text-gray-400 text-xs leading-relaxed">{mod.desc}</p>

                        {/* Flecha */}
                        <div className="mt-4 flex items-center gap-1 text-gray-500 text-xs group-hover:text-gray-300 transition-colors">
                            <span>Gestionar</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DashboardPage;
