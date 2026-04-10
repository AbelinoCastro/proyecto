import TablaGenerica, { API_BASE, EstadoBadge } from './TablaGenerica';

const TablaMotivoBaja = ({ onEdit, onDelete, onToggle }) => (
    <TablaGenerica
        url={`${API_BASE}/motivo-baja`}
        rowKey="ID_MOTIVO_BAJA"
        columns={[
            { key: 'ID_MOTIVO_BAJA', label: 'ID',          className: 'text-blue-400 font-bold' },
            { key: 'DESCRIPCION',    label: 'Motivo',       className: 'text-white font-semibold' },
            { key: 'ESTADO',         label: 'Estado',       render: v => <EstadoBadge value={v || 'ACTIVO'} /> },
        ]}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        emptyText="No hay motivos de baja registrados"
    />
);

export default TablaMotivoBaja;
