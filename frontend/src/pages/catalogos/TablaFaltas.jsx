import TablaGenerica, { API_BASE } from './TablaGenerica';

const TablaFaltas = ({ onEdit }) => (
    <TablaGenerica
        url={`${API_BASE}/faltas`}
        rowKey="ID_FALTA"
        columns={[
            { key: 'ID_FALTA',    label: 'ID',             className: 'text-blue-400 font-bold' },
            { key: 'DESCRIPCION', label: 'Tipo de Falta',  className: 'text-white font-semibold' },
            {
                key: 'ES_PAGADO', label: 'Condición',
                render: v => (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        v === 'S' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                        {v === 'S' ? 'Con goce' : 'Sin goce'}
                    </span>
                ),
            },
        ]}
        onEdit={onEdit}
        emptyText="No hay tipos de falta registrados"
    />
);

export default TablaFaltas;
