import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getPolizas, createPoliza, deletePoliza } from '../../services/polizaSegurosService';
import { getEmpleados } from '../../services/empleadoService';
import { digitsMax, nitFormat } from '../../utils/validators';

const PLANES = ['BÁSICO', 'PLUS', 'PREMIUM'];

const planColor = {
    'BÁSICO':   'bg-slate-600/10 text-slate-400 border-slate-500/20',
    'PLUS':     'bg-blue-600/10 text-blue-400 border-blue-500/20',
    'PREMIUM':  'bg-[#C5A028]/10 text-[#C5A028] border-[#C5A028]/20',
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
        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{tipo === 'error' ? 'Sistema / Error' : 'Operación Exitosa'}</span>
        <span className="text-[13px] font-bold">{mensaje}</span>
      </div>
    </div>
  );
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
        } catch { setMsg({ type: 'error', text: 'Error al sincronizar cartera de seguros' }); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            await createPoliza(form);
            setMsg({ type: 'ok', text: 'Póliza corporativa registrada' });
            setModal(false);
            setForm(EMPTY);
            load();
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Fallo en el registro de póliza' });
        } finally { setSaving(false); }
    };

    const handleDelete = async (id, nombre) => {
        if (!window.confirm(`¿Confirmar la revocación permanente de la póliza de ${nombre}?`)) return;
        try {
            await deletePoliza(id);
            setMsg({ type: 'ok', text: 'Contrato de seguro eliminado' });
            load();
        } catch { setMsg({ type: 'error', text: 'Error al eliminar el registro' }); }
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('REPORTE CORPORATIVO — PÓLIZAS DE SEGUROS', 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-GT')}`, 14, 30);
        autoTable(doc, {
            startY: 35,
            head: [['ID', 'Empleado', 'Plan', 'Aseguradora', 'Prima Mensual', 'Inicio', 'Renovación']],
            body: polizas.map(p => [
                p.ID_POLIZA,
                p.NOMBRE_EMPLEADO,
                p.PLAN,
                p.NOMBRE_SEGURADORA,
                `Q ${parseFloat(p.MONTO_PRIMA).toFixed(2)}`,
                formatDate(p.FECHA_INICIO_PLAN),
                formatDate(p.FECHA_RENOVACION)
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [20, 20, 22] },
        });
        doc.save('Seguros_Reporte.pdf');
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
        XLSX.utils.book_append_sheet(wb, ws, 'Cartera de Seguros');
        XLSX.writeFile(wb, 'Audit_Seguros.xlsx');
    };

    const labelCls = "text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block opacity-60";
    const inputCls = "bg-[#0b0b0b] border border-white/5 rounded-xl px-4 py-3 text-[12px] text-white outline-none focus:border-[#C5A028]/30 transition-all w-full shadow-inner";

    return (
        <div className="max-w-[1450px] mx-auto py-10 px-8 animate-in fade-in duration-1000 min-h-screen">
            {msg && <Toast mensaje={msg.text} tipo={msg.type === 'ok' ? 'exito' : 'error'} onClose={() => setMsg(null)} />}

            {/* Header Maestro */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-12">
                <div>
                    <p className="text-[#C5A028] text-[10px] font-black uppercase tracking-[0.4em] mb-3 opacity-60">Beneficios & Riesgos</p>
                    <h1 className="font-serif-title text-6xl text-white tracking-tighter leading-none">Pólizas de Seguros</h1>
                    <p className="text-gray-600 text-[13px] mt-4 font-medium max-w-2xl leading-relaxed">
                        Gestión técnica de la cartera de seguros corporativos. Administre coberturas, primas mensuales
                        y ciclos de renovación para el aseguramiento del capital humano.
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-[#111112] border border-white/5 p-2 rounded-[28px] shadow-2xl">
                    <button onClick={exportExcel} className="dark-button text-[9px] uppercase tracking-widest px-6 py-3.5 hover:border-emerald-500/30 transition-all">📊 Excel</button>
                    <button onClick={exportPDF} className="dark-button text-[9px] uppercase tracking-widest px-6 py-3.5 hover:border-red-500/30 transition-all">📄 PDF</button>
                    <button onClick={() => { setModal(true); setMsg(null); setForm(EMPTY); }} className="gold-button text-[9px] uppercase tracking-widest px-8 py-3.5 shadow-xl">+ Nuevo Contrato</button>
                </div>
            </div>

            {/* Listado Técnico */}
            <div className="luxury-card overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Listado de Coberturas Vigentes</h2>
                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{polizas.length} Pólizas Activas</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/[0.04] bg-white/[0.005]">
                                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">ID & Titular</th>
                                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-center">Nivel de Plan</th>
                                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Entidad Aseguradora</th>
                                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-right">Prima Mensual</th>
                                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-center">Rango Vigencia</th>
                                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] text-center">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {loading ? (
                                <tr><td colSpan={6} className="px-8 py-32 text-center opacity-20 italic text-sm tracking-widest uppercase">Sincronizando con Servidor...</td></tr>
                            ) : polizas.length === 0 ? (
                                <tr><td colSpan={6} className="px-8 py-32 text-center opacity-20 italic text-sm tracking-widest uppercase">No se localizan registros de seguros</td></tr>
                            ) : (
                                polizas.map(p => (
                                    <tr key={p.ID_POLIZA} className="hover:bg-white/[0.015] transition-all group">
                                        <td className="px-8 py-5">
                                            <p className="text-white font-bold text-[13px] tracking-tight">{p.NOMBRE_EMPLEADO}</p>
                                            <p className="text-[#C5A028] font-black text-[9px] uppercase tracking-widest mt-1">Ref: #{p.ID_POLIZA}</p>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${planColor[p.PLAN] || 'bg-gray-600/10 text-gray-400'}`}>
                                                {p.PLAN}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-gray-300 font-medium text-[12px]">{p.NOMBRE_SEGURADORA}</td>
                                        <td className="px-8 py-5 text-right text-white font-black text-[13px] tracking-tighter">{formatQ(p.MONTO_PRIMA)}</td>
                                        <td className="px-8 py-5 text-center">
                                            <p className="text-gray-400 text-[11px] font-medium">{formatDate(p.FECHA_INICIO_PLAN)}</p>
                                            <p className="text-gray-600 text-[9px] font-bold uppercase mt-1">Renov: {formatDate(p.FECHA_RENOVACION)}</p>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <button
                                                onClick={() => handleDelete(p.ID_POLIZA, p.NOMBRE_EMPLEADO)}
                                                className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-all shadow-lg mx-auto active:scale-90"
                                                title="Revocar Póliza"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h14" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Nuevo Contrato — LUXURY */}
            {modal && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="luxury-card w-full max-w-4xl shadow-[0_0_80px_rgba(0,0,0,0.8)] border-[#C5A028]/20 animate-in zoom-in-95 duration-500 overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                            <div>
                                <h2 className="text-white text-xs font-black uppercase tracking-[0.5em]">Apertura de Contrato de Seguro</h2>
                                <p className="text-gray-500 text-[10px] font-bold mt-2 uppercase tracking-widest">Módulo de Cobertura NóminaGT</p>
                            </div>
                            <button onClick={() => setModal(false)} className="text-gray-500 hover:text-white transition-all hover:rotate-90">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                                {/* Cluster A: Colaborador y Plan */}
                                <div className="space-y-8">
                                    <h4 className="text-[#C5A028] text-[9px] font-black uppercase tracking-[0.4em] mb-4 border-b border-[#C5A028]/10 pb-2">Identificación de Cobertura</h4>
                                    <div>
                                        <label className={labelCls}>Colaborador Beneficiario *</label>
                                        <select className={inputCls} value={form.id_empleado} onChange={e => setForm(f => ({ ...f, id_empleado: e.target.value }))} required>
                                            <option value="">Seleccione personal...</option>
                                            {empleados.map(emp => <option key={emp.ID_EMPLEADO} value={emp.ID_EMPLEADO}>{emp.NOMBRE}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className={labelCls}>Nivel de Plan *</label>
                                            <select className={inputCls} value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} required>
                                                {PLANES.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Monto Prima (Q) *</label>
                                            <input
                                                type="number" step="0.01" min="0"
                                                className={inputCls}
                                                value={form.monto_prima}
                                                onChange={e => setForm(f => ({ ...f, monto_prima: e.target.value }))}
                                                required
                                                placeholder="Ej: 150.00"
                                                title="Monto mensual mayor a 0"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className={labelCls}>Fecha Inicio *</label>
                                            <input type="date" className={inputCls} value={form.fecha_inicio_plan} onChange={e => setForm(f => ({ ...f, fecha_inicio_plan: e.target.value }))} required />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Fecha Renovación</label>
                                            <input type="date" className={inputCls} value={form.fecha_renovacion} onChange={e => setForm(f => ({ ...f, fecha_renovacion: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>

                                {/* Cluster B: Datos Aseguradora */}
                                <div className="space-y-8">
                                    <h4 className="text-[#C5A028] text-[9px] font-black uppercase tracking-[0.4em] mb-4 border-b border-[#C5A028]/10 pb-2">Entidad Proveedora</h4>
                                    <div>
                                        <label className={labelCls}>Nombre de Aseguradora *</label>
                                        <input
                                            type="text" className={inputCls}
                                            value={form.nombre_seguradora}
                                            onChange={e => setForm(f => ({ ...f, nombre_seguradora: e.target.value }))}
                                            required
                                            maxLength={150}
                                            placeholder="Ej: Aseguradora General de Guatemala, S.A."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className={labelCls}>NIT Entidad</label>
                                            <input
                                                type="text" className={inputCls}
                                                value={form.nit_seguradora}
                                                onChange={e => setForm(f => ({ ...f, nit_seguradora: e.target.value }))}
                                                onInput={nitFormat}
                                                placeholder="Ej: 1234567-8"
                                                maxLength={10}
                                                title="Formato NIT: dígitos con guion al final"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Cuenta de Depósito</label>
                                            <input
                                                type="text" className={inputCls}
                                                inputMode="numeric"
                                                value={form.cuenta_bancaria}
                                                onChange={e => setForm(f => ({ ...f, cuenta_bancaria: e.target.value }))}
                                                onInput={digitsMax(20)}
                                                placeholder="Ej: 1234567890 (solo dígitos)"
                                                title="Solo números"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Dirección Fiscal</label>
                                        <input
                                            type="text" className={inputCls}
                                            value={form.direccion_aseguradora}
                                            onChange={e => setForm(f => ({ ...f, direccion_aseguradora: e.target.value }))}
                                            maxLength={250}
                                            placeholder="Ej: 6a Avenida 5-30 Zona 9, Ciudad de Guatemala"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-16 border-t border-white/5 pt-8">
                                <button type="button" onClick={() => setModal(false)} className="flex-1 dark-button py-4 text-[10px] uppercase tracking-widest">Cancelar Proceso</button>
                                <button type="submit" disabled={saving} className="flex-1 gold-button py-4 text-[10px] uppercase tracking-widest shadow-2xl shadow-[#C5A028]/20 font-black">
                                    {saving ? 'Procesando...' : 'Confirmar Póliza'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="mt-16 flex justify-center opacity-30">
                <p className="text-[9px] font-black text-gray-700 uppercase tracking-[1em]">Auditoría de Riesgos NóminaGT</p>
            </div>
        </div>
    );
};

export default PolizaSegurosPage;
