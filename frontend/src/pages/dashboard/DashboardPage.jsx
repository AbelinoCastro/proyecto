import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const API = 'http://localhost:4000/api';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const DashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        empleadosActivos: 0,
        montoNomina: 'Q 57,467.15',
        horasExtras: 0,
        faltas: 0,
        periodoAbiertoLabel: 'Cargando...'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [empRes, horRes, falRes, perRes] = await Promise.all([
                    fetch(`${API}/empleado`),
                    fetch(`${API}/horasextra`),
                    fetch(`${API}/registro-faltas`).catch(() => null),
                    fetch(`${API}/periodos`)
                ]);

                const empData = await empRes.json();
                const horData = await horRes.json();
                const falData = falRes ? await falRes.json() : { data: [] };
                const perData = await perRes.json();

                // Buscar periodo abierto real
                const periodos = perData.data ?? [];
                const abierto = periodos.find(p => p.ESTADO === 'ABIERTO');
                const label = abierto
                    ? `${MESES[(abierto.NUMERO_PERIODO || 1) - 1]} ${abierto.ANIO}`
                    : 'Sin período activo';

                setStats(s => ({
                    ...s,
                    empleadosActivos: (empData.data ?? []).filter(e => e.ESTADO === 'ACTIVO').length,
                    horasExtras: (Array.isArray(horData) ? horData : (horData.data ?? [])).filter(h => h.ESTADO === 'PENDIENTE').length,
                    faltas: (falData.data ?? []).length,
                    periodoAbiertoLabel: label
                }));
            } catch (err) {
                console.error('Error dashboard');
                setStats(s => ({ ...s, periodoAbiertoLabel: 'Error al cargar' }));
            }
        };
        fetchData();
    }, []);

    return (
        <div className="max-w-[1200px] mx-auto py-6 px-10 animate-in fade-in duration-1000">

            {/* Top Navigation Bar Exacta */}
            <div className="flex items-center justify-between mb-10 text-[11px] font-bold">
                <div className="flex items-center gap-3">
                    <span className="text-gray-600 opacity-40 uppercase tracking-widest">NóminaGT</span>
                    <span className="text-gray-800">/</span>
                    <span className="text-[#C5A028] uppercase tracking-widest">Menú Principal</span>
                </div>
                <div className="text-gray-600 opacity-40 uppercase tracking-widest">
                    {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
            </div>

            {/* Bienvenida Exacta */}
            <div className="mb-12">
                <p className="text-[#C5A028] text-[10px] font-black uppercase tracking-[0.4em] mb-3 opacity-60">Bienvenido de vuelta</p>
                <h1 className="font-serif-title text-5xl text-white mb-4 tracking-tight">Panel de Control</h1>
                <p className="text-gray-500 text-[12px] font-medium">
                    Período activo: <span className="text-[#C5A028] font-bold uppercase tracking-wider">{stats.periodoAbiertoLabel}</span> — Gestión Centralizada
                </p>
            </div>

            {/* Fila de Estadísticas Superior Exacta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">

                {/* Empleados */}
                <div className="luxury-card p-8 flex flex-col justify-between min-h-[140px]">
                    <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 opacity-40">Empleados Activos</p>
                        <p className="text-4xl font-bold text-white tracking-tighter leading-none">{stats.empleadosActivos}</p>
                    </div>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-4">↑ 2 incorporaciones este mes</p>
                </div>

                {/* Nómina */}
                <div className="luxury-card p-8 flex flex-col justify-between min-h-[140px] border-t-2 border-t-emerald-500/30">
                    <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 opacity-40">Nómina Feb 2026</p>
                        <p className="font-serif-title text-2xl font-bold text-white leading-none tracking-tight">{stats.montoNomina}</p>
                    </div>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-4 italic opacity-60">Período cerrado</p>
                </div>

                {/* Horas */}
                <div className="luxury-card p-8 flex flex-col justify-between min-h-[140px] border-t-2 border-t-blue-500/30">
                    <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 opacity-40">Horas Extras</p>
                        <p className="text-4xl font-bold text-white tracking-tighter leading-none">{stats.horasExtras}</p>
                    </div>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-4">17 horas totales</p>
                </div>

                {/* Faltas */}
                <div className="luxury-card p-8 flex flex-col justify-between min-h-[140px] border-t-2 border-t-red-500/30">
                    <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4 opacity-40">Faltas Registradas</p>
                        <p className="text-4xl font-bold text-white tracking-tighter leading-none">{stats.faltas}</p>
                    </div>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-4">Período actual</p>
                </div>

            </div>

            {/* Grid de Módulos Grandes Exacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Horas Extras */}
                <div className="luxury-card p-10 group">
                    <div className="flex justify-between items-start mb-8">
                        <div className="text-gray-400 group-hover:text-[#C5A028] transition-colors">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.2em] bg-white/[0.03] px-3 py-1 rounded-md">Módulo</span>
                    </div>
                    <h3 className="font-serif-title text-2xl font-bold text-white mb-3">Horas Extras</h3>
                    <p className="text-gray-500 text-[12px] leading-relaxed mb-10 max-w-[320px]">
                        Registra las horas trabajadas fuera de jornada con cálculo automático según tipo de jornada seleccionada.
                    </p>
                    <button onClick={() => navigate('/horasextra')} className="gold-button text-[11px] uppercase tracking-[0.2em]">
                        Acceder <span className="ml-1">→</span>
                    </button>
                </div>

                {/* Registrar Faltas */}
                <div className="luxury-card p-10 group">
                    <div className="flex justify-between items-start mb-8">
                        <div className="text-gray-400 group-hover:text-[#C5A028] transition-colors">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        </div>
                        <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.2em] bg-white/[0.03] px-3 py-1 rounded-md">Módulo</span>
                    </div>
                    <h3 className="font-serif-title text-2xl font-bold text-white mb-3">Registrar Faltas</h3>
                    <p className="text-gray-500 text-[12px] leading-relaxed mb-10 max-w-[320px]">
                        Documenta inasistencias con motivo, descripción detallada y categorización para descuento en nómina.
                    </p>
                    <button onClick={() => navigate('/registro-faltas')} className="dark-button text-[11px] uppercase tracking-[0.2em]">
                        Acceder <span className="ml-1">→</span>
                    </button>
                </div>

                {/* Calcular Nómina */}
                <div className="luxury-card p-10 group border-b border-b-emerald-500/10">
                    <div className="flex justify-between items-start mb-8">
                        <div className="text-gray-400 group-hover:text-emerald-500 transition-colors">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.2em] bg-white/[0.03] px-3 py-1 rounded-md">Módulo</span>
                    </div>
                    <h3 className="font-serif-title text-2xl font-bold text-white mb-3">Calcular Nómina</h3>
                    <p className="text-gray-500 text-[12px] leading-relaxed mb-10 max-w-[320px]">
                        Genera la boleta completa: percepciones, deducciones (IGSS, ISR, faltas), procesa el pago e imprime.
                    </p>
                    <button onClick={() => navigate('/calcular-nomina')} className="bg-[#102A1E]/80 text-emerald-400 font-bold px-6 py-2 rounded-lg border border-emerald-500/10 hover:bg-[#153a2a] transition-all text-[11px] uppercase tracking-[0.2em]">
                        Acceder <span className="ml-1">→</span>
                    </button>
                </div>

                {/* Histórico */}
                <div className="luxury-card p-10 group border-b border-b-blue-500/10">
                    <div className="flex justify-between items-start mb-8">
                        <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.2em] bg-white/[0.03] px-3 py-1 rounded-md">Módulo</span>
                    </div>
                    <h3 className="font-serif-title text-2xl font-bold text-white mb-3">Histórico de Nómina</h3>
                    <p className="text-gray-500 text-[12px] leading-relaxed mb-10 max-w-[320px]">
                        Consulta todos los pagos procesados con detalle completo de percepciones y deducciones. Solo lectura.
                    </p>
                    <button onClick={() => navigate('/historial')} className="dark-button text-[11px] uppercase tracking-[0.2em]">
                        Acceder <span className="ml-1">→</span>
                    </button>
                </div>

            </div>

            <p className="text-center mt-12 text-[9px] font-black text-gray-900 uppercase tracking-[0.8em] opacity-40">NóminaGT Enterprise · Advanced Solution</p>
        </div>
    );
};

export default DashboardPage;
