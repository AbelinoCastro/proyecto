import { useEffect, useState } from 'react';
import { getEmpleados, createEmpleado, updateEmpleado, darBajaEmpleado, cambiarEstadoEmpleado, deleteEmpleado } from '../../services/empleadoService';
import { getPuestos } from '../../services/puestosService';
import { getJornadas } from '../../services/jornadasService';
import { getMotivosBaja } from '../../services/motivoBajaService';
import EstadoBadge from '../../components/EstadoBadge';
import { digitsMax, lettersMax } from '../../utils/validators';

const formatFecha = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const EmpleadoPage = () => {
    const [datos, setDatos] = useState([]);
    const [puestos, setPuestos] = useState([]);
    const [jornadas, setJornadas] = useState([]);
    const [motivos, setMotivos] = useState([]);
    const [buscar, setBuscar] = useState('');
    const [selected, setSelected] = useState(null);
    const [modal, setModal] = useState(null);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});

    const validar = () => {
        const e = {};
        if (!form.nombre?.trim()) e.nombre = true;
        if (!form.fecha_nacimiento) e.fecha_nacimiento = true;
        if (!form.fecha_inicio) e.fecha_inicio = true;
        if (!form.id_puesto) e.id_puesto = true;
        if (!form.id_jornada) e.id_jornada = true;
        if (form.no_dpi_permiso && form.no_dpi_permiso.length !== 13) e.no_dpi_permiso = true;
        if (form.telefono && form.telefono.length !== 8) e.telefono = true;
        if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) e.correo = true;
        setErrors(e);
        if (Object.keys(e).length > 0) {
            setError('Revisa los campos marcados en rojo');
            return false;
        }
        setError('');
        return true;
    };

    const formInicial = { nombre: '', fecha_nacimiento: '', genero: 'M', nacionalidad: 'Guatemalteca', no_afiliacion_igss: '', no_dpi_permiso: '', fecha_inicio: '', id_puesto: '', id_jornada: '', correo: '', telefono: '', cuenta_bancaria: '', estado: 'ACTIVO', porcentaje_pago_comision: 0 };
    const [form, setForm] = useState(formInicial);
    const [formBaja, setFormBaja] = useState({ id_motivo_baja: '', fecha_fin: '' });

    const cargar = async () => {
        const [resEmp, resPuestos, resJornadas, resMotivos] = await Promise.all([
            getEmpleados(), getPuestos(), getJornadas(), getMotivosBaja()
        ]);
        setDatos(resEmp.data.data);
        setPuestos(resPuestos.data.data);
        setJornadas(resJornadas.data.data);
        setMotivos(resMotivos.data.data);
    };
    useEffect(() => { cargar(); }, []);

    const filtrados = datos.filter(d =>
        d.NOMBRE.toLowerCase().includes(buscar.toLowerCase()) ||
        d.NO_DPI_PERMISO.toLowerCase().includes(buscar.toLowerCase())
    );

    const abrirCreate = () => { setForm(formInicial); setError(''); setErrors({}); setModal('create'); };
    const abrirUpdate = () => {
        if (!selected) return;
        setForm({
            nombre: selected.NOMBRE, fecha_nacimiento: '', genero: selected.GENERO,
            nacionalidad: selected.NACIONALIDAD, no_afiliacion_igss: selected.NO_AFILIACION_IGSS,
            no_dpi_permiso: selected.NO_DPI_PERMISO, fecha_inicio: '',
            id_puesto: selected.ID_PUESTO, id_jornada: selected.ID_JORNADA,
            correo: selected.CORREO || '', telefono: selected.TELEFONO || '',
            cuenta_bancaria: selected.CUENTA_BANCARIA || '', estado: selected.ESTADO,
            porcentaje_pago_comision: selected.PORCENTAJE_PAGO_COMISION
        });
        setError(''); setErrors({}); setModal('update');
    };

    const guardar = async () => {
        if (!validar()) return;
        try {
            if (modal === 'create') await createEmpleado(form);
            else await updateEmpleado(selected.ID_EMPLEADO, form);
            setModal(null); setSelected(null); setErrors({}); cargar();
        } catch (err) { setError(err.response?.data?.message || 'Error al guardar'); }
    };

    const darBaja = async () => {
        try {
            await darBajaEmpleado(selected.ID_EMPLEADO, formBaja);
            setModal(null); setSelected(null); cargar();
        } catch (err) { setError(err.response?.data?.message || 'Error al dar de baja'); }
    };

    const eliminar = async () => {
        if (!selected || !window.confirm(`¿Eliminar a "${selected.NOMBRE}"?`)) return;
        try { await deleteEmpleado(selected.ID_EMPLEADO); setSelected(null); cargar(); }
        catch (err) { alert(err.response?.data?.message || 'Error al eliminar'); }
    };

    const cambiarEstado = async (nuevoEstado) => {
        try {
            await cambiarEstadoEmpleado(selected.ID_EMPLEADO, { estado: nuevoEstado });
            setModal(null); setSelected(null); cargar();
        } catch (err) { setError(err.response?.data?.message || 'Error'); }
    };

    const labelCls = "text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block opacity-60";
    const inputBase = "bg-[#0b0b0b] rounded-xl px-4 py-2.5 text-[12px] text-white outline-none transition-all w-full shadow-inner";
    const inputCls = `${inputBase} border border-white/5 focus:border-[#C5A028]/30`;
    const inputErrCls = `${inputBase} border-2 border-red-500/60 focus:border-red-500 bg-red-950/10`;
    const cls = (field) => errors[field] ? inputErrCls : inputCls;

    return (
        <div className="max-w-[1450px] mx-auto py-10 px-6 animate-in fade-in duration-1000">

            {/* Header Técnico */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                <div>
                    <p className="text-[#C5A028] text-[10px] font-black uppercase tracking-[0.4em] mb-3 opacity-60">Recursos Humanos</p>
                    <h1 className="font-serif-title text-6xl text-white tracking-tighter leading-none">Gestión de Empleados</h1>
                    <p className="text-gray-600 text-[13px] mt-4 font-medium max-w-2xl leading-relaxed">
                        Consola centralizada para la administración de expedientes, contratos y estados operativos del personal.
                        Mantenga la integridad de la base de datos de talento humano.
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-[#111112] border border-white/5 px-6 py-4 rounded-[28px] shadow-2xl">
                    <div className="text-right border-r border-white/5 pr-6">
                        <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest opacity-60">Total Personal</p>
                        <p className="text-white font-black text-3xl tracking-tighter">{datos.length}</p>
                    </div>
                    <button onClick={abrirCreate} className="gold-button text-[10px] uppercase tracking-[0.2em] py-3.5 px-8 shadow-xl">
                        + Registrar Colaborador
                    </button>
                </div>
            </div>

            {/* Barra de Búsqueda y Acciones Rápidas */}
            <div className="luxury-card p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/[0.01]">
                <div className="relative w-full max-w-md group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#C5A028] transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input
                        className="bg-[#0b0b0b] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs text-white placeholder-gray-600 outline-none w-full focus:border-[#C5A028]/30 transition-all"
                        placeholder="Buscar por nombre, DPI o identificación..."
                        value={buscar}
                        onChange={e => setBuscar(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    <button onClick={abrirUpdate} disabled={!selected} className="dark-button text-[9px] uppercase tracking-widest flex-1 md:flex-none disabled:opacity-20">Editar Perfil</button>
                    <button onClick={() => { if (selected) { setFormBaja({ id_motivo_baja: '', fecha_fin: '' }); setError(''); setModal('baja'); } }} disabled={!selected} className="bg-red-500/10 border border-red-500/20 text-red-500 px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all disabled:opacity-20">Gestionar Baja</button>
                    <button onClick={() => { if (selected) { setError(''); setModal('estado'); } }} disabled={!selected} className="dark-button text-[9px] uppercase tracking-widest flex-1 md:flex-none disabled:opacity-20">Cambiar Estado</button>
                    <button onClick={eliminar} disabled={!selected} className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-500 hover:bg-red-600/20 transition-all disabled:opacity-20">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h14" /></svg>
                    </button>
                </div>
            </div>

            {/* Listado Maestro de Empleados */}
            <div className="luxury-card overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                                <th className="w-14 px-6 py-6 text-center">
                                    <div className="w-4 h-4 border-2 border-white/10 rounded mx-auto"></div>
                                </th>
                                <th className="px-6 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Identificación del Colaborador</th>
                                <th className="px-6 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Cargo & Depto</th>
                                <th className="px-6 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Gestión Temporal</th>
                                <th className="px-6 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Finanzas</th>
                                <th className="px-6 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {filtrados.map(item => (
                                <tr
                                    key={item.ID_EMPLEADO}
                                    onClick={() => setSelected(selected?.ID_EMPLEADO === item.ID_EMPLEADO ? null : item)}
                                    className={`group cursor-pointer transition-all duration-300 ${selected?.ID_EMPLEADO === item.ID_EMPLEADO ? 'bg-[#C5A028]/5 border-l-2 border-l-[#C5A028]' : 'hover:bg-white/[0.015]'}`}
                                >
                                    <td className="px-6 py-6 text-center">
                                        <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${selected?.ID_EMPLEADO === item.ID_EMPLEADO ? 'bg-[#C5A028] border-[#C5A028]' : 'border-white/10 group-hover:border-white/30'}`}>
                                            {selected?.ID_EMPLEADO === item.ID_EMPLEADO && <svg className="w-3.5 h-3.5 text-black" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1c1c1e] to-[#2c2c2e] border border-white/5 flex items-center justify-center text-white text-[10px] font-black shadow-inner">
                                                {item.NOMBRE.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-[14px] tracking-tight">{item.NOMBRE}</p>
                                                <div className="flex items-center gap-3 mt-1 opacity-50">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#C5A028]">DPI: {item.NO_DPI_PERMISO}</span>
                                                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">ID: {item.ID_EMPLEADO}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <p className="text-gray-300 font-bold text-[12px]">{item.NOMBRE_PUESTO}</p>
                                        <p className="text-[10px] text-gray-500 font-medium mt-1 uppercase tracking-widest">{item.NOMBRE_DEPARTAMENTO}</p>
                                    </td>
                                    <td className="px-6 py-6">
                                        <p className="text-gray-400 text-[11px] font-medium italic">Inicio: {formatFecha(item.FECHA_INICIO)}</p>
                                        <p className="text-[10px] text-gray-600 font-bold mt-1 uppercase tracking-widest">{item.NOMBRE_JORNADA}</p>
                                    </td>
                                    <td className="px-6 py-6">
                                        <p className="text-white font-black text-[13px] tracking-tight">
                                            Q {Number(puestos.find(p => p.ID_PUESTO === item.ID_PUESTO)?.SUELDO_BASE || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[9px] text-gray-600 font-bold mt-1 uppercase tracking-widest">Sueldo Ordinario</p>
                                    </td>
                                    <td className="px-6 py-6">
                                        <EstadoBadge estado={item.ESTADO} />
                                    </td>
                                </tr>
                            ))}
                            {filtrados.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center opacity-30 italic text-sm">
                                        No se han localizado registros de personal bajo este criterio.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Registro / Actualización — LUXURY STYLE */}
            {(modal === 'create' || modal === 'update') && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 overflow-y-auto py-10 px-4">
                    <div className="luxury-card w-full max-w-4xl shadow-2xl border-[#C5A028]/20 animate-in zoom-in-95 duration-500 overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                            <div>
                                <h2 className="text-white text-xs font-black uppercase tracking-[0.4em]">{modal === 'create' ? 'Apertura de Expediente' : 'Actualización de Perfil'}</h2>
                                <p className="text-gray-500 text-[10px] font-bold mt-1 uppercase tracking-widest">Personal de NóminaGT Enterprise</p>
                            </div>
                            <button onClick={() => setModal(null)} className="text-gray-500 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-10">
                            {error && <p className="text-red-400 text-[11px] font-bold uppercase tracking-widest mb-8 bg-red-500/5 p-4 rounded-xl border border-red-500/10 text-center">{error}</p>}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                {/* Sección Datos Personales */}
                                <div className="space-y-6">
                                    <h4 className="text-[#C5A028] text-[9px] font-black uppercase tracking-[0.4em] mb-4 border-b border-[#C5A028]/10 pb-2">Información de Identidad</h4>
                                    <div>
                                        <label className={labelCls}>Nombre Legal Completo</label>
                                        <input
                                            className={cls('nombre')}
                                            placeholder="Ej. Juan Carlos Méndez"
                                            value={form.nombre}
                                            onChange={e => setForm({ ...form, nombre: e.target.value })}
                                            onInput={lettersMax(100)}
                                            maxLength={100}
                                            title="Solo letras y espacios" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelCls}>Nacimiento</label>
                                            <input type="date" className={cls('fecha_nacimiento')} value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Género</label>
                                            <select className={inputCls} value={form.genero} onChange={e => setForm({ ...form, genero: e.target.value })}>
                                                <option value="M">Masculino</option>
                                                <option value="F">Femenino</option>
                                                <option value="O">Otro</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Nacionalidad</label>
                                        <input
                                            className={inputCls}
                                            value={form.nacionalidad}
                                            onChange={e => setForm({ ...form, nacionalidad: e.target.value })}
                                            onInput={lettersMax(50)}
                                            maxLength={50}
                                            placeholder="Ej: Guatemalteca"
                                            title="Solo letras" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelCls}>Afiliación IGSS</label>
                                            <input
                                                className={inputCls}
                                                inputMode="numeric"
                                                placeholder="Ej: 12345678 (solo dígitos, máx 11)"
                                                value={form.no_afiliacion_igss}
                                                onChange={e => setForm({ ...form, no_afiliacion_igss: e.target.value })}
                                                onInput={digitsMax(11)}
                                                title="Solo números, máximo 11 dígitos"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Documento DPI</label>
                                            <input
                                                className={cls('no_dpi_permiso')}
                                                inputMode="numeric"
                                                placeholder="Ej: 1234567890101 (13 dígitos)"
                                                value={form.no_dpi_permiso}
                                                onChange={e => setForm({ ...form, no_dpi_permiso: e.target.value })}
                                                onInput={digitsMax(13)}
                                                title="DPI debe tener exactamente 13 dígitos"
                                                maxLength={13}
                                            />
                                            {errors.no_dpi_permiso && <p className="text-red-400 text-[10px] mt-1">El DPI debe tener exactamente 13 dígitos</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Sección Datos Laborales */}
                                <div className="space-y-6">
                                    <h4 className="text-[#C5A028] text-[9px] font-black uppercase tracking-[0.4em] mb-4 border-b border-[#C5A028]/10 pb-2">Contratación & Finanzas</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelCls}>Fecha de Inicio</label>
                                            <input type="date" className={cls('fecha_inicio')} value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>% Comisión</label>
                                            <input
                                                type="number"
                                                className={inputCls}
                                                min="0" max="100" step="0.01"
                                                placeholder="Ej: 5 (0 a 100)"
                                                value={form.porcentaje_pago_comision}
                                                onChange={e => {
                                                    let v = e.target.value;
                                                    if (v === '') { setForm({ ...form, porcentaje_pago_comision: '' }); return; }
                                                    let n = parseFloat(v);
                                                    if (isNaN(n)) return;
                                                    if (n < 0) n = 0;
                                                    if (n > 100) n = 100;
                                                    setForm({ ...form, porcentaje_pago_comision: n });
                                                }}
                                                title="Porcentaje entre 0 y 100"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Asignación de Puesto</label>
                                        <select className={cls('id_puesto')} value={form.id_puesto} onChange={e => setForm({ ...form, id_puesto: e.target.value })}>
                                            <option value="">Selecciona una posición jerárquica...</option>
                                            {puestos.map(p => <option key={p.ID_PUESTO} value={p.ID_PUESTO}>{p.NOMBRE_PUESTO} — Q{Number(p.SUELDO_BASE).toLocaleString()}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Jornada Laboral</label>
                                        <select className={cls('id_jornada')} value={form.id_jornada} onChange={e => setForm({ ...form, id_jornada: e.target.value })}>
                                            <option value="">Selecciona el régimen de horas...</option>
                                            {jornadas.map(j => <option key={j.ID_JORNADA} value={j.ID_JORNADA}>{j.NOMBRE_JORNADA} ({j.HORAS_DIARIAS}h)</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Información de Pago (Banco)</label>
                                        <input
                                            className={inputCls}
                                            inputMode="numeric"
                                            placeholder="Ej: 1234567890 (solo dígitos)"
                                            value={form.cuenta_bancaria}
                                            onChange={e => setForm({ ...form, cuenta_bancaria: e.target.value })}
                                            onInput={digitsMax(20)}
                                            title="Solo números"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelCls}>Correo Electrónico</label>
                                            <input
                                                type="email"
                                                className={cls('correo')}
                                                placeholder="Ej: empleado@empresa.gt"
                                                value={form.correo}
                                                onChange={e => setForm({ ...form, correo: e.target.value })}
                                                title="Formato: nombre@dominio.com"
                                            />
                                            {errors.correo && <p className="text-red-400 text-[10px] mt-1">Formato de correo inválido</p>}
                                        </div>
                                        <div>
                                            <label className={labelCls}>Teléfono Contacto</label>
                                            <input
                                                type="tel"
                                                className={cls('telefono')}
                                                inputMode="numeric"
                                                placeholder="Ej: 55551234 (8 dígitos)"
                                                value={form.telefono}
                                                onChange={e => setForm({ ...form, telefono: e.target.value })}
                                                onInput={digitsMax(8)}
                                                title="Teléfono GT: 8 dígitos"
                                                maxLength={8}
                                            />
                                            {errors.telefono && <p className="text-red-400 text-[10px] mt-1">El teléfono debe tener 8 dígitos</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-16 border-t border-white/5 pt-8">
                                <button onClick={() => setModal(null)} className="flex-1 dark-button py-4 text-[10px] uppercase tracking-widest">Descartar Cambios</button>
                                <button onClick={guardar} className="flex-1 gold-button py-4 text-[10px] uppercase tracking-widest shadow-2xl shadow-[#C5A028]/20">Confirmar Expediente</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Baja — LUXURY */}
            {modal === 'baja' && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="luxury-card w-full max-w-md shadow-2xl border-red-500/20 animate-in zoom-in-95 duration-500">
                        <div className="p-8 border-b border-white/5">
                            <h2 className="text-red-500 text-xs font-black uppercase tracking-[0.4em]">Finalización de Contrato</h2>
                            <p className="text-gray-500 text-[11px] font-bold mt-2 uppercase tracking-widest">Colaborador: {selected?.NOMBRE}</p>
                        </div>
                        <div className="p-10 space-y-8">
                            <div>
                                <label className={labelCls}>Motivo de la Desvinculación</label>
                                <select className={inputCls} value={formBaja.id_motivo_baja} onChange={e => setFormBaja({ ...formBaja, id_motivo_baja: e.target.value })}>
                                    <option value="">Seleccionar causa legal...</option>
                                    {motivos.map(m => <option key={m.ID_MOTIVO_BAJA} value={m.ID_MOTIVO_BAJA}>{m.DESCRIPCION}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Fecha de Cese Efectivo</label>
                                <input type="date" className={inputCls} value={formBaja.fecha_fin} onChange={e => setFormBaja({ ...formBaja, fecha_fin: e.target.value })} />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setModal(null)} className="flex-1 dark-button py-3 text-[10px] tracking-widest uppercase">Cancelar</button>
                                <button onClick={darBaja} className="flex-1 bg-red-600 text-white font-black py-3 rounded-lg text-[10px] tracking-widest uppercase hover:bg-red-500 transition-all shadow-xl shadow-red-600/20">Ejecutar Baja</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Estado — LUXURY */}
            {modal === 'estado' && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="luxury-card w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="p-6 border-b border-white/5 text-center">
                            <h2 className="text-white text-[10px] font-black uppercase tracking-[0.4em]">Estatus Operativo</h2>
                        </div>
                        <div className="p-8 space-y-3">
                            {['ACTIVO', 'INACTIVO', 'SUSPENDIDO'].map(e => (
                                <button
                                    key={e}
                                    onClick={() => cambiarEstado(e)}
                                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${selected?.ESTADO === e ? 'bg-[#C5A028] text-black border-[#C5A028]' : 'bg-white/[0.02] text-gray-500 border-white/5 hover:text-white hover:bg-white/[0.05]'}`}
                                >
                                    {e}
                                </button>
                            ))}
                            <button onClick={() => setModal(null)} className="w-full mt-4 text-[9px] font-black text-gray-600 uppercase tracking-widest hover:text-white transition-colors">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmpleadoPage;
