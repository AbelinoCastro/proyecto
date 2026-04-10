const db = require('../../config/db');

// VALIDAR DUPLICADOS
const validateDuplicate = async (connection, id_empleado, fecha) => {
  const result = await connection.execute(
    `SELECT COUNT(*) AS TOTAL
     FROM REGISTRO_FALTAS
     WHERE id_empleado = :id_empleado
     AND TRUNC(fecha) = TRUNC(:fecha)`,
    {
      id_empleado,
      fecha: new Date(fecha)
    }
  );

  return result.rows[0][0] > 0;
};

// CREAR REGISTRO
const create = async (data) => {
  const connection = await db.getConnection();

  try {
    const {
      id_empleado,
      id_falta,
      fecha,
      fecha_fin,
      justificacion
    } = data;

    if (await validateDuplicate(connection, id_empleado, fecha)) {
      throw new Error('Ya existe una falta para este empleado en esa fecha');
    }

    await connection.execute(
      `INSERT INTO REGISTRO_FALTAS
      (id_empleado, id_falta, id_usuario, fecha, fecha_fin, justificacion, estado)
      VALUES
      (:id_empleado, :id_falta, :id_usuario, :fecha, :fecha_fin, :justificacion, 'PENDIENTE')`,
      {
        id_empleado: Number(id_empleado),
        id_falta: Number(id_falta),
        id_usuario: 2,
        fecha: new Date(fecha),
        fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
        justificacion: justificacion || null
      },
      { autoCommit: true }
    );

    return { message: 'Falta registrada correctamente' };

  } finally {
    await connection.close();
  }
};

// GET ALL
const getAll = async () => {
  const connection = await db.getConnection();
  try {
    const result = await connection.execute(`
      SELECT
        r.ID_REGISTRO_FALTA,
        e.NOMBRE,
        p.NOMBRE_PUESTO,
        f.DESCRIPCION,
        r.FECHA,
        u.USERNAME,
        r.JUSTIFICACION,
        r.ESTADO
      FROM REGISTRO_FALTAS r
      JOIN EMPLEADO e ON r.ID_EMPLEADO = e.ID_EMPLEADO
      JOIN PUESTOS p ON e.ID_PUESTO = p.ID_PUESTO
      JOIN FALTAS f ON r.ID_FALTA = f.ID_FALTA
      JOIN USUARIOS u ON r.ID_USUARIO = u.ID_USUARIO
      ORDER BY r.FECHA DESC
    `);
    return result.rows;
  } finally {
    await connection.close();
  }
};

// ACTUALIZAR ESTADO
const updateEstado = async (id, estado) => {
  const connection = await db.getConnection();
  try {
    await connection.execute(
      `UPDATE REGISTRO_FALTAS SET estado = :estado WHERE id_registro_falta = :id`,
      { estado, id: Number(id) },
      { autoCommit: true }
    );
    return { message: 'Estado actualizado' };
  } finally {
    await connection.close();
  }
};

module.exports = { create, getAll, updateEstado };