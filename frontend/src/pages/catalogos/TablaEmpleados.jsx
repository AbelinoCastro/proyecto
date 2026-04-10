import TablaGenerica, { API_BASE, EstadoBadge } from './TablaGenerica';

const TablaEmpleados = ({ onEdit, onDelete, onToggle, onDarBaja }) => (
    <TablaGenerica
        url={`${API_BASE}/empleado`}
        rowKey="ID_EMPLEADO"
        columns={[
            { key: 'ID_EMPLEADO',    label: 'ID',         className: 'text-blue-400 font-bold' },
            { key: 'NOMBRE',         label: 'Nombre',     className: 'text-white font-semibold' },
            { key: 'NOMBRE_PUESTO',  label: 'Puesto',     className: 'text-gray-300', render: v => v || '—' },
            { key: 'NOMBRE_JORNADA', label: 'Jornada',    className: 'text-gray-400', render: v => v || '—' },
            { key: 'FECHA_INICIO',   label: 'Ingreso',    className: 'text-gray-400', render: v => v ? new Date(v).toLocaleDateString('es-GT') : '—' },
            { key: 'ESTADO',         label: 'Estado',     render: v => <EstadoBadge value={v} /> },
        ]}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        onDarBaja={onDarBaja}
        emptyText="No hay empleados registrados"
    />
);

export default TablaEmpleados;
