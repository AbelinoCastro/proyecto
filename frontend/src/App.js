import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
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
import CalcularNominaPage from './pages/nomina/CalcularNominaPage';
import PeriodosPage from './pages/periodos/PeriodosPage';
import RegistroHorasExtra from './pages/registroHorasExtras/RegistroHorasExtra';
import ListadoFaltas from './pages/registroFaltas/ListadoFaltas';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/calcular-nomina" replace />} />
          <Route path="tipo-usuario" element={<TipoUsuarioPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
          <Route path="departamentos" element={<DepartamentosPage />} />
          <Route path="jornadas" element={<JornadasPage />} />
          <Route path="percepciones" element={<PercepcionesPage />} />
          <Route path="deducciones" element={<DeduccionesPage />} />
          <Route path="faltas" element={<FaltasPage />} />
          <Route path="motivo-baja" element={<MotivoBajaPage />} />
          <Route path="puestos" element={<PuestosPage />} />
          <Route path="empleado" element={<EmpleadoPage />} />
          <Route path="calcular-nomina" element={<CalcularNominaPage />} />
          <Route path="periodos" element={<PeriodosPage />} />
          <Route path="horasextra" element={<RegistroHorasExtra />} />
          <Route path="registro-faltas" element={<ListadoFaltas />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;