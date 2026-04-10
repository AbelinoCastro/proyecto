const express = require("express");
const router = express.Router();
// Importamos el controlador de faltas
const faltasCtrl = require("../controllers/faltasController");

router.get("/", faltasCtrl.obtenerTodos);
router.post("/", faltasCtrl.crear);
router.put("/:id", faltasCtrl.actualizar);
router.delete("/:id", faltasCtrl.eliminar);

module.exports = router;