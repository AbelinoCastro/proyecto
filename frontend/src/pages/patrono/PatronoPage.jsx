import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function PatronoPage() {
    const [patrono, setPatrono] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    const [form, setForm] = useState({
        razon_social: '',
        direccion: '',
        telefono: '',
        numero_patronal: '',
        cod_formulario: '',
    });

    // ── cargar datos ─────────────────────────────────────────
    useEffect(() => {
        fetchPatrono();
    }, []);

    const fetchPatrono = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/patrono`);
            if (data.ok) {
                setPatrono(data.data);
                setForm({
                    razon_social: data.data.RAZON_SOCIAL || '',
                    direccion: data.data.DIRECCION || '',
                    telefono: data.data.TELEFONO || '',
                    numero_patronal: data.data.NUMERO_PATRONAL || '',
                    cod_formulario: data.data.COD_FORMULARIO || '',
                });
            }
        } catch (err) {
            // 404 = aún no hay registro, modo creación
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

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

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
                razon_social: patrono.RAZON_SOCIAL || '',
                direccion: patrono.DIRECCION || '',
                telefono: patrono.TELEFONO || '',
                numero_patronal: patrono.NUMERO_PATRONAL || '',
                cod_formulario: patrono.COD_FORMULARIO || '',
            });
        }
        setEditMode(false);
    };

    // ── render ────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const isNew = !patrono;

    return (
        <div className="p-6 max-w-2xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-white">Datos del patrono</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        Información de la empresa para formularios IGSS
                    </p>
                </div>
                {!isNew && !editMode && (
                    <button
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                    >
                        ✏️ Editar
                    </button>
                )}
            </div>

            {/* Toast */}
            {msg.text && (
                <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${msg.type === 'success'
                    ? 'bg-green-900/40 border border-green-700 text-green-300'
                    : 'bg-red-900/40 border border-red-700 text-red-300'
                    }`}>
                    {msg.type === 'success' ? '✓ ' : '✕ '}{msg.text}
                </div>
            )}

            {/* Card */}
            <div className="rounded-xl border border-white/10 bg-[#1a1f2e] overflow-hidden">

                {/* Banner si no hay registro */}
                {isNew && (
                    <div className="px-5 py-3 bg-yellow-900/30 border-b border-yellow-700/40 text-yellow-300 text-sm">
                        ⚠️ Aún no hay datos registrados. Complete el formulario para continuar.
                    </div>
                )}

                <div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2">

                    {/* Razón social — full width */}
                    <div className="sm:col-span-2">
                        <Field
                            label="Razón social *"
                            name="razon_social"
                            value={form.razon_social}
                            readOnly={!editMode && !isNew}
                            onChange={handleChange}
                            placeholder="Nombre legal de la empresa"
                        />
                    </div>

                    {/* Dirección — full width */}
                    <div className="sm:col-span-2">
                        <Field
                            label="Dirección *"
                            name="direccion"
                            value={form.direccion}
                            readOnly={!editMode && !isNew}
                            onChange={handleChange}
                            placeholder="Dirección fiscal completa"
                        />
                    </div>

                    <Field
                        label="Teléfono"
                        name="telefono"
                        value={form.telefono}
                        readOnly={!editMode && !isNew}
                        onChange={handleChange}
                        placeholder="2XXX-XXXX"
                    />

                    <Field
                        label="Número patronal *"
                        name="numero_patronal"
                        value={form.numero_patronal}
                        readOnly={!editMode && !isNew}
                        onChange={handleChange}
                        placeholder="Ej. 123456"
                    />

                    <Field
                        label="Código de formulario"
                        name="cod_formulario"
                        value={form.cod_formulario}
                        readOnly={!editMode && !isNew}
                        onChange={handleChange}
                        placeholder="Ej. DRPT-001"
                    />

                </div>

                {/* Footer con acciones */}
                {(editMode || isNew) && (
                    <div className="px-5 py-4 border-t border-white/10 flex justify-end gap-3">
                        {!isNew && (
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 text-sm transition-colors"
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
                )}
            </div>

            {/* Metadata si ya existe */}
            {patrono && (
                <p className="text-xs text-gray-600 mt-3 text-right">
                    Registrado el {new Date(patrono.CREADO_EN).toLocaleDateString('es-GT')}
                    {' · '}Estado: <span className={patrono.ACTIVO === 'S' ? 'text-green-500' : 'text-red-500'}>
                        {patrono.ACTIVO === 'S' ? 'Activo' : 'Inactivo'}
                    </span>
                </p>
            )}
        </div>
    );
}

// ── Componente campo reutilizable ─────────────────────────
function Field({ label, name, value, onChange, readOnly, placeholder }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {label}
            </label>
            <input
                name={name}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                placeholder={readOnly ? '—' : placeholder}
                className={`w-full h-9 px-3 rounded-lg text-sm border outline-none transition-colors
          ${readOnly
                        ? 'bg-white/5 border-white/5 text-gray-300 cursor-default'
                        : 'bg-[#131720] border-white/10 text-white placeholder-gray-600 focus:border-blue-500'
                    }`}
            />
        </div>
    );
}