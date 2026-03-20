-- =============================================================
-- 02_ddl_y_datos.sql
-- Ejecutar como: NOMINA_ADMIN (nube o local)
-- Descripcion: Crea todas las tablas, indices y datos de prueba
-- =============================================================


-- =============================================================
-- 01. TABLAS CATALOGO (8 tablas)
-- =============================================================

CREATE TABLE DEPARTAMENTOS (
    id_departamento     VARCHAR2(2)     NOT NULL,
    nombre_departamento VARCHAR2(100)   NOT NULL,
    descripcion         VARCHAR2(500),
    estado              VARCHAR2(10)    DEFAULT 'ACTIVO' NOT NULL,
    CONSTRAINT pk_departamentos     PRIMARY KEY (id_departamento),
    CONSTRAINT chk_dep_estado       CHECK (estado IN ('ACTIVO','INACTIVO'))
);

CREATE TABLE JORNADAS (
    id_jornada      VARCHAR2(2)     NOT NULL,
    nombre_jornada  VARCHAR2(50)    NOT NULL,
    descripcion     VARCHAR2(255),
    hora_inicio     VARCHAR2(8),
    hora_fin        VARCHAR2(8),
    horas_diarias   NUMBER(4,2)     NOT NULL,
    CONSTRAINT pk_jornadas          PRIMARY KEY (id_jornada)
);

CREATE TABLE PUESTOS (
    id_puesto       VARCHAR2(5)     NOT NULL,
    nombre_puesto   VARCHAR2(100)   NOT NULL,
    id_departamento VARCHAR2(2)     NOT NULL,
    descripcion     VARCHAR2(255),
    sueldo_base     NUMBER(10,2)    NOT NULL,
    CONSTRAINT pk_puestos           PRIMARY KEY (id_puesto),
    CONSTRAINT fk_puestos_dep       FOREIGN KEY (id_departamento)
                                    REFERENCES DEPARTAMENTOS (id_departamento)
);

CREATE TABLE PERCEPCIONES (
    id_percepcion       VARCHAR2(5)     NOT NULL,
    nombre_percepcion   VARCHAR2(100)   NOT NULL,
    descripcion_formula VARCHAR2(255),
    CONSTRAINT pk_percepciones      PRIMARY KEY (id_percepcion)
);

CREATE TABLE DEDUCCIONES (
    id_deduccion        VARCHAR2(5)     NOT NULL,
    nombre_deduccion    VARCHAR2(100)   NOT NULL,
    descripcion_formula VARCHAR2(255),
    CONSTRAINT pk_deducciones       PRIMARY KEY (id_deduccion)
);

CREATE TABLE FALTAS (
    id_falta    NUMBER          GENERATED ALWAYS AS IDENTITY NOT NULL,
    descripcion VARCHAR2(255)   NOT NULL,
    es_pagado   VARCHAR2(2)     DEFAULT 'N' NOT NULL,
    CONSTRAINT pk_faltas            PRIMARY KEY (id_falta),
    CONSTRAINT chk_falta_pagado     CHECK (es_pagado IN ('S','N'))
);

CREATE TABLE TIPO_USUARIO (
    id_tipo_usuario VARCHAR2(5)     NOT NULL,
    nombre          VARCHAR2(50)    NOT NULL,
    descripcion     VARCHAR2(255),
    estado          VARCHAR2(10)    DEFAULT 'ACTIVO' NOT NULL,
    CONSTRAINT pk_tipo_usuario      PRIMARY KEY (id_tipo_usuario),
    CONSTRAINT chk_tipusr_estado    CHECK (estado IN ('ACTIVO','INACTIVO'))
);

CREATE TABLE MOTIVO_BAJA (
    id_motivo_baja  VARCHAR2(5)     NOT NULL,
    descripcion     VARCHAR2(100)   NOT NULL,
    estado          VARCHAR2(10)    DEFAULT 'ACTIVO' NOT NULL,
    CONSTRAINT pk_motivo_baja       PRIMARY KEY (id_motivo_baja),
    CONSTRAINT chk_motbaj_estado    CHECK (estado IN ('ACTIVO','INACTIVO'))
);


