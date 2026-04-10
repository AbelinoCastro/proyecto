import TablaGenerica, { API_BASE } from './TablaGenerica';

const TablaPuestos = ({ onEdit, onDelete }) => (
    <TablaGenerica
        url={`${API_BASE}/puestos`}
        rowKey="ID_PUESTO"
        columns={[
            { key: 'ID_PUESTO',         label: 'ID',           className: 'text-blue-400 font-bold' },
            { key: 'NOMBRE_PUESTO',     label: 'Puesto',       className: 'text-white font-semibold' },
            { key: 'NOMBRE_DEPARTAMENTO', label: 'Departamento', className: 'text-gray-400', render: v => v || '—' },
            { key: 'SUELDO_BASE',       label: 'Sueldo Base',  className: 'text-green-400 font-semibold',
                render: v => v != null ? `Q ${Number(v).toLocaleString('es-GT', { minimumFractionDigits: 2 })}` : '—' },
        ]}
        onEdit={onEdit}
        onDelete={onDelete}
        emptyText="No hay puestos registrados"
    />
);

export default TablaPuestos;
