import { describe, it, expect } from 'vitest';
import {
    buildSumasYSaldos,
    computeBalanceSituacion,
    computeCuentaResultados
} from './balances';
import { BALANCE_STRUCTURE, PYG_STRUCTURE } from './pgc_structure';

// Helpers ---------------------------------------------------------------

const cuenta = (codigo, nombre = `Cuenta ${codigo}`) => ({ codigo, nombre });

const apunte = (cuenta_codigo, debe = 0, haber = 0) => ({ cuenta_codigo, debe, haber });

// Construye un balance de sumas y saldos a partir de pares [codigo, debe, haber]
const sumas = (...movs) => {
    const cuentas = [...new Set(movs.map(m => m[0]))].map(c => cuenta(c));
    const apuntes = movs.map(([c, d, h]) => apunte(c, d, h));
    return buildSumasYSaldos(cuentas, apuntes);
};

const findNode = (nodes, id) => {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findNode(node.children, id);
            if (found) return found;
        }
    }
    return null;
};

const totalActivo = (balance) => balance.activo.reduce((s, n) => s + n.amount, 0);
const totalPasivo = (balance) => balance.patrimonioPasivo.reduce((s, n) => s + n.amount, 0);

// buildSumasYSaldos -----------------------------------------------------

describe('buildSumasYSaldos', () => {
    it('acumula debe y haber por cuenta y calcula el saldo', () => {
        const result = sumas(['430', 1000, 0], ['430', 500, 0], ['430', 0, 300]);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
            codigo: '430',
            sumaDebe: 1500,
            sumaHaber: 300,
            saldoDeudor: 1200,
            saldoAcreedor: 0,
            saldoNeto: 1200
        });
    });

    it('excluye cuentas sin movimientos', () => {
        const result = buildSumasYSaldos([cuenta('100'), cuenta('430')], [apunte('430', 100)]);
        expect(result.map(r => r.codigo)).toEqual(['430']);
    });
});

// Balance de Situación --------------------------------------------------

describe('computeBalanceSituacion', () => {
    it('no duplica cuentas que coinciden con prefijos de varios epígrafes (240 vs 24)', () => {
        // 240 coincide con '240' (IV. Inversiones grupo L/P) y con '24' (V. Inv. financieras L/P)
        const balance = computeBalanceSituacion(sumas(['240', 1000, 0], ['100', 0, 1000]));

        const grupoLP = findNode(balance.activo, 'A_NC_IV');
        const finLP = findNode(balance.activo, 'A_NC_V');

        expect(grupoLP.amount).toBe(1000);
        expect(finLP.amount).toBe(0);
        expect(totalActivo(balance)).toBe(1000); // antes del arreglo salía 2000
    });

    it('no duplica amortización acumulada (281 vs 28*) ni deterioros (29*)', () => {
        const balance = computeBalanceSituacion(sumas(
            ['210', 5000, 0],   // Terrenos
            ['281', 0, 1000],   // Amort. acum. inmovilizado material
            ['100', 0, 4000]
        ));

        const material = findNode(balance.activo, 'A_NC_II');
        expect(material.amount).toBe(4000); // 5000 - 1000, una sola vez
        expect(totalActivo(balance)).toBe(4000);
    });

    it('asigna deudas grupo c/p (510) a su epígrafe específico, no también a Deudas c/p (51)', () => {
        const balance = computeBalanceSituacion(sumas(['572', 800, 0], ['510', 0, 800]));

        const deudasGrupo = findNode(balance.patrimonioPasivo, 'P_C_IV');
        const deudasCP = findNode(balance.patrimonioPasivo, 'P_C_III');

        expect(deudasGrupo.amount).toBe(800);
        expect(deudasCP.amount).toBe(0);
    });

    it('las fianzas recibidas (560) van al pasivo, no al activo por el prefijo 56', () => {
        const balance = computeBalanceSituacion(sumas(['572', 500, 0], ['560', 0, 500]));

        const invFinCP = findNode(balance.activo, 'A_C_V');
        const deudasCP = findNode(balance.patrimonioPasivo, 'P_C_III');

        expect(invFinCP.amount).toBe(0);
        expect(deudasCP.amount).toBe(500);
    });

    it('cuadra Activo = PN + Pasivo en un caso completo con resultado', () => {
        const balance = computeBalanceSituacion(sumas(
            ['100', 0, 10000],  // Capital
            ['572', 10000, 0],  // Bancos
            ['600', 2000, 0],   // Compras
            ['400', 0, 2000],   // Proveedores
            ['430', 3000, 0],   // Clientes
            ['700', 0, 3000]    // Ventas
        ));

        expect(totalActivo(balance)).toBe(13000);
        expect(totalPasivo(balance)).toBe(13000);

        // El resultado (3000 - 2000) se inyecta en la 129 dentro del PN
        const resultado = findNode(balance.patrimonioPasivo, 'PN_A1_VII');
        expect(resultado.amount).toBe(1000);
    });

    it('una pérdida aparece como resultado negativo en el PN', () => {
        const balance = computeBalanceSituacion(sumas(
            ['100', 0, 5000],
            ['572', 4000, 0],
            ['600', 1000, 0]
        ));

        const resultado = findNode(balance.patrimonioPasivo, 'PN_A1_VII');
        expect(resultado.amount).toBe(-1000);
        expect(totalActivo(balance)).toBe(totalPasivo(balance));
    });

    it('no muta la lista de sumas y saldos que recibe', () => {
        const lista = sumas(['700', 0, 1000], ['129', 0, 50]);
        const copia = JSON.parse(JSON.stringify(lista));
        computeBalanceSituacion(lista);
        expect(lista).toEqual(copia);
    });
});

