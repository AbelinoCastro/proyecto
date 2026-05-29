import { useState, useEffect } from 'react';
import axios from 'axios';
import { digitsMax, nitFormat } from '../../utils/validators';

const API = 'http://localhost:4000/api';

const EMPTY = { razon_social: '', direccion: '', telefono: '', numero_patronal: '', cod_formulario: '', activo: 1 };

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
        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{tipo === 'error' ? 'Alerta de Sistema' : 'Operación Exitosa'}</span>
        <span className="text-[13px] font-bold">{mensaje}</span>
      </div>
    </div>
  );
};

export default function PatronoPage() {
    const [patrono,  setPatrono]  = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [saving,   setSaving]   = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form,     setForm]     = useState(EMPTY);
    const [toast,    setToast]    = useState(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchPatrono(); }, []);

    const fetchPatrono = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/patrono`);
            if (data.ok && data.data) {
                setPatrono(data.data);
                setForm({
                    razon_social:    data.data.RAZON_SOCIAL    || '',
                    direccion:       data.data.DIRECCION       || '',
                    telefono:        data.data.TELEFONO        || '',
                    numero_patronal: data.data.NUMERO_PATRONAL || '',
                    cod_formulario:  data.data.COD_FORMULARIO  || '',
                    activo:          data.data.ACTIVO ?? 1,
                });
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                setToast({ mensaje: 'Error al cargar los datos del patrono', tipo: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async () => {
        if (!form.razon_social.trim() || !form.direccion.trim() || !form.numero_patronal.trim()) {
            setToast({ mensaje: 'Razón social, dirección y número patronal son requeridos', tipo: 'error' });
            return;
        }
        setSaving(true);
        try {
            let res;
            if (patrono) {
                res = await axios.put(`${API}/patrono/${patrono.ID_PATRONO}`, form);
            } else {
                res = await axios.post(`${API}/patrono`, form);
            }
            if (res.data.ok) {
                setPatrono(res.data.data);
                setForm({
                    razon_social:    res.data.data.RAZON_SOCIAL    || '',
                    direccion:       res.data.data.DIRECCION       || '',
                    telefono:        res.data.data.TELEFONO        || '',
                    numero_patronal: res.data.data.NUMERO_PATRONAL || '',
                    cod_formulario:  res.data.data.COD_FORMULARIO  || '',
                });
                setEditMode(false);
                setToast({ mensaje: patrono ? 'Datos actualizados correctamente' : 'Patrono registrado correctamente', tipo: 'exito' });
            }
        } catch (err) {
            setToast({ mensaje: err.response?.data?.message || 'Error al guardar', tipo: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (patrono) {
            setForm({
                razon_social:    patrono.RAZON_SOCIAL    || '',
                direccion:       patrono.DIRECCION       || '',
                telefono:        patrono.TELEFONO        || '',
                numero_patronal: patrono.NUMERO_PATRONAL || '',
                cod_formulario:  patrono.COD_FORMULARIO  || '',
                activo:          patrono.ACTIVO ?? 1,
            });
        }
        setEditMode(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-10 h-10 border-4 border-[#C5A028]/20 border-t-[#C5A028] rounded-full animate-spin" />
        </div>
    );

    const isNew = !patrono;
    const labelCls = "text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block opacity-60";
    const inputCls = "bg-[#0b0b0b] border border-white/5 rounded-xl px-4 py-3 text-[12px] text-white outline-none focus:border-[#C5A028]/30 transition-all w-full shadow-inner";

    return (
        <div className="max-w-[1000px] mx-auto py-10 px-8 animate-in fade-in duration-1000 min-h-screen">
            {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}

            {/* Header Maestro */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-12">
                <div>
                    <p className="text-[#C5A028] text-[10px] font-black uppercase tracking-[0.4em] mb-3 opacity-60">Identidad Corporativa</p>
                    <h1 className="font-serif-title text-6xl text-white tracking-tighter leading-none">Datos del Patrono</h1>
                    <p className="text-gray-600 text-[13px] mt-4 font-medium max-w-2xl leading-relaxed">
                        Información legal y fiscal de la entidad patronal. Estos datos son obligatorios para la certificación
                        de planillas ante el IGSS y la administración tributaria (SAT).
                    </p>
                </div>
                {!isNew && !editMode && (
                    <button
                        onClick={() => setEditMode(true)}
                        className="gold-button text-[10px] uppercase tracking-[0.2em] py-3.5 px-8 shadow-xl active:scale-95 transition-all"
                    >
                        ✏️ Editar Registro
                    </button>
                )}
            </div>

            {/* Alerta de Datos Faltantes */}
            {isNew && (
                <div className="mb-10 p-6 bg-amber-500/5 border-2 border-amber-500/20 rounded-3xl flex items-center gap-5 animate-in slide-in-from-top-2">
                    <svg className="w-6 h-6 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <div>
                        <p className="text-amber-500 font-black uppercase tracking-widest text-[11px]">Expediente Incompleto</p>
                        <p className="text-amber-500/70 text-[12px] font-medium mt-1 leading-relaxed">
                            Aún no se han detectado datos registrados para el patrono. Complete el formulario maestro para habilitar las funciones fiscales.
                        </p>
                    </div>
                </div>
            )}

            {/* VISTA RESUMEN (Premium View) */}
            {!isNew && !editMode && (
                <div className="luxury-card overflow-hidden shadow-2xl border-t-2 border-t-[#C5A028]/30">
                    <div className="p-10 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                        <h2 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Ficha de Registro Patronal</h2>
                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${patrono.ACTIVO === 1 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            {patrono.ACTIVO === 1 ? '● Operativo' : '● Suspendido'}
                        </div>
                    </div>

                    <div className="p-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <InfoField label="Razón Social / Nombre Legal" value={patrono.RAZON_SOCIAL} highlight />
                                <InfoField label="Dirección Fiscal" value={patrono.DIRECCION} />
                                <InfoField label="Teléfono de Contacto" value={patrono.TELEFONO} />
                            </div>
                            <div className="space-y-8">
                                <InfoField label="Número Patronal (IGSS)" value={patrono.NUMERO_PATRONAL} gold />
                                <InfoField label="Código de Formulario (SAT)" value={patrono.COD_FORMULARIO} />
                                {patrono.CREADO_EN && (
                                    <div className="pt-4 opacity-30">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Certificación de Registro</p>
                                        <p className="text-[11px] font-bold text-gray-600 mt-1 uppercase">Emitido: {new Date(patrono.CREADO_EN).toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FORMULARIO (Luxury Console Style) */}
            {(isNew || editMode) && (
                <div className="luxury-card overflow-hidden shadow-2xl border-t-2 border-t-[#C5A028]/30 animate-in zoom-in-95 duration-500">
                    <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                        <h2 className="text-white text-[11px] font-black uppercase tracking-[0.4em]">{isNew ? 'Apertura de Registro Maestro' : 'Consola de Edición de Datos'}</h2>
                    </div>

                    <div className="p-10 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <div className="md:col-span-2">
                                <label className={labelCls}>Razón Social *</label>
                                <input
                                    name="razon_social"
                                    value={form.razon_social}
                                    onChange={handleChange}
                                    placeholder="Ej: Mi Empresa, Sociedad Anónima"
                                    className={inputCls}
                                    required
                                    maxLength={150}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelCls}>Dirección Fiscal de Operaciones *</label>
                                <input
                                    name="direccion"
                                    value={form.direccion}
                                    onChange={handleChange}
                                    placeholder="Ej: 5a Avenida 10-50 Zona 1, Ciudad de Guatemala"
                                    className={inputCls}
                                    required
                                    maxLength={250}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Línea Telefónica</label>
                                <input
                                    name="telefono"
                                    type="tel"
                                    inputMode="numeric"
                                    value={form.telefono}
                                    onChange={handleChange}
                                    onInput={digitsMax(8)}
                                    placeholder="Ej: 22345678 (8 dígitos)"
                                    className={inputCls}
                                    maxLength={8}
                                    title="Teléfono GT: 8 dígitos"
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Número Patronal Registrado *</label>
                                <input
                                    name="numero_patronal"
                                    inputMode="numeric"
                                    value={form.numero_patronal}
                                    onChange={handleChange}
                                    onInput={digitsMax(15)}
                                    placeholder="Ej: 123456789 (solo dígitos)"
                                    className={inputCls}
                                    required
                                    title="Número patronal IGSS, solo dígitos"
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Identificador de Formulario</label>
                                <input
                                    name="cod_formulario"
                                    value={form.cod_formulario}
                                    onChange={handleChange}
                                    placeholder="Ej: DRPT-001"
                                    className={inputCls}
                                    maxLength={20}
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </div>

                            {editMode && (
                                <div>
                                    <label className={labelCls}>Estado Operativo</label>
                                    <button
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, activo: f.activo === 1 ? 0 : 1 }))}
                                        className={`flex items-center gap-3 w-fit px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                            form.activo === 1
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'
                                                : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'
                                        }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${form.activo === 1 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                                        {form.activo === 1 ? 'Activo' : 'Inactivo'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-4 pt-10 border-t border-white/5">
                            {editMode && (
                                <button onClick={handleCancel} className="dark-button px-8 py-3.5 text-[10px] uppercase tracking-widest">
                                    Descartar
                                </button>
                            )}
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="gold-button px-10 py-3.5 text-[10px] uppercase tracking-widest shadow-2xl shadow-[#C5A028]/10 disabled:opacity-30"
                            >
                                {saving ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        Sincronizando...
                                    </span>
                                ) : (
                                    isNew ? 'Registrar Patrono' : 'Actualizar Maestro'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-20 flex justify-center opacity-30">
                <p className="text-[9px] font-black text-gray-700 uppercase tracking-[1.5em]">Identidad Legal NóminaGT</p>
            </div>
        </div>
    );
}

function InfoField({ label, value, highlight, gold }) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] opacity-60">{label}</span>
            <span className={`text-[15px] font-bold tracking-tight ${highlight ? 'text-white text-lg' : gold ? 'text-[#C5A028] font-black' : 'text-gray-300'}`}>
                {value || '—'}
            </span>
        </div>
    );
}
