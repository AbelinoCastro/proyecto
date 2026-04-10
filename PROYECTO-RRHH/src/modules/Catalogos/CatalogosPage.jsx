import React, { useState, useCallback, useEffect } from 'react';
import './CatalogosStyles.css';
import ModalForm from './ModalForm';
import { apiGuardar, apiEliminar, apiBaja } from './CatalogosLogic';
 
// Importaciones de tablas
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
 
// ─────────────────────────────────────────────────────────────────────────────
// 1.  CATALOGOS — Metadatos de cada sección
//
//     acciones:
//       agregar  → muestra botón "+ Nuevo Registro" en el header
//       editar   → la tabla recibe onEdit   (muestra botón Editar por fila)
//       eliminar → la tabla recibe onDelete (muestra botón Eliminar por fila)
//       bajar    → la tabla recibe onBaja   (muestra botón "Dar de Baja" por fila)
//                  Solo aplica a Empleados y Usuarios; cambia estado en lugar de borrar
// ─────────────────────────────────────────────────────────────────────────────
const CATALOGOS = [
  {
    id: 'empleados', nombre: 'Empleados', color: '#4e73df', icon: '👥',
    acciones: { agregar: true, editar: true, eliminar: false, bajar: true },
    // Empleados NUNCA se eliminan físicamente; se dan de baja para conservar
    // el historial de planillas y auditorías.
  },
  {
    id: 'usuarios', nombre: 'Usuarios', color: '#1cc88a', icon: '👤',
    acciones: { agregar: true, editar: true, eliminar: false, bajar: true },
    // Usuarios se desactivan (estado = 'I') en lugar de eliminarse,
    // para mantener trazabilidad de acciones en el sistema.
  },
  {
    id: 'tipos', nombre: 'Roles/Permisos', color: '#36b9cc', icon: '🔑',
    acciones: { agregar: true, editar: true, eliminar: true, bajar: false },
  },
  {
    id: 'departamentos', nombre: 'Departamentos', color: '#f6c23e', icon: '🏢',
    acciones: { agregar: true, editar: true, eliminar: true, bajar: false },
  },
  {
    id: 'puestos', nombre: 'Puestos', color: '#e74a3b', icon: '💼',
    acciones: { agregar: true, editar: true, eliminar: true, bajar: false },
  },
  {
    id: 'jornadas', nombre: 'Jornadas', color: '#5a5c69', icon: '⏰',
    acciones: { agregar: true, editar: true, eliminar: true, bajar: false },
  },
  {
    id: 'percepciones', nombre: 'Percepciones', color: '#6610f2', icon: '💰',
    acciones: { agregar: true, editar: true, eliminar: true, bajar: false },
  },
  {
    id: 'deducciones', nombre: 'Deducciones', color: '#e83e8c', icon: '📉',
    acciones: { agregar: true, editar: true, eliminar: true, bajar: false },
  },
  {
    id: 'faltas', nombre: 'Faltas', color: '#fd7e14', icon: '⚠️',
    acciones: { agregar: true, editar: true, eliminar: false, bajar: false },
    // Faltas no se eliminan para no corromper registros históricos ya aplicados.
  },
  {
    id: 'motivos', nombre: 'Motivos Baja', color: '#858796', icon: '🚪',
    acciones: { agregar: true, editar: true, eliminar: true, bajar: false },
  },
];
 