-- =============================================================
-- 02. TABLAS MAESTRAS (2 tablas)
-- =============================================================

CREATE TABLE EMPLEADO (
    id_empleado              NUMBER         GENERATED ALWAYS AS IDENTITY NOT NULL,
    nombre                   VARCHAR2(80)   NOT NULL,
    fecha_nacimiento         DATE           NOT NULL,
    genero                   VARCHAR2(1)    NOT NULL,
    nacionalidad             VARCHAR2(50)   NOT NULL,
    no_afiliacion_igss       VARCHAR2(20)   NOT NULL,
    no_dpi_permiso           VARCHAR2(20)   NOT NULL,
    fecha_inicio             DATE           NOT NULL,
    fecha_fin                DATE,
    id_puesto                VARCHAR2(5)    NOT NULL,
    correo                   VARCHAR2(100),
    telefono                 VARCHAR2(15),
    cuenta_bancaria          VARCHAR2(30),
    estado                   VARCHAR2(15)   DEFAULT 'ACTIVO' NOT NULL,
    porcentaje_pago_comision NUMBER(5,2)    DEFAULT 0 NOT NULL,
    id_jornada               VARCHAR2(2)    NOT NULL,
    id_motivo_baja           VARCHAR2(5),
    CONSTRAINT pk_empleado          PRIMARY KEY (id_empleado),
    CONSTRAINT fk_emp_puesto        FOREIGN KEY (id_puesto)
                                    REFERENCES PUESTOS (id_puesto),
    CONSTRAINT fk_emp_jornada       FOREIGN KEY (id_jornada)
                                    REFERENCES JORNADAS (id_jornada),
    CONSTRAINT fk_emp_motivo_baja   FOREIGN KEY (id_motivo_baja)
                                    REFERENCES MOTIVO_BAJA (id_motivo_baja),
    CONSTRAINT chk_emp_genero       CHECK (genero IN ('M','F','O')),
    CONSTRAINT chk_emp_estado       CHECK (estado IN ('ACTIVO','INACTIVO','SUSPENDIDO')),
    CONSTRAINT uq_emp_dpi           UNIQUE (no_dpi_permiso),
    CONSTRAINT uq_emp_igss          UNIQUE (no_afiliacion_igss)
);

CREATE TABLE USUARIOS (
    id_usuario      NUMBER         GENERATED ALWAYS AS IDENTITY NOT NULL,
    id_tipo_usuario VARCHAR2(5)    NOT NULL,
    id_empleado     NUMBER         NOT NULL,
    username        VARCHAR2(50)   NOT NULL,
    password_hash   VARCHAR2(255)  NOT NULL,
    estado          VARCHAR2(10)   DEFAULT 'ACTIVO' NOT NULL,
    creado_en       TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT pk_usuarios          PRIMARY KEY (id_usuario),
    CONSTRAINT fk_usr_tipo          FOREIGN KEY (id_tipo_usuario)
                                    REFERENCES TIPO_USUARIO (id_tipo_usuario),
    CONSTRAINT fk_usr_empleado      FOREIGN KEY (id_empleado)
                                    REFERENCES EMPLEADO (id_empleado),
    CONSTRAINT chk_usr_estado       CHECK (estado IN ('ACTIVO','INACTIVO','BLOQUEADO')),
    CONSTRAINT uq_usr_username      UNIQUE (username),
    CONSTRAINT uq_usr_empleado      UNIQUE (id_empleado)
);


-- =============================================================
-- 03. TABLAS TRANSACCIONALES (6 tablas)
-- =============================================================

CREATE TABLE PERIODO_NOMINA (
    id_periodo      NUMBER         GENERATED ALWAYS AS IDENTITY NOT NULL,
    numero_periodo  NUMBER(2)      NOT NULL,
    anio            NUMBER(4)      NOT NULL,
    fecha_inicio    DATE           NOT NULL,
    fecha_fin       DATE           NOT NULL,
    estado          VARCHAR2(10)   DEFAULT 'ABIERTO' NOT NULL,
    fecha_cierre    DATE,
    creado_en       TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT pk_periodo_nomina    PRIMARY KEY (id_periodo),
    CONSTRAINT chk_per_numero       CHECK (numero_periodo BETWEEN 1 AND 12),
    CONSTRAINT chk_per_estado       CHECK (estado IN ('ABIERTO','CERRADO')),
    CONSTRAINT uq_periodo_anio      UNIQUE (numero_periodo, anio)
);

