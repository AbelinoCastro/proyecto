const express = require("express");
const router = express.Router();
const horasextraController = require("./horasextra.controller");

// Ruta para obtener todos los registros de horas extra
router.get("/", horasextraController.getAll);

// Ruta para crear un nuevo registro
router.post("/", horasextraController.create);

// Ruta para actualizar el estado de un registro
router.put("/:id", horasextraController.updateEstado);

module.exports = router;