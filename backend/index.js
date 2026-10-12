const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initPool } = require('./src/config/db');
require('dotenv').config();

const app = express();

// 🔒 Headers de seguridad HTTP (CSP, XSS, clickjacking, etc.)
app.use(helmet({
    contentSecurityPolicy: false,  // Desactivado para permitir Tableau embed
    crossOriginEmbedderPolicy: false,
}));

// 🌐 CORS restrictivo (solo el origin del frontend)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
}));

app.use(express.json({ limit: '5mb' }));

// 🛡️ Límite estricto en producción; margen amplio durante desarrollo local.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 5 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, message: 'Demasiados intentos de login. Espera 15 minutos.' },
});
app.use('/api/auth/login', loginLimiter);

// Autenticación y permisos (deben ir antes de las demás rutas protegidas)
app.use('/api/auth',     require('./src/modules/auth/auth.routes'));
app.use('/api/permisos', require('./src/modules/permisos/permisos.routes'));

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
app.use('/api/horasextra', require('./src/modules/horasextra/horasextra.routes'));
app.use('/api/registro-faltas', require('./src/modules/registroFaltas/registroFaltas.routes'));
app.use('/api/emp-asignaciones', require('./src/modules/empAsignaciones/empAsignaciones.routes'));
app.use('/api/patrono', require('./src/modules/patrono/patrono.routes'));
app.use('/api/sat', require('./src/modules/sat/sat.routes'));
app.use('/api/igss', require('./src/modules/igss/igss.routes'));
app.use('/api/prestamos', require('./src/modules/prestamo/prestamo.routes'));
app.use('/api/polizas-seguros', require('./src/modules/polizaSeguros/polizaSeguros.routes'));
app.use('/api/formato-salarios', require('./src/modules/formatoSalarios/formatoSalarios.routes'));

app.get('/', (req, res) => res.json({ ok: true, message: 'Proyecto Nomina API corriendo' }));

const PORT = process.env.PORT || 4000;
initPool().then(() => {
    app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
});