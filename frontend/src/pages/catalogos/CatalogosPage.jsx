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

const Icons = {
    Empleados: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    Usuarios: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    Roles: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
    Departamentos: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    Puestos: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    Jornadas: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Percepciones: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Deducciones: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>,
    Faltas: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    Motivos: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
};

const CATALOGOS = [
    { id: 'empleados',     nombre: 'EMPLEADOS',     icon: <Icons.Empleados />, acciones: { agregar: true, editar: true, eliminar: true, bajar: false, toggle: true  } },
    { id: 'usuarios',      nombre: 'USUARIOS',      icon: <Icons.Usuarios />, acciones: { agregar: true, editar: true, eliminar: true, bajar: false, toggle: true  } },
    { id: 'tipos',         nombre: 'ROLES',         icon: <Icons.Roles />, acciones: { agregar: true, editar: true, eliminar: true,  bajar: false, toggle: true  } },
    { id: 'departamentos', nombre: 'DEPARTAMENTOS', icon: <Icons.Departamentos />, acciones: { agregar: true, editar: true, eliminar: true,  bajar: false, toggle: true  } },
    { id: 'puestos',       nombre: 'PUESTOS',       icon: <Icons.Puestos />, acciones: { agregar: true, editar: true, eliminar: true,  bajar: false, toggle: false } },
    { id: 'jornadas',      nombre: 'JORNADAS',      icon: <Icons.Jornadas />, acciones: { agregar: true, editar: true, eliminar: true,  bajar: false, toggle: false } },
    { id: 'percepciones',  nombre: 'PERCEPCIONES',  icon: <Icons.Percepciones />, acciones: { agregar: true, editar: true, eliminar: true,  bajar: false, toggle: false } },
    { id: 'deducciones',   nombre: 'DEDUCCIONES',   icon: <Icons.Deducciones />, acciones: { agregar: true, editar: true, eliminar: true,  bajar: false, toggle: false } },
    { id: 'faltas',        nombre: 'FALTAS',        icon: <Icons.Faltas />, acciones: { agregar: true, editar: true, eliminar: true,  bajar: false, toggle: true  } },
    { id: 'motivos',       nombre: 'MOTIVOS BAJA',  icon: <Icons.Motivos />, acciones: { agregar: true, editar: true, eliminar: true,  bajar: false, toggle: true  } },
];

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
        { name: 'porcentaje_pago_comision', label: '% Comisión', type: 'number', placeholder: '0.00' },
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
        { name: 'hora_inicio',    label: 'Hora Inicio',      type: 'text',   placeholder: '08:00 AM' },
        { name: 'hora_fin',       label: 'Hora Fin',         type: 'text',   placeholder: '05:00 PM' },
        { name: 'descripcion',    label: 'Descripción',      type: 'textarea' },
    ],
    percepciones: [
        { name: 'id_percepcion',       label: 'Código (ej: PER10)', type: 'text',     required: true, soloCrear: true, placeholder: 'Máx 5 caracteres' },
        { name: 'nombre_percepcion',   label: 'Nombre',             type: 'text',     required: true },
        { name: 'descripcion_formula', label: 'Descripción / Fórmula', type: 'textarea' },
    ],
    deducciones: [
        { name: 'id_deduccion',        label: 'Código (ej: DED09)', type: 'text',     required: true, soloCrear: true, placeholder: 'Máx 5 caracteres' },
        { name: 'nombre_deduccion',    label: 'Nombre',             type: 'text',     required: true },
        { name: 'descripcion_formula', label: 'Descripción / Fórmula', type: 'textarea' },
    ],
    faltas: [
        { name: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
        { name: 'es_pagado',   label: '¿Genera pago (con goce)?',  type: 'select',   required: true,
          options: [{ value: 'S', label: 'Sí (Pagado)' }, { value: 'N', label: 'No (Descuento)' }] },
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

const Toast = ({ mensaje, tipo, onClose }) => {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div className={`fixed bottom-10 right-10 z-[150] flex items-center gap-4 px-6 py-4 rounded-xl shadow-2xl border animate-in slide-in-from-right-10 duration-500 backdrop-blur-xl ${
            tipo === 'error' ? 'bg-red-950/60 border-red-500/50 text-red-100' : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-100'
        }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${tipo === 'error' ? 'border-red-500/30 bg-red-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
                {tipo === 'error' ? '✕' : '✔'}
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5">{tipo === 'error' ? 'Error' : 'Éxito'}</span>
                <span className="text-[13px] font-bold tracking-tight">{mensaje}</span>
            </div>
        </div>
    );
};

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

const FormularioDinamico = ({ catalogo, formData, editandoId, onChange }) => {
    const campos = CAMPOS[catalogo] || [];

    if (!campos.length)
        return <p className="text-gray-400 text-sm text-center py-4">Sin campos configurados</p>;

    const labelCls = "text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block opacity-80";
    const inputClass = "bg-[#0c0c0c] border border-white/5 rounded-lg px-4 py-2.5 text-[13px] text-white outline-none focus:border-[#C5A028]/50 transition-all w-full shadow-inner font-medium";

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campos.map((campo) => {
                if (campo.soloCrear && editandoId) return null;
                const valor = formData[campo.name] ?? '';

                return (
                    <div key={campo.name} className={campo.type === 'textarea' ? 'md:col-span-2' : ''}>
                        <label className={labelCls}>
                            {campo.label}
                            {campo.required && <span className="text-[#C5A028] ml-1.5">*</span>}
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

    const labelCls = "text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block opacity-80";
    const inputClass = "bg-[#0c0c0c] border border-white/5 rounded-lg px-4 py-2.5 text-[13px] text-white outline-none focus:border-red-500/50 transition-all w-full shadow-inner";

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="bg-[#121214] border border-white/5 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-white/5 bg-white/[0.01]">
                    <h2 className="text-white text-lg font-bold uppercase tracking-widest">Protocolo de Baja</h2>
                </div>

                <div className="p-8 space-y-6">
                    <div>
                        <label className={labelCls}>Motivo de Baja *</label>
                        <select value={motivoId} onChange={e => setMotivoId(e.target.value)} className={inputClass}>
                            <option value="">— Seleccionar —</option>
                            {motivos.map(m => (
                                <option key={m.ID_MOTIVO_BAJA} value={m.ID_MOTIVO_BAJA}>{m.DESCRIPCION}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Fecha Efectiva *</label>
                        <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className={inputClass} />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button onClick={onClose} className="flex-1 py-3 text-[11px] font-black uppercase bg-white/5 text-gray-400 rounded-lg hover:text-white transition-all">Cancelar</button>
                        <button
                            onClick={() => onConfirm(empleadoId, motivoId, fechaFin)}
                            disabled={!motivoId || !fechaFin}
                            className="flex-[2] bg-red-600 text-white font-black py-3 rounded-lg text-[11px] uppercase shadow-lg shadow-red-900/20 disabled:opacity-20 transition-all"
                        >
                            Confirmar Baja
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CatalogosPage = () => {
    const [tabActiva,    setTabActiva]    = useState('empleados');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [formData,     setFormData]     = useState({});
    const [editandoId,   setEditandoId]   = useState(null);
    const [refresh,      setRefresh]      = useState(0);
    const [cargando,     setCargando]     = useState(false);
    const [toast,        setToast]        = useState(null);
    const [modalBaja,    setModalBaja]    = useState(null);

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
            if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.split('T')[0];
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
        if (!window.confirm('¿Confirmar la eliminación permanente?')) return;
        setCargando(true);
        try {
            const res = await apiEliminar(tabActiva, id);
            res.ok ? mostrarToast('Registro eliminado') : mostrarToast(res.msg || 'Error', 'error');
            if (res.ok) setRefresh((n) => n + 1);
        } catch { mostrarToast('Error de conexión', 'error'); }
        finally { setCargando(false); }
    }, [tabActiva, mostrarToast]);

    const handleDarBaja = useCallback((id) => { setModalBaja(id); }, []);

    const confirmarBaja = useCallback(async (id, id_motivo_baja, fecha_fin) => {
        setCargando(true);
        try {
            const res = await fetch(`${API_BASE}/empleado/${id}/baja`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_motivo_baja, fecha_fin }),
            });
            if (res.ok) {
                mostrarToast('Empleado dado de baja');
                setModalBaja(null);
                setRefresh(n => n + 1);
            } else {
                const data = await res.json();
                mostrarToast(data.message || 'Error', 'error');
            }
        } catch { mostrarToast('Error de red', 'error'); }
        finally { setCargando(false); }
    }, [mostrarToast]);

    const handleToggle = useCallback(async (id, nuevoEstado) => {
        if (!window.confirm(`¿Confirmar cambio de estado?`)) return;
        setCargando(true);
        try {
            const res = await apiToggleEstado(tabActiva, id, nuevoEstado);
            res.ok ? mostrarToast(`Estado actualizado`) : mostrarToast(res.msg || 'Error', 'error');
            if (res.ok) setRefresh((n) => n + 1);
        } catch { mostrarToast('Error técnico', 'error'); }
        finally { setCargando(false); }
    }, [tabActiva, mostrarToast]);

    const handleGuardar = useCallback(async () => {
        setCargando(true);
        try {
            const res = await apiGuardar(tabActiva, formData, editandoId);
            if (res.ok) {
                mostrarToast(editandoId ? 'Actualizado con éxito' : 'Creado con éxito');
                cerrarModal();
                setRefresh((n) => n + 1);
            } else {
                mostrarToast(res.msg || 'Error al guardar', 'error');
            }
        } catch { mostrarToast('Error crítico', 'error'); }
        finally { setCargando(false); }
    }, [tabActiva, formData, editandoId, mostrarToast, cerrarModal]);

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 animate-in fade-in duration-700 min-h-screen">
            {/* Header optimized structure */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                <div className="space-y-3">
                    <p className="text-[#C5A028] text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Configuración Estructural</p>
                    <h1 className="font-serif-title text-6xl text-white tracking-tight leading-tight">Panel Maestro</h1>
                    <p className="text-gray-500 text-[13px] font-medium max-w-xl leading-relaxed">
                        Administre catálogos y diccionarios de datos de forma centralizada.
                    </p>
                </div>

                <div className="flex items-center gap-5 bg-white/[0.02] border border-white/5 p-4 rounded-2xl shadow-xl">
                    <div className="text-right border-r border-white/5 pr-5">
                        <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest opacity-60">Categorías</p>
                        <p className="text-white font-black text-2xl tracking-tighter">{CATALOGOS.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[#C5A028]/10 flex items-center justify-center border border-[#C5A028]/20 text-[#C5A028]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                </div>
            </div>

            {/* Optimized Tabs Grid - Smaller and more compact */}
            <div className="flex flex-wrap gap-2.5 mb-10 pb-4 overflow-x-auto no-scrollbar">
                {CATALOGOS.map((cat) => {
                    const activo = tabActiva === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => handleTabChange(cat.id)}
                            className={`flex flex-col items-center justify-center min-w-[90px] h-[90px] rounded-2xl border transition-all duration-300 ${
                                activo
                                    ? 'bg-[#C5A028] border-[#C5A028] text-black shadow-xl shadow-[#C5A028]/20 scale-105'
                                    : 'bg-white/[0.02] border-white/5 text-gray-500 hover:text-white hover:border-white/10'
                            }`}
                        >
                            <div className={`${activo ? 'text-black' : 'text-gray-600'} mb-2`}>{cat.icon}</div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-center px-1 leading-none">{cat.nombre}</span>
                        </button>
                    );
                })}
            </div>

            {/* Optimized Table Container */}
            <div className="luxury-card overflow-hidden shadow-2xl bg-[#0c0c0c] border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-8 py-8 border-b border-white/5 bg-white/[0.01] gap-4">
                    <div className="flex items-center gap-4">
                        <div className="text-[#C5A028]/60">{catActivo?.icon}</div>
                        <div>
                            <h2 className="text-[12px] font-black text-white uppercase tracking-[0.4em]">Gestión de {catActivo?.nombre}</h2>
                            <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-50">Base de Datos Operativa</p>
                        </div>
                    </div>
                    {catActivo?.acciones.agregar && (
                        <button
                            onClick={handleNuevo}
                            disabled={cargando}
                            className="bg-[#C5A028] hover:bg-[#A8871E] text-black text-[11px] font-black uppercase tracking-widest py-3.5 px-8 rounded-xl transition-all shadow-xl shadow-[#C5A028]/10"
                        >
                            + Registrar Nuevo
                        </button>
                    )}
                </div>

                <div className="min-h-[400px]">
                    {TablaActiva && (
                        <TablaActiva
                            key={`${tabActiva}-${refresh}`}
                            onEdit={catActivo?.acciones.editar    ? handleEditar   : null}
                            onDelete={catActivo?.acciones.eliminar ? handleBorrar  : null}
                            onToggle={catActivo?.acciones.toggle   ? handleToggle  : null}
                            onDarBaja={tabActiva === 'empleados'   ? handleDarBaja : null}
                        />
                    )}
                </div>
            </div>

            <ModalCatalogo
                isOpen={modalAbierto}
                onClose={cerrarModal}
                title={editandoId ? `Edición: ${catActivo?.nombre}` : `Nuevo: ${catActivo?.nombre}`}
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

            {modalBaja && (
                <ModalBaja
                    empleadoId={modalBaja}
                    onClose={() => setModalBaja(null)}
                    onConfirm={confirmarBaja}
                />
            )}

            {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}

            <div className="mt-16 flex justify-center opacity-30">
                <p className="text-[9px] font-black text-gray-700 uppercase tracking-[1em]">Diccionario Maestro NóminaGT</p>
            </div>
        </div>
    );
};

export default CatalogosPage;
