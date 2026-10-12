# Plan de Rescate y Corrección: NóminaGT

Este plan aborda las fallas críticas reportadas en el cálculo de nómina y la gestión del panel administrativo, asegurando que el sistema cumpla con la normativa guatemalteca y sea robusto ante errores de usuario.

## Problemas Identificados y Soluciones

### 1. Motor de Cálculo de Nómina (Falla Crítica)
- **Error en ISR:** La fórmula anterior gravaba el ISR sobre la Bonificación Incentivo de Q250, lo cual es ilegal en Guatemala.
  - **Solución:** Se ajustó la función `calcularISRMensual` para excluir los Q250 de la base imponible anual proyectada.
- **IDs Hardcoded:** El sistema depende de IDs específicos (`DED01`, `PER01`, etc.).
  - **Solución:** Se añadieron comentarios de advertencia en el código y se mejoró la captura de errores en el backend para reportar si un concepto core falta en la base de datos en lugar de simplemente fallar.

### 2. Panel Maestro y CRUD (Fallas de Usabilidad)
- **Faltas Incompletas:** El catálogo de Faltas no permitía eliminar registros ni cambiar su estado.
  - **Solución:** Se habilitaron los botones de Eliminar y Toggle en el frontend y se sincronizaron con el backend.
- **Errores de Eliminación Cripticos:** El mensaje "Error: No se pudo eliminar" no explicaba la causa (Integridad Referencial).
  - **Solución:** Se mejoró la lógica de detección de errores ORA-02292 en el frontend para sugerir la desactivación en lugar de la eliminación.

### 3. Estabilidad de la Interfaz
- **Peticiones en Bucle:** Se optimizó el manejo de respuestas `400` y `409` en el backend para que el frontend pueda mostrar alertas claras al usuario en lugar de intentar re-cargar infinitamente.

## Cambios Propuestos

### [Backend] [nomina.controller.js](file:///C:/Users/kurtc/OneDrive/Documentos/GitHub/Gestion-Nomina/backend/src/modules/nomina/nomina.controller.js)
- Ajuste de lógica de ISR (Exención Decreto 37-2001).
- Mejora de códigos de respuesta HTTP (`409` para duplicados, `403` para periodos cerrados).

### [Frontend] [CatalogosLogic.js](file:///C:/Users/kurtc/OneDrive/Documentos/GitHub/Gestion-Nomina/frontend/src/pages/catalogos/CatalogosLogic.js)
- Codificación de URLs con `encodeURIComponent` para soportar caracteres especiales en IDs.
- Traducción de errores técnicos de base de datos a mensajes de negocio.

### [Frontend] [CalcularNominaPage.jsx](file:///C:/Users/kurtc/OneDrive/Documentos/GitHub/Gestion-Nomina/frontend/src/pages/nomina/CalcularNominaPage.jsx)
- Mejoras en la visualización de errores de carga de vista previa.

## Plan de Verificación

### Pruebas Manuales
1. **Validación ISR:** Calcular la nómina de un empleado con sueldo de Q5,000. El ISR debe ser Q0 (ya que (5000-250)*12 < 48000 + IGSS).
2. **Validación Eliminación:** Intentar eliminar la deducción "IGSS". El sistema debe mostrar el nuevo mensaje de sugerencia de desactivación.
3. **Validación Caracteres:** Crear una percepción con ID "PER#1" y luego intentar eliminarla. Debe funcionar gracias al nuevo encode.
