import { describe, it, expect } from 'vitest';
import { buildApuntesRegularizacion, buildApuntesCierre } from './cierre';
import { buildSumasYSaldos } from './balances';

const cuenta = (codigo) => ({ codigo, nombre: `Cuenta ${codigo}` });
const apunte = (cuenta_codigo, debe = 0, haber = 0) => ({ cuenta_codigo, debe, haber });

const sumas = (...movs) => {
    const cuentas = [...new Set(movs.map(m => m[0]))].map(c => cuenta(c));
    const apuntes = movs.map(([c, d, h]) => apunte(c, d, h));
    return buildSumasYSaldos(cuentas, apuntes);
};

const cuadre = (apuntes) => {
    const debe = apuntes.reduce((s, a) => s + a.debe, 0);
    const haber = apuntes.reduce((s, a) => s + a.haber, 0);
    return Math.abs(debe - haber);
};

describe('buildApuntesRegularizacion', () => {
    it('salda los grupos 6 y 7 contra la 129 con beneficio al Haber', () => {
        const result = buildApuntesRegularizacion(sumas(
            ['600', 2000, 0],   // Gasto
            ['700', 0, 3000],   // Ingreso
            ['572', 1000, 0]    // No debe tocarse
        ));

        expect(result.resultado).toBe(1000); // Beneficio

        const linea600 = result.apuntes.find(a => a.cuenta_codigo === '600');
        const linea700 = result.apuntes.find(a => a.cuenta_codigo === '700');
        const linea129 = result.apuntes.find(a => a.cuenta_codigo === '129');

        expect(linea600).toMatchObject({ debe: 0, haber: 2000 }); // gasto se salda por el Haber
        expect(linea700).toMatchObject({ debe: 3000, haber: 0 }); // ingreso se salda por el Debe
        expect(linea129).toMatchObject({ debe: 0, haber: 1000 }); // beneficio al Haber

        expect(result.apuntes.some(a => a.cuenta_codigo === '572')).toBe(false);
        expect(cuadre(result.apuntes)).toBeLessThan(0.01);
    });

    it('una pérdida lleva la 129 al Debe', () => {
        const result = buildApuntesRegularizacion(sumas(['600', 500, 0]));
        const linea129 = result.apuntes.find(a => a.cuenta_codigo === '129');

        expect(result.resultado).toBe(-500);
        expect(linea129).toMatchObject({ debe: 500, haber: 0 });
        expect(cuadre(result.apuntes)).toBeLessThan(0.01);
    });

    it('devuelve null si no hay nada que regularizar', () => {
        expect(buildApuntesRegularizacion(sumas(['572', 100, 0]))).toBeNull();
    });
});

describe('buildApuntesCierre', () => {
    it('rechaza cerrar si los grupos 6/7 tienen saldo', () => {
        const result = buildApuntesCierre(sumas(['600', 500, 0], ['572', 500, 0]));
        expect(result.error).toBeTruthy();
    });

    it('salda todas las cuentas y el asiento cuadra', () => {
        const result = buildApuntesCierre(sumas(
            ['100', 0, 1000],
            ['572', 700, 0],
            ['430', 300, 0]
        ));

        expect(result.apuntes).toHaveLength(3);
        expect(result.apuntes.find(a => a.cuenta_codigo === '100')).toMatchObject({ debe: 1000, haber: 0 });
        expect(result.apuntes.find(a => a.cuenta_codigo === '572')).toMatchObject({ debe: 0, haber: 700 });
        expect(cuadre(result.apuntes)).toBeLessThan(0.01);
    });

    it('devuelve null si ya está todo a cero', () => {
        expect(buildApuntesCierre(sumas(['572', 100, 100]))).toBeNull();
    });
});