// ─────────────────────────────────────────────────────────────────────────────
// 2.  CAMPOS — Definición declarativa de formularios por catálogo
//
//     Propiedades de cada campo:
//       name        → coincide con la columna de BD (en minúsculas)
//       label       → texto visible del label
//       type        → 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea'
//       options     → [{ value, label }]  solo para type='select'
//       soloCrear   → true → el campo se oculta al editar (ej: campos ID)
//       required    → true → marcado como obligatorio con asterisco rojo
//       placeholder → texto de ayuda dentro del input
// ─────────────────────────────────────────────────────────────────────────────
const CAMPOS = {
  empleados: [
    { name: 'id_empleado',      label: 'ID Empleado',   type: 'text',   soloCrear: true, required: true },
    { name: 'nombres',          label: 'Nombres',       type: 'text',   required: true },
    { name: 'apellidos',        label: 'Apellidos',     type: 'text',   required: true },
    { name: 'fecha_nacimiento', label: 'Fecha Nac.',    type: 'date' },
    { name: 'correo',           label: 'Correo',        type: 'email' },
    { name: 'telefono',         label: 'Teléfono',      type: 'text' },
    { name: 'id_departamento',  label: 'Departamento',  type: 'text',   required: true },
    { name: 'id_puesto',        label: 'Puesto',        type: 'text',   required: true },
    { name: 'id_jornada',       label: 'Jornada',       type: 'text' },
  ],
 
  usuarios: [
    { name: 'id_usuario', label: 'ID Usuario', type: 'text',   soloCrear: true, required: true },
    { name: 'username',   label: 'Usuario',    type: 'text',   required: true },
    { name: 'correo',     label: 'Correo',     type: 'email',  required: true },
    { name: 'id_tipo',    label: 'Rol / Tipo', type: 'text',   required: true },
    { name: 'estado',     label: 'Estado',     type: 'select',
      options: [{ value: 'A', label: 'Activo' }, { value: 'I', label: 'Inactivo' }] },
  ],
 
  tipos: [
    { name: 'id_tipo',     label: 'ID',          type: 'text',     soloCrear: true, required: true },
    { name: 'nombre_tipo', label: 'Nombre',      type: 'text',     required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
  ],
 
  departamentos: [
    { name: 'id_departamento',     label: 'ID',          type: 'text',     soloCrear: true, required: true },
    { name: 'nombre_departamento', label: 'Nombre',      type: 'text',     required: true },
    { name: 'descripcion',         label: 'Descripción', type: 'textarea' },
  ],
 
  puestos: [
    { name: 'id_puesto',    label: 'ID Puesto',    type: 'text',   soloCrear: true, required: true },
    { name: 'nombre_puesto', label: 'Nombre',      type: 'text',   required: true },
    { name: 'salario_base', label: 'Salario Base', type: 'number', required: true },
  ],
 
  jornadas: [
    { name: 'id_jornada',     label: 'ID',            type: 'text',   soloCrear: true, required: true },
    { name: 'nombre_jornada', label: 'Nombre',        type: 'text',   required: true },
    { name: 'hora_entrada',   label: 'Hora Entrada',  type: 'text',   placeholder: 'HH:MM' },
    { name: 'hora_salida',    label: 'Hora Salida',   type: 'text',   placeholder: 'HH:MM' },
    { name: 'horas_diarias',  label: 'Horas Diarias', type: 'number' },
  ],
 
  percepciones: [
    { name: 'id_percepcion', label: 'ID',        type: 'text',   soloCrear: true, required: true },
    { name: 'nombre',        label: 'Nombre',    type: 'text',   required: true },
    { name: 'monto',         label: 'Monto',     type: 'number' },
    { name: 'es_fijo',       label: '¿Es Fijo?', type: 'select',
      options: [{ value: 'S', label: 'Sí' }, { value: 'N', label: 'No' }] },
  ],
 
  deducciones: [
    { name: 'id_deduccion', label: 'ID',         type: 'text',   soloCrear: true, required: true },
    { name: 'nombre',       label: 'Nombre',     type: 'text',   required: true },
    { name: 'porcentaje',   label: 'Porcentaje', type: 'number', placeholder: 'Ej: 4.83' },
    { name: 'monto_fijo',   label: 'Monto Fijo', type: 'number' },
  ],
 
  faltas: [
    { name: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
    { name: 'es_pagado',   label: '¿Es Pagado?', type: 'select',   required: true,
      options: [{ value: 'S', label: 'Sí' }, { value: 'N', label: 'No' }] },
  ],
 
  motivos: [
    { name: 'id_motivo',   label: 'ID',          type: 'text',     soloCrear: true, required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
  ],
};
 
// ─────────────────────────────────────────────────────────────────────────────
// 3.  TABLA_MAP — Relaciona id del catálogo con su componente de tabla
// ─────────────────────────────────────────────────────────────────────────────
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
 
// ─────────────────────────────────────────────────────────────────────────────
// 4.  Toast — Notificación visual no bloqueante (reemplaza alert)
//     Se auto-cierra a los 3.5 s. El usuario también puede cerrarlo manualmente.
//     tipo: 'exito' (verde) | 'error' (rojo)
// ─────────────────────────────────────────────────────────────────────────────
const Toast = ({ mensaje, tipo, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);
 
  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem',
      padding: '0.75rem 1.25rem', borderRadius: '8px',
      color: '#fff', fontWeight: 500, fontSize: '0.875rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      zIndex: 9999, maxWidth: '360px',
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      backgroundColor: tipo === 'error' ? '#e74a3b' : '#1cc88a',
      animation: 'slideUp 0.25s ease',
    }}>
      <span style={{ fontSize: '1rem' }}>{tipo === 'error' ? '✖' : '✔'}</span>
      <span>{mensaje}</span>
      <button
        onClick={onClose}
        style={{
          marginLeft: 'auto', background: 'none', border: 'none',
          color: '#fff', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1,
        }}
        aria-label="Cerrar notificación"
      >×</button>
    </div>
  );
};
 
