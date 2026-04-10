const express = require('express');
const cors = require('cors');
const { initPool } = require('./src/config/db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas existentes
app.use('/api/tipo-usuario', require('./src/modules/tipoUsuario/tipoUsuario.routes'));
app.use('/api/usuarios', require('./src/modules/usuarios/usuario.routes'));

// Rutas nuevas
app.use('/api/departamentos', require('./src/modules/departamentos/departamentos.routes'));
app.use('/api/jornadas', require('./src/modules/jornadas/jornadas.routes'));
app.use('/api/percepciones', require('./src/modules/percepciones/percepciones.routes'));
app.use('/api/deducciones', require('./src/modules/deducciones/deducciones.routes'));
app.use('/api/faltas', require('./src/modules/faltas/faltas.routes'));
app.use('/api/motivo-baja', require('./src/modules/motivoBaja/motivoBaja.routes'));
app.use('/api/puestos', require('./src/modules/puestos/puestos.routes'));
app.use('/api/empleado', require('./src/modules/empleado/empleado.routes'));
app.use('/api/nomina', require('./src/modules/nomina/nomina.routes'));
app.use('/api/periodos', require('./src/modules/periodo/periodo.routes'));

app.get('/', (req, res) => res.json({ ok: true, message: 'Proyecto Nomina API corriendo' }));

const PORT = process.env.PORT || 4000;
initPool().then(() => {
    app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
});