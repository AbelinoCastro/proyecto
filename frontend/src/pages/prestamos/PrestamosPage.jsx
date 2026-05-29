import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    getPrestamos, createPrestamo, getDetallePrestamo,
    procesarPagosMensuales, getUltimoComprobante
} from '../../services/prestamoService';

const formatQ = (n) => `Q ${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Toast = ({ mensaje, tipo, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed bottom-10 right-10 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-10 duration-500 ${
      tipo === 'error' ? 'bg-red-950/60 border-red-500/50 text-red-100' : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-100'
    } backdrop-blur-2xl`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${tipo === 'error' ? 'border-red-500/30' : 'border-emerald-500/30'}`}>
        {tipo === 'error' ? '✕' : '✔'}
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{tipo === 'error' ? 'Sistema / Alerta' : 'Notificación'}</span>
        <span className="text-[13px] font-bold">{mensaje}</span>
      </div>
    </div>
  );
};

const PrestamosPage = () => {
    const [prestamos, setPrestamos]     = useState([]);
    const [showModal, setShowModal]     = useState(false);
    const [showCuotas, setShowCuotas]   = useState(false);
    const [cuotas, setCuotas]           = useState([]);
    const [prestamoSel, setPrestamoSel] = useState(null);
    const [formData, setFormData]       = useState({ id_prestamo: '', id_empleado: '', monto: '', cuotas: '' });
    const [toast, setToast]             = useState(null);
    const [loading, setLoading]         = useState(false);

    const showToast = (msg, tipo = 'exito') => setToast({ mensaje: msg, tipo });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { cargarPrestamos(); }, []);

    const cargarPrestamos = async () => {
        try {
            const res = await getPrestamos();
            setPrestamos(res.data?.data || []);
        } catch { showToast('Fallo al sincronizar cartera de préstamos', 'error'); }
    };

    const verCuotas = async (prestamo) => {
        try {
            const res = await getDetallePrestamo(prestamo.ID_PRESTAMO);
            setCuotas(res.data?.data || []);
            setPrestamoSel(prestamo);
            setShowCuotas(true);
        } catch { showToast('No se pudo obtener el cronograma de pagos', 'error'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createPrestamo(formData);
            showToast('Instrumento de deuda registrado formalmente');
            setShowModal(false);
            setFormData({ id_prestamo: '', id_empleado: '', monto: '', cuotas: '' });
            cargarPrestamos();
        } catch (err) {
            showToast(err.response?.data?.message || 'Error en el registro del préstamo', 'error');
        } finally { setLoading(false); }
    };

    const procesarPagos = async () => {
        if (!window.confirm('¿Desea ejecutar la deducción mensual masiva de todos los préstamos activos?')) return;
        setLoading(true);
        try {
            const res = await procesarPagosMensuales();
            if (res.data?.ok && res.data?.data) {
                showToast(`Ciclo de cobro ejecutado. Total: ${formatQ(res.data.data.total)}`);
                cargarPrestamos();
            } else {
                showToast(res.data?.mensaje || 'No se detectaron cobros pendientes', 'error');
            }
        } catch { showToast('Fallo en la ejecución del proceso masivo', 'error'); }
        finally { setLoading(false); }
    };

    const handleComprobanteGeneral = async () => {
        try {
            const res = await getUltimoComprobante();
            if (res.data?.ok && res.data?.data) {
                generarPDFGeneral(res.data.data);
            } else {
                showToast('No se localizó un historial de cierres previo.', 'error');
            }
        } catch { showToast('Error al generar reporte histórico', 'error'); }
    };

    const generarPDFGeneral = (datos) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('REPORTE CORPORATIVO DE DESCUENTOS', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Transacción: ${datos.ID_TRANSACCION}`, 20, 40);
        doc.text(`Cierre: ${new Date(datos.FECHA_PROCESO).toLocaleString('es-GT')}`, 20, 50);
        autoTable(doc, {
            startY: 62,
            head: [['Descripción Técnica', 'Valor Contable']],
            body: [
                ['Volumen de Colaboradores', datos.CANTIDAD_EMPLEADOS],
                ['Estatus de Cartera', 'LIQUIDADO'],
                ['Divisa Operativa', 'Quetzales (GTQ)'],
                ['IMPORTE TOTAL', formatQ(datos.TOTAL_DESCONTADO)]
            ],
            theme: 'striped',
            headStyles: { fillColor: [20, 20, 22] }
        });
        doc.save(`Audit_Prestamos_${datos.ID_TRANSACCION}.pdf`);
    };

    const generarComprobanteCuota = (cuota) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('CERTIFICADO DE ABONO — PRÉSTAMO', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Contrato: #${prestamoSel.ID_PRESTAMO}`, 20, 40);
        doc.text(`Titular: ${prestamoSel.NOMBRE_EMPLEADO}`, 20, 50);
        autoTable(doc, {
            startY: 62,
            head: [['Descripción', 'Importe']],
            body: [
                [`Amortización No. ${cuota.NUMERO_CUOTA}`, formatQ(cuota.MONTO_CUOTA)],
                ['Estatus de Cuota', 'PAGADO'],
                ['Moneda de Pago', 'Quetzales (GTQ)']
            ],
            theme: 'grid',
            headStyles: { fillColor: [197, 160, 40] }
        });
        const finalY = doc.lastAutoTable?.finalY || 100;
        doc.setFontSize(10);
        doc.text('Este documento certifica el descuento realizado mediante el sistema de nómina.', 20, finalY + 20);
        doc.text('Firma Autorizada: ________________________', 20, finalY + 35);
        doc.save(`Abono_${prestamoSel.ID_PRESTAMO}_C${cuota.NUMERO_CUOTA}.pdf`);
    };

    const labelCls = "text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block opacity-60";
    const inputCls = "bg-[#0b0b0b] border border-white/5 rounded-xl px-4 py-3 text-[12px] text-white outline-none focus:border-[#C5A028]/30 transition-all w-full shadow-inner";

    return (
        <div className="max-w-[1450px] mx-auto py-10 px-8 animate-in fade-in duration-1000 min-h-screen">
            {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}

            {/* Header Maestro */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-12">
                <div>
                    <p className="text-[#C5A028] text-[10px] font-black uppercase tracking-[0.4em] mb-3 opacity-60">Servicios Financieros</p>
                    <h1 className="font-serif-title text-6xl text-white tracking-tighter leading-none">Gestión de Préstamos</h1>
                    <p className="text-gray-600 text-[13px] mt-4 font-medium max-w-2xl leading-relaxed">
                        Control integral de financiamiento interno. Gestione amortizaciones, saldos pendientes y
                        ejecute los cobros automáticos integrados al motor de nómina corporativa.
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-[#111112] border border-white/5 p-2 rounded-[28px] shadow-2xl">
                    <button onClick={handleComprobanteGeneral} className="dark-button text-[9px] uppercase tracking-widest px-6 py-3.5">📊 Último Reporte</button>
                    <button onClick={procesarPagos} disabled={loading} className="gold-button !bg-emerald-600/10 !text-emerald-500 border border-emerald-500/20 text-[9px] uppercase tracking-widest px-6 py-3.5 hover:!bg-emerald-600 hover:!text-white disabled:opacity-20">⚙️ Procesar Ciclo</button>
                    <button onClick={() => setShowModal(true)} className="gold-button text-[9px] uppercase tracking-widest px-8 py-3.5 shadow-xl shadow-[#C5A028]/10">+ Nuevo Instrumento</button>
                </div>
            </div>

            {/* Listado de Préstamos */}
            <div className="luxury-card overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Cartera de Créditos Activa</h2>
                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{prestamos.length} Contratos Vigentes</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/[0.04] bg-white/[0.005]">
                                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Referencia</th>
                                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Titular & ID</th>
                                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-right">Principal Autorizado</th>
                                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-center">Plazo</th>
                                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-right">Cuota Mensual</th>
                                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-center">Estatus</th>
                                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {prestamos.map(p => (
                                <tr key={p.ID_PRESTAMO} className="hover:bg-white/[0.015] transition-all group">
                                    <td className="px-8 py-5 text-[#C5A028] font-black text-[11px] tracking-widest">#{p.ID_PRESTAMO}</td>
                                    <td className="px-8 py-5">
                                        <p className="text-white font-bold text-[13px] tracking-tight">{p.NOMBRE_EMPLEADO}</p>
                                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Socio ID: {p.ID_EMPLEADO}</p>
                                    </td>
                                    <td className="px-8 py-5 text-right text-emerald-500 font-bold text-[13px]">{formatQ(p.MONTO)}</td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="bg-white/[0.03] border border-white/5 px-3 py-1 rounded-lg text-[11px] text-gray-300 font-black">{p.CUOTAS} <small className="opacity-40 ml-1">Meses</small></span>
                                    </td>
                                    <td className="px-8 py-5 text-right text-blue-400 font-black text-[13px]">{formatQ(p.PAGO_MENSUAL)}</td>
                                    <td className="px-8 py-5 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                            p.ESTADO === 'ACTIVO'
                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        }`}>{p.ESTADO}</span>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <button onClick={() => verCuotas(p)} className="dark-button text-[9px] uppercase tracking-widest px-4 py-2 hover:border-[#C5A028]/40 transition-all">Ver Cronograma</button>
                                    </td>
                                </tr>
                            ))}
                            {prestamos.length === 0 && (
                                <tr><td colSpan="7" className="px-8 py-32 text-center opacity-20 italic text-sm tracking-[0.2em] uppercase">No se localizan instrumentos financieros activos</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Cronograma de Pagos */}
            {showCuotas && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="luxury-card w-full max-w-3xl shadow-2xl border-[#C5A028]/20 animate-in zoom-in-95 duration-500 overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                            <div>
                                <h2 className="text-white text-xs font-black uppercase tracking-[0.4em]">Cronograma de Amortización</h2>
                                <p className="text-gray-500 text-[10px] font-bold mt-1 uppercase tracking-widest">Contrato: #{prestamoSel?.ID_PRESTAMO} — {prestamoSel?.NOMBRE_EMPLEADO}</p>
                            </div>
                            <button onClick={() => setShowCuotas(false)} className="text-gray-500 hover:text-white transition-all hover:rotate-90">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-10 max-h-[70vh] overflow-y-auto no-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/[0.01] border-b border-white/[0.04]">
                                    <tr>
                                        <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Amortización No.</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-right">Monto Cuota</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-center">Estado</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-right">Comprobante</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.02]">
                                    {cuotas.map((c, i) => (
                                        <tr key={i} className="hover:bg-white/[0.015] transition-colors">
                                            <td className="px-6 py-4 text-white font-bold text-[12px]">Mensualidad {c.NUMERO_CUOTA}</td>
                                            <td className="px-6 py-4 text-right font-black text-blue-400 text-[12px]">{formatQ(c.MONTO_CUOTA)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                                    c.ESTADO === 'PENDIENTE'
                                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                }`}>{c.ESTADO}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {c.ESTADO === 'PAGADO' ? (
                                                    <button onClick={() => generarComprobanteCuota(c)} className="text-[#C5A028] text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors flex items-center justify-end gap-2 ml-auto">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        Descargar PDF
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-700 text-[9px] font-bold uppercase tracking-widest italic opacity-40">Pendiente de Procesar</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Registro de Nuevo Instrumento */}
            {showModal && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="luxury-card w-full max-w-md shadow-[0_0_80px_rgba(0,0,0,0.8)] border-[#C5A028]/20 animate-in zoom-in-95 duration-500 overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                            <h2 className="text-white text-xs font-black uppercase tracking-[0.5em]">Nuevo Instrumento Financiero</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-all hover:rotate-90">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-12 space-y-8">
                            <div className="space-y-6">
                                <div>
                                    <label className={labelCls}>Identificador del Préstamo</label>
                                    <input
                                        type="number" min="1"
                                        placeholder="Ej: 1001 (número único)"
                                        required
                                        value={formData.id_prestamo}
                                        onChange={e => setFormData({ ...formData, id_prestamo: e.target.value })}
                                        className={inputCls}
                                        title="Número único de préstamo"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>ID del Colaborador Beneficiario</label>
                                    <input
                                        type="number" min="1"
                                        placeholder="Ej: 5 (ID del empleado)"
                                        required
                                        value={formData.id_empleado}
                                        onChange={e => setFormData({ ...formData, id_empleado: e.target.value })}
                                        className={inputCls}
                                        title="ID del empleado al que se le otorga"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Principal Autorizado (Monto)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C5A028] font-black text-sm">Q</span>
                                        <input
                                            type="number" step="0.01" min="0.01"
                                            placeholder="Ej: 5000.00"
                                            required
                                            value={formData.monto}
                                            onChange={e => setFormData({ ...formData, monto: e.target.value })}
                                            className={inputCls + " pl-12"}
                                            title="Monto en quetzales (mayor a 0)"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Plazo del Crédito (Cuotas)</label>
                                    <input
                                        type="number" min="1" max="60" step="1"
                                        placeholder="Ej: 12 (entre 1 y 60 meses)"
                                        required
                                        value={formData.cuotas}
                                        onChange={e => setFormData({ ...formData, cuotas: e.target.value })}
                                        className={inputCls}
                                        title="Número de meses (1-60)"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 dark-button py-4 text-[10px] uppercase tracking-widest">Cancelar</button>
                                <button type="submit" disabled={loading} className="flex-1 gold-button py-4 text-[10px] uppercase tracking-widest shadow-2xl shadow-[#C5A028]/20 font-black">{loading ? 'Procesando...' : 'Confirmar Préstamo'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="mt-16 flex justify-center opacity-30">
                <p className="text-[9px] font-black text-gray-700 uppercase tracking-[1em]">Administración Financiera NóminaGT</p>
            </div>
        </div>
    );
};

export default PrestamosPage;
