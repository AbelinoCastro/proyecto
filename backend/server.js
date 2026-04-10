const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const departamentosRoutes = require("./routers/departamentos");
const jornadasRoutes = require("./routers/jornadas");
const faltasRoutes = require("./routers/faltas");

app.use("/departamentos", departamentosRoutes);
app.use("/jornadas", jornadasRoutes);
app.use("/faltas", faltasRoutes);

app.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000");
});
