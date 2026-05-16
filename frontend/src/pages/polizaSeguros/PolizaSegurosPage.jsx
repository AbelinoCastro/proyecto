import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getPolizas, createPoliza, deletePoliza } from '../../services/polizaSegurosService';
import { getEmpleados } from '../../services/empleadoService';

const PLANES = ['BÁSICO', 'PLUS', 'PREMIUM'];

const planColor = {
    'BÁSICO':   'bg-slate-600/20 text-slate-300',
    'PLUS':     'bg-blue-600/20 text-blue-300',
    'PREMIUM':  'bg-amber-600/20 text-amber-300',
};

const formatQ = (n) =>
    `Q ${parseFloat(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

const EMPTY = {
    id_empleado: '', fecha_inicio_plan: '', fecha_renovacion: '',
    plan: 'BÁSICO', monto_prima: '',
    nombre_seguradora: '', nit_seguradora: '',
    direccion_aseguradora: '', cuenta_bancaria: ''
};

const PolizaSegurosPage = () => {
    const [polizas, setPolizas]     = useState([]);
    const [empleados, setEmpleados] = useState([]);
    const [form, setForm]           = useState(EMPTY);
    const [modal, setModal]         = useState(false);
    const [loading, setLoading]     = useState(false);
    const [saving, setSaving]       = useState(false);
    const [msg, setMsg]             = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const [p, e] = await Promise.all([getPolizas(), getEmpleados()]);
            setPolizas(p.data.data ?? p.data);
            setEmpleados(e.data.data ?? []);
        } catch { setMsg({ type: 'error', text: 'Error al cargar datos' }); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            await createPoliza(form);
            setMsg({ type: 'ok', text: 'Póliza registrada correctamente' });
            setModal(false);
            setForm(EMPTY);
            load();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Error al crear póliza' });
        } finally { setSaving(false); }
    };

    const handleDelete = async (id, nombre) => {
        if (!window.confirm(`¿Eliminar la póliza de ${nombre}?`)) return;
        try {
            await deletePoliza(id);
            setMsg({ type: 'ok', text: 'Póliza eliminada' });
            load();
        } catch { setMsg({ type: 'error', text: 'Error al eliminar póliza' }); }
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text('Listado de Pólizas de Seguros', 14, 18);
        doc.setFontSize(10);
        doc.setTextColor(120);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-GT')}`, 14, 25);
        doc.setTextColor(0);
        autoTable(doc, {
            startY: 30,
            head: [['ID', 'Empleado', 'Plan', 'Aseguradora', 'Prima mensual', 'Inicio', 'Renovación']],
            body: polizas.map(p => [
                p.ID_POLIZA,
                p.NOMBRE_EMPLEADO,
                p.PLAN,
                p.NOMBRE_SEGURADORA,
                `Q ${parseFloat(p.MONTO_PRIMA).toFixed(2)}`,
                formatDate(p.FECHA_INICIO_PLAN),
                formatDate(p.FECHA_RENOVACION)
            ]),
            styles: { fontSize: 9 },
            headStyles: { fillColor: [30, 64, 175] },
        });
        doc.save('polizas_seguros.pdf');
    };

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(polizas.map(p => ({
            ID: p.ID_POLIZA,
            Empleado: p.NOMBRE_EMPLEADO,
            Plan: p.PLAN,
            'Prima (Q)': parseFloat(p.MONTO_PRIMA),
            Aseguradora: p.NOMBRE_SEGURADORA,
            NIT: p.NIT_SEGURADORA,
            'Cuenta Bancaria': p.CUENTA_BANCARIA,
            'Fecha Inicio': formatDate(p.FECHA_INICIO_PLAN),
            'Fecha Renovación': formatDate(p.FECHA_RENOVACION),
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pólizas');
        XLSX.writeFile(wb, 'polizas_seguros.xlsx');
    };

    const inputCls  = 'w-full bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50';
    const selectCls = 'w-full bg-[#0b0e14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50';

    return (
        <div className="p-6 text-white min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Pólizas de Seguros</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Administra las pólizas de seguro de empleados</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={exportExcel}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-lg transition">
                        Excel
                    </button>
                    <button onClick={exportPDF}
                        className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg transition">
                        PDF
                    </button>
                    <button onClick={() => { setModal(true); setMsg(null); setForm(EMPTY); }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition">
                        + Nueva póliza
                    </button>
                </div>
            </div>

            {/* Mensaje */}
            {msg && (
                <div className={`mb-4 p-3 rounded-lg text-sm border ${msg.type === 'ok' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    {msg.text}
                </div>
            )}

            {/* Tabla */}
            <div className="bg-[#121621] border border-white/5 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 text-sm">Cargando...</div>
                ) : polizas.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">No hay pólizas registradas</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    {['ID', 'Empleado', 'Plan', 'Aseguradora', 'Prima mensual', 'Inicio', 'Renovación', ''].map(h => (
                                        <th key={h} className="text-left py-3 px-4 text-xs text-gray-400 font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {polizas.map(p => (
                                    <tr key={p.ID_POLIZA} className="border-b border-white/5 hover:bg-white/3">
                                        <td className="py-3 px-4 text-gray-400">{p.ID_POLIZA}</td>
                                        <td className="py-3 px-4 font-medium">{p.NOMBRE_EMPLEADO}</td>
                                        <td className="py-3 px-4">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColor[p.PLAN] ?? 'bg-gray-600/20 text-gray-300'}`}>
                                                {p.PLAN}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-300">{p.NOMBRE_SEGURADORA}</td>
                                        <td className="py-3 px-4 text-amber-400 font-medium">{formatQ(p.MONTO_PRIMA)}</td>
                                        <td className="py-3 px-4 text-gray-400">{formatDate(p.FECHA_INICIO_PLAN)}</td>
                                        <td className="py-3 px-4 text-gray-400">{formatDate(p.FECHA_RENOVACION)}</td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => handleDelete(p.ID_POLIZA, p.NOMBRE_EMPLEADO)}
                                                className="text-xs text-red-400 hover:text-red-300 transition"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal nueva póliza */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-[#121621] border border-white/5 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-white font-semibold text-base">Nueva póliza de seguro</h3>
                            <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Empleado *</label>
                                    <select
                                        className={selectCls}
                                        value={form.id_empleado}
                                        onChange={e => setForm(f => ({ ...f, id_empleado: e.target.value }))}
                                        required
                                    >
                                        <option value="">Seleccionar...</option>
                                        {empleados.map(emp => (
                                            <option key={emp.ID_EMPLEADO} value={emp.ID_EMPLEADO}>{emp.NOMBRE}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Plan *</label>
                                    <select
                                        className={selectCls}
                                        value={form.plan}
                                        onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                                        required
                                    >
                                        {PLANES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Fecha inicio plan *</label>
                                    <input type="date" className={inputCls} value={form.fecha_inicio_plan}
                                        onChange={e => setForm(f => ({ ...f, fecha_inicio_plan: e.target.value }))} required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Fecha renovación</label>
                                    <input type="date" className={inputCls} value={form.fecha_renovacion}
                                        onChange={e => setForm(f => ({ ...f, fecha_renovacion: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Monto prima (Q) *</label>
                                    <input type="number" step="0.01" min="0" className={inputCls}
                                        value={form.monto_prima}
                                        onChange={e => setForm(f => ({ ...f, monto_prima: e.target.value }))} required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Nombre aseguradora *</label>
                                    <input type="text" className={inputCls} value={form.nombre_seguradora}
                                        onChange={e => setForm(f => ({ ...f, nombre_seguradora: e.target.value }))} required />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">NIT aseguradora</label>
                                    <input type="text" className={inputCls} value={form.nit_seguradora}
                                        onChange={e => setForm(f => ({ ...f, nit_seguradora: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Cuenta bancaria aseguradora</label>
                                    <input type="text" className={inputCls} value={form.cuenta_bancaria}
                                        onChange={e => setForm(f => ({ ...f, cuenta_bancaria: e.target.value }))} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs text-gray-400 mb-1 block">Dirección aseguradora</label>
                                    <input type="text" className={inputCls} value={form.direccion_aseguradora}
                                        onChange={e => setForm(f => ({ ...f, direccion_aseguradora: e.target.value }))} />
                                </div>
                            </div>

                            {msg?.type === 'error' && (
                                <p className="text-red-400 text-sm">{msg.text}</p>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={saving}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition">
                                    {saving ? 'Guardando...' : 'Registrar póliza'}
                                </button>
                                <button type="button" onClick={() => setModal(false)}
                                    className="px-5 py-2 bg-[#0b0e14] border border-white/5 hover:bg-white/5 text-white text-sm rounded-lg transition">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PolizaSegurosPage;
