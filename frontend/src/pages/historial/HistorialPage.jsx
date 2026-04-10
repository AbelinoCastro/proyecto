import { useState, useEffect } from 'react';
import { getEmpleados } from '../../services/empleadoService';
import { getHistoricoNomina, getDetalleNomina } from '../../services/nominaService';

const EstadoBadge = ({ value }) => {
    const upper = value?.toUpperCase();
    const color =
        upper === 'PAGADO'    ? 'bg-green-500/20 text-green-400'  :
        upper === 'PROCESADO' ? 'bg-blue-500/20 text-blue-400'   :
        upper === 'ANULADO'   ? 'bg-red-500/20 text-red-400'     :
                                'bg-gray-500/20 text-gray-400';
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{value}</span>;
};

const HistorialPage = () => {
    const [empleados,         setEmpleados]         = useState([]);
    const [selectedEmpleado,  setSelectedEmpleado]  = useState('');   // '' = ninguno, 'todos' = todos
    const [todosLosRegistros, setTodosLosRegistros] = useState([]);
    const [cargando,          setCargando]          = useState(true);
    const [error,             setError]             = useState(null);

    useEffect(() => {
        Promise.all([getEmpleados(), getHistoricoNomina()])
            .then(([resEmp, resHist]) => {
                setEmpleados(resEmp.data?.data || []);
                setTodosLosRegistros(resHist.data?.data || []);
            })
            .catch(() => setError('No se pudo cargar la información'))
            .finally(() => setCargando(false));
    }, []);

    // Filtro: ninguno = vacío | 'todos' = todos | id = filtrado
    const historialFiltrado =
        selectedEmpleado === ''      ? [] :
        selectedEmpleado === 'todos' ? todosLosRegistros :
        todosLosRegistros.filter(p => String(p.ID_EMPLEADO) === selectedEmpleado);

    const empleadoNombre =
        selectedEmpleado === 'todos' ? 'Todos los empleados' :
        empleados.find(e => String(e.ID_EMPLEADO) === selectedEmpleado)?.NOMBRE || '';

    const handleVerBoleta = async (idNomina) => {
        try {
            const res = await getDetalleNomina(idNomina);
            const det = res.data?.data;
            if (!det) return;

            const enc = det.encabezado;
            const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
            const periodo = enc ? `${meses[(enc.NUMERO_PERIODO || 1) - 1] || enc.NUMERO_PERIODO} ${enc.ANIO}` : '—';
            const referencia = enc ? `REF-${String(enc.ID_NOMINA).padStart(4, '0')}` : '—';

            const win = window.open('', '_blank');
            win.document.write(`
                <html><head><title>Boleta de Nómina</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 30px; color: #111; }
                  h2 { margin-bottom: 4px; }
                  .info p { margin: 4px 0; }
                  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                  th { background: #f5f5f5; }
                  .totales { margin-top: 16px; text-align: right; }
                  .totales p { margin: 4px 0; }
                  .liquido { font-size: 1.3rem; font-weight: bold; color: #1d4ed8; margin-top: 8px; }
                </style></head>
                <body>
                <h2>Boleta de Pago</h2>
                <div class="info">
                  <p><strong>Empleado:</strong> ${enc?.NOMBRE_EMPLEADO || '—'}</p>
                  <p><strong>Puesto:</strong> ${enc?.NOMBRE_PUESTO || '—'} — ${enc?.NOMBRE_DEPARTAMENTO || '—'}</p>
                  <p><strong>Período:</strong> ${periodo}</p>
                  <p><strong>Fecha de pago:</strong> ${enc?.FECHA_PAGO ? new Date(enc.FECHA_PAGO).toLocaleDateString('es-GT') : '—'}</p>
                  <p><strong>Referencia:</strong> ${referencia}</p>
                </div>

                <h4>Percepciones</h4>
                <table>
                  <thead><tr><th>Descripción</th><th>Monto</th></tr></thead>
                  <tbody>
                    ${(det.percepciones || []).map(p =>
                        `<tr><td>${p.NOMBRE_PERCEPCION}</td><td>Q ${Number(p.MONTO).toFixed(2)}</td></tr>`
                    ).join('')}
                  </tbody>
                </table>

                <h4>Deducciones</h4>
                <table>
                  <thead><tr><th>Descripción</th><th>Detalle</th><th>Monto</th></tr></thead>
                  <tbody>
                    ${(det.deducciones || []).length > 0
                        ? (det.deducciones || []).map(d =>
                            `<tr>
                              <td>${d.NOMBRE_DEDUCCION}</td>
                              <td>${d.TIPO_FALTA ? `${d.TIPO_FALTA} — ${d.FECHA_FALTA ? new Date(d.FECHA_FALTA).toLocaleDateString('es-GT') : ''}` : '—'}</td>
                              <td>Q ${Number(d.MONTO).toFixed(2)}</td>
                            </tr>`
                          ).join('')
                        : '<tr><td colspan="3" style="text-align:center;color:#888">Sin deducciones</td></tr>'
                    }
                  </tbody>
                </table>

                <div class="totales">
                  <p>Total Percepciones: <strong>Q ${Number(enc?.TOTAL_PERCEPCIONES || 0).toFixed(2)}</strong></p>
                  <p>Total Deducciones: <strong>Q ${Number(enc?.TOTAL_DEDUCCIONES || 0).toFixed(2)}</strong></p>
                  <p class="liquido">Líquido a Pagar: Q ${Number(enc?.LIQUIDO_A_PAGAR || 0).toFixed(2)}</p>
                </div>
                </body></html>`);
            win.document.close();
            win.print();
        } catch {
            alert('No se pudo cargar el detalle de la boleta.');
        }
    };

    const inputClass = 'bg-[#131720] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors';

    return (
        <div className="p-6 min-h-full">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Historial de Nómina</h1>
                <p className="text-gray-400 text-sm mt-1">Auditoría de pagos procesados por empleado</p>
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Filtro */}
            <div className="bg-[#1a1f2e] border border-white/10 rounded-xl p-5 mb-6">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Seleccionar colaborador
                </label>
                {cargando ? (
                    <p className="text-gray-500 text-sm">Cargando empleados...</p>
                ) : (
                    <select
                        value={selectedEmpleado}
                        onChange={(e) => setSelectedEmpleado(e.target.value)}
                        className={`${inputClass} w-full max-w-sm`}
                    >
                        <option value="">— Seleccione un empleado —</option>
                        <option value="todos">Todos los empleados</option>
                        {empleados.map((emp) => (
                            <option key={emp.ID_EMPLEADO} value={emp.ID_EMPLEADO}>
                                {emp.NOMBRE}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Tabla */}
            <div className="bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
                        Pagos registrados{empleadoNombre ? ` — ${empleadoNombre}` : ''}
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-800/80 text-gray-300 text-left">
                                <th className="px-4 py-3 font-semibold">Empleado</th>
                                <th className="px-4 py-3 font-semibold">Período</th>
                                <th className="px-4 py-3 font-semibold">Fecha Pago</th>
                                <th className="px-4 py-3 font-semibold">Percepciones</th>
                                <th className="px-4 py-3 font-semibold">Deducciones</th>
                                <th className="px-4 py-3 font-semibold">Líquido</th>
                                <th className="px-4 py-3 font-semibold">Estado</th>
                                <th className="px-4 py-3 font-semibold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedEmpleado === '' ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                                        Seleccione un empleado para ver su historial
                                    </td>
                                </tr>
                            ) : historialFiltrado.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                                        No hay pagos registrados
                                    </td>
                                </tr>
                            ) : (
                                historialFiltrado.map((pago) => (
                                    <tr key={pago.ID_NOMINA} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 text-gray-300">{pago.NOMBRE_EMPLEADO || '—'}</td>
                                        <td className="px-4 py-3 text-gray-300">
                                            {pago.NUMERO_PERIODO && pago.ANIO ? (() => { const m = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']; return `${m[pago.NUMERO_PERIODO - 1] || pago.NUMERO_PERIODO} ${pago.ANIO}`; })() : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-300">
                                            {pago.FECHA_PAGO ? new Date(pago.FECHA_PAGO).toLocaleDateString('es-GT') : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-green-400 font-semibold">
                                            Q {Number(pago.TOTAL_PERCEPCIONES || 0).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-red-400 font-semibold">
                                            Q {Number(pago.TOTAL_DEDUCCIONES || 0).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-white font-bold">
                                            Q {Number(pago.LIQUIDO_A_PAGAR || 0).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3"><EstadoBadge value={pago.ESTADO} /></td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleVerBoleta(pago.ID_NOMINA)}
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors"
                                            >
                                                Ver boleta
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HistorialPage;
