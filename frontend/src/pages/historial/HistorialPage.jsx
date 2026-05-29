import { useState, useEffect } from 'react';
import { getEmpleados } from '../../services/empleadoService';
import { getHistoricoNomina, getDetalleNomina } from '../../services/nominaService';
import { urlFormatoUnico } from '../../services/formatoSalariosService';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const formatQ = (n) => `Q ${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatFecha = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const EstadoBadge = ({ value }) => {
    const upper = value?.toUpperCase();
    const styles =
        upper === 'PAGADO'    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
        upper === 'PROCESADO' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
        upper === 'ANULADO'   ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                'bg-gray-500/10 text-gray-400 border-gray-500/20';
    return <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles} whitespace-nowrap`}>{value}</span>;
};

const HistorialPage = () => {
    const [empleados,         setEmpleados]         = useState([]);
    const [selectedEmpleado,  setSelectedEmpleado]  = useState('');
    const [selectedPeriodo,   setSelectedPeriodo]   = useState('');
    const [selectedPuesto,    setSelectedPuesto]    = useState('');
    const [anioFormato,       setAnioFormato]       = useState(new Date().getFullYear());
    const [todosLosRegistros, setTodosLosRegistros] = useState([]);
    const [cargando,          setCargando]          = useState(true);
    const [error,             setError]             = useState(null);

    useEffect(() => {
        Promise.all([getEmpleados(), getHistoricoNomina()])
            .then(([resEmp, resHist]) => {
                setEmpleados(resEmp.data?.data || []);
                setTodosLosRegistros(resHist.data?.data || []);
            })
            .catch(() => setError('Error en la sincronización del historial operativo'))
            .finally(() => setCargando(false));
    }, []);

    const periodosUnicos = [...new Map(
        todosLosRegistros
            .filter(r => r.ID_PERIODO)
            .map(r => [r.ID_PERIODO, { id: r.ID_PERIODO, numero: r.NUMERO_PERIODO, anio: r.ANIO }])
    ).values()].sort((a, b) => b.id - a.id);

    const puestosUnicos = [...new Set(
        todosLosRegistros
            .map(r => r.NOMBRE_PUESTO)
            .filter(Boolean)
    )].sort();

    const labelPeriodo = (num, anio) => `${MESES[(num || 1) - 1] || num} ${anio}`;

    const handleChangeEmpleado = (val) => {
        setSelectedEmpleado(val);
        setSelectedPeriodo('');
        setSelectedPuesto('');
    };

    const historialFiltrado = (() => {
        if (selectedEmpleado === '') return [];
        if (selectedEmpleado !== 'todos') return todosLosRegistros.filter(p => String(p.ID_EMPLEADO) === selectedEmpleado);
        return todosLosRegistros.filter(p =>
            (!selectedPeriodo || String(p.ID_PERIODO) === selectedPeriodo) &&
            (!selectedPuesto  || p.NOMBRE_PUESTO === selectedPuesto)
        );
    })();

    const handleVerBoleta = async (idNomina) => {
        try {
            const res = await getDetalleNomina(idNomina);
            const det = res.data?.data;
            if (!det) return;
            const enc = det.encabezado;
            const periodoLabel = `${MESES[(enc.NUMERO_PERIODO || 1) - 1] || enc.NUMERO_PERIODO} ${enc.ANIO}`;
            const win = window.open('', '_blank');
            win.document.write(`
                <html><head><title>Boleta ${enc.ID_NOMINA}</title>
                <style>
                  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;700&display=swap');
                  body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; }
                  .header { border-bottom: 2px solid #D4AF37; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: end; }
                  .logo { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 900; }
                  .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
                  .info-box { background: #fcfcfc; padding: 12px; border-radius: 6px; border-left: 3px solid #D4AF37; }
                  .label { font-weight: bold; text-transform: uppercase; font-size: 9px; color: #777; letter-spacing: 1px; margin-bottom: 3px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                  th { text-align: left; padding: 10px; font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #eee; color: #999; }
                  td { padding: 10px; font-size: 12px; border-bottom: 1px solid #f5f5f5; }
                  .monto { text-align: right; font-weight: bold; }
                  .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 20px; }
                  .total-box { background: #111; color: #fff; padding: 15px 30px; border-radius: 12px; text-align: right; }
                  .total-monto { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 900; }
                </style></head>
                <body>
                <div class="header">
                  <div class="logo">NóminaGT</div>
                  <h3 style="margin:0; font-family:'Playfair Display'">Comprobante de Pago</h3>
                </div>
                <div class="info-grid">
                  <div class="info-box"><p class="label">Colaborador</p><p><strong>${enc.NOMBRE_EMPLEADO}</strong></p><p style="font-size:11px; color:#555">${enc.NOMBRE_PUESTO}</p></div>
                  <div class="info-box"><p class="label">Ciclo Operativo</p><p><strong>${periodoLabel}</strong></p></div>
                </div>
                <div style="display:grid; grid-template-cols: 1fr 1fr; gap: 30px">
                  <div><h4 class="label">Ingresos</h4><table><thead><tr><th>Descripción</th><th class="monto">Monto</th></tr></thead><tbody>
                  ${(det.percepciones || []).map(p => `<tr><td>${p.NOMBRE_PERCEPCION}</td><td class="monto">Q ${Number(p.MONTO).toFixed(2)}</td></tr>`).join('')}
                  </tbody></table></div>
                  <div><h4 class="label">Egresos</h4><table><thead><tr><th>Descripción</th><th class="monto">Monto</th></tr></thead><tbody>
                  ${(det.deducciones || []).map(d => `<tr><td>${d.NOMBRE_DEDUCCION}</td><td class="monto">Q ${Number(d.MONTO).toFixed(2)}</td></tr>`).join('')}
                  </tbody></table></div>
                </div>
                <div class="footer">
                  <p class="label">Emitido el ${new Date(enc.FECHA_PAGO).toLocaleDateString('es-GT')}</p>
                  <div class="total-box"><p class="label" style="color:#aaa">Neto Pagado</p><p class="total-monto">Q ${Number(enc.LIQUIDO_A_PAGAR).toFixed(2)}</p></div>
                </div>
                </body></html>`);
            win.document.close();
            win.print();
        } catch { alert('Error al cargar detalle'); }
    };

    const labelCls = "text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block opacity-60";
    const inputCls = "bg-[#0b0b0b] border border-white/5 rounded-xl px-4 py-2.5 text-[12px] text-white outline-none focus:border-[#C5A028]/30 transition-all w-full";

    return (
        <div className="max-w-[1550px] mx-auto py-10 px-6 animate-in fade-in duration-1000">

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                <div>
                    <p className="text-[#C5A028] text-[10px] font-black uppercase tracking-[0.4em] mb-3 opacity-60">Dirección de Auditoría</p>
                    <h1 className="font-serif-title text-6xl text-white tracking-tighter leading-none">Historial Operativo</h1>
                    <p className="text-gray-600 text-[13px] mt-4 font-medium max-w-2xl leading-relaxed">
                        Acceso integral al registro histórico de liquidaciones. Esta consola permite auditar bases imponibles,
                        identificación fiscal (DPI/NIT) y el flujo de caja por colaborador.
                    </p>
                </div>
                <div className="flex items-center gap-6 bg-[#111112] border border-white/5 px-8 py-4 rounded-[28px] shadow-2xl">
                    <div className="text-right border-r border-white/5 pr-6">
                        <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest opacity-60">Entradas</p>
                        <p className="text-white font-black text-3xl tracking-tighter">{todosLosRegistros.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#C5A028]/10 flex items-center justify-center border border-[#C5A028]/20">
                        <svg className="w-5 h-5 text-[#C5A028]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                </div>
            </div>

            <div className="luxury-card p-8 mb-10 border-t-2 border-t-[#C5A028]/30 shadow-2xl bg-white/[0.01]">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                    <div className="md:col-span-5">
                        <label className={labelCls}>Criterio de Auditoría</label>
                        <select value={selectedEmpleado} onChange={(e) => handleChangeEmpleado(e.target.value)} className={inputCls}>
                            <option value="">— Seleccionar Colaborador —</option>
                            <option value="todos">Audit General (Empresa Completa)</option>
                            {empleados.map((emp) => (<option key={emp.ID_EMPLEADO} value={emp.ID_EMPLEADO}>{emp.NOMBRE}</option>))}
                        </select>
                    </div>

                    {selectedEmpleado === 'todos' && (
                        <>
                            <div className="md:col-span-3">
                                <label className={labelCls}>Periodo Fiscal</label>
                                <select value={selectedPeriodo} onChange={(e) => setSelectedPeriodo(e.target.value)} className={inputCls}>
                                    <option value="">Todos los ciclos</option>
                                    {periodosUnicos.map(p => (<option key={p.id} value={String(p.id)}>{labelPeriodo(p.numero, p.anio)}</option>))}
                                </select>
                            </div>
                            <div className="md:col-span-4">
                                <label className={labelCls}>Filtrar por Cargo</label>
                                <select value={selectedPuesto} onChange={(e) => setSelectedPuesto(e.target.value)} className={inputCls}>
                                    <option value="">Todas las posiciones</option>
                                    {puestosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </>
                    )}

                    {selectedEmpleado && selectedEmpleado !== 'todos' && (
                         <div className="md:col-span-7 flex items-end gap-3">
                            <div className="flex-1">
                                <label className={labelCls}>Año Fiscal para Reporte SAT</label>
                                <select value={anioFormato} onChange={(e) => setAnioFormato(Number(e.target.value))} className={inputCls}>
                                    {[...new Set(todosLosRegistros.filter(r => String(r.ID_EMPLEADO) === selectedEmpleado).map(r => r.ANIO))].sort((a,b)=>b-a).map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <button onClick={() => window.open(urlFormatoUnico(selectedEmpleado, anioFormato), '_blank')} className="gold-button text-[10px] uppercase tracking-[0.2em] py-3 shadow-xl">
                                📊 Formato Único
                            </button>
                         </div>
                    )}
                </div>
            </div>

            <div className="luxury-card overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                                <th className="px-6 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] whitespace-nowrap min-w-[220px]">Colaborador & Datos SAT</th>
                                <th className="px-6 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] whitespace-nowrap min-w-[150px]">Ciclo Operativo</th>
                                <th className="px-6 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-right whitespace-nowrap min-w-[120px]">Sueldo Base</th>
                                <th className="px-6 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-right whitespace-nowrap min-w-[120px]">Devengado</th>
                                <th className="px-6 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-right whitespace-nowrap min-w-[120px]">Egresos</th>
                                <th className="px-6 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-right whitespace-nowrap min-w-[140px]">Liquido Neto</th>
                                <th className="px-6 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] whitespace-nowrap min-w-[100px]">Estado</th>
                                <th className="px-6 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-center whitespace-nowrap min-w-[60px]">Boleta</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {selectedEmpleado === '' ? (
                                <tr><td colSpan={8} className="px-8 py-32 text-center opacity-30 italic text-sm">Seleccione un parámetro de auditoría para cargar el historial.</td></tr>
                            ) : historialFiltrado.length === 0 ? (
                                <tr><td colSpan={8} className="px-8 py-32 text-center opacity-30 italic text-sm">No se localizaron registros bajo este criterio.</td></tr>
                            ) : (
                                historialFiltrado.map((r) => (
                                    <tr key={r.ID_NOMINA} className="hover:bg-white/[0.015] transition-all group">
                                        <td className="px-6 py-6">
                                            <p className="text-white font-bold text-[13px] tracking-tight whitespace-nowrap">{r.NOMBRE_EMPLEADO}</p>
                                            <div className="flex items-center gap-2 mt-1.5 opacity-50">
                                                <span className="text-[8.5px] font-black uppercase tracking-widest text-[#C5A028] whitespace-nowrap">DPI: {r.DPI || '—'}</span>
                                                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                                <span className="text-[8.5px] font-black uppercase tracking-widest text-blue-400 whitespace-nowrap">NIT: {r.NIT || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <p className="text-gray-300 font-bold text-[12px] whitespace-nowrap">{labelPeriodo(r.NUMERO_PERIODO, r.ANIO)}</p>
                                            <p className="text-[9px] text-gray-600 font-medium mt-1 uppercase tracking-widest whitespace-nowrap">Pago: {formatFecha(r.FECHA_PAGO)}</p>
                                        </td>
                                        <td className="px-6 py-6 text-right text-gray-500 font-bold text-[12px] whitespace-nowrap">
                                            {formatQ(r.SUELDO_BASE || r.SUELDO_BASE_HIST || (Number(r.TOTAL_PERCEPCIONES) - 250))}
                                        </td>
                                        <td className="px-6 py-6 text-right text-emerald-500/80 font-bold text-[12px] whitespace-nowrap">
                                            {formatQ(r.TOTAL_PERCEPCIONES)}
                                        </td>
                                        <td className="px-6 py-6 text-right text-red-500/80 font-bold text-[12px] whitespace-nowrap">
                                            {formatQ(r.TOTAL_DEDUCCIONES)}
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <p className="text-white font-black text-[15px] tracking-tighter whitespace-nowrap">{formatQ(r.LIQUIDO_A_PAGAR)}</p>
                                            <p className="text-[8px] text-gray-700 font-black uppercase mt-1 tracking-widest whitespace-nowrap">Liquidado</p>
                                        </td>
                                        <td className="px-6 py-6"><EstadoBadge value={r.ESTADO} /></td>
                                        <td className="px-6 py-6 text-center">
                                            <button onClick={() => handleVerBoleta(r.ID_NOMINA)} className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-500 hover:text-[#C5A028] hover:border-[#C5A028]/30 transition-all shadow-lg mx-auto">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-12 flex justify-center opacity-30">
                <p className="text-[9px] font-black text-gray-700 uppercase tracking-[1em]">Certificación Digital NóminaGT</p>
            </div>
        </div>
    );
};

export default HistorialPage;