CREATE TABLE REGISTRO_HORAS_EXTRA (
    id_hora_extra   NUMBER         GENERATED ALWAYS AS IDENTITY NOT NULL,
    id_empleado     NUMBER         NOT NULL,
    id_jornada      VARCHAR2(2)    NOT NULL,
    id_usuario      NUMBER         NOT NULL,
    fecha           DATE           NOT NULL,
    cantidad        NUMBER(5,2)    NOT NULL,
    factor          NUMBER(3,1)    NOT NULL,
    justificacion   VARCHAR2(255),
    estado          VARCHAR2(15)   DEFAULT 'PENDIENTE' NOT NULL,
    creado_en       TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT pk_horas_extra       PRIMARY KEY (id_hora_extra),
    CONSTRAINT fk_rhe_empleado      FOREIGN KEY (id_empleado)
                                    REFERENCES EMPLEADO (id_empleado),
    CONSTRAINT fk_rhe_jornada       FOREIGN KEY (id_jornada)
                                    REFERENCES JORNADAS (id_jornada),
    CONSTRAINT fk_rhe_usuario       FOREIGN KEY (id_usuario)
                                    REFERENCES USUARIOS (id_usuario),
    CONSTRAINT chk_rhe_factor       CHECK (factor IN (1.5, 2.0)),
    CONSTRAINT chk_rhe_estado       CHECK (estado IN ('PENDIENTE','APROBADO','RECHAZADO'))
);

CREATE TABLE REGISTRO_FALTAS (
    id_registro_falta   NUMBER         GENERATED ALWAYS AS IDENTITY NOT NULL,
    id_empleado         NUMBER         NOT NULL,
    id_falta            NUMBER         NOT NULL,
    id_usuario          NUMBER         NOT NULL,
    fecha               DATE           NOT NULL,
    fecha_fin           DATE,
    justificacion       VARCHAR2(255),
    estado              VARCHAR2(15)   DEFAULT 'PENDIENTE' NOT NULL,
    creado_en           TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT pk_registro_faltas   PRIMARY KEY (id_registro_falta),
    CONSTRAINT fk_rfa_empleado      FOREIGN KEY (id_empleado)
                                    REFERENCES EMPLEADO (id_empleado),
    CONSTRAINT fk_rfa_falta         FOREIGN KEY (id_falta)
                                    REFERENCES FALTAS (id_falta),
    CONSTRAINT fk_rfa_usuario       FOREIGN KEY (id_usuario)
                                    REFERENCES USUARIOS (id_usuario),
    CONSTRAINT chk_rfa_estado       CHECK (estado IN ('PENDIENTE','JUSTIFICADO','APROBADO','RECHAZADO'))
);

CREATE TABLE HISTORICO_NOMINA (
    id_nomina           NUMBER         GENERATED ALWAYS AS IDENTITY NOT NULL,
    id_empleado         NUMBER         NOT NULL,
    id_periodo          NUMBER         NOT NULL,
    fecha_pago          DATE           NOT NULL,
    total_percepciones  NUMBER(10,2)   DEFAULT 0 NOT NULL,
    total_deducciones   NUMBER(10,2)   DEFAULT 0 NOT NULL,
    liquido_a_pagar     NUMBER(10,2)   DEFAULT 0 NOT NULL,
    estado              VARCHAR2(15)   DEFAULT 'PENDIENTE' NOT NULL,
    observacion         VARCHAR2(500),
    creado_en           TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT pk_historico_nomina  PRIMARY KEY (id_nomina),
    CONSTRAINT fk_hn_empleado       FOREIGN KEY (id_empleado)
                                    REFERENCES EMPLEADO (id_empleado),
    CONSTRAINT fk_hn_periodo        FOREIGN KEY (id_periodo)
                                    REFERENCES PERIODO_NOMINA (id_periodo),
    CONSTRAINT chk_hn_estado        CHECK (estado IN ('PENDIENTE','PROCESADO','PAGADO','ANULADO')),
    CONSTRAINT uq_hn_emp_periodo    UNIQUE (id_empleado, id_periodo)
);

