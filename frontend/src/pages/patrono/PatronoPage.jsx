import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const EMPTY = { razon_social: '', direccion: '', telefono: '', numero_patronal: '', cod_formulario: '', activo: 1 };

export default function PatronoPage() {
    const [patrono,  setPatrono]  = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [saving,   setSaving]   = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form,     setForm]     = useState(EMPTY);
    const [msg,      setMsg]      = useState({ type: '', text: '' });

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
                showMsg('error', 'Error al cargar los datos del patrono');
            }
        } finally {
            setLoading(false);
        }
    };

    const showMsg = (type, text) => {
        setMsg({ type, text });
        setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async () => {
        if (!form.razon_social.trim() || !form.direccion.trim() || !form.numero_patronal.trim()) {
            showMsg('error', 'Razón social, dirección y número patronal son requeridos');
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
                showMsg('success', patrono ? 'Datos actualizados correctamente' : 'Patrono registrado correctamente');
            }
        } catch (err) {
            showMsg('error', err.response?.data?.message || 'Error al guardar');
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
        <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const isNew = !patrono;

    return (
        <div className="p-6 max-w-2xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-white">Datos del patrono</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Información de la empresa para formularios IGSS e ISR</p>
                </div>
                {!isNew && !editMode && (
                    <button
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                    >
                        ✏️ Editar datos
                    </button>
                )}
            </div>

            {/* Mensaje éxito / error */}
            {msg.text && (
                <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium border ${
                    msg.type === 'success'
                        ? 'bg-green-900/40 border-green-700 text-green-300'
                        : 'bg-red-900/40 border-red-700 text-red-300'
                }`}>
                    {msg.type === 'success' ? '✓ ' : '✕ '}{msg.text}
                </div>
            )}

            {/* Alerta solo cuando no hay registro */}
            {isNew && (
                <div className="mb-4 px-4 py-3 rounded-lg text-sm border bg-amber-900/30 border-amber-700/40 text-amber-300">
                    ⚠️ Aún no hay datos registrados. Complete el formulario para continuar.
                </div>
            )}

            {/* TARJETA resumen — solo cuando hay datos y NO está en modo edición */}
            {!isNew && !editMode && (
                <div className="bg-[#121621] border border-white/5 rounded-xl p-5 mb-5">
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                        Información registrada
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoField label="Razón social"      value={patrono.RAZON_SOCIAL}    full />
                        <InfoField label="Dirección"         value={patrono.DIRECCION}        full />
                        <InfoField label="Teléfono"          value={patrono.TELEFONO} />
                        <InfoField label="Número patronal"   value={patrono.NUMERO_PATRONAL} />
                        <InfoField label="Código formulario" value={patrono.COD_FORMULARIO} />
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Estado</span>
                            <span className={`text-sm font-semibold ${patrono.ACTIVO === 1 ? 'text-green-400' : 'text-red-400'}`}>
                                {patrono.ACTIVO === 1 ? '● Activo' : '● Inactivo'}
                            </span>
                        </div>
                    </div>
                    {patrono.CREADO_EN && (
                        <p className="text-xs text-gray-600 mt-4 text-right">
                            Registrado el {new Date(patrono.CREADO_EN).toLocaleDateString('es-GT')}
                        </p>
                    )}
                </div>
            )}

            {/* FORMULARIO — solo cuando es nuevo o está en modo edición */}
            {(isNew || editMode) && (
                <div className="bg-[#121621] border border-white/5 rounded-xl overflow-hidden">
                    <div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Field label="Razón social *"    name="razon_social"    value={form.razon_social}    onChange={handleChange} placeholder="Nombre legal de la empresa" />
                        </div>
                        <div className="sm:col-span-2">
                            <Field label="Dirección *"       name="direccion"       value={form.direccion}       onChange={handleChange} placeholder="Dirección fiscal completa" />
                        </div>
                        <Field label="Teléfono"              name="telefono"        value={form.telefono}        onChange={handleChange} placeholder="2XXX-XXXX" />
                        <Field label="Número patronal *"     name="numero_patronal" value={form.numero_patronal} onChange={handleChange} placeholder="Ej. 123456" />
                        <Field label="Código de formulario"  name="cod_formulario"  value={form.cod_formulario}  onChange={handleChange} placeholder="Ej. DRPT-001" />

                        {/* Toggle activo/inactivo — solo al editar */}
                        {editMode && (
                            <div className="flex flex-col gap-1.5">
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Estado</span>
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, activo: f.activo === 1 ? 0 : 1 }))}
                                    className={`flex items-center gap-2 w-fit px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                        form.activo === 1
                                            ? 'bg-green-600/20 border-green-600/40 text-green-400 hover:bg-green-600/30'
                                            : 'bg-red-600/20 border-red-600/40 text-red-400 hover:bg-red-600/30'
                                    }`}
                                >
                                    {form.activo === 1 ? '● Activo' : '● Inactivo'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="px-5 py-4 border-t border-white/5 flex justify-end gap-3">
                        {editMode && (
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 rounded-lg border border-white/5 text-gray-300 hover:bg-white/5 text-sm transition-colors"
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {saving ? 'Guardando...' : isNew ? 'Registrar patrono' : 'Guardar cambios'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, name, value, onChange, placeholder }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</label>
            <input
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full h-9 px-3 rounded-lg text-sm border outline-none transition-colors bg-[#0b0e14] border-white/5 text-white placeholder-gray-600 focus:border-blue-500"
            />
        </div>
    );
}

function InfoField({ label, value, full }) {
    return (
        <div className={`flex flex-col gap-1 ${full ? 'sm:col-span-2' : ''}`}>
            <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
            <span className="text-sm text-white font-medium">{value || '—'}</span>
        </div>
    );
}
