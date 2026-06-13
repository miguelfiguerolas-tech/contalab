// Formato español: miles con punto y decimales con coma (1.234,56).
// useGrouping 'always' fuerza el punto también en miles de 4 cifras (1.000),
// que es lo habitual en contabilidad aunque la RAE lo omita.
const makeFormatter = (options) => {
    try {
        return new Intl.NumberFormat('es-ES', { ...options, useGrouping: 'always' });
    } catch (e) {
        // Navegadores antiguos sin useGrouping 'always'
        return new Intl.NumberFormat('es-ES', options);
    }
};

const CURRENCY = makeFormatter({
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const NUMBER = makeFormatter({
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

export const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '-';
    return CURRENCY.format(Number(amount));
};

// Como formatCurrency pero sin el símbolo €, para columnas Debe/Haber
export const formatNumber = (amount) => {
    if (amount === undefined || amount === null || amount === '') return '-';
    return NUMBER.format(Number(amount));
};
