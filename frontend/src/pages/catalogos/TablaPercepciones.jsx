import TablaGenerica, { API_BASE } from './TablaGenerica';

const TablaPercepciones = ({ onEdit, onDelete }) => (
    <TablaGenerica
        url={`${API_BASE}/percepciones`}
        rowKey="ID_PERCEPCION"
        columns={[
            { key: 'ID_PERCEPCION',      label: 'ID',          className: 'text-blue-400 font-bold' },
            { key: 'NOMBRE_PERCEPCION',  label: 'Percepción',  className: 'text-white font-semibold' },
            { key: 'DESCRIPCION_FORMULA',label: 'Descripción', className: 'text-gray-400', render: v => v || '—' },
        ]}
        onEdit={onEdit}
        onDelete={onDelete}
        emptyText="No hay percepciones registradas"
    />
);

export default TablaPercepciones;
