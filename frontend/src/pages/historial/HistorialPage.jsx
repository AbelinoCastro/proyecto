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
            const slug = (enc.NOMBRE_EMPLEADO || 'empleado').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
            const tituloPDF = `Boleta_${slug}_${MESES[(enc.NUMERO_PERIODO || 1) - 1] || enc.NUMERO_PERIODO}_${enc.ANIO}`;
            const referencia = `REF-${String(enc.ID_NOMINA).padStart(6, '0')}`;
            const fechaPago = enc.FECHA_PAGO ? new Date(enc.FECHA_PAGO).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: '2-digit' }) : '—';
            const totalPercepciones = (det.percepciones || []).reduce((s, p) => s + Number(p.MONTO || 0), 0);
            const totalDeducciones  = (det.deducciones || []).reduce((s, d) => s + Number(d.MONTO || 0), 0);

            const win = window.open('', '_blank');
            win.document.write(`
                <!DOCTYPE html>
                <html lang="es"><head>
                  <meta charset="UTF-8">
                  <title>${tituloPDF}</title>
                  <link rel="preconnect" href="https://fonts.googleapis.com">
                  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    @page { size: A4; margin: 0; }
                    body {
                      font-family: 'Inter', sans-serif;
                      color: #1a1a1a;
                      background: #f5f5f5;
                      -webkit-print-color-adjust: exact;
                      print-color-adjust: exact;
                    }
                    .page {
                      max-width: 800px;
                      margin: 30px auto;
                      background: white;
                      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
                      padding: 0;
                      overflow: hidden;
                    }
                    /* Header dorado oscuro */
                    .hero {
                      background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #1f2937 100%);
                      color: white;
                      padding: 40px 50px;
                      position: relative;
                      overflow: hidden;
                    }
                    .hero::before {
                      content: '';
                      position: absolute;
                      top: -50%;
                      right: -10%;
                      width: 400px;
                      height: 400px;
                      background: radial-gradient(circle, rgba(197,160,40,0.15) 0%, transparent 70%);
                    }
                    .hero-content { position: relative; display: flex; justify-content: space-between; align-items: flex-start; }
                    .brand-logo {
                      font-family: 'Playfair Display', serif;
                      font-size: 36px;
                      font-weight: 900;
                      letter-spacing: -1px;
                      line-height: 1;
                    }
                    .brand-logo span { color: #C5A028; }
                    .brand-tag {
                      font-size: 9px;
                      letter-spacing: 0.4em;
                      color: rgba(255,255,255,0.5);
                      text-transform: uppercase;
                      margin-top: 6px;
                      font-weight: 700;
                    }
                    .doc-meta {
                      text-align: right;
                      padding: 16px 20px;
                      background: rgba(197,160,40,0.12);
                      border: 1px solid rgba(197,160,40,0.3);
                      border-radius: 12px;
                    }
                    .doc-meta-label {
                      font-size: 9px;
                      letter-spacing: 0.3em;
                      color: #C5A028;
                      text-transform: uppercase;
                      font-weight: 800;
                      margin-bottom: 4px;
                    }
                    .doc-meta-value {
                      font-family: 'Playfair Display', serif;
                      font-size: 22px;
                      font-weight: 700;
                      color: white;
                    }
                    .doc-ref { font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 2px; font-family: monospace; }

                    /* Title section */
                    .title-section { padding: 36px 50px 24px; text-align: center; border-bottom: 1px solid #f0f0f0; }
                    .title-section h1 {
                      font-family: 'Playfair Display', serif;
                      font-size: 32px;
                      font-weight: 900;
                      color: #1a1a1a;
                      letter-spacing: -0.5px;
                      line-height: 1.1;
                    }
                    .title-section p {
                      font-size: 11px;
                      letter-spacing: 0.3em;
                      color: #888;
                      text-transform: uppercase;
                      font-weight: 600;
                      margin-top: 8px;
                    }

                    /* Info cards */
                    .info-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 28px 50px; }
                    .info-card {
                      background: #fafafa;
                      padding: 18px 22px;
                      border-radius: 10px;
                      border-left: 3px solid #C5A028;
                      position: relative;
                    }
                    .info-card .label {
                      font-size: 9px;
                      letter-spacing: 0.3em;
                      color: #999;
                      text-transform: uppercase;
                      font-weight: 700;
                      margin-bottom: 8px;
                    }
                    .info-card .value {
                      font-size: 15px;
                      font-weight: 700;
                      color: #1a1a1a;
                      line-height: 1.3;
                    }
                    .info-card .subtitle {
                      font-size: 11px;
                      color: #666;
                      margin-top: 4px;
                      font-weight: 500;
                    }

                    /* Tables section */
                    .tables { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 20px 50px 30px; }
                    .table-block { display: flex; flex-direction: column; }
                    .table-title {
                      font-family: 'Playfair Display', serif;
                      font-size: 18px;
                      font-weight: 700;
                      margin-bottom: 12px;
                      padding-bottom: 8px;
                      border-bottom: 2px solid;
                      display: flex;
                      align-items: center;
                      gap: 8px;
                    }
                    .table-block.income .table-title { color: #0f7a3d; border-color: #0f7a3d; }
                    .table-block.expense .table-title { color: #9b1c1c; border-color: #9b1c1c; }
                    .item-row {
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      padding: 11px 4px;
                      border-bottom: 1px dashed #e5e5e5;
                      font-size: 12px;
                    }
                    .item-row:last-of-type { border-bottom: none; }
                    .item-name { color: #444; font-weight: 500; }
                    .item-amount { font-weight: 700; font-family: 'Inter', sans-serif; }
                    .income .item-amount { color: #0f7a3d; }
                    .expense .item-amount { color: #9b1c1c; }
                    .subtotal-row {
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      margin-top: 12px;
                      padding-top: 12px;
                      border-top: 2px solid;
                      font-size: 11px;
                      letter-spacing: 0.15em;
                      text-transform: uppercase;
                      font-weight: 800;
                    }
                    .income .subtotal-row { color: #0f7a3d; border-color: #0f7a3d; }
                    .expense .subtotal-row { color: #9b1c1c; border-color: #9b1c1c; }
                    .subtotal-row .amount { font-size: 16px; }

                    /* Footer / total */
                    .total-section {
                      margin: 0 50px 40px;
                      background: linear-gradient(135deg, #0f1419 0%, #1f2937 100%);
                      color: white;
                      border-radius: 16px;
                      padding: 28px 36px;
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      position: relative;
                      overflow: hidden;
                    }
                    .total-section::before {
                      content: '';
                      position: absolute;
                      bottom: -50%;
                      right: -10%;
                      width: 300px;
                      height: 300px;
                      background: radial-gradient(circle, rgba(197,160,40,0.2) 0%, transparent 70%);
                    }
                    .total-section .info {
                      position: relative;
                    }
                    .total-section .label {
                      font-size: 9px;
                      letter-spacing: 0.4em;
                      color: #C5A028;
                      text-transform: uppercase;
                      font-weight: 800;
                      margin-bottom: 6px;
                    }
                    .total-section .name {
                      font-size: 13px;
                      color: rgba(255,255,255,0.6);
                    }
                    .total-section .amount {
                      position: relative;
                      text-align: right;
                    }
                    .total-section .amount-label {
                      font-size: 9px;
                      letter-spacing: 0.4em;
                      color: #C5A028;
                      text-transform: uppercase;
                      font-weight: 800;
                      margin-bottom: 4px;
                    }
                    .total-section .amount-value {
                      font-family: 'Playfair Display', serif;
                      font-size: 42px;
                      font-weight: 900;
                      color: white;
                      line-height: 1;
                      letter-spacing: -1px;
                    }
                    .total-section .amount-words {
                      font-size: 10px;
                      color: rgba(255,255,255,0.5);
                      font-style: italic;
                      margin-top: 4px;
                    }

                    /* Signature & footer */
                    .signature-area {
                      padding: 0 50px 30px;
                      display: grid;
                      grid-template-columns: 1fr 1fr;
                      gap: 60px;
                    }
                    .signature-line {
                      border-top: 1px solid #999;
                      padding-top: 8px;
                      text-align: center;
                      font-size: 10px;
                      letter-spacing: 0.2em;
                      color: #666;
                      text-transform: uppercase;
                      font-weight: 600;
                      margin-top: 30px;
                    }
                    .footer-bar {
                      background: #1a1f2e;
                      color: #999;
                      padding: 16px 50px;
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      font-size: 9px;
                      letter-spacing: 0.2em;
                      text-transform: uppercase;
                    }
                    .footer-bar .left { color: #C5A028; font-weight: 700; }

                    @media print {
                      body { background: white; }
                      .page { box-shadow: none; margin: 0; max-width: 100%; }
                    }
                  </style></head>
                <body>
                  <div class="page">
                    <!-- Hero header -->
                    <div class="hero">
                      <div class="hero-content">
                        <div>
                          <div class="brand-logo">Nómina<span>GT</span></div>
                          <p class="brand-tag">Enterprise · v 4.2</p>
                        </div>
                        <div class="doc-meta">
                          <p class="doc-meta-label">Ciclo Operativo</p>
                          <p class="doc-meta-value">${periodoLabel}</p>
                          <p class="doc-ref">${referencia}</p>
                        </div>
                      </div>
                    </div>

                    <!-- Title -->
                    <div class="title-section">
                      <h1>Comprobante de Pago de Nómina</h1>
                      <p>Documento Oficial · Reservados los derechos</p>
                    </div>

                    <!-- Info cards -->
                    <div class="info-cards">
                      <div class="info-card">
                        <p class="label">Colaborador</p>
                        <p class="value">${enc.NOMBRE_EMPLEADO || '—'}</p>
                        <p class="subtitle">${enc.NOMBRE_PUESTO || '—'}${enc.NOMBRE_DEPARTAMENTO ? ' · ' + enc.NOMBRE_DEPARTAMENTO : ''}</p>
                      </div>
                      <div class="info-card">
                        <p class="label">Fecha de Pago</p>
                        <p class="value">${fechaPago}</p>
                        <p class="subtitle">Procesado vía sistema NóminaGT</p>
                      </div>
                    </div>

                    <!-- Tables -->
                    <div class="tables">
                      <div class="table-block income">
                        <h3 class="table-title">▲ Percepciones</h3>
                        ${(det.percepciones || []).map(p => `
                          <div class="item-row">
                            <span class="item-name">${p.NOMBRE_PERCEPCION}</span>
                            <span class="item-amount">${formatQ(p.MONTO)}</span>
                          </div>
                        `).join('')}
                        <div class="subtotal-row">
                          <span>Total ingresos</span>
                          <span class="amount">${formatQ(totalPercepciones)}</span>
                        </div>
                      </div>

                      <div class="table-block expense">
                        <h3 class="table-title">▼ Deducciones</h3>
                        ${(det.deducciones || []).length > 0
                          ? (det.deducciones || []).map(d => `
                            <div class="item-row">
                              <span class="item-name">${d.NOMBRE_DEDUCCION}</span>
                              <span class="item-amount">${formatQ(d.MONTO)}</span>
                            </div>
                          `).join('')
                          : '<div class="item-row"><span class="item-name" style="color:#999;font-style:italic">Sin deducciones aplicables</span><span class="item-amount">${formatQ(0)}</span></div>'
                        }
                        <div class="subtotal-row">
                          <span>Total egresos</span>
                          <span class="amount">${formatQ(totalDeducciones)}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Líquido a pagar -->
                    <div class="total-section">
                      <div class="info">
                        <p class="label">Beneficiario</p>
                        <p class="name">${enc.NOMBRE_EMPLEADO || '—'}</p>
                      </div>
                      <div class="amount">
                        <p class="amount-label">Líquido a Pagar</p>
                        <p class="amount-value">${formatQ(enc.LIQUIDO_A_PAGAR)}</p>
                        <p class="amount-words">Moneda: Quetzales (GTQ)</p>
                      </div>
                    </div>

                    <!-- Signatures -->
                    <div class="signature-area">
                      <div class="signature-line">Firma del Colaborador</div>
                      <div class="signature-line">Autorización RRHH</div>
                    </div>

                    <!-- Footer -->
                    <div class="footer-bar">
                      <span class="left">NóminaGT · Enterprise</span>
                      <span>Documento generado el ${new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: '2-digit' })}</span>
                    </div>
                  </div>
                </body></html>`);
            win.document.close();
            setTimeout(() => win.print(), 600);
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
