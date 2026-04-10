const getConnection = require("../db");
const oracledb = require("oracledb");

const faltasController = {
  obtenerTodos: async (req, res) => {
    let connection;
    try {
      connection = await getConnection();
      const result = await connection.execute(
        "SELECT * FROM FALTAS ORDER BY ID_FALTA ASC",
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ mensaje: "Error al obtener datos", error: error.message });
    } finally {
      if (connection) await connection.close();
    }
  },

  // CREAR (Para Faltas NO enviamos el ID porque es Identity Always)
  crear: async (req, res) => {
    // Solo extraemos descripción y pagado. Ignoramos el id que viene del front.
    const { descripcion, pagado } = req.body; 
    let connection;
    try {
      connection = await getConnection();
      // El SQL NO lleva ID_FALTA
      const sql = `INSERT INTO FALTAS (DESCRIPCION, ES_PAGADO) VALUES (:descripcion, :pagado)`;
      
      await connection.execute(sql, { descripcion, pagado }, { autoCommit: true });
      res.status(201).json({ mensaje: "Falta guardada correctamente" });
    } catch (error) {
      // Si hay error, enviamos el detalle para saber qué pasó
      res.status(400).json({ mensaje: "Error al crear", detalle: error.message });
    } finally {
      if (connection) await connection.close();
    }
  },

  actualizar: async (req, res) => {
    const { id } = req.params;
    const { descripcion, pagado } = req.body;
    let connection;
    try {
      connection = await getConnection();
      const sql = `UPDATE FALTAS SET DESCRIPCION = :descripcion, ES_PAGADO = :pagado WHERE ID_FALTA = :id`;
      await connection.execute(sql, { descripcion, pagado, id }, { autoCommit: true });
      res.json({ mensaje: "Falta actualizada" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    } finally {
      if (connection) await connection.close();
    }
  },

  eliminar: async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
      connection = await getConnection();
      await connection.execute("DELETE FROM FALTAS WHERE ID_FALTA = :id", [id], { autoCommit: true });
      res.json({ mensaje: "Falta eliminada" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      if (connection) await connection.close();
    }
  }
};

module.exports = faltasController;