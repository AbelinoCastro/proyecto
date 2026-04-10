const getConnection = require("../db");
const oracledb = require("oracledb");

const jornadasController = {
  // OBTENER TODOS
  obtenerTodos: async (req, res) => {
    let connection;
    try {
      connection = await getConnection();
      const result = await connection.execute(
        "SELECT * FROM JORNADAS ORDER BY ID_JORNADA ASC",
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ mensaje: "Error al obtener jornadas", error: error.message });
    } finally {
      if (connection) await connection.close();
    }
  },

  // CREAR (Corregido para recibir ID manual)
  crear: async (req, res) => {
    // 1. Volvemos a incluir 'id' en la desestructuración
    const { id, nombre, descripcion, inicio, fin, horas } = req.body;
    let connection;
    try {
      connection = await getConnection();
      // 2. Volvemos a poner ID_JORNADA y :id en el INSERT
      const sql = `INSERT INTO JORNADAS (ID_JORNADA, NOMBRE_JORNADA, DESCRIPCION, HORA_INICIO, HORA_FIN, HORAS_DIARIAS) 
                   VALUES (:id, :nombre, :descripcion, :inicio, :fin, :horas)`;
      
      await connection.execute(
        sql, 
        { id, nombre, descripcion, inicio, fin, horas }, 
        { autoCommit: true }
      );
      
      res.status(201).json({ mensaje: "Jornada creada con éxito" });
    } catch (error) {
      // Devolvemos el detalle del error para que el frontend lo muestre bien
      res.status(400).json({ mensaje: "Error al crear", detalle: error.message });
    } finally {
      if (connection) await connection.close();
    }
  },

  // ACTUALIZAR
  actualizar: async (req, res) => {
    const { id } = req.params; 
    const { nombre, descripcion, inicio, fin, horas } = req.body;
    let connection;
    try {
      connection = await getConnection();
      const sql = `UPDATE JORNADAS SET 
                    NOMBRE_JORNADA = :nombre, 
                    DESCRIPCION = :descripcion, 
                    HORA_INICIO = :inicio, 
                    HORA_FIN = :fin, 
                    HORAS_DIARIAS = :horas 
                   WHERE ID_JORNADA = :id`;
      
      await connection.execute(
        sql, 
        { nombre, descripcion, inicio, fin, horas, id }, 
        { autoCommit: true }
      );
      
      res.json({ mensaje: "Jornada actualizada correctamente" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    } finally {
      if (connection) await connection.close();
    }
  },

  // ELIMINAR
  eliminar: async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
      connection = await getConnection();
      const sql = `DELETE FROM JORNADAS WHERE ID_JORNADA = :id`;
      await connection.execute(sql, [id], { autoCommit: true });
      res.json({ mensaje: "Jornada eliminada correctamente" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      if (connection) await connection.close();
    }
  }
};

module.exports = jornadasController;