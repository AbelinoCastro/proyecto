import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import LoginPage from './pages/login/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CalcularNominaPage from './pages/nomina/CalcularNominaPage';
import PeriodosPage from './pages/periodos/PeriodosPage';
import HistorialPage from './pages/historial/HistorialPage';
import CatalogosPage from './pages/catalogos/CatalogosPage';
import RegistroHorasExtra from './pages/registroHorasExtras/RegistroHorasExtra';
import ListadoFaltas from './pages/registroFaltas/ListadoFaltas';
import AsignacionesPage from './pages/asignaciones/AsignacionesPage';
import ReporteriaPage from './pages/reporteria/ReporteriaPage';
import ReporteriaCloudPage from './pages/reporteriaCloud/ReporteriaCloudPage';
import ISRPage from './pages/isr/ISRPage';
import IGSSPage from './pages/igss/IGSSPage';
import PrestamosPage from './pages/prestamos/PrestamosPage';
import PolizaSegurosPage from './pages/polizaSeguros/PolizaSegurosPage';
import TipoUsuarioPage from './pages/tipoUsuario/TipoUsuarioPage';
import UsuariosPage from './pages/usuarios/UsuariosPage';
import DepartamentosPage from './pages/departamentos/DepartamentosPage';
import JornadasPage from './pages/jornadas/JornadasPage';
import PercepcionesPage from './pages/percepciones/PercepcionesPage';
import DeduccionesPage from './pages/deducciones/DeduccionesPage';
import FaltasPage from './pages/faltas/FaltasPage';
import MotivoBajaPage from './pages/motivoBaja/MotivoBajaPage';
import PuestosPage from './pages/puestos/PuestosPage';
import EmpleadoPage from './pages/empleado/EmpleadoPage';
import PatronoPage from './pages/patrono/PatronoPage';
import PermisosPage from './pages/permisos/PermisosPage';

// Wrapper rápido para rutas con módulo requerido
const P = ({ mod, children }) => (
    <ProtectedRoute requiereModulo={mod}>{children}</ProtectedRoute>
);

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={
                        <ProtectedRoute><Layout /></ProtectedRoute>
                    }>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard"        element={<P mod="DASHBOARD"><DashboardPage /></P>} />

                        <Route path="calcular-nomina"  element={<P mod="NOMINA"><CalcularNominaPage /></P>} />
                        <Route path="periodos"         element={<P mod="PERIODOS"><PeriodosPage /></P>} />
                        <Route path="historial"        element={<P mod="HISTORIAL"><HistorialPage /></P>} />

                        <Route path="catalogos"        element={<P mod="CATALOGOS"><CatalogosPage /></P>} />
                        <Route path="horasextra"       element={<P mod="HORASEXTRA"><RegistroHorasExtra /></P>} />
                        <Route path="registro-faltas"  element={<P mod="FALTAS"><ListadoFaltas /></P>} />

                        <Route path="empleado"         element={<P mod="EMPLEADOS"><EmpleadoPage /></P>} />
                        <Route path="asignaciones"     element={<P mod="ASIGNAC"><AsignacionesPage /></P>} />

                        <Route path="reporteria"       element={<P mod="REPORTERIA"><ReporteriaPage /></P>} />
                        <Route path="reporteria-cloud" element={<P mod="REPORTERIA_CLOUD"><ReporteriaCloudPage /></P>} />
                        <Route path="isr"              element={<P mod="ISR"><ISRPage /></P>} />
                        <Route path="igss"             element={<P mod="IGSS"><IGSSPage /></P>} />
                        <Route path="prestamos"        element={<P mod="PRESTAMOS"><PrestamosPage /></P>} />
                        <Route path="polizas-seguros"  element={<P mod="SEGUROS"><PolizaSegurosPage /></P>} />

                        <Route path="patrono"          element={<P mod="PATRONO"><PatronoPage /></P>} />
                        <Route path="usuarios"         element={<P mod="USUARIOS"><UsuariosPage /></P>} />
                        <Route path="permisos"         element={<P mod="PERMISOS"><PermisosPage /></P>} />

                        {/* Catálogos individuales (acceso directo, sin guarda específica) */}
                        <Route path="departamentos"    element={<DepartamentosPage />} />
                        <Route path="jornadas"         element={<JornadasPage />} />
                        <Route path="percepciones"     element={<PercepcionesPage />} />
                        <Route path="deducciones"      element={<DeduccionesPage />} />
                        <Route path="faltas"           element={<FaltasPage />} />
                        <Route path="motivo-baja"      element={<MotivoBajaPage />} />
                        <Route path="puestos"          element={<PuestosPage />} />
                        <Route path="tipo-usuario"     element={<TipoUsuarioPage />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
