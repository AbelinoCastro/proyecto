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
INSERT INTO DEPARTAMENTOS (ID_DEPARTAMENTO, NOMBRE_DEPARTAMENTO, DESCRIPCION, ESTADO) VALUES ('01', 'Recursos Humanos', 'Gestión integral del personal', 'ACTIVO');
INSERT INTO DEPARTAMENTOS (ID_DEPARTAMENTO, NOMBRE_DEPARTAMENTO, DESCRIPCION, ESTADO) VALUES ('02', 'Contabilidad', 'Cálculo y control de planilla salarial', 'ACTIVO');
INSERT INTO DEPARTAMENTOS (ID_DEPARTAMENTO, NOMBRE_DEPARTAMENTO, DESCRIPCION, ESTADO) VALUES ('03', 'Ventas', 'Actividades comerciales y comisiones', 'ACTIVO');
INSERT INTO DEPARTAMENTOS (ID_DEPARTAMENTO, NOMBRE_DEPARTAMENTO, DESCRIPCION, ESTADO) VALUES ('04', 'Operaciones', 'Supervisión de productividad y horas extra', 'ACTIVO');
INSERT INTO DEPARTAMENTOS (ID_DEPARTAMENTO, NOMBRE_DEPARTAMENTO, DESCRIPCION, ESTADO) VALUES ('05', 'Gerencia General', 'Supervisión estratégica y toma de decisiones', 'ACTIVO');

-- JORNADAS
INSERT INTO JORNADAS (ID_JORNADA, NOMBRE_JORNADA, DESCRIPCION, HORA_INICIO, HORA_FIN, HORAS_DIARIAS) VALUES ('J1', 'Matutina', 'Turno de mañana', '07:00', '15:00', 8);
INSERT INTO JORNADAS (ID_JORNADA, NOMBRE_JORNADA, DESCRIPCION, HORA_INICIO, HORA_FIN, HORAS_DIARIAS) VALUES ('J2', 'Vespertina', 'Turno de tarde', '13:00', '21:00', 8);
INSERT INTO JORNADAS (ID_JORNADA, NOMBRE_JORNADA, DESCRIPCION, HORA_INICIO, HORA_FIN, HORAS_DIARIAS) VALUES ('J3', 'Nocturna', 'Turno de noche', '21:00', '06:00', 8);
INSERT INTO JORNADAS (ID_JORNADA, NOMBRE_JORNADA, DESCRIPCION, HORA_INICIO, HORA_FIN, HORAS_DIARIAS) VALUES ('J4', 'Mixta', 'Turno mixto', '14:00', '22:00', 7);

