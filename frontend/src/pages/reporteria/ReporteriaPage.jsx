import { useNavigate } from 'react-router-dom';

const Icons = {
    IGSS: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    ISR: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    Prestamos: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Seguros: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
};

const modulos = [
    {
        path: '/igss',
        icon: <Icons.IGSS />,
        titulo: 'IGSS',
        subtitulo: 'Seguro Social',
        descripcion: 'Liquidación de cuotas laborales y patronales.',
        color: 'blue',
    },
    {
        path: '/isr',
        icon: <Icons.ISR />,
        titulo: 'ISR / SAT',
        subtitulo: 'Gestión Fiscal',
        descripcion: 'Auditoría de retenciones y pagos tributarios.',
        color: 'amber',
    },
    {
        path: '/prestamos',
        icon: <Icons.Prestamos />,
        titulo: 'Préstamos',
        subtitulo: 'Financiamiento',
        descripcion: 'Cartera crediticia y cobros mensuales.',
        color: 'purple',
    },
    {
        path: '/polizas-seguros',
        icon: <Icons.Seguros />,
        titulo: 'Seguros',
        subtitulo: 'Pólizas Vida/Médico',
        descripcion: 'Gestión técnica de coberturas y primas.',
        color: 'emerald',
    },
];

const colorMap = {
    blue:    { border: 'border-blue-500/20', bg: 'bg-blue-500/5', text: 'text-blue-400' },
    amber:   { border: 'border-amber-500/20', bg: 'bg-amber-500/5', text: 'text-amber-400' },
    purple:  { border: 'border-purple-500/20', bg: 'bg-purple-500/5', text: 'text-purple-400' },
    emerald: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', text: 'text-emerald-400' },
};

const ReporteriaPage = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-[1300px] mx-auto py-6 px-8 animate-in fade-in duration-700 h-[calc(100vh-80px)] flex flex-col justify-center">
            {/* Header Compacto para evitar scroll */}
            <div className="mb-10 text-center lg:text-left">
                <p className="text-[#C5A028] text-[9px] font-black uppercase tracking-[0.4em] mb-2 opacity-60">Consola Central de Auditoría</p>
                <h1 className="font-serif-title text-5xl text-white tracking-tighter leading-none">Reportería & SAT</h1>
                <p className="text-gray-600 text-[12px] mt-4 font-medium max-w-xl leading-relaxed">
                    Sincronización integral de obligaciones legales y beneficios corporativos por ciclo operativo.
                </p>
            </div>

            {/* Grid de 4 Columnas: Todo visible de un solo vistazo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                {modulos.map((m) => {
                    const c = colorMap[m.color];
                    return (
                        <div
                            key={m.path}
                            onClick={() => navigate(m.path)}
                            className="luxury-card p-8 group cursor-pointer hover:bg-white/[0.02] transition-all flex flex-col justify-between min-h-[320px] shadow-2xl"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`${c.text} p-2.5 rounded-xl ${c.bg} border ${c.border} group-hover:scale-110 transition-transform duration-500`}>
                                        {m.icon}
                                    </div>
                                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.2em] bg-white/[0.02] px-2 py-1 rounded border border-white/[0.03]">Audit</span>
                                </div>
                                <h3 className="font-serif-title text-2xl text-white mb-2 tracking-tight group-hover:text-[#C5A028] transition-colors">{m.titulo}</h3>
                                <p className="text-[#C5A028]/60 text-[9px] font-black uppercase tracking-[0.2em] mb-4">{m.subtitulo}</p>
                                <p className="text-gray-500 text-[11px] leading-relaxed mb-6">
                                    {m.descripcion}
                                </p>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(m.path); }}
                                className="dark-button text-[9px] uppercase tracking-[0.2em] py-3 w-full group-hover:border-[#C5A028]/40 group-hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                Ingresar
                                <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="mt-12 flex justify-center opacity-20">
                <p className="text-[8px] font-black text-gray-700 uppercase tracking-[0.8em]">Fiscal Compliance · NóminaGT Enterprise</p>
            </div>
        </div>
    );
};

export default ReporteriaPage;
