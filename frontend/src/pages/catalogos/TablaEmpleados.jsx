import TablaGenerica, { API_BASE, EstadoBadge } from './TablaGenerica';

const TablaEmpleados = ({ onEdit, onDelete, onToggle, onDarBaja }) => (
    <TablaGenerica
        url={`${API_BASE}/empleado`}
        rowKey="ID_EMPLEADO"
        columns={[
            {
                key: 'ID_EMPLEADO',
                label: 'ID',
                className: 'text-[#0061f2] font-black'
            },
            {
                key: 'NOMBRE',
                label: 'Nombre',
                className: 'text-white font-bold text-[14px] tracking-tight'
            },
            {
                key: 'NOMBRE_PUESTO',
                label: 'Puesto',
                className: 'text-gray-400 font-medium',
                render: v => v || '—'
            },
            {
                key: 'NOMBRE_JORNADA',
                label: 'Jornada',
                className: 'text-gray-400 font-medium',
                render: v => v || '—'
            },
            {
                key: 'FECHA_INICIO',
                label: 'Ingreso',
                className: 'text-gray-400 font-medium',
                render: v => v ? new Date(v).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
            },
            {
                key: 'ESTADO',
                label: 'Estado',
                render: v => <EstadoBadge value={v} />
            },
        ]}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        onDarBaja={onDarBaja}
        emptyText="No se localizan colaboradores registrados"
    />
);

export default TablaEmpleados;
