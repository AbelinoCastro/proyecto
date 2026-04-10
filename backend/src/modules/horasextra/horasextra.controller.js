const horasextraModel = require("./horasextra.model");

// Obtener todos los registros
exports.getAll = async (req, res) => {
  try {
    const result = await horasextraModel.getAll();
    res.json(result);
  } catch (error) {
    console.error("Error al obtener horas extra:", error);
    res.status(500).json({ message: "Error al obtener horas extra" });
  }
};

// Crear un nuevo registro
exports.create = async (req, res) => {
  const { id_empleado, id_jornada, id_usuario, fecha, cantidad, factor, justificacion } = req.body;
  try {
    await horasextraModel.create({ id_empleado, id_jornada, id_usuario, fecha, cantidad, factor, justificacion });
    res.json({ message: "Registro creado correctamente" });
  } catch (error) {
    console.error("Error al crear registro:", error);
    res.status(500).json({ message: "Error al crear registro" });
  }
};

const { getConnection } = require('../../config/db');

// Actualizar el estado de un registro
exports.updateEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const conn = await getConnection();
    await conn.execute(
      `UPDATE REGISTRO_HORAS_EXTRA SET ESTADO = :estado WHERE ID_HORA_EXTRA = :id`,
      { estado, id },
      { autoCommit: true }
    );

    res.json({ message: "Estado actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar estado", error);
    res.status(500).json({ error: "Error al actualizar estado" });
  }
};