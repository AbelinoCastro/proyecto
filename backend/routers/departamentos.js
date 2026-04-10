const express = require("express");
const router = express.Router();
// Importamos el controlador (El cerebro)
const deptoController = require("../controllers/departamentosController");

router.get("/", deptoController.obtenerTodos);
router.post("/", deptoController.crear);
router.put("/:id", deptoController.actualizar);
router.delete("/:id", deptoController.eliminar);

module.exports = router;