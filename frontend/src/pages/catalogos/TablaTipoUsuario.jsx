import TablaGenerica, { API_BASE, EstadoBadge } from './TablaGenerica';

const TablaTipoUsuario = ({ onEdit, onDelete, onToggle }) => (
    <TablaGenerica
        url={`${API_BASE}/tipo-usuario`}
        rowKey="ID_TIPO_USUARIO"
        columns={[
            { key: 'ID_TIPO_USUARIO', label: 'ID',          className: 'text-blue-400 font-bold' },
            { key: 'NOMBRE',          label: 'Rol',          className: 'text-white font-semibold' },
            { key: 'DESCRIPCION',     label: 'Descripción',  className: 'text-gray-400', render: v => v || '—' },
            { key: 'ESTADO',          label: 'Estado',       render: v => <EstadoBadge value={v || 'ACTIVO'} /> },
        ]}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        emptyText="No hay tipos de usuario registrados"
    />
);

export default TablaTipoUsuario;
