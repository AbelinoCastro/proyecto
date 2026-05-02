const { getConnection } = require('../../config/db');
const oracledb = require('oracledb');

const getAllPrestamos = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT p.id_prestamo, p.id_empleado, e.nombre AS nombre_empleado,
                    p.monto, p.cuotas, p.pago_mensual, p.estado
             FROM PRESTAMOS p
             JOIN EMPLEADO e ON e.id_empleado = p.id_empleado
             ORDER BY p.id_prestamo DESC`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

const crearPrestamo = async ({ id_prestamo, id_empleado, monto, cuotas }) => {
    const conn = await getConnection();
    try {
        const pago_mensual = parseFloat((monto / cuotas).toFixed(2));

        await conn.execute(
            `INSERT INTO PRESTAMOS (id_prestamo, id_empleado, monto, cuotas, pago_mensual, estado)
             VALUES (:id_prestamo, :id_empleado, :monto, :cuotas, :pago_mensual, 'ACTIVO')`,
            {
                id_prestamo:  Number(id_prestamo),
                id_empleado:  Number(id_empleado),
                monto:        Number(monto),
                cuotas:       Number(cuotas),
                pago_mensual
            },
            { autoCommit: false }
        );

        for (let i = 1; i <= Number(cuotas); i++) {
            await conn.execute(
                `INSERT INTO DETALLE_PRESTAMO (id_detalle, id_prestamo, numero_cuota, monto_cuota, estado)
                 VALUES (SEQ_DETALLE_PRESTAMO.NEXTVAL, :id_p, :num, :monto, 'PENDIENTE')`,
                { id_p: Number(id_prestamo), num: i, monto: pago_mensual },
                { autoCommit: false }
            );
        }

        await conn.commit();
        return { id_prestamo: Number(id_prestamo), pago_mensual };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally { await conn.close(); }
};

const getDetallesPrestamo = async (id_prestamo) => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT id_detalle, numero_cuota, monto_cuota, estado
             FROM DETALLE_PRESTAMO
             WHERE id_prestamo = :id
             ORDER BY numero_cuota ASC`,
            { id: Number(id_prestamo) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } finally { await conn.close(); }
};

const procesarPagosMensuales = async () => {
    const conn = await getConnection();
    try {
        // Primera cuota PENDIENTE de cada préstamo activo
        const result = await conn.execute(
            `SELECT d.id_detalle, d.monto_cuota, p.id_empleado
             FROM DETALLE_PRESTAMO d
             JOIN PRESTAMOS p ON p.id_prestamo = d.id_prestamo
             WHERE d.estado = 'PENDIENTE'
               AND p.estado = 'ACTIVO'
               AND d.numero_cuota = (
                   SELECT MIN(numero_cuota) FROM DETALLE_PRESTAMO
                   WHERE id_prestamo = d.id_prestamo AND estado = 'PENDIENTE'
               )`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const cuotas = result.rows;
        if (!cuotas.length) return null;

        let total = 0;
        const empleados = new Set();

        for (const c of cuotas) {
            await conn.execute(
                `UPDATE DETALLE_PRESTAMO SET estado = 'PAGADO' WHERE id_detalle = :id`,
                { id: c.ID_DETALLE },
                { autoCommit: false }
            );
            total += Number(c.MONTO_CUOTA);
            empleados.add(c.ID_EMPLEADO);
        }

        // Registrar transacción
        const transRes = await conn.execute(
            `SELECT SEQ_PROCESO_PAGOS.NEXTVAL AS ID FROM DUAL`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const transId = transRes.rows[0].ID;

        await conn.execute(
            `INSERT INTO PROCESO_PAGOS (id_transaccion, total_descontado, cantidad_empleados)
             VALUES (:id, :total, :cant)`,
            { id: transId, total: parseFloat(total.toFixed(2)), cant: empleados.size },
            { autoCommit: false }
        );

        await conn.commit();
        return {
            id_transaccion: transId,
            total:           parseFloat(total.toFixed(2)),
            empleados:       empleados.size,
            fecha:           new Date().toISOString()
        };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally { await conn.close(); }
};

const getUltimoComprobante = async () => {
    const conn = await getConnection();
    try {
        const result = await conn.execute(
            `SELECT id_transaccion, fecha_proceso, total_descontado, cantidad_empleados
             FROM (SELECT * FROM PROCESO_PAGOS ORDER BY id_transaccion DESC)
             WHERE ROWNUM = 1`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows[0] || null;
    } finally { await conn.close(); }
};

module.exports = { getAllPrestamos, crearPrestamo, getDetallesPrestamo, procesarPagosMensuales, getUltimoComprobante };
