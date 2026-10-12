import TablaGenerica, { API_BASE } from './TablaGenerica';

const TablaJornadas = ({ onEdit, onDelete, onToggle }) => (
    <TablaGenerica
        url={`${API_BASE}/jornadas`}
        rowKey="ID_JORNADA"
        columns={[
            { key: 'ID_JORNADA',     label: 'ID',            className: 'text-blue-400 font-bold' },
            { key: 'NOMBRE_JORNADA', label: 'Tipo de Jornada', className: 'text-white font-semibold' },
            { key: 'HORAS_DIARIAS',  label: 'Horas Diarias', className: 'text-gray-300', render: v => v ? `${v} hrs` : '—' },
        ]}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        emptyText="No hay jornadas registradas"
    />
);

export default TablaJornadas;
