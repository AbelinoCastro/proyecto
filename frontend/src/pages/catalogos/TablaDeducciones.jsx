import TablaGenerica, { API_BASE } from './TablaGenerica';

const TablaDeducciones = ({ onEdit, onDelete }) => (
    <TablaGenerica
        url={`${API_BASE}/deducciones`}
        rowKey="ID_DEDUCCION"
        columns={[
            { key: 'ID_DEDUCCION',       label: 'ID',          className: 'text-blue-400 font-bold' },
            { key: 'NOMBRE_DEDUCCION',   label: 'Nombre',      className: 'text-white font-semibold' },
            { key: 'DESCRIPCION_FORMULA',label: 'Descripción', className: 'text-gray-400', render: v => v || '—' },
        ]}
        onEdit={onEdit}
        onDelete={onDelete}
        emptyText="No hay deducciones registradas"
    />
);

export default TablaDeducciones;
