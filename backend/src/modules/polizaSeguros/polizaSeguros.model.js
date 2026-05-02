const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');

const getAll = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT ps.id_poliza, ps.id_empleado, e.nombre AS nombre_empleado,
                    ps.fecha_inicio_plan, ps.fecha_renovacion, ps.plan,
                    ps.monto_prima, ps.nombre_seguradora, ps.nit_seguradora,
                    ps.direccion_aseguradora, ps.cuenta_bancaria
             FROM POLIZA_SEGUROS ps
             JOIN EMPLEADO e ON e.id_empleado = ps.id_empleado
             ORDER BY ps.id_poliza DESC`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

const getById = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT ps.id_poliza, ps.id_empleado, e.nombre AS nombre_empleado,
                    ps.fecha_inicio_plan, ps.fecha_renovacion, ps.plan,
                    ps.monto_prima, ps.nombre_seguradora, ps.nit_seguradora,
                    ps.direccion_aseguradora, ps.cuenta_bancaria
             FROM POLIZA_SEGUROS ps
             JOIN EMPLEADO e ON e.id_empleado = ps.id_empleado
             WHERE ps.id_poliza = :id`,
            { id: Number(id) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } finally { await conn.close(); }
};

const create = async ({ id_empleado, fecha_inicio_plan, fecha_renovacion, plan, monto_prima, nombre_seguradora, nit_seguradora, direccion_aseguradora, cuenta_bancaria }) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `INSERT INTO POLIZA_SEGUROS
                (id_empleado, fecha_inicio_plan, fecha_renovacion, plan, monto_prima, nombre_seguradora, nit_seguradora, direccion_aseguradora, cuenta_bancaria)
             VALUES (:id_empleado, TO_DATE(:fini,'YYYY-MM-DD'), TO_DATE(:fren,'YYYY-MM-DD'),
                     :plan, :monto_prima, :nombre_seguradora, :nit_seguradora, :direccion_aseguradora, :cuenta_bancaria)
             RETURNING id_poliza INTO :id_poliza`,
            {
                id_empleado:          Number(id_empleado),
                fini:                 fecha_inicio_plan,
                fren:                 fecha_renovacion,
                plan,
                monto_prima:          Number(monto_prima),
                nombre_seguradora,
                nit_seguradora,
                direccion_aseguradora,
                cuenta_bancaria,
                id_poliza: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            { autoCommit: true }
        );
        return result.outBinds.id_poliza[0];
    } finally { await conn.close(); }
};

const remove = async (id) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `DELETE FROM POLIZA_SEGUROS WHERE id_poliza = :id`,
            { id: Number(id) },
            { autoCommit: true }
        );
        return result.rowsAffected;
    } finally { await conn.close(); }
};

module.exports = { getAll, getById, create, remove };
