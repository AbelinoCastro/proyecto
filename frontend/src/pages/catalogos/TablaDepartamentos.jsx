import TablaGenerica, { API_BASE, EstadoBadge } from './TablaGenerica';

const TablaDepartamentos = ({ onEdit, onDelete, onToggle }) => (
    <TablaGenerica
        url={`${API_BASE}/departamentos`}
        rowKey="ID_DEPARTAMENTO"
        columns={[
            { key: 'ID_DEPARTAMENTO',     label: 'ID',          className: 'text-blue-400 font-bold' },
            { key: 'NOMBRE_DEPARTAMENTO', label: 'Nombre',      className: 'text-white font-semibold' },
            { key: 'DESCRIPCION',         label: 'Descripción', className: 'text-gray-400', render: v => v || '—' },
            { key: 'ESTADO',              label: 'Estado',      render: v => <EstadoBadge value={v} /> },
        ]}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        emptyText="No hay departamentos registrados"
    />
);

export default TablaDepartamentos;
