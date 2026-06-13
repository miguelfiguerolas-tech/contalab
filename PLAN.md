# Plan de Desarrollo: ContaLab (Extensión de Chrome)

## 1. Descripción General
Una extensión de Chrome diseñada para estudiantes de contabilidad que permite gestionar ciclos contables completos directamente desde el navegador. Cumplirá con Manifest V3 y las directrices de seguridad y privacidad de Google.

## 2. Tecnologías
- **Core**: React + Vite (para una SPA robusta y rápida).
- **Lenguaje**: JavaScript (ES6+).
- **Estilos**: Vanilla CSS moderno (Variables, Flexbox, Grid) para un diseño "Premium" y limpio, sin dependencias pesadas.
- **Persistencia**: `chrome.storage.local` (para configuraciones simples) + **IndexedDB** (para el volumen de datos de asientos y cuentas, usando una librería ligera como `idb`).
- **Formato de Archivos**: JSON para exportación/importación (copias de seguridad entregables).

## 3. Estructura de la Extensión
La extensión tendrá dos vistas principales:
1.  **Popup (Vista Rápida)**:
    -   Selección de ejercicio activo.
    -   Resumen rápido (Total Debe/Haber).
    -   Acceso directo a "Abrir ContaLab" (vista completa).
2.  **Dashboard (Vista Completa - Tab)**:
    -   Aquí residirá la aplicación compleja. Al ser contabilidad, necesitamos espacio para tablas anchas.
    -   Navegación lateral: Diario, Mayor, Balances, Configuración.

## 4. Módulos Funcionales

### A. Gestión de Ejercicios (Multi-tenant local)
-   Crear nuevo ejercicio (Nombre, Año, Plan Contable Base).
-   Cambiar entre ejercicios.
-   Eliminar/Archivar ejercicios.

### B. Plan Contable y Cuentas
-   Carga inicial de un Plan General Contable (PGC) básico para estudiantes.
-   CRUD de Cuentas: Crear, Editar, Borrar cuentas personalizadas.
-   Validación de códigos de cuenta (ej. 570, 430).

### C. Libro Diario (Core)
-   Interfaz de entrada de asientos: Fecha, Concepto, Cuentas (Debe/Haber), Importes.
-   Validación de asiento cuadrado (Debe = Haber).
-   Edición y eliminación de asientos.
-   Numeración automática de asientos.

### D. Libro Mayor
-   Visualización de todos los movimientos de una cuenta específica.
-   Cálculo de saldo acumulado.
-   Navegación interactiva (clic en un apunte lleva al asiento en el Diario).

### E. Balances e Informes
-   **Balance de Sumas y Saldos**: Tabla generada automáticamente desde el Mayor.
-   **Cuentas Anuales**:
    -   Balance de Situación (Activo vs Pasivo/Neto).
    -   Cuenta de Pérdidas y Ganancias.
    -   *Nota: Requiere mapear las cuentas a sus grupos correspondientes.*

### F. Exportación e Importación
-   **Exportar**: Generar un archivo `.json` (o `.clab`) con todos los datos del ejercicio seleccionado.
-   **Importar**: Restaurar un ejercicio desde un archivo (útil para corrección del profesor o backups).

## 5. Hoja de Ruta (Roadmap)

### Fase 1: Configuración y Base (Día 1)
-   Inicializar proyecto React + Vite configurado para Chrome Extension (Manifest V3).
-   Configurar sistema de diseño (CSS Variables, colores, tipografía).
-   Implementar capa de datos (IndexedDB wrapper).

### Fase 2: Gestión de Cuentas y Diario (Día 1-2)
-   Crear estructura de Ejercicios.
-   Implementar Plan Contable.
-   Crear interfaz del Libro Diario (Asientos).

### Fase 3: Mayor y Balances (Día 2-3)
-   Lógica de cálculo para el Mayor.
-   Generación de Balance de Sumas y Saldos.
-   Generación de Cuentas Anuales.

### Fase 4: Pulido y Exportación (Día 3)
-   Sistema de Exportar/Importar.
-   Mejoras de UI/UX (validaciones visuales, animaciones).
-   Preparación para empaquetado.
