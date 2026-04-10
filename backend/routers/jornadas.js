const express = require("express");
const router = express.Router();
// Importamos el controlador de jornadas
const jornadasCtrl = require("../controllers/jornadasController");

router.get("/", jornadasCtrl.obtenerTodos);
router.post("/", jornadasCtrl.crear);
router.put("/:id", jornadasCtrl.actualizar);
router.delete("/:id", jornadasCtrl.eliminar);

module.exports = router;