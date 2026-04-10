const getConnection = require("../db");
const oracledb = require("oracledb");

const departamentosController = {
  obtenerTodos: async (req, res) => {
    let connection;
    try {
      connection = await getConnection();
      const result = await connection.execute(
        "SELECT * FROM DEPARTAMENTOS ORDER BY ID_DEPARTAMENTO ASC", 
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

  crear: async (req, res) => {
    // Volvemos a pedir el ID del cuerpo de la petición
    const { id, nombre, descripcion, estado } = req.body; 
    let connection;
    try {
      connection = await getConnection();
      const sql = `INSERT INTO DEPARTAMENTOS (ID_DEPARTAMENTO, NOMBRE_DEPARTAMENTO, DESCRIPCION, ESTADO) 
                   VALUES (:id, :nombre, :descripcion, :estado)`;
      
      await connection.execute(sql, { id, nombre, descripcion, estado }, { autoCommit: true });
      res.status(201).json({ mensaje: "Departamento creado con éxito" });
    } catch (error) {
      res.status(400).json({ mensaje: "Error al crear", detalle: error.message });
    } finally {
      if (connection) await connection.close();
    }
  },

  actualizar: async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, estado } = req.body;
    let connection;
    try {
      connection = await getConnection();
      const sql = `UPDATE DEPARTAMENTOS SET NOMBRE_DEPARTAMENTO = :nombre, DESCRIPCION = :descripcion, ESTADO = :estado 
                   WHERE ID_DEPARTAMENTO = :id`;
      await connection.execute(sql, { nombre, descripcion, estado, id }, { autoCommit: true });
      res.json({ mensaje: "Departamento actualizado" });
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
      await connection.execute("DELETE FROM DEPARTAMENTOS WHERE ID_DEPARTAMENTO = :id", [id], { autoCommit: true });
      res.json({ mensaje: "Departamento eliminado" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      if (connection) await connection.close();
    }
  }
};

module.exports = departamentosController;