CREATE TABLE HISTORICO_PERCEPCIONES_DETALLE (
    id_detalle_per  NUMBER         GENERATED ALWAYS AS IDENTITY NOT NULL,
    id_nomina       NUMBER         NOT NULL,
    id_percepcion   VARCHAR2(5)    NOT NULL,
    id_hora_extra   NUMBER,
    monto           NUMBER(10,2)   NOT NULL,
    creado_en       TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT pk_hpd               PRIMARY KEY (id_detalle_per),
    CONSTRAINT fk_hpd_nomina        FOREIGN KEY (id_nomina)
                                    REFERENCES HISTORICO_NOMINA (id_nomina),
    CONSTRAINT fk_hpd_percepcion    FOREIGN KEY (id_percepcion)
                                    REFERENCES PERCEPCIONES (id_percepcion),
    CONSTRAINT fk_hpd_hora_extra    FOREIGN KEY (id_hora_extra)
                                    REFERENCES REGISTRO_HORAS_EXTRA (id_hora_extra)
);

CREATE TABLE HISTORICO_DEDUCCIONES_DETALLE (
    id_detalle_ded      NUMBER         GENERATED ALWAYS AS IDENTITY NOT NULL,
    id_nomina           NUMBER         NOT NULL,
    id_deduccion        VARCHAR2(5)    NOT NULL,
    id_registro_falta   NUMBER,
    monto               NUMBER(10,2)   NOT NULL,
    creado_en           TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT pk_hdd               PRIMARY KEY (id_detalle_ded),
    CONSTRAINT fk_hdd_nomina        FOREIGN KEY (id_nomina)
                                    REFERENCES HISTORICO_NOMINA (id_nomina),
    CONSTRAINT fk_hdd_deduccion     FOREIGN KEY (id_deduccion)
                                    REFERENCES DEDUCCIONES (id_deduccion),
    CONSTRAINT fk_hdd_reg_falta     FOREIGN KEY (id_registro_falta)
                                    REFERENCES REGISTRO_FALTAS (id_registro_falta)
);


-- =============================================================
-- 04. INDICES
-- =============================================================

CREATE INDEX idx_emp_puesto         ON EMPLEADO (id_puesto);
CREATE INDEX idx_emp_jornada        ON EMPLEADO (id_jornada);
CREATE INDEX idx_emp_estado         ON EMPLEADO (estado);
CREATE INDEX idx_rhe_empleado       ON REGISTRO_HORAS_EXTRA (id_empleado);
CREATE INDEX idx_rhe_fecha          ON REGISTRO_HORAS_EXTRA (fecha);
CREATE INDEX idx_rhe_estado         ON REGISTRO_HORAS_EXTRA (estado);
CREATE INDEX idx_rfa_empleado       ON REGISTRO_FALTAS (id_empleado);
CREATE INDEX idx_rfa_fecha          ON REGISTRO_FALTAS (fecha);
CREATE INDEX idx_rfa_estado         ON REGISTRO_FALTAS (estado);
CREATE INDEX idx_hn_empleado        ON HISTORICO_NOMINA (id_empleado);
CREATE INDEX idx_hn_periodo         ON HISTORICO_NOMINA (id_periodo);
CREATE INDEX idx_hn_estado          ON HISTORICO_NOMINA (estado);
CREATE INDEX idx_hpd_nomina         ON HISTORICO_PERCEPCIONES_DETALLE (id_nomina);
CREATE INDEX idx_hpd_hora_extra     ON HISTORICO_PERCEPCIONES_DETALLE (id_hora_extra);
CREATE INDEX idx_hdd_nomina         ON HISTORICO_DEDUCCIONES_DETALLE (id_nomina);
CREATE INDEX idx_hdd_reg_falta      ON HISTORICO_DEDUCCIONES_DETALLE (id_registro_falta);


-- =============================================================
-- 05. DATOS DE PRUEBA
-- =============================================================

-- DEPARTAMENTOS
INSERT INTO DEPARTAMENTOS (id_departamento, nombre_departamento, descripcion, estado) VALUES ('01', 'Recursos Humanos', 'Gestión integral del personal', 'ACTIVO');
INSERT INTO DEPARTAMENTOS (id_departamento, nombre_departamento, descripcion, estado) VALUES ('02', 'Contabilidad', 'Cálculo y control de planilla salarial', 'ACTIVO');
INSERT INTO DEPARTAMENTOS (id_departamento, nombre_departamento, descripcion, estado) VALUES ('03', 'Ventas', 'Actividades comerciales y comisiones', 'ACTIVO');
INSERT INTO DEPARTAMENTOS (id_departamento, nombre_departamento, descripcion, estado) VALUES ('04', 'Operaciones', 'Supervisión de productividad y horas extra', 'ACTIVO');
INSERT INTO DEPARTAMENTOS (id_departamento, nombre_departamento, descripcion, estado) VALUES ('05', 'Gerencia General', 'Supervisión estratégica y toma de decisiones', 'ACTIVO');

-- JORNADAS
INSERT INTO JORNADAS (id_jornada, nombre_jornada, descripcion, hora_inicio, hora_fin, horas_diarias) VALUES ('J1', 'Matutina', 'Turno de mañana', '07:00', '15:00', 8);
INSERT INTO JORNADAS (id_jornada, nombre_jornada, descripcion, hora_inicio, hora_fin, horas_diarias) VALUES ('J2', 'Vespertina', 'Turno de tarde', '13:00', '21:00', 8);
INSERT INTO JORNADAS (id_jornada, nombre_jornada, descripcion, hora_inicio, hora_fin, horas_diarias) VALUES ('J3', 'Nocturna', 'Turno de noche', '21:00', '06:00', 8);
INSERT INTO JORNADAS (id_jornada, nombre_jornada, descripcion, hora_inicio, hora_fin, horas_diarias) VALUES ('J4', 'Mixta', 'Turno mixto', '14:00', '22:00', 7);

-- PUESTOS
INSERT INTO PUESTOS (id_puesto, nombre_puesto, id_departamento, descripcion, sueldo_base) VALUES ('RH01', 'Gerente de RRHH', '01', 'Responsable de la gestión del personal', 15000);
INSERT INTO PUESTOS (id_puesto, nombre_puesto, id_departamento, descripcion, sueldo_base) VALUES ('RH02', 'Analista de RRHH', '01', 'Apoya en contratación y expedientes', 8000);
INSERT INTO PUESTOS (id_puesto, nombre_puesto, id_departamento, descripcion, sueldo_base) VALUES ('FIN01', 'Gerente Financiero', '02', 'Supervisa las finanzas y contabilidad', 18000);
INSERT INTO PUESTOS (id_puesto, nombre_puesto, id_departamento, descripcion, sueldo_base) VALUES ('FIN02', 'Contador General', '02', 'Maneja planillas, impuestos y registros', 12000);
INSERT INTO PUESTOS (id_puesto, nombre_puesto, id_departamento, descripcion, sueldo_base) VALUES ('VEN01', 'Gerente de Ventas', '03', 'Responsable del equipo de ventas', 16000);
INSERT INTO PUESTOS (id_puesto, nombre_puesto, id_departamento, descripcion, sueldo_base) VALUES ('VEN02', 'Vendedor', '03', 'Realiza ventas y genera comisiones', 6000);
INSERT INTO PUESTOS (id_puesto, nombre_puesto, id_departamento, descripcion, sueldo_base) VALUES ('OP01', 'Gerente de Operaciones', '04', 'Supervisa productividad y procesos', 17000);
INSERT INTO PUESTOS (id_puesto, nombre_puesto, id_departamento, descripcion, sueldo_base) VALUES ('OP02', 'Supervisor Operativo', '04', 'Controla actividades del personal', 9000);
INSERT INTO PUESTOS (id_puesto, nombre_puesto, id_departamento, descripcion, sueldo_base) VALUES ('GG01', 'Gerente General', '05', 'Dirección general de la empresa', 25000);
INSERT INTO PUESTOS (id_puesto, nombre_puesto, id_departamento, descripcion, sueldo_base) VALUES ('GG02', 'Subgerente General', '05', 'Apoya en decisiones administrativas', 20000);

