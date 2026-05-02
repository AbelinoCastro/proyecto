import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Nómina
import CalcularNominaPage from './pages/nomina/CalcularNominaPage';
import PeriodosPage from './pages/periodos/PeriodosPage';
import HistorialPage from './pages/historial/HistorialPage';

// Catálogos unificados (Abelino)
import CatalogosPage from './pages/catalogos/CatalogosPage';

// Módulos individuales (David / Juan)
import RegistroHorasExtra from './pages/registroHorasExtras/RegistroHorasExtra';
import ListadoFaltas from './pages/registroFaltas/ListadoFaltas';

// Asignaciones por empleado
import AsignacionesPage from './pages/asignaciones/AsignacionesPage';

// Reportería y obligaciones legales
import ReporteriaPage from './pages/reporteria/ReporteriaPage';
import ISRPage from './pages/isr/ISRPage';
import IGSSPage from './pages/igss/IGSSPage';
import PrestamosPage from './pages/prestamos/PrestamosPage';
import PolizaSegurosPage from './pages/polizaSeguros/PolizaSegurosPage';

// Páginas individuales de catálogos (acceso directo desde el sidebar)
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Dashboard principal */}
          <Route index element={<DashboardPage />} />

          {/* Nómina */}
          <Route path="calcular-nomina" element={<CalcularNominaPage />} />
          <Route path="periodos" element={<PeriodosPage />} />
          <Route path="historial" element={<HistorialPage />} />

          {/* Catálogos unificados */}
          <Route path="catalogos" element={<CatalogosPage />} />

          {/* Módulos David & Juan */}
          <Route path="horasextra" element={<RegistroHorasExtra />} />
          <Route path="registro-faltas" element={<ListadoFaltas />} />

          {/* Empleados */}
          <Route path="empleado" element={<EmpleadoPage />} />
          <Route path="asignaciones" element={<AsignacionesPage />} />

          {/* Reportería y obligaciones */}
          <Route path="reporteria" element={<ReporteriaPage />} />
          <Route path="isr" element={<ISRPage />} />
          <Route path="igss" element={<IGSSPage />} />
          <Route path="prestamos" element={<PrestamosPage />} />
          <Route path="polizas-seguros" element={<PolizaSegurosPage />} />

          {/* Catálogos individuales (acceso directo) */}
          <Route path="departamentos" element={<DepartamentosPage />} />
          <Route path="jornadas" element={<JornadasPage />} />
          <Route path="percepciones" element={<PercepcionesPage />} />
          <Route path="deducciones" element={<DeduccionesPage />} />
          <Route path="faltas" element={<FaltasPage />} />
          <Route path="motivo-baja" element={<MotivoBajaPage />} />
          <Route path="puestos" element={<PuestosPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
          <Route path="tipo-usuario" element={<TipoUsuarioPage />} />
          <Route path="patrono" element={<PatronoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;