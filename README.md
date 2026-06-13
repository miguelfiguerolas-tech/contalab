# ContaLab

**Contabilidad para estudiantes** — extensión de Chrome para aprender y practicar contabilidad según el Plan General Contable español: Libro Diario, Libro Mayor, Balances y un panel de Auditoría que detecta los errores típicos del aula.

Pensada para clases de FP y bachillerato: los datos viven en el navegador (IndexedDB, sin servidores ni cuentas), los alumnos entregan su ejercicio como archivo JSON y el profesor lo importa y lo corrige desde la pestaña Auditoría.

[**Instalar desde la Chrome Web Store**](https://chromewebstore.google.com/detail/gcjimlngbpkflmlcmhcmnebdehhklpic) · [Proponer mejoras](https://github.com/miguelfiguerolas-tech/contalab/issues) · [Invitar a un café](https://buymeacoffee.com/miguelfiguerola)

## Funcionalidades

- **Libro Diario**: asientos con validación de cuadre, búsqueda y exportación a PDF.
- **Libro Mayor**: extracto con saldo acumulado o vista clásica de **cuenta en T**, exportable a PDF.
- **Plan de Cuentas**: PGC básico precargado, subcuentas personalizadas, filtros por grupo (1-7).
- **Balances**: Sumas y Saldos, Balance de Situación y Cuenta de Pérdidas y Ganancias, con exportación a PDF y CSV (formato Excel español).
- **Auditoría**: chequeos automáticos (cuadre, ecuación contable, tesorería negativa, saldos antinaturales, signo de gastos/ingresos, amortización y variación de existencias pendientes) con enlaces directos a las cuentas a revisar.
- **Asistente de cierre**: genera los asientos reales de regularización (6/7 → 129) y de cierre.
- **Entregas**: exportación/importación en JSON con huella de contenido y ficha de entrega, para corregir y detectar copias directas.

## Desarrollo

Requisitos: Node.js 18+.

```bash
npm install
npm run dev      # servidor de desarrollo
npm test         # tests (Vitest) de la lógica contable
npm run build    # genera dist/
```

Para cargar la extensión en Chrome: `chrome://extensions` → activar "Modo desarrollador" → "Cargar descomprimida" → seleccionar la carpeta `dist/`.

### Estructura

- `src/db/` — lógica contable y persistencia (IndexedDB vía [idb](https://github.com/jakearchibald/idb)): asientos, balances, cierre, copias de seguridad.
- `src/dashboard/` — interfaz React.
- `src/utils/` — formato es-ES, exportación PDF (jsPDF), enlaces.
- `public/` — manifest de la extensión y service worker.

La lógica contable (balances, PyG, regularización/cierre) está en funciones puras con tests en `src/db/*.test.js`.

## Contribuir

¿Eres docente o estudiante y echas algo en falta? [Abre un issue](https://github.com/miguelfiguerolas-tech/contalab/issues) contando el caso de uso. Los pull requests son bienvenidos — si tocas la lógica contable, acompáñala de tests (`npm test`).

## Licencia

[MIT](LICENSE) — © Miguel Figuerola. Úsala, modifícala y compártela libremente.
