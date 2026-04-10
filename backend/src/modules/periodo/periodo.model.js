const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const getAll = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT id_periodo, numero_periodo, anio, fecha_inicio, fecha_fin,
                    estado, fecha_cierre, creado_en
             FROM PERIODO_NOMINA
             ORDER BY fecha_inicio ASC`,
            [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

const getByMesAnio = async (mes, anio) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT id_periodo, numero_periodo, anio, fecha_inicio, fecha_fin,
                    estado, fecha_cierre, creado_en
             FROM PERIODO_NOMINA
             WHERE numero_periodo = :mes AND anio = :anio`,
            { mes, anio }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } finally { await conn.close(); }
};

const create = async (mes, anio) => {
    const conn = await getConnection();
    try {
        const fechaFin = new Date(anio, mes, 0);
        const strInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
        const strFin = `${anio}-${String(mes).padStart(2, '0')}-${String(fechaFin.getDate()).padStart(2, '0')}`;

        await conn.execute(
            `INSERT INTO PERIODO_NOMINA (numero_periodo, anio, fecha_inicio, fecha_fin, estado)
             VALUES (:mes, :anio, TO_DATE(:fi,'YYYY-MM-DD'), TO_DATE(:ff,'YYYY-MM-DD'), 'ABIERTO')`,
            { mes, anio, fi: strInicio, ff: strFin },
            { autoCommit: true }
        );
        return await getByMesAnio(mes, anio);
    } finally { await conn.close(); }
};

const cambiarEstado = async (id_periodo, estado) => {
    const conn = await getConnection();
    try {
        await conn.execute(
            `UPDATE PERIODO_NOMINA
             SET estado       = :estado,
                 fecha_cierre = CASE WHEN :estado2 = 'CERRADO' THEN SYSDATE ELSE NULL END
             WHERE id_periodo = :id`,
            { estado, estado2: estado, id: id_periodo },
            { autoCommit: true }
        );
        const result = await conn.execute(
            `SELECT id_periodo, numero_periodo, anio, fecha_inicio, fecha_fin,
                    estado, fecha_cierre
             FROM PERIODO_NOMINA WHERE id_periodo = :id`,
            { id: id_periodo }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0];
    } finally { await conn.close(); }
};

module.exports = { getAll, getByMesAnio, create, cambiarEstado };