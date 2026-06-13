import { initDB } from './index';

export const getMayor = async (ejercicioId, cuentaCodigo) => {
    const db = await initDB();

    // 1. Obtener todos los apuntes de esa cuenta en ese ejercicio
    // Usamos el índice compuesto 'ejercicio_cuenta' que creamos en initDB
    // Nota: IDB KeyRange para índices compuestos puede ser tricky.
    // Si no funciona directo, filtramos en memoria (para estudiantes es ok).

    // Opción A: getAllFromIndex con IDBKeyRange.only([ejercicioId, cuentaCodigo])
    // Esto requiere que el índice esté configurado exactamente así.

    // Vamos a usar la opción segura: traer todos los apuntes del ejercicio y filtrar.
    // (Optimización futura: usar índice específico)
    const todosApuntes = await db.getAllFromIndex('apuntes', 'ejercicio_id', ejercicioId);

    const apuntesCuenta = todosApuntes.filter(a => a.cuenta_codigo === cuentaCodigo);

    // 2. Necesitamos la fecha y el número de asiento para ordenar
    // Hacemos un fetch de los asientos relacionados
    const asientoIds = [...new Set(apuntesCuenta.map(a => a.asiento_id))];

    const tx = db.transaction('asientos', 'readonly');
    const store = tx.objectStore('asientos');

    const asientosMap = {};
    for (const id of asientoIds) {
        const asiento = await store.get(id);
        if (asiento) asientosMap[id] = asiento;
    }
    await tx.done;

    // 3. Combinar y ordenar
    const movimientos = apuntesCuenta.map(apunte => {
        const asiento = asientosMap[apunte.asiento_id];
        return {
            ...apunte,
            fecha: asiento ? asiento.fecha : '1970-01-01',
            asiento_numero: asiento ? asiento.numero : 0,
            asiento_concepto: asiento ? asiento.concepto : ''
        };
    });

    // Ordenar por fecha y número
    movimientos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha) || a.asiento_numero - b.asiento_numero);

    // 4. Calcular saldos acumulados
    let saldo = 0;
    const movimientosConSaldo = movimientos.map(m => {
        saldo += (m.debe || 0) - (m.haber || 0);
        return { ...m, saldo };
    });

    return movimientosConSaldo;
};