-- PERCEPCIONES
INSERT INTO PERCEPCIONES (id_percepcion, nombre_percepcion, descripcion_formula) VALUES ('PER01', 'Sueldo Base', 'Monto fijo mensual según contrato');
INSERT INTO PERCEPCIONES (id_percepcion, nombre_percepcion, descripcion_formula) VALUES ('PER02', 'Bonificación Incentivo', 'Q250 mensuales obligatorio por ley');
INSERT INTO PERCEPCIONES (id_percepcion, nombre_percepcion, descripcion_formula) VALUES ('PER03', 'Bono por Productividad', 'Monto fijo o porcentaje por metas cumplidas');
INSERT INTO PERCEPCIONES (id_percepcion, nombre_percepcion, descripcion_formula) VALUES ('PER04', 'Comisión', 'Porcentaje sobre ventas generadas');
INSERT INTO PERCEPCIONES (id_percepcion, nombre_percepcion, descripcion_formula) VALUES ('PER05', 'Horas Extra', 'Sueldo por hora x 1.5 o x 2.0 domingo/feriado');
INSERT INTO PERCEPCIONES (id_percepcion, nombre_percepcion, descripcion_formula) VALUES ('PER06', 'Aguinaldo', 'Un mes de salario pagado en diciembre');
INSERT INTO PERCEPCIONES (id_percepcion, nombre_percepcion, descripcion_formula) VALUES ('PER07', 'Bono 14', 'Un mes de salario pagado en julio');
INSERT INTO PERCEPCIONES (id_percepcion, nombre_percepcion, descripcion_formula) VALUES ('PER08', 'Vacaciones', 'Sueldo diario x días de vacaciones');
INSERT INTO PERCEPCIONES (id_percepcion, nombre_percepcion, descripcion_formula) VALUES ('PER09', 'Viáticos', 'Pago por gastos de viaje o representación');

-- DEDUCCIONES
INSERT INTO DEDUCCIONES (id_deduccion, nombre_deduccion, descripcion_formula) VALUES ('DED01', 'IGSS', '4.83% del salario ordinario');
INSERT INTO DEDUCCIONES (id_deduccion, nombre_deduccion, descripcion_formula) VALUES ('DED02', 'ISR', 'Retención de impuesto sobre la renta');
INSERT INTO DEDUCCIONES (id_deduccion, nombre_deduccion, descripcion_formula) VALUES ('DED03', 'Descuento Judicial', 'Retención ordenada por juez');
INSERT INTO DEDUCCIONES (id_deduccion, nombre_deduccion, descripcion_formula) VALUES ('DED04', 'Seguro Médico', 'Aporte voluntario de seguro privado');
INSERT INTO DEDUCCIONES (id_deduccion, nombre_deduccion, descripcion_formula) VALUES ('DED05', 'Parqueo', 'Cobro por uso de parqueo de la empresa');
INSERT INTO DEDUCCIONES (id_deduccion, nombre_deduccion, descripcion_formula) VALUES ('DED06', 'Préstamo Bantrab', 'Descuento por crédito del Banco de los Trabajadores');
INSERT INTO DEDUCCIONES (id_deduccion, nombre_deduccion, descripcion_formula) VALUES ('DED07', 'Descuento por Inasistencia', 'Descuento por día no laborado sin justificación');
INSERT INTO DEDUCCIONES (id_deduccion, nombre_deduccion, descripcion_formula) VALUES ('DED08', 'Séptimo', 'Pérdida del séptimo día por jornada incompleta');

-- FALTAS
INSERT INTO FALTAS (descripcion, es_pagado) VALUES ('Falta injustificada', 'N');
INSERT INTO FALTAS (descripcion, es_pagado) VALUES ('Falta justificada', 'S');
INSERT INTO FALTAS (descripcion, es_pagado) VALUES ('Llegada tarde', 'N');
INSERT INTO FALTAS (descripcion, es_pagado) VALUES ('Incapacidad IGSS', 'S');
INSERT INTO FALTAS (descripcion, es_pagado) VALUES ('Permiso con goce de sueldo', 'S');

-- MOTIVO_BAJA
INSERT INTO MOTIVO_BAJA (id_motivo_baja, descripcion, estado) VALUES ('MB001', 'Renuncia voluntaria', 'ACTIVO');
INSERT INTO MOTIVO_BAJA (id_motivo_baja, descripcion, estado) VALUES ('MB002', 'Despido', 'ACTIVO');
INSERT INTO MOTIVO_BAJA (id_motivo_baja, descripcion, estado) VALUES ('MB003', 'Fin de contrato', 'ACTIVO');
INSERT INTO MOTIVO_BAJA (id_motivo_baja, descripcion, estado) VALUES ('MB004', 'Jubilación', 'ACTIVO');
INSERT INTO MOTIVO_BAJA (id_motivo_baja, descripcion, estado) VALUES ('MB005', 'Fallecimiento', 'ACTIVO');

-- TIPO_USUARIO
INSERT INTO TIPO_USUARIO (id_tipo_usuario, nombre, descripcion, estado) VALUES ('ADM', 'Administrador', 'Acceso total al sistema', 'ACTIVO');
INSERT INTO TIPO_USUARIO (id_tipo_usuario, nombre, descripcion, estado) VALUES ('RH', 'Recursos Humanos', 'Gestión de personal', 'ACTIVO');
INSERT INTO TIPO_USUARIO (id_tipo_usuario, nombre, descripcion, estado) VALUES ('CON', 'Contador', 'Acceso a nómina', 'ACTIVO');
INSERT INTO TIPO_USUARIO (id_tipo_usuario, nombre, descripcion, estado) VALUES ('VEN', 'Ventas', 'Acceso a módulo de ventas', 'ACTIVO');

-- EMPLEADO
INSERT INTO EMPLEADO (nombre, fecha_nacimiento, genero, nacionalidad, no_afiliacion_igss, no_dpi_permiso, fecha_inicio, id_puesto, id_jornada, correo, telefono, estado) VALUES ('Gerardo Ramirez', DATE '1999-05-15', 'M', 'Guatemalteca', 'IGSS-0001', 'DPI-0001', DATE '2024-01-01', 'GG01', 'J1', 'gerardo@nomina.gt', '50212345678', 'ACTIVO');
INSERT INTO EMPLEADO (nombre, fecha_nacimiento, genero, nacionalidad, no_afiliacion_igss, no_dpi_permiso, fecha_inicio, id_puesto, id_jornada, correo, telefono, estado) VALUES ('Ana López', DATE '1995-08-20', 'F', 'Guatemalteca', 'IGSS-0002', 'DPI-0002', DATE '2024-01-01', 'RH01', 'J1', 'ana@nomina.gt', '50287654321', 'ACTIVO');
INSERT INTO EMPLEADO (nombre, fecha_nacimiento, genero, nacionalidad, no_afiliacion_igss, no_dpi_permiso, fecha_inicio, id_puesto, id_jornada, correo, telefono, estado) VALUES ('Carlos Méndez', DATE '1990-03-10', 'M', 'Guatemalteca', 'IGSS-0003', 'DPI-0003', DATE '2024-01-01', 'FIN02', 'J2', 'carlos@nomina.gt', '50211112222', 'ACTIVO');
INSERT INTO EMPLEADO (nombre, fecha_nacimiento, genero, nacionalidad, no_afiliacion_igss, no_dpi_permiso, fecha_inicio, id_puesto, id_jornada, correo, telefono, estado) VALUES ('María García', DATE '1992-11-05', 'F', 'Guatemalteca', 'IGSS-0004', 'DPI-0004', DATE '2024-02-01', 'VEN02', 'J1', 'maria@nomina.gt', '50233334444', 'ACTIVO');
INSERT INTO EMPLEADO (nombre, fecha_nacimiento, genero, nacionalidad, no_afiliacion_igss, no_dpi_permiso, fecha_inicio, id_puesto, id_jornada, correo, telefono, estado) VALUES ('Pedro Ruiz', DATE '1988-07-22', 'M', 'Guatemalteca', 'IGSS-0005', 'DPI-0005', DATE '2023-06-01', 'OP02', 'J3', 'pedro@nomina.gt', '50255556666', 'ACTIVO');

COMMIT;