-- PUESTOS
INSERT INTO PUESTOS (ID_PUESTO, NOMBRE_PUESTO, ID_DEPARTAMENTO, DESCRIPCION, SUELDO_BASE) VALUES ('FIN01', 'Gerente Financiero', '02', 'Supervisa las finanzas y contabilidad', 18000);
INSERT INTO PUESTOS (ID_PUESTO, NOMBRE_PUESTO, ID_DEPARTAMENTO, DESCRIPCION, SUELDO_BASE) VALUES ('FIN02', 'Contador General', '02', 'Maneja planillas, impuestos y registros', 12000);
INSERT INTO PUESTOS (ID_PUESTO, NOMBRE_PUESTO, ID_DEPARTAMENTO, DESCRIPCION, SUELDO_BASE) VALUES ('GG01', 'Gerente General', '05', 'Dirección general de la empresa', 25000);
INSERT INTO PUESTOS (ID_PUESTO, NOMBRE_PUESTO, ID_DEPARTAMENTO, DESCRIPCION, SUELDO_BASE) VALUES ('GG02', 'Subgerente General', '05', 'Apoya en decisiones administrativas', 20000);
INSERT INTO PUESTOS (ID_PUESTO, NOMBRE_PUESTO, ID_DEPARTAMENTO, DESCRIPCION, SUELDO_BASE) VALUES ('OP01', 'Gerente de Operaciones', '04', 'Supervisa productividad y procesos', 17000);
INSERT INTO PUESTOS (ID_PUESTO, NOMBRE_PUESTO, ID_DEPARTAMENTO, DESCRIPCION, SUELDO_BASE) VALUES ('OP02', 'Supervisor Operativo', '04', 'Controla actividades del personal', 9000);
INSERT INTO PUESTOS (ID_PUESTO, NOMBRE_PUESTO, ID_DEPARTAMENTO, DESCRIPCION, SUELDO_BASE) VALUES ('RH01', 'Gerente de RRHH', '01', 'Responsable de la gestión del personal', 15000);
INSERT INTO PUESTOS (ID_PUESTO, NOMBRE_PUESTO, ID_DEPARTAMENTO, DESCRIPCION, SUELDO_BASE) VALUES ('RH02', 'Analista de RRHH', '01', 'Apoya en contratación y expedientes', 8000);
INSERT INTO PUESTOS (ID_PUESTO, NOMBRE_PUESTO, ID_DEPARTAMENTO, DESCRIPCION, SUELDO_BASE) VALUES ('VEN01', 'Gerente de Ventas', '03', 'Responsable del equipo de ventas', 16000);
INSERT INTO PUESTOS (ID_PUESTO, NOMBRE_PUESTO, ID_DEPARTAMENTO, DESCRIPCION, SUELDO_BASE) VALUES ('VEN02', 'Vendedor', '03', 'Realiza ventas y genera comisiones', 6000);

-- PERCEPCIONES
INSERT INTO PERCEPCIONES (ID_PERCEPCION, NOMBRE_PERCEPCION, DESCRIPCION_FORMULA) VALUES ('PER01', 'Sueldo Base', 'Monto fijo mensual según contrato');
INSERT INTO PERCEPCIONES (ID_PERCEPCION, NOMBRE_PERCEPCION, DESCRIPCION_FORMULA) VALUES ('PER02', 'Bonificación Incentivo', 'Q250 mensuales obligatorio por ley');
INSERT INTO PERCEPCIONES (ID_PERCEPCION, NOMBRE_PERCEPCION, DESCRIPCION_FORMULA) VALUES ('PER03', 'Bono por Productividad', 'Monto fijo o porcentaje por metas cumplidas');
INSERT INTO PERCEPCIONES (ID_PERCEPCION, NOMBRE_PERCEPCION, DESCRIPCION_FORMULA) VALUES ('PER04', 'Comisión', 'Porcentaje sobre ventas generadas');
INSERT INTO PERCEPCIONES (ID_PERCEPCION, NOMBRE_PERCEPCION, DESCRIPCION_FORMULA) VALUES ('PER05', 'Horas Extra', 'Sueldo por hora x 1.5 o x 2.0 domingo/feriado');
INSERT INTO PERCEPCIONES (ID_PERCEPCION, NOMBRE_PERCEPCION, DESCRIPCION_FORMULA) VALUES ('PER06', 'Aguinaldo', 'Un mes de salario pagado en diciembre');
INSERT INTO PERCEPCIONES (ID_PERCEPCION, NOMBRE_PERCEPCION, DESCRIPCION_FORMULA) VALUES ('PER07', 'Bono 14', 'Un mes de salario pagado en julio');
INSERT INTO PERCEPCIONES (ID_PERCEPCION, NOMBRE_PERCEPCION, DESCRIPCION_FORMULA) VALUES ('PER08', 'Vacaciones', 'Sueldo diario x días de vacaciones');
INSERT INTO PERCEPCIONES (ID_PERCEPCION, NOMBRE_PERCEPCION, DESCRIPCION_FORMULA) VALUES ('PER09', 'Viáticos', 'Pago por gastos de viaje o representación');

-- DEDUCCIONES
INSERT INTO DEDUCCIONES (ID_DEDUCCION, NOMBRE_DEDUCCION, DESCRIPCION_FORMULA) VALUES ('DED01', 'IGSS', '4.83% del salario ordinario');
INSERT INTO DEDUCCIONES (ID_DEDUCCION, NOMBRE_DEDUCCION, DESCRIPCION_FORMULA) VALUES ('DED02', 'ISR', 'Retención de impuesto sobre la renta');
INSERT INTO DEDUCCIONES (ID_DEDUCCION, NOMBRE_DEDUCCION, DESCRIPCION_FORMULA) VALUES ('DED03', 'Descuento Judicial', 'Retención ordenada por juez');
INSERT INTO DEDUCCIONES (ID_DEDUCCION, NOMBRE_DEDUCCION, DESCRIPCION_FORMULA) VALUES ('DED04', 'Seguro Médico', 'Aporte voluntario de seguro privado');
INSERT INTO DEDUCCIONES (ID_DEDUCCION, NOMBRE_DEDUCCION, DESCRIPCION_FORMULA) VALUES ('DED05', 'Parqueo', 'Cobro por uso de parqueo de la empresa');
INSERT INTO DEDUCCIONES (ID_DEDUCCION, NOMBRE_DEDUCCION, DESCRIPCION_FORMULA) VALUES ('DED06', 'Préstamo Bantrab', 'Descuento por crédito del Banco de los Trabajadores');
INSERT INTO DEDUCCIONES (ID_DEDUCCION, NOMBRE_DEDUCCION, DESCRIPCION_FORMULA) VALUES ('DED07', 'Descuento por Inasistencia', 'Descuento por día no laborado sin justificación');
INSERT INTO DEDUCCIONES (ID_DEDUCCION, NOMBRE_DEDUCCION, DESCRIPCION_FORMULA) VALUES ('DED08', 'Séptimo', 'Pérdida del séptimo día por jornada incompleta');

-- FALTAS
INSERT INTO FALTAS (DESCRIPCION, ES_PAGADO) VALUES ('Falta injustificada', 'N');
INSERT INTO FALTAS (DESCRIPCION, ES_PAGADO) VALUES ('Falta justificada', 'S');
INSERT INTO FALTAS (DESCRIPCION, ES_PAGADO) VALUES ('Llegada tarde', 'N');
INSERT INTO FALTAS (DESCRIPCION, ES_PAGADO) VALUES ('Incapacidad IGSS', 'S');
INSERT INTO FALTAS (DESCRIPCION, ES_PAGADO) VALUES ('Permiso con goce de sueldo', 'S');

-- MOTIVO_BAJA
INSERT INTO MOTIVO_BAJA (ID_MOTIVO_BAJA, DESCRIPCION, ESTADO) VALUES ('MB001', 'Renuncia voluntaria', 'ACTIVO');
INSERT INTO MOTIVO_BAJA (ID_MOTIVO_BAJA, DESCRIPCION, ESTADO) VALUES ('MB002', 'Despido', 'ACTIVO');
INSERT INTO MOTIVO_BAJA (ID_MOTIVO_BAJA, DESCRIPCION, ESTADO) VALUES ('MB003', 'Fin de contrato', 'ACTIVO');
INSERT INTO MOTIVO_BAJA (ID_MOTIVO_BAJA, DESCRIPCION, ESTADO) VALUES ('MB004', 'Jubilación', 'ACTIVO');
INSERT INTO MOTIVO_BAJA (ID_MOTIVO_BAJA, DESCRIPCION, ESTADO) VALUES ('MB005', 'Fallecimiento', 'ACTIVO');

-- TIPO_USUARIO
INSERT INTO TIPO_USUARIO (ID_TIPO_USUARIO, NOMBRE, DESCRIPCION, ESTADO) VALUES ('ADM', 'Administrador', 'Acceso total al sistema', 'ACTIVO');
INSERT INTO TIPO_USUARIO (ID_TIPO_USUARIO, NOMBRE, DESCRIPCION, ESTADO) VALUES ('CON', 'Contador', 'Acceso a nómina', 'ACTIVO');
INSERT INTO TIPO_USUARIO (ID_TIPO_USUARIO, NOMBRE, DESCRIPCION, ESTADO) VALUES ('ING', 'soporte', 'soporte TI', 'ACTIVO');
INSERT INTO TIPO_USUARIO (ID_TIPO_USUARIO, NOMBRE, DESCRIPCION, ESTADO) VALUES ('RH', 'Recursos Humanos', 'Gestión de personal', 'ACTIVO');
INSERT INTO TIPO_USUARIO (ID_TIPO_USUARIO, NOMBRE, DESCRIPCION, ESTADO) VALUES ('VEN', 'Ventas', 'Acceso a módulo de ventas', 'ACTIVO');

-- EMPLEADO
INSERT INTO EMPLEADO (NOMBRE, FECHA_NACIMIENTO, GENERO, NACIONALIDAD, NO_AFILIACION_IGSS, NO_DPI_PERMISO, FECHA_INICIO, FECHA_FIN, ID_PUESTO, ID_JORNADA, CORREO, TELEFONO, CUENTA_BANCARIA, ESTADO, PORCENTAJE_PAGO_COMISION, ID_MOTIVO_BAJA) VALUES ('Gerardo Ramirez', DATE '1999-05-15', 'M', 'Guatemalteca', 'IGSS-0001', 'DPI-0001', DATE '2024-01-01', DATE '2026-03-21', 'GG01', 'J1', 'gerardo@nomina.gt', '50212345678', NULL, 'ACTIVO', 0, 'MB001');
INSERT INTO EMPLEADO (NOMBRE, FECHA_NACIMIENTO, GENERO, NACIONALIDAD, NO_AFILIACION_IGSS, NO_DPI_PERMISO, FECHA_INICIO, FECHA_FIN, ID_PUESTO, ID_JORNADA, CORREO, TELEFONO, CUENTA_BANCARIA, ESTADO, PORCENTAJE_PAGO_COMISION, ID_MOTIVO_BAJA) VALUES ('Ana López', DATE '1995-08-20', 'F', 'Guatemalteca', 'IGSS-0002', 'DPI-0002', DATE '2024-01-01', DATE '2026-03-19', 'RH01', 'J1', 'ana@nomina.gt', '50287654321', NULL, 'ACTIVO', 0, 'MB002');
INSERT INTO EMPLEADO (NOMBRE, FECHA_NACIMIENTO, GENERO, NACIONALIDAD, NO_AFILIACION_IGSS, NO_DPI_PERMISO, FECHA_INICIO, FECHA_FIN, ID_PUESTO, ID_JORNADA, CORREO, TELEFONO, CUENTA_BANCARIA, ESTADO, PORCENTAJE_PAGO_COMISION, ID_MOTIVO_BAJA) VALUES ('Carlos Méndez', DATE '1990-03-10', 'M', 'Guatemalteca', 'IGSS-0003', 'DPI-0003', DATE '2024-01-01', NULL, 'FIN02', 'J2', 'carlos@nomina.gt', '50211112222', NULL, 'ACTIVO', 0, NULL);
INSERT INTO EMPLEADO (NOMBRE, FECHA_NACIMIENTO, GENERO, NACIONALIDAD, NO_AFILIACION_IGSS, NO_DPI_PERMISO, FECHA_INICIO, FECHA_FIN, ID_PUESTO, ID_JORNADA, CORREO, TELEFONO, CUENTA_BANCARIA, ESTADO, PORCENTAJE_PAGO_COMISION, ID_MOTIVO_BAJA) VALUES ('María García', DATE '1992-11-05', 'F', 'Guatemalteca', 'IGSS-0004', 'DPI-0004', DATE '2024-02-01', NULL, 'VEN02', 'J1', 'maria@nomina.gt', '50233334444', NULL, 'ACTIVO', 0, NULL);
INSERT INTO EMPLEADO (NOMBRE, FECHA_NACIMIENTO, GENERO, NACIONALIDAD, NO_AFILIACION_IGSS, NO_DPI_PERMISO, FECHA_INICIO, FECHA_FIN, ID_PUESTO, ID_JORNADA, CORREO, TELEFONO, CUENTA_BANCARIA, ESTADO, PORCENTAJE_PAGO_COMISION, ID_MOTIVO_BAJA) VALUES ('juanin guerra', DATE '1997-05-30', 'M', 'Guatemalteca', '2996179200101', '2996179200101', DATE '2026-03-21', NULL, 'FIN01', 'J1', NULL, NULL, NULL, 'ACTIVO', 0, NULL);

-- USUARIOS
INSERT INTO USUARIOS (ID_TIPO_USUARIO, ID_EMPLEADO, USERNAME, PASSWORD_HASH, ESTADO) VALUES ('VEN', 1, 'admin', '$2b$10$dast3Ir/u/hpUSYhAVrP7eAwOjJAIcoi6zLiAd3ZC3H/XtsWKWrNq', 'ACTIVO');
INSERT INTO USUARIOS (ID_TIPO_USUARIO, ID_EMPLEADO, USERNAME, PASSWORD_HASH, ESTADO) VALUES ('CON', 2, 'prb', '$2b$10$mtLZk8SLvWYZ3.J88uVXguGZgK3ZogjGLMHewGOAABhYS9b3.FG4S', 'ACTIVO');
INSERT INTO USUARIOS (ID_TIPO_USUARIO, ID_EMPLEADO, USERNAME, PASSWORD_HASH, ESTADO) VALUES ('VEN', 3, 'mainin', '$2b$10$.RIy.7jtIuAUE9XfgqA2BertMa4kay2IfT8FwIL140o4DfeXz1SxS', 'ACTIVO');

-- PERIODO_NOMINA
INSERT INTO PERIODO_NOMINA (NUMERO_PERIODO, ANIO, FECHA_INICIO, FECHA_FIN, ESTADO, FECHA_CIERRE) VALUES (3, 2026, DATE '2026-03-01', DATE '2026-03-31', 'CERRADO', DATE '2026-04-10');
INSERT INTO PERIODO_NOMINA (NUMERO_PERIODO, ANIO, FECHA_INICIO, FECHA_FIN, ESTADO, FECHA_CIERRE) VALUES (4, 2026, DATE '2026-04-01', DATE '2026-04-30', 'ABIERTO', NULL);
INSERT INTO PERIODO_NOMINA (NUMERO_PERIODO, ANIO, FECHA_INICIO, FECHA_FIN, ESTADO, FECHA_CIERRE) VALUES (1, 2026, DATE '2026-01-01', DATE '2026-01-31', 'CERRADO', DATE '2026-01-31');
INSERT INTO PERIODO_NOMINA (NUMERO_PERIODO, ANIO, FECHA_INICIO, FECHA_FIN, ESTADO, FECHA_CIERRE) VALUES (2, 2026, DATE '2026-02-01', DATE '2026-02-28', 'CERRADO', DATE '2026-02-28');

-- REGISTRO_HORAS_EXTRA
INSERT INTO REGISTRO_HORAS_EXTRA (ID_EMPLEADO, ID_JORNADA, ID_USUARIO, FECHA, CANTIDAD, FACTOR, JUSTIFICACION, ESTADO) VALUES (1, 'J1', 1, DATE '2026-03-05', 3, 1.5, 'Cierre de informe mensual', 'APROBADO');
INSERT INTO REGISTRO_HORAS_EXTRA (ID_EMPLEADO, ID_JORNADA, ID_USUARIO, FECHA, CANTIDAD, FACTOR, JUSTIFICACION, ESTADO) VALUES (1, 'J1', 1, DATE '2026-03-16', 2, 2, 'Trabajo en domingo por urgencia', 'APROBADO');
INSERT INTO REGISTRO_HORAS_EXTRA (ID_EMPLEADO, ID_JORNADA, ID_USUARIO, FECHA, CANTIDAD, FACTOR, JUSTIFICACION, ESTADO) VALUES (1, 'J1', 1, DATE '2026-03-22', 1.5, 1.5, 'Pendiente de revision', 'PENDIENTE');
INSERT INTO REGISTRO_HORAS_EXTRA (ID_EMPLEADO, ID_JORNADA, ID_USUARIO, FECHA, CANTIDAD, FACTOR, JUSTIFICACION, ESTADO) VALUES (2, 'J1', 21, DATE '2026-03-10', 4, 1.5, 'Reclutamiento urgente', 'APROBADO');
INSERT INTO REGISTRO_HORAS_EXTRA (ID_EMPLEADO, ID_JORNADA, ID_USUARIO, FECHA, CANTIDAD, FACTOR, JUSTIFICACION, ESTADO) VALUES (2, 'J1', 21, DATE '2026-03-20', 2, 1.5, 'Sin justificacion suficiente', 'RECHAZADO');
INSERT INTO REGISTRO_HORAS_EXTRA (ID_EMPLEADO, ID_JORNADA, ID_USUARIO, FECHA, CANTIDAD, FACTOR, JUSTIFICACION, ESTADO) VALUES (3, 'J2', 23, DATE '2026-03-08', 3, 1.5, 'Cierre contable', 'APROBADO');
INSERT INTO REGISTRO_HORAS_EXTRA (ID_EMPLEADO, ID_JORNADA, ID_USUARIO, FECHA, CANTIDAD, FACTOR, JUSTIFICACION, ESTADO) VALUES (3, 'J2', 23, DATE '2026-03-23', 2.5, 2, 'Domingo de auditoria', 'APROBADO');
INSERT INTO REGISTRO_HORAS_EXTRA (ID_EMPLEADO, ID_JORNADA, ID_USUARIO, FECHA, CANTIDAD, FACTOR, JUSTIFICACION, ESTADO) VALUES (4, 'J1', 1, DATE '2026-03-14', 2, 1.5, 'Cierre de ventas del mes', 'APROBADO');
INSERT INTO REGISTRO_HORAS_EXTRA (ID_EMPLEADO, ID_JORNADA, ID_USUARIO, FECHA, CANTIDAD, FACTOR, JUSTIFICACION, ESTADO) VALUES (21, 'J1', 1, DATE '2026-03-18', 3, 1.5, 'Apoyo en area financiera', 'APROBADO');
INSERT INTO REGISTRO_HORAS_EXTRA (ID_EMPLEADO, ID_JORNADA, ID_USUARIO, FECHA, CANTIDAD, FACTOR, JUSTIFICACION, ESTADO) VALUES (21, 'J1', 1, DATE '2026-03-25', 2, 2, 'Pendiente aprobacion', 'PENDIENTE');