// Cuenta de Pérdidas y Ganancias ----------------------------------------

describe('computeCuentaResultados', () => {
    const rowAmount = (pyg, id) => pyg.find(r => r.id === id).amount;

    it('calcula importe de negocio, aprovisionamientos y resultado', () => {
        const pyg = computeCuentaResultados(sumas(['700', 0, 3000], ['600', 2000, 0]));

        expect(rowAmount(pyg, '1')).toBe(3000);
        expect(rowAmount(pyg, '4')).toBe(-2000);
        expect(rowAmount(pyg, 'A_RES_EXPLOTACION')).toBe(1000);
        expect(rowAmount(pyg, 'D_RES_EJERCICIO')).toBe(1000);
    });

    it('el impuesto (630) solo entra en la línea 17, no también en Otros gastos (63)', () => {
        const pyg = computeCuentaResultados(sumas(['630', 250, 0]));

        expect(rowAmount(pyg, '17')).toBe(-250);
        expect(rowAmount(pyg, '7')).toBe(0); // antes del arreglo salía -250 también aquí
        expect(rowAmount(pyg, 'D_RES_EJERCICIO')).toBe(-250);
    });

    it('la 6930 entra en Variación de existencias (6930), no en Deterioros (690)', () => {
        const pyg = computeCuentaResultados(sumas(['6930', 100, 0]));

        expect(rowAmount(pyg, '2')).toBe(-100);
        expect(rowAmount(pyg, '11')).toBe(0);
    });
});

// Sanidad de la estructura ----------------------------------------------

describe('estructura PGC', () => {
    const collectLeaves = (nodes, leaves = []) => {
        nodes.forEach(node => {
            if (node.children) collectLeaves(node.children, leaves);
            else if (node.accounts) leaves.push(node);
        });
        return leaves;
    };

    it('ningún prefijo de cuenta aparece en dos epígrafes del Balance', () => {
        const leaves = collectLeaves([
            ...BALANCE_STRUCTURE.activo,
            ...BALANCE_STRUCTURE.patrimonio_pasivo
        ]);

        const seen = new Map(); // prefijo -> id del epígrafe
        const duplicados = [];
        leaves.forEach(leaf => {
            leaf.accounts.forEach(prefix => {
                if (seen.has(prefix)) {
                    duplicados.push(`${prefix} en ${seen.get(prefix)} y ${leaf.id}`);
                } else {
                    seen.set(prefix, leaf.id);
                }
            });
        });

        expect(duplicados).toEqual([]);
    });

    it('ningún prefijo de cuenta aparece en dos líneas de PyG', () => {
        const seen = new Map();
        const duplicados = [];
        PYG_STRUCTURE.filter(r => !r.isTotal).forEach(row => {
            row.accounts.forEach(prefix => {
                if (seen.has(prefix)) {
                    duplicados.push(`${prefix} en ${seen.get(prefix)} y ${row.id}`);
                } else {
                    seen.set(prefix, row.id);
                }
            });
        });

        expect(duplicados).toEqual([]);
    });
});