// ─────────────────────────────────────────────────────────────────────────────
// 5.  FormularioDinamico — Renderiza inputs automáticamente
//     basándose en la definición de CAMPOS para el catálogo activo.
// ─────────────────────────────────────────────────────────────────────────────
const FormularioDinamico = ({ catalogo, formData, editandoId, onChange }) => {
  const campos = CAMPOS[catalogo] || [];
 
  if (!campos.length) {
    return (
      <p style={{ textAlign: 'center', color: '#6c757d', padding: '1rem 0' }}>
        Sin campos configurados para <strong>{catalogo}</strong>.
      </p>
    );
  }
 
  return (
    <div className="form-maestro">
      {campos.map((campo) => {
        // Campos soloCrear se ocultan al editar (ej: ID autogenerado)
        if (campo.soloCrear && editandoId) return null;
 
        const valorActual = formData[campo.name] ?? '';
 
        return (
          <div key={campo.name} className="form-grupo">
            <label className="form-label">
              {campo.label}
              {campo.required && (
                <span style={{ color: '#e74a3b', marginLeft: 3 }} title="Campo obligatorio">*</span>
              )}
            </label>
 
            {campo.type === 'select' ? (
              <select
                name={campo.name}
                value={valorActual}
                onChange={onChange}
                className="form-input"
                required={campo.required}
              >
                <option value="">— Seleccionar —</option>
                {campo.options.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
 
            ) : campo.type === 'textarea' ? (
              <textarea
                name={campo.name}
                value={valorActual}
                onChange={onChange}
                className="form-input form-textarea"
                rows={3}
                required={campo.required}
                placeholder={campo.placeholder || ''}
              />
 
            ) : (
              <input
                type={campo.type || 'text'}
                name={campo.name}
                value={valorActual}
                onChange={onChange}
                className="form-input"
                required={campo.required}
                placeholder={campo.placeholder || ''}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
 
// ─────────────────────────────────────────────────────────────────────────────
// 6.  CatalogosPage — Componente principal
// ─────────────────────────────────────────────────────────────────────────────
const CatalogosPage = () => {
  const [tabActiva,    setTabActiva]    = useState('empleados');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [formData,     setFormData]     = useState({});
  const [editandoId,   setEditandoId]   = useState(null);
  const [refresh,      setRefresh]      = useState(0);
  const [cargando,     setCargando]     = useState(false);
  const [toast,        setToast]        = useState(null); // { mensaje, tipo }
 
  // ── Helpers ────────────────────────────────────────────────────────────────
  const mostrarToast = useCallback((mensaje, tipo = 'exito') => {
    setToast({ mensaje, tipo });
  }, []);
 
  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    setEditandoId(null);
    setFormData({});
  }, []);
 
  // Catálogo activo (metadatos + acciones permitidas)
  const catActivo   = CATALOGOS.find((c) => c.id === tabActiva);
  const TablaActiva = TABLA_MAP[tabActiva] || null;
 
  // ── Handlers ───────────────────────────────────────────────────────────────
 
  const handleTabChange = useCallback((id) => {
    setTabActiva(id);
    setEditandoId(null);
    setFormData({});
  }, []);
 
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);
 
  const handleNuevo = useCallback(() => {
    setEditandoId(null);
    setFormData({});
    setModalAbierto(true);
  }, []);
 
  // Abrir modal cargando datos del registro a editar
  const handleEditar = useCallback((item) => {
    // Oracle devuelve llaves en MAYÚSCULAS → normalizamos a minúsculas
    const normalizado = Object.fromEntries(
      Object.entries(item).map(([k, v]) => [k.toLowerCase(), v])
    );
    // Detectar PK dinámicamente (primera columna que empiece con ID_)
    const pkKey   = Object.keys(item).find((k) => k.toUpperCase().startsWith('ID_'));
    const pkValue = pkKey ? item[pkKey] : null;
 
    setEditandoId(pkValue);
    setFormData(normalizado);
    setModalAbierto(true);
  }, []);
 
  // Eliminar físicamente (solo catálogos que lo permiten según acciones.eliminar)
  const handleBorrar = useCallback(async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este registro?\nEsta acción no se puede deshacer.')) return;
    setCargando(true);
    try {
      const res = await apiEliminar(tabActiva, id);
      if (res.ok) {
        mostrarToast('Registro eliminado correctamente.');
        setRefresh((n) => n + 1);
      } else {
        mostrarToast(res.msg || 'No se pudo eliminar el registro.', 'error');
      }
    } catch {
      mostrarToast('Error de conexión al eliminar.', 'error');
    } finally {
      setCargando(false);
    }
  }, [tabActiva, mostrarToast]);
 
  // Dar de baja — Empleados y Usuarios (acciones.bajar = true)
  // No borra el registro; llama apiBaja que actualiza estado a 'I' / 'BAJA'
  // Esto preserva el historial de planillas y la trazabilidad del sistema.
  const handleBaja = useCallback(async (id) => {
    const entidad = tabActiva === 'empleados' ? 'empleado' : 'usuario';
    if (!window.confirm(
      `¿Seguro que deseas dar de baja a este ${entidad}?\nEl registro se conserva y puede reactivarse después.`
    )) return;
    setCargando(true);
    try {
      const res = await apiBaja(tabActiva, id);
      if (res.ok) {
        mostrarToast(`${entidad.charAt(0).toUpperCase() + entidad.slice(1)} dado de baja correctamente.`);
        setRefresh((n) => n + 1);
      } else {
        mostrarToast(res.msg || 'No se pudo procesar la baja.', 'error');
      }
    } catch {
      mostrarToast('Error de conexión al procesar la baja.', 'error');
    } finally {
      setCargando(false);
    }
  }, [tabActiva, mostrarToast]);
 
  // Guardar registro (crear si editandoId es null, actualizar si tiene valor)
  const handleGuardar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await apiGuardar(tabActiva, formData, editandoId);
      if (data.ok) {
        mostrarToast(editandoId ? 'Registro actualizado correctamente.' : 'Registro creado correctamente.');
        cerrarModal();
        setRefresh((n) => n + 1);
      } else {
        mostrarToast(data.msg || 'No se pudo guardar el registro.', 'error');
      }
    } catch {
      mostrarToast('Error de conexión al guardar.', 'error');
    } finally {
      setCargando(false);
    }
  }, [tabActiva, formData, editandoId, mostrarToast, cerrarModal]);
 
  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="catalogos-container">
 
      {/* ── Header ── */}
      <div className="catalogos-header">
        <h2>⚙️ Panel Maestro de Catálogos</h2>
        <p>Configuración del Sistema de Recursos Humanos</p>
      </div>
 
      {/* ── Navegación por catálogos ── */}
      <nav className="grid-catalogos" aria-label="Catálogos disponibles">
        {CATALOGOS.map((cat) => {
          const activo = tabActiva === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleTabChange(cat.id)}
              className={`btn-catalogo ${activo ? 'active' : ''}`}
              style={activo ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
              aria-pressed={activo}
              title={cat.nombre}
            >
              <span className="icon-span" aria-hidden="true">{cat.icon}</span>
              {cat.nombre}
            </button>
          );
        })}
      </nav>
 
      {/* ── Card con la tabla del catálogo activo ── */}
      <div className="card-tabla">
        <div className="tabla-header">
          <h6>
            <span aria-hidden="true">{catActivo?.icon}</span>{' '}
            Gestión de {catActivo?.nombre}
          </h6>
 
          {/* Botón "Nuevo" condicional según acciones.agregar */}
          {catActivo?.acciones.agregar && (
            <button
              onClick={handleNuevo}
              className="btn-agregar"
              disabled={cargando}
            >
              + Nuevo Registro
            </button>
          )}
        </div>
 
        <div className="tabla-content">
          {/*
            key={tabActiva-refresh} fuerza re-montaje (y nuevo fetch) cuando:
              · El usuario cambia de catálogo  (tabActiva cambia)
              · Se guarda o elimina un registro (refresh se incrementa)
          */}
          {TablaActiva && (
            <TablaActiva
              key={`${tabActiva}-${refresh}`}
              // Si la acción no aplica al catálogo → null.
              // Cada tabla debe verificar el prop antes de renderizar su botón.
              onEdit={catActivo?.acciones.editar    ? handleEditar : null}
              onDelete={catActivo?.acciones.eliminar ? handleBorrar : null}
              onBaja={catActivo?.acciones.bajar      ? handleBaja   : null}
            />
          )}
        </div>
      </div>
 
      {/* ── Modal de formulario ── */}
      <ModalForm
        isOpen={modalAbierto}
        onClose={cerrarModal}
        title={editandoId
          ? `✏️ Editar — ${catActivo?.nombre}`
          : `➕ Nuevo — ${catActivo?.nombre}`}
        onSave={handleGuardar}
        cargando={cargando}
      >
        <FormularioDinamico
          catalogo={tabActiva}
          formData={formData}
          editandoId={editandoId}
          onChange={handleChange}
        />
      </ModalForm>
 
      {/* ── Toast de notificación ── */}
      {toast && (
        <Toast
          mensaje={toast.mensaje}
          tipo={toast.tipo}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
 
export default CatalogosPage;