-- REGISTRO_FALTAS
INSERT INTO REGISTRO_FALTAS (ID_EMPLEADO, ID_FALTA, ID_USUARIO, FECHA, FECHA_FIN, JUSTIFICACION, ESTADO) VALUES (1, 2, 1, DATE '2026-03-12', NULL, 'Cita medica con comprobante', 'APROBADO');
INSERT INTO REGISTRO_FALTAS (ID_EMPLEADO, ID_FALTA, ID_USUARIO, FECHA, FECHA_FIN, JUSTIFICACION, ESTADO) VALUES (2, 1, 21, DATE '2026-03-07', NULL, 'Sin aviso previo', 'APROBADO');
INSERT INTO REGISTRO_FALTAS (ID_EMPLEADO, ID_FALTA, ID_USUARIO, FECHA, FECHA_FIN, JUSTIFICACION, ESTADO) VALUES (2, 3, 21, DATE '2026-03-19', NULL, 'Llego 45 minutos tarde', 'PENDIENTE');
INSERT INTO REGISTRO_FALTAS (ID_EMPLEADO, ID_FALTA, ID_USUARIO, FECHA, FECHA_FIN, JUSTIFICACION, ESTADO) VALUES (3, 4, 23, DATE '2026-03-03', DATE '2026-03-04', 'Incapacidad IGSS presentada', 'APROBADO');
INSERT INTO REGISTRO_FALTAS (ID_EMPLEADO, ID_FALTA, ID_USUARIO, FECHA, FECHA_FIN, JUSTIFICACION, ESTADO) VALUES (4, 1, 1, DATE '2026-03-11', NULL, 'Ausencia sin justificacion', 'APROBADO');
INSERT INTO REGISTRO_FALTAS (ID_EMPLEADO, ID_FALTA, ID_USUARIO, FECHA, FECHA_FIN, JUSTIFICACION, ESTADO) VALUES (4, 5, 1, DATE '2026-03-25', NULL, 'Permiso por diligencia personal', 'APROBADO');
INSERT INTO REGISTRO_FALTAS (ID_EMPLEADO, ID_FALTA, ID_USUARIO, FECHA, FECHA_FIN, JUSTIFICACION, ESTADO) VALUES (21, 1, 1, DATE '2026-03-06', NULL, 'No se presento sin aviso', 'APROBADO');
INSERT INTO REGISTRO_FALTAS (ID_EMPLEADO, ID_FALTA, ID_USUARIO, FECHA, FECHA_FIN, JUSTIFICACION, ESTADO) VALUES (21, 3, 1, DATE '2026-03-20', NULL, 'Llegada tarde sin justificacion', 'APROBADO');

-- HISTORICO_NOMINA
INSERT INTO HISTORICO_NOMINA (ID_EMPLEADO, ID_PERIODO, FECHA_PAGO, TOTAL_PERCEPCIONES, TOTAL_DEDUCCIONES, LIQUIDO_A_PAGAR, ESTADO, OBSERVACION) VALUES (21, 23, DATE '2026-04-08', 18337.5, 1200, 17137.5, 'PAGADO', 'Nómina Marzo 2026');
INSERT INTO HISTORICO_NOMINA (ID_EMPLEADO, ID_PERIODO, FECHA_PAGO, TOTAL_PERCEPCIONES, TOTAL_DEDUCCIONES, LIQUIDO_A_PAGAR, ESTADO, OBSERVACION) VALUES (1, 23, DATE '2026-04-09', 25885.42, 0, 25885.42, 'PAGADO', 'Nómina Marzo 2026');

-- HISTORICO_PERCEPCIONES_DETALLE
INSERT INTO HISTORICO_PERCEPCIONES_DETALLE (ID_NOMINA, ID_PERCEPCION, ID_HORA_EXTRA, MONTO) VALUES (25, 'PER01', NULL, 18000);
INSERT INTO HISTORICO_PERCEPCIONES_DETALLE (ID_NOMINA, ID_PERCEPCION, ID_HORA_EXTRA, MONTO) VALUES (25, 'PER05', 25, 337.5);
INSERT INTO HISTORICO_PERCEPCIONES_DETALLE (ID_NOMINA, ID_PERCEPCION, ID_HORA_EXTRA, MONTO) VALUES (26, 'PER01', NULL, 25000);
INSERT INTO HISTORICO_PERCEPCIONES_DETALLE (ID_NOMINA, ID_PERCEPCION, ID_HORA_EXTRA, MONTO) VALUES (26, 'PER05', 17, 468.75);
INSERT INTO HISTORICO_PERCEPCIONES_DETALLE (ID_NOMINA, ID_PERCEPCION, ID_HORA_EXTRA, MONTO) VALUES (26, 'PER05', 18, 416.67);

-- HISTORICO_DEDUCCIONES_DETALLE
INSERT INTO HISTORICO_DEDUCCIONES_DETALLE (ID_NOMINA, ID_DEDUCCION, ID_REGISTRO_FALTA, MONTO) VALUES (25, 'DED07', 8, 600);
INSERT INTO HISTORICO_DEDUCCIONES_DETALLE (ID_NOMINA, ID_DEDUCCION, ID_REGISTRO_FALTA, MONTO) VALUES (25, 'DED07', 9, 600);

COMMIT;
