import TablaGenerica, { API_BASE, EstadoBadge } from './TablaGenerica';

const TablaUsuarios = ({ onEdit, onDelete, onToggle }) => (
    <TablaGenerica
        url={`${API_BASE}/usuarios`}
        rowKey="ID_USUARIO"
        columns={[
            { key: 'ID_USUARIO',   label: 'ID',        className: 'text-blue-400 font-bold' },
            { key: 'USERNAME',     label: 'Usuario',   className: 'text-white font-semibold' },
            { key: 'EMPLEADO',     label: 'Empleado',  className: 'text-gray-300', render: v => v || '—' },
            { key: 'TIPO_USUARIO', label: 'Rol',       className: 'text-gray-400', render: v => v || '—' },
            { key: 'ESTADO',       label: 'Estado',    render: v => <EstadoBadge value={v} /> },
        ]}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        emptyText="No hay usuarios registrados"
    />
);

export default TablaUsuarios;
