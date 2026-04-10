const express = require('express');
const app = express();
const PORT = 5000;

app.get('/api/saludo', (req, res) => {
  res.send({ mensaje: "El backend del Menú está listo para cuando RRHH lo necesite" });
});

app.listen(PORT, () => {
  console.log(`Backend inicializado en el puerto ${PORT}`);
});