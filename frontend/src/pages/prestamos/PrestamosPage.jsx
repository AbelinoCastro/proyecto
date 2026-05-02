import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    getPrestamos, createPrestamo, getDetallePrestamo,
    procesarPagosMensuales, getUltimoComprobante
} from '../../services/prestamoService';

const PrestamosPage = () => {
    const [prestamos, setPrestamos]     = useState([]);
    const [showModal, setShowModal]     = useState(false);
    const [showCuotas, setShowCuotas]   = useState(false);
    const [cuotas, setCuotas]           = useState([]);
    const [prestamoSel, setPrestamoSel] = useState(null);
    const [formData, setFormData]       = useState({ id_prestamo: '', id_empleado: '', monto: '', cuotas: '' });
    const [toast, setToast]             = useState(null);
    const [loading, setLoading]         = useState(false);

    const showToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 3500);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { cargarPrestamos(); }, []);

    const cargarPrestamos = async () => {
        try {
            const res = await getPrestamos();
            setPrestamos(res.data?.data || []);
        } catch { showToast('Error al cargar préstamos', 'error'); }
    };

    const verCuotas = async (prestamo) => {
        try {
            const res = await getDetallePrestamo(prestamo.ID_PRESTAMO);
            setCuotas(res.data?.data || []);
            setPrestamoSel(prestamo);
            setShowCuotas(true);
        } catch { showToast('Error al obtener cuotas', 'error'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createPrestamo(formData);
            showToast('Préstamo creado correctamente');
            setShowModal(false);
            setFormData({ id_prestamo: '', id_empleado: '', monto: '', cuotas: '' });
            cargarPrestamos();
        } catch (err) {
            showToast(err.response?.data?.message || 'Error al crear préstamo', 'error');
        } finally { setLoading(false); }
    };

    const procesarPagos = async () => {
        if (!window.confirm('¿Desea procesar la cuota mensual de todos los préstamos activos?')) return;
        setLoading(true);
        try {
            const res = await procesarPagosMensuales();
            if (res.data?.ok && res.data?.data) {
                showToast(`Cuotas procesadas. Total: Q ${Number(res.data.data.total).toFixed(2)}`);
                cargarPrestamos();
            } else {
                showToast(res.data?.mensaje || 'No hay cuotas pendientes', 'error');
            }
        } catch { showToast('Error al procesar pagos', 'error'); }
        finally { setLoading(false); }
    };

    const handleComprobanteGeneral = async () => {
        try {
            const res = await getUltimoComprobante();
            if (res.data?.ok && res.data?.data) {
                generarPDFGeneral(res.data.data);
            } else {
                showToast('No hay ningún pago registrado todavía.', 'error');
            }
        } catch { showToast('Error al obtener comprobante', 'error'); }
    };

    const generarPDFGeneral = (datos) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('COMPROBANTE DE DESCUENTOS MENSUALES', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`No. Transacción: ${datos.ID_TRANSACCION}`, 20, 40);
        doc.text(`Fecha: ${new Date(datos.FECHA_PROCESO).toLocaleString('es-GT')}`, 20, 50);
        autoTable(doc, {
            startY: 62,
            head: [['Descripción', 'Valor']],
            body: [
                ['Cantidad de Empleados Procesados', datos.CANTIDAD_EMPLEADOS],
                ['Estado de las Cuotas', 'PAGADO'],
                ['Moneda', 'Quetzales (GTQ)'],
                ['TOTAL DESCONTADO', `Q ${Number(datos.TOTAL_DESCONTADO).toFixed(2)}`]
            ],
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59] }
        });
        doc.save(`Reporte_Prestamos_${datos.ID_TRANSACCION}.pdf`);
    };

    const generarComprobanteCuota = (cuota) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('COMPROBANTE DE DESCUENTO — PRÉSTAMO', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`No. Préstamo: #${prestamoSel.ID_PRESTAMO}`, 20, 40);
        doc.text(`Empleado: ${prestamoSel.NOMBRE_EMPLEADO}`, 20, 50);
        autoTable(doc, {
            startY: 62,
            head: [['Descripción', 'Monto']],
            body: [
                [`Cuota No. ${cuota.NUMERO_CUOTA}`, `Q ${Number(cuota.MONTO_CUOTA).toFixed(2)}`],
                ['Estado', 'PAGADO'],
                ['Moneda', 'Quetzales (GTQ)']
            ],
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] }
        });
        const finalY = doc.lastAutoTable?.finalY || 100;
        doc.setFontSize(10);
        doc.text('Este documento sirve como comprobante de descuento de nómina.', 20, finalY + 20);
        doc.text('Firma Recibido: ________________________', 20, finalY + 35);
        doc.save(`Comprobante_Prestamo_${prestamoSel.ID_PRESTAMO}_Cuota_${cuota.NUMERO_CUOTA}.pdf`);
    };

    return (
        <div className="p-6 text-slate-100 min-h-screen bg-[#131720]">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium
                    ${toast.tipo === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-[#1a1f2e] p-5 rounded-2xl border border-slate-700/60">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">🏦 Gestión de Préstamos</h1>
                    <p className="text-slate-400 text-sm mt-1">Administración de cuotas y descuentos en nómina (GTQ)</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button onClick={handleComprobanteGeneral}
                        className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 border border-slate-600 transition-colors">
                        📊 Último Reporte
                    </button>
                    <button onClick={procesarPagos} disabled={loading}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors">
                        ⚙️ Procesar Mes
                    </button>
                    <button onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors">
                        + Nuevo Préstamo
                    </button>
                </div>
            </div>

            {/* Tabla principal */}
            <div className="bg-[#1a1f2e] rounded-2xl border border-slate-700/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-800/80 text-slate-300 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-5 py-4">#</th>
                                <th className="px-5 py-4">Empleado</th>
                                <th className="px-5 py-4 text-right">Monto Total</th>
                                <th className="px-5 py-4 text-center">Cuotas</th>
                                <th className="px-5 py-4 text-right">Cuota Mensual</th>
                                <th className="px-5 py-4 text-center">Estado</th>
                                <th className="px-5 py-4 text-center">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {prestamos.map(p => (
                                <tr key={p.ID_PRESTAMO} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-5 py-3 text-slate-400 font-mono text-xs">{p.ID_PRESTAMO}</td>
                                    <td className="px-5 py-3">
                                        <div className="font-medium text-slate-200">{p.NOMBRE_EMPLEADO}</div>
                                        <div className="text-xs text-slate-500">ID {p.ID_EMPLEADO}</div>
                                    </td>
                                    <td className="px-5 py-3 text-right font-bold text-emerald-400">Q {Number(p.MONTO).toFixed(2)}</td>
                                    <td className="px-5 py-3 text-center text-slate-300">{p.CUOTAS}</td>
                                    <td className="px-5 py-3 text-right font-semibold text-blue-400">Q {Number(p.PAGO_MENSUAL).toFixed(2)}</td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                            p.ESTADO === 'ACTIVO'
                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        }`}>{p.ESTADO}</span>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <button onClick={() => verCuotas(p)}
                                            className="bg-slate-700 hover:bg-blue-600 text-slate-200 hover:text-white px-4 py-1.5 rounded-lg text-xs font-medium border border-slate-600 transition-colors">
                                            Ver Cuotas
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {prestamos.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-10 text-center text-slate-500 italic">
                                        <div className="text-3xl mb-2 opacity-40">📂</div>No hay préstamos registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Cuotas */}
            {showCuotas && (
                <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-sm z-50">
                    <div className="bg-[#1a1f2e] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-center p-5 border-b border-slate-700">
                            <div>
                                <h2 className="text-lg font-bold text-white">Detalle de Cuotas</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Préstamo #{prestamoSel?.ID_PRESTAMO} — {prestamoSel?.NOMBRE_EMPLEADO}
                                </p>
                            </div>
                            <button onClick={() => setShowCuotas(false)}
                                className="text-slate-400 hover:text-white hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-xl leading-none">
                                &times;
                            </button>
                        </div>
                        <div className="overflow-y-auto p-5">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-800 text-slate-300 text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">No. Cuota</th>
                                        <th className="px-4 py-3 text-right">Monto</th>
                                        <th className="px-4 py-3 text-center">Estado</th>
                                        <th className="px-4 py-3 text-center">Comprobante</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {cuotas.map((c, i) => (
                                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-4 py-3 text-slate-300">Cuota {c.NUMERO_CUOTA}</td>
                                            <td className="px-4 py-3 text-right font-bold text-blue-400">Q {Number(c.MONTO_CUOTA).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                                                    c.ESTADO === 'PENDIENTE'
                                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                }`}>{c.ESTADO}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {c.ESTADO === 'PAGADO' ? (
                                                    <button onClick={() => generarComprobanteCuota(c)}
                                                        className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-xs px-3 py-1 rounded-lg transition-all">
                                                        📥 Descargar
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-600 text-xs italic">No disponible</span>
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

            {/* Modal: Nuevo préstamo */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-sm z-50">
                    <form onSubmit={handleSubmit}
                        className="bg-[#1a1f2e] p-7 rounded-2xl border border-slate-700 w-full max-w-md space-y-5">
                        <div>
                            <h2 className="text-xl font-bold text-white">Nuevo Préstamo</h2>
                            <p className="text-slate-400 text-sm mt-0.5">La cuota mensual se calcula automáticamente.</p>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'ID Préstamo', key: 'id_prestamo', placeholder: 'Ej: 1001' },
                                { label: 'ID Empleado',  key: 'id_empleado', placeholder: 'Ej: 5' },
                                { label: 'Monto Total (Q)', key: 'monto', placeholder: '0.00' },
                                { label: 'Cantidad de Cuotas', key: 'cuotas', placeholder: 'Ej: 12' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                                    <input type="number" placeholder={f.placeholder} required
                                        value={formData[f.key]}
                                        onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                                        className="w-full bg-[#131720] border border-slate-600 text-white p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-600" />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setShowModal(false)}
                                className="flex-1 bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-600 py-2.5 rounded-xl font-medium transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold transition-colors">
                                {loading ? 'Guardando...' : 'Guardar Préstamo'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PrestamosPage;
