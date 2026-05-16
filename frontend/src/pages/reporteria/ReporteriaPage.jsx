import { useNavigate } from 'react-router-dom';

const modulos = [
    {
        path: '/igss',
        icon: '🏥',
        titulo: 'IGSS',
        subtitulo: 'Seguro Social',
        descripcion: 'Validación y pago de cuotas IGSS (4.83%) por período de nómina. Genera comprobante PDF para el IGSS.',
        color: 'blue',
    },
    {
        path: '/isr',
        icon: '📑',
        titulo: 'ISR / SAT',
        subtitulo: 'Impuesto Sobre la Renta',
        descripcion: 'Preview de retenciones ISR por período. Registra el pago ante la SAT y genera comprobante.',
        color: 'amber',
    },
    {
        path: '/prestamos',
        icon: '🏦',
        titulo: 'Préstamos',
        subtitulo: 'Amortización en nómina',
        descripcion: 'Administra préstamos de empleados, procesa cuotas mensuales y descarga comprobantes individuales.',
        color: 'purple',
    },
    {
        path: '/polizas-seguros',
        icon: '🛡️',
        titulo: 'Pólizas de Seguros',
        subtitulo: 'Seguros de empleados',
        descripcion: 'Registra y administra pólizas de seguro (BÁSICO, PLUS, PREMIUM). Exporta listado en Excel y PDF.',
        color: 'green',
    },
];

const colorMap = {
    blue:   { card: 'border-blue-500/30 hover:border-blue-500/60',     icon: 'bg-blue-600/20 text-blue-400',     btn: 'bg-blue-600 hover:bg-blue-500',     badge: 'text-blue-400' },
    amber:  { card: 'border-amber-500/30 hover:border-amber-500/60',   icon: 'bg-amber-600/20 text-amber-400',   btn: 'bg-amber-600 hover:bg-amber-500',   badge: 'text-amber-400' },
    purple: { card: 'border-purple-500/30 hover:border-purple-500/60', icon: 'bg-purple-600/20 text-purple-400', btn: 'bg-purple-600 hover:bg-purple-500', badge: 'text-purple-400' },
    green:  { card: 'border-green-500/30 hover:border-green-500/60',   icon: 'bg-green-600/20 text-green-400',   btn: 'bg-green-600 hover:bg-green-500',   badge: 'text-green-400' },
};

const ReporteriaPage = () => {
    const navigate = useNavigate();

    return (
        <div className="p-6 text-slate-100 min-h-screen bg-[#0b0e14]">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Reportería</h1>
                <p className="text-slate-400 text-sm mt-1">Módulos de obligaciones legales y descuentos en nómina</p>
            </div>

            {/* Tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl">
                {modulos.map((m) => {
                    const c = colorMap[m.color];
                    return (
                        <div
                            key={m.path}
                            className={`bg-[#121621] border rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200 cursor-pointer ${c.card}`}
                            onClick={() => navigate(m.path)}
                        >
                            {/* Ícono + título */}
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${c.icon}`}>
                                    {m.icon}
                                </div>
                                <div>
                                    <div className={`text-lg font-bold ${c.badge}`}>{m.titulo}</div>
                                    <div className="text-xs text-slate-500">{m.subtitulo}</div>
                                </div>
                            </div>

                            {/* Descripción */}
                            <p className="text-slate-400 text-sm leading-relaxed flex-1">
                                {m.descripcion}
                            </p>

                            {/* Botón */}
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(m.path); }}
                                className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${c.btn}`}
                            >
                                Abrir módulo
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ReporteriaPage;
