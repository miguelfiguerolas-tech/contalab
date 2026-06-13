import { createAsiento, getCuentas } from './index';
import { getSumasYSaldos } from './balances';

// Umbral para ignorar restos de redondeo
const EPSILON = 0.005;

// Lógica pura: construye los apuntes del asiento de regularización.
// Salda todas las cuentas de los grupos 6 y 7 contra la 129:
// gastos (saldo deudor) al Haber, ingresos (saldo acreedor) al Debe,
// y la 129 recoge la diferencia (beneficio al Haber, pérdida al Debe).
export const buildApuntesRegularizacion = (sumas) => {
    const grupos67 = sumas.filter(c =>
        (c.codigo.startsWith('6') || c.codigo.startsWith('7')) &&
        Math.abs(c.saldoNeto) > EPSILON
    );

    if (grupos67.length === 0) return null;

    const apuntes = [];
    let resultado = 0; // Ingresos - Gastos

    grupos67.forEach(c => {
        if (c.saldoNeto > 0) {
            apuntes.push({ cuenta_codigo: c.codigo, debe: 0, haber: c.saldoNeto });
        } else {
            apuntes.push({ cuenta_codigo: c.codigo, debe: -c.saldoNeto, haber: 0 });
        }
        resultado -= c.saldoNeto;
    });

    if (Math.abs(resultado) > EPSILON) {
        apuntes.push(resultado > 0
            ? { cuenta_codigo: '129', debe: 0, haber: resultado }
            : { cuenta_codigo: '129', debe: -resultado, haber: 0 });
    }

    return { apuntes, resultado };
};

// Lógica pura: construye los apuntes del asiento de cierre.
// Salda todas las cuentas con saldo (los grupos 6 y 7 deben estar ya
// regularizados). Tras contabilizarlo, todos los saldos quedan a cero.
export const buildApuntesCierre = (sumas) => {
    const pendientes67 = sumas.filter(c =>
        (c.codigo.startsWith('6') || c.codigo.startsWith('7')) &&
        Math.abs(c.saldoNeto) > EPSILON
    );
    if (pendientes67.length > 0) {
        return { error: 'Hay saldos sin regularizar en los grupos 6 y 7. Haz primero el asiento de regularización.' };
    }

    const conSaldo = sumas.filter(c => Math.abs(c.saldoNeto) > EPSILON);
    if (conSaldo.length === 0) return null;

    const apuntes = conSaldo.map(c => c.saldoNeto > 0
        ? { cuenta_codigo: c.codigo, debe: 0, haber: c.saldoNeto }
        : { cuenta_codigo: c.codigo, debe: -c.saldoNeto, haber: 0 });

    return { apuntes };
};

export const crearAsientoRegularizacion = async (ejercicioId, anyo) => {
    const sumas = await getSumasYSaldos(ejercicioId);
    const construido = buildApuntesRegularizacion(sumas);

    if (!construido) {
        throw new Error('No hay saldos en los grupos 6 y 7 que regularizar.');
    }

    // La 129 debe existir en el plan del ejercicio (viene en el PGC precargado)
    const cuentas = await getCuentas(ejercicioId);
    if (!cuentas.some(c => c.codigo === '129')) {
        throw new Error('No existe la cuenta 129 (Resultado del ejercicio) en el plan. Créala en Plan de Cuentas.');
    }

    const fecha = `${anyo}-12-31`;
    await createAsiento(ejercicioId, fecha, 'Asiento de regularización', construido.apuntes);
    return construido.resultado;
};

export const crearAsientoCierre = async (ejercicioId, anyo) => {
    const sumas = await getSumasYSaldos(ejercicioId);
    const construido = buildApuntesCierre(sumas);

    if (!construido) {
        throw new Error('No hay saldos que cerrar.');
    }
    if (construido.error) {
        throw new Error(construido.error);
    }

    const fecha = `${anyo}-12-31`;
    return createAsiento(ejercicioId, fecha, 'Asiento de cierre', construido.apuntes);
};
