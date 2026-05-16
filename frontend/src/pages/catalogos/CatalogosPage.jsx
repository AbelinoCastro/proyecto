import { useState, useCallback, useEffect, useRef } from 'react';
import { API_BASE } from './TablaGenerica';
import ModalCatalogo from './ModalCatalogo';
import { apiGuardar, apiEliminar, apiBaja, apiToggleEstado } from './CatalogosLogic';

import TablaEmpleados     from './TablaEmpleados';
import TablaPuestos       from './TablaPuestos';
import TablaDeducciones   from './TablaDeducciones';
import TablaJornadas      from './TablaJornadas';
import TablaPercepciones  from './TablaPercepciones';
import TablaDepartamentos from './TablaDepartamentos';
import TablaUsuarios      from './TablaUsuarios';
import TablaFaltas        from './TablaFaltas';
import TablaMotivoBaja    from './TablaMotivoBaja';
import TablaTipoUsuario   from './TablaTipoUsuario';

// ─── Metadatos de catálogos ───────────────────────────────────────────────────
const CATALOGOS = [
    { id: 'empleados',     nombre: 'Empleados',     icon: '👥', acciones: { agregar: true, editar: true, eliminar: true, bajar: false, toggle: true  } },
    { id: 'usuarios',      nombre: 'Usuarios',      icon: '👤', acciones: { agregar: true, editar: true, eliminar: true, bajar: false, toggle: true  } },
    { id: 'tipos',         nombre: 'Roles',         icon: '🔑', acciones: { agregar: true, editar: true, eliminar: true,  bajar: false, toggle: true  } },
    { id: 'departamentos', nombre: 'Departamentos', icon: '🏢', acciones: { agregar: true, editar: true, eliminar: true,  bajar: false, toggle: true  } },
    { id: 'puestos',       nombre: 'Puestos',       icon: '💼', acciones: { agregar: true, editar: true, eliminar: true,  bajar: false, toggle: false } },
    { id: 'jornadas',      nombre: 'Jornadas',      icon: '⏰', acciones: { agregar: true, editar: true, eliminar: true,  bajar: false, toggle: false } },
    { id: 'percepciones',  nombre: 'Percepciones',  icon: '💰', acciones: { agregar: true, editar: true, eliminar: true,  bajar: false, toggle: false } },
    { id: 'deducciones',   nombre: 'Deducciones',   icon: '📉', acciones: { agregar: true, editar: true, eliminar: true,  bajar: false, toggle: false } },
    { id: 'faltas',        nombre: 'Faltas',        icon: '⚠️', acciones: { agregar: true, editar: true, eliminar: false, bajar: false, toggle: false } },
    { id: 'motivos',       nombre: 'Motivos Baja',  icon: '🚪', acciones: { agregar: true, editar: true, eliminar: true,  bajar: false, toggle: true  } },
];

// ─── Definición de campos por catálogo ────────────────────────────────────────
const CAMPOS = {
    empleados: [
        { name: 'nombre',            label: 'Nombre completo',  type: 'text',     required: true },
        { name: 'fecha_nacimiento',  label: 'Fecha nacimiento', type: 'date',     required: true },
        { name: 'genero',            label: 'Género',           type: 'select',   required: true,
          options: [{ value: 'M', label: 'Masculino' }, { value: 'F', label: 'Femenino' }, { value: 'O', label: 'Otro' }] },
        { name: 'nacionalidad',      label: 'Nacionalidad',     type: 'text',     required: true },
        { name: 'no_dpi_permiso',    label: 'DPI / Permiso',    type: 'text',     required: true },
        { name: 'no_afiliacion_igss',label: 'No. Afiliación IGSS', type: 'text', required: true },
        { name: 'id_puesto',         label: 'Puesto',           type: 'select-api', required: true,
          endpoint: '/puestos', valueKey: 'ID_PUESTO', labelKey: 'NOMBRE_PUESTO' },
        { name: 'id_jornada',        label: 'Jornada',          type: 'select-api', required: true,
          endpoint: '/jornadas', valueKey: 'ID_JORNADA', labelKey: 'NOMBRE_JORNADA' },
        { name: 'fecha_inicio',      label: 'Fecha inicio',     type: 'date',     required: true },
        { name: 'correo',            label: 'Correo',           type: 'email' },
        { name: 'telefono',          label: 'Teléfono',         type: 'text' },
        { name: 'cuenta_bancaria',   label: 'Cuenta bancaria',  type: 'text' },
    ],
    usuarios: [
        { name: 'username',        label: 'Usuario',    type: 'text',       required: true },
        { name: 'id_empleado',     label: 'Empleado',   type: 'select-api',
          endpoint: '/empleado', valueKey: 'ID_EMPLEADO', labelKey: 'NOMBRE', required: true },
        { name: 'id_tipo_usuario', label: 'Rol',        type: 'select-api',
          endpoint: '/tipo-usuario', valueKey: 'ID_TIPO_USUARIO', labelKey: 'NOMBRE', required: true },
        { name: 'password',        label: 'Contraseña', type: 'password',   required: true, soloCrear: true },
    ],
    tipos: [
        { name: 'id_tipo_usuario', label: 'Código (ej: ADM)',  type: 'text', required: true, soloCrear: true, placeholder: 'Máx 5 caracteres' },
        { name: 'nombre',          label: 'Nombre',            type: 'text', required: true },
        { name: 'descripcion',     label: 'Descripción',       type: 'textarea' },
    ],
    departamentos: [
        { name: 'id_departamento',     label: 'Código (ej: 01)', type: 'text', required: true, soloCrear: true, placeholder: 'Máx 2 caracteres' },
        { name: 'nombre_departamento', label: 'Nombre',          type: 'text', required: true },
        { name: 'descripcion',         label: 'Descripción',     type: 'textarea' },
    ],
    puestos: [
        { name: 'id_puesto',       label: 'Código (ej: RH01)',  type: 'text',       required: true, soloCrear: true, placeholder: 'Máx 5 caracteres' },
        { name: 'nombre_puesto',   label: 'Nombre',             type: 'text',       required: true },
        { name: 'id_departamento', label: 'Departamento',       type: 'select-api',
          endpoint: '/departamentos', valueKey: 'ID_DEPARTAMENTO', labelKey: 'NOMBRE_DEPARTAMENTO', required: true },
        { name: 'sueldo_base',     label: 'Sueldo Base',        type: 'number',     required: true },
    ],
    jornadas: [
        { name: 'id_jornada',     label: 'Código (ej: J5)',  type: 'text',   required: true, soloCrear: true, placeholder: 'Máx 2 caracteres' },
        { name: 'nombre_jornada', label: 'Nombre',           type: 'text',   required: true },
        { name: 'horas_diarias',  label: 'Horas Diarias',    type: 'number', required: true },
    ],
    percepciones: [
        { name: 'id_percepcion',       label: 'Código (ej: PER10)', type: 'text',     required: true, soloCrear: true, placeholder: 'Máx 5 caracteres' },
        { name: 'nombre_percepcion',   label: 'Nombre',             type: 'text',     required: true },
        { name: 'descripcion_formula', label: 'Descripción',        type: 'textarea' },
    ],
    deducciones: [
        { name: 'id_deduccion',        label: 'Código (ej: DED09)', type: 'text',     required: true, soloCrear: true, placeholder: 'Máx 5 caracteres' },
        { name: 'nombre_deduccion',    label: 'Nombre',             type: 'text',     required: true },
        { name: 'descripcion_formula', label: 'Descripción',        type: 'textarea' },
    ],
    faltas: [
        { name: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
        { name: 'es_pagado',   label: '¿Con goce?',  type: 'select',   required: true,
          options: [{ value: 'S', label: 'Sí' }, { value: 'N', label: 'No' }] },
    ],
    motivos: [
        { name: 'id_motivo_baja', label: 'Código (ej: MB006)', type: 'text',     required: true, soloCrear: true, placeholder: 'Máx 5 caracteres' },
        { name: 'descripcion',    label: 'Descripción',        type: 'textarea', required: true },
    ],
};

const TABLA_MAP = {
    empleados:     TablaEmpleados,
    usuarios:      TablaUsuarios,
    tipos:         TablaTipoUsuario,
    departamentos: TablaDepartamentos,
    puestos:       TablaPuestos,
    jornadas:      TablaJornadas,
    percepciones:  TablaPercepciones,
    deducciones:   TablaDeducciones,
    faltas:        TablaFaltas,
    motivos:       TablaMotivoBaja,
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ mensaje, tipo, onClose }) => {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium text-white max-w-sm ${
            tipo === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`}>
            <span>{tipo === 'error' ? '✖' : '✔'}</span>
            <span className="flex-1">{mensaje}</span>
            <button onClick={onClose} className="text-white/70 hover:text-white text-lg leading-none">×</button>
        </div>
    );
};

// ─── Select con opciones cargadas desde API ───────────────────────────────────
const SelectAPI = ({ campo, valor, onChange, inputClass }) => {
    const [opciones, setOpciones] = useState([]);
    const fetched = useRef(false);

    useEffect(() => {
        if (fetched.current) return;
        fetched.current = true;
        fetch(`${API_BASE}${campo.endpoint}`)
            .then(r => r.json())
            .then(data => {
                const lista = data.data ?? data ?? [];
                setOpciones(Array.isArray(lista) ? lista : []);
            })
            .catch(() => {});
    }, [campo.endpoint]);

    return (
        <select name={campo.name} value={valor} onChange={onChange} required={campo.required} className={inputClass}>
            <option value="">— Seleccionar —</option>
            {opciones.map(op => (
                <option key={op[campo.valueKey]} value={op[campo.valueKey]}>
                    {op[campo.labelKey]}
                </option>
            ))}
        </select>
    );
};

// ─── Formulario dinámico ──────────────────────────────────────────────────────
const FormularioDinamico = ({ catalogo, formData, editandoId, onChange }) => {
    const campos = CAMPOS[catalogo] || [];

    if (!campos.length)
        return <p className="text-gray-400 text-sm text-center py-4">Sin campos configurados para "{catalogo}".</p>;

    const inputClass = 'w-full bg-[#0b0e14] border border-white/5 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600';

    return (
        <div className="flex flex-col gap-4">
            {campos.map((campo) => {
                if (campo.soloCrear && editandoId) return null;
                const valor = formData[campo.name] ?? '';

                return (
                    <div key={campo.name}>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                            {campo.label}
                            {campo.required && <span className="text-red-400 ml-1">*</span>}
                        </label>

                        {campo.type === 'select' ? (
                            <select name={campo.name} value={valor} onChange={onChange} required={campo.required} className={inputClass}>
                                <option value="">— Seleccionar —</option>
                                {campo.options.map((op) => (
                                    <option key={op.value} value={op.value}>{op.label}</option>
                                ))}
                            </select>
                        ) : campo.type === 'select-api' ? (
                            <SelectAPI campo={campo} valor={valor} onChange={onChange} inputClass={inputClass} />
                        ) : campo.type === 'textarea' ? (
                            <textarea
                                name={campo.name} value={valor} onChange={onChange}
                                rows={3} required={campo.required}
                                placeholder={campo.placeholder || ''}
                                className={`${inputClass} resize-none`}
                            />
                        ) : (
                            <input
                                type={campo.type || 'text'} name={campo.name} value={valor}
                                onChange={onChange} required={campo.required}
                                placeholder={campo.placeholder || ''}
                                className={inputClass}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// ─── Modal Dar de Baja ────────────────────────────────────────────────────────
const ModalBaja = ({ empleadoId, onClose, onConfirm }) => {
    const [motivos,  setMotivos]  = useState([]);
    const [motivoId, setMotivoId] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    useEffect(() => {
        fetch(`${API_BASE}/motivo-baja`)
            .then(r => r.json())
            .then(d => setMotivos(d.data ?? []))
            .catch(() => {});
    }, []);

    const inputClass = 'w-full bg-[#0b0e14] border border-white/5 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors';

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#121621] border border-white/5 rounded-xl p-6 w-full max-w-sm">
                <h2 className="text-lg font-bold text-white mb-1">Dar de Baja</h2>
                <p className="text-gray-400 text-sm mb-4">Esta acción cambia el estado del empleado a INACTIVO.</p>

                <div className="flex flex-col gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                            Motivo de baja <span className="text-red-400">*</span>
                        </label>
                        <select value={motivoId} onChange={e => setMotivoId(e.target.value)} className={inputClass}>
                            <option value="">— Seleccionar motivo —</option>
                            {motivos.map(m => (
                                <option key={m.ID_MOTIVO_BAJA} value={m.ID_MOTIVO_BAJA}>{m.DESCRIPCION}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                            Fecha de baja <span className="text-red-400">*</span>
                        </label>
                        <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className={inputClass} />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-5">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm(empleadoId, motivoId, fechaFin)}
                        disabled={!motivoId || !fechaFin}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Confirmar Baja
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Página principal ─────────────────────────────────────────────────────────
const CatalogosPage = () => {
    const [tabActiva,    setTabActiva]    = useState('empleados');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [formData,     setFormData]     = useState({});
    const [editandoId,   setEditandoId]   = useState(null);
    const [refresh,      setRefresh]      = useState(0);
    const [cargando,     setCargando]     = useState(false);
    const [toast,        setToast]        = useState(null);
    const [modalBaja,    setModalBaja]    = useState(null); // id del empleado a dar de baja

    const mostrarToast = useCallback((mensaje, tipo = 'exito') => setToast({ mensaje, tipo }), []);

    const cerrarModal = useCallback(() => {
        setModalAbierto(false);
        setEditandoId(null);
        setFormData({});
    }, []);

    const catActivo   = CATALOGOS.find((c) => c.id === tabActiva);
    const TablaActiva = TABLA_MAP[tabActiva] || null;

    const handleTabChange = useCallback((id) => { setTabActiva(id); setEditandoId(null); setFormData({}); }, []);
    const handleChange    = useCallback((e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value })), []);
    const handleNuevo     = useCallback(() => { setEditandoId(null); setFormData({}); setModalAbierto(true); }, []);

    const handleEditar = useCallback((item) => {
        const formatVal = (k, v) => {
            if (!v) return v;
            // Fechas: convertir ISO a YYYY-MM-DD para input[type=date]
            if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
                return v.split('T')[0];
            }
            if (v instanceof Date) return v.toISOString().split('T')[0];
            return v;
        };
        const norm  = Object.fromEntries(Object.entries(item).map(([k, v]) => [k.toLowerCase(), formatVal(k, v)]));
        const pkKey = Object.keys(item).find((k) => k.toUpperCase().startsWith('ID_'));
        setEditandoId(pkKey ? item[pkKey] : null);
        setFormData(norm);
        setModalAbierto(true);
    }, []);

    const handleBorrar = useCallback(async (id) => {
        if (!window.confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return;
        setCargando(true);
        try {
            const res = await apiEliminar(tabActiva, id);
            res.ok ? mostrarToast('Registro eliminado.') : mostrarToast(res.msg || 'No se pudo eliminar.', 'error');
            if (res.ok) setRefresh((n) => n + 1);
        } catch { mostrarToast('Error de conexión.', 'error'); }
        finally { setCargando(false); }
    }, [tabActiva, mostrarToast]);

    const handleBaja = useCallback(async (id) => {
        const entidad = tabActiva === 'empleados' ? 'empleado' : 'usuario';
        if (!window.confirm(`¿Dar de baja este ${entidad}? El registro se conserva y puede reactivarse.`)) return;
        setCargando(true);
        try {
            const res = await apiBaja(tabActiva, id);
            res.ok ? mostrarToast(`${entidad.charAt(0).toUpperCase() + entidad.slice(1)} dado de baja.`) : mostrarToast(res.msg || 'No se pudo dar de baja.', 'error');
            if (res.ok) setRefresh((n) => n + 1);
        } catch { mostrarToast('Error de conexión.', 'error'); }
        finally { setCargando(false); }
    }, [tabActiva, mostrarToast]);

    const handleDarBaja = useCallback((id) => {
        setModalBaja(id);
    }, []);

    const confirmarBaja = useCallback(async (id, id_motivo_baja, fecha_fin) => {
        setCargando(true);
        try {
            const res = await fetch(`${API_BASE}/empleado/${id}/baja`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_motivo_baja, fecha_fin }),
            });
            const data = await res.json();
            if (res.ok) {
                mostrarToast('Empleado dado de baja correctamente.');
                setModalBaja(null);
                setRefresh(n => n + 1);
            } else {
                mostrarToast(data.message || 'No se pudo dar de baja.', 'error');
            }
        } catch { mostrarToast('Error de conexión.', 'error'); }
        finally { setCargando(false); }
    }, [mostrarToast]);

    const handleToggle = useCallback(async (id, nuevoEstado) => {
        const accion = nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar';
        if (!window.confirm(`¿Desea ${accion} este registro?`)) return;
        setCargando(true);
        try {
            const res = await apiToggleEstado(tabActiva, id, nuevoEstado);
            res.ok ? mostrarToast(`Registro ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'}.`) : mostrarToast(res.msg || 'No se pudo cambiar el estado.', 'error');
            if (res.ok) setRefresh((n) => n + 1);
        } catch { mostrarToast('Error de conexión.', 'error'); }
        finally { setCargando(false); }
    }, [tabActiva, mostrarToast]);

    const handleGuardar = useCallback(async () => {
        setCargando(true);
        try {
            const res = await apiGuardar(tabActiva, formData, editandoId);
            if (res.ok) {
                mostrarToast(editandoId ? 'Registro actualizado.' : 'Registro creado.');
                cerrarModal();
                setRefresh((n) => n + 1);
            } else {
                mostrarToast(res.msg || 'No se pudo guardar.', 'error');
            }
        } catch { mostrarToast('Error de conexión.', 'error'); }
        finally { setCargando(false); }
    }, [tabActiva, formData, editandoId, mostrarToast, cerrarModal]);

    return (
        <div className="p-6 min-h-full">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Panel Maestro de Catálogos</h1>
                <p className="text-gray-400 text-sm mt-1">Configuración del sistema de Recursos Humanos</p>
            </div>

            {/* Tabs de catálogos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6">
                {CATALOGOS.map((cat) => {
                    const activo = tabActiva === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => handleTabChange(cat.id)}
                            className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold border transition-all ${
                                activo
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                    : 'bg-[#121621] border-white/5 text-gray-400 hover:text-white hover:border-white/20'
                            }`}
                        >
                            <span className="text-lg">{cat.icon}</span>
                            {cat.nombre}
                        </button>
                    );
                })}
            </div>

            {/* Card con tabla */}
            <div className="bg-[#121621] border border-white/5 rounded-xl overflow-hidden">
                {/* Header de tabla */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
                        {catActivo?.icon} Gestión de {catActivo?.nombre}
                    </h2>
                    {catActivo?.acciones.agregar && (
                        <button
                            onClick={handleNuevo}
                            disabled={cargando}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                            + Nuevo
                        </button>
                    )}
                </div>

                {/* Tabla activa */}
                <div className="min-h-[300px]">
                    {TablaActiva && (
                        <TablaActiva
                            key={`${tabActiva}-${refresh}`}
                            onEdit={catActivo?.acciones.editar    ? handleEditar   : null}
                            onDelete={catActivo?.acciones.eliminar ? handleBorrar  : null}
                            onBaja={catActivo?.acciones.bajar      ? handleBaja    : null}
                            onToggle={catActivo?.acciones.toggle   ? handleToggle  : null}
                            onDarBaja={tabActiva === 'empleados'   ? handleDarBaja : null}
                        />
                    )}
                </div>
            </div>

            {/* Modal */}
            <ModalCatalogo
                isOpen={modalAbierto}
                onClose={cerrarModal}
                title={editandoId ? `✏️ Editar — ${catActivo?.nombre}` : `➕ Nuevo — ${catActivo?.nombre}`}
                onSave={handleGuardar}
                cargando={cargando}
            >
                <FormularioDinamico
                    catalogo={tabActiva}
                    formData={formData}
                    editandoId={editandoId}
                    onChange={handleChange}
                />
            </ModalCatalogo>

            {/* Modal Dar de Baja */}
            {modalBaja && (
                <ModalBaja
                    empleadoId={modalBaja}
                    onClose={() => setModalBaja(null)}
                    onConfirm={confirmarBaja}
                />
            )}

            {/* Toast */}
            {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}
        </div>
    );
};

export default CatalogosPage;
