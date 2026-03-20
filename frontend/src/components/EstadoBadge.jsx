const colores = {
    ACTIVO: 'bg-green-500/20 text-green-400',
    INACTIVO: 'bg-gray-500/20 text-gray-400',
    BLOQUEADO: 'bg-red-500/20 text-red-400',
    PENDIENTE: 'bg-yellow-500/20 text-yellow-400',
};

const EstadoBadge = ({ estado }) => {
    const clase = colores[estado] || 'bg-gray-500/20 text-gray-400';
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${clase}`}>
            {estado}
        </span>
    );
};

export default EstadoBadge;