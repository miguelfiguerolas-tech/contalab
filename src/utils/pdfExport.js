import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatNumber } from './format';

// Exporta el Libro Diario completo: cada asiento con su cabecera y sus líneas.
export const exportDiarioToPDF = (asientos, cuentasMap, ejercicio) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text('Libro Diario', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Empresa/Ejercicio: ${ejercicio.nombre}`, 14, 30);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 35);

    // El diario se presenta en orden cronológico ascendente
    const ordenados = [...asientos].sort((a, b) =>
        new Date(a.fecha) - new Date(b.fecha) || a.numero - b.numero
    );

    const body = [];
    ordenados.forEach(asiento => {
        body.push([{
            content: `Asiento #${asiento.numero}  ·  ${new Date(asiento.fecha).toLocaleDateString('es-ES')}  ·  ${asiento.concepto}`,
            colSpan: 5,
            styles: { fontStyle: 'bold', fillColor: [241, 245, 249] }
        }]);

        (asiento.apuntes || []).forEach(ap => {
            body.push([
                ap.cuenta_codigo,
                cuentasMap[ap.cuenta_codigo] || '',
                ap.concepto_linea || '',
                ap.debe ? formatNumber(ap.debe) : '',
                ap.haber ? formatNumber(ap.haber) : ''
            ]);
        });
    });

    autoTable(doc, {
        startY: 45,
        head: [['Cuenta', 'Nombre', 'Concepto', 'Debe (€)', 'Haber (€)']],
        body,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 18 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 45 },
            3: { halign: 'right', cellWidth: 24 },
            4: { halign: 'right', cellWidth: 24 }
        }
    });

    doc.save(`Libro_Diario_${ejercicio.nombre}.pdf`);
};

// Exporta el mayor de una cuenta: extracto con saldo acumulado.
export const exportMayorToPDF = (movimientos, cuenta, ejercicio) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(`Libro Mayor — ${cuenta.codigo} ${cuenta.nombre}`, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Empresa/Ejercicio: ${ejercicio.nombre}`, 14, 30);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 35);

    const sumaDebe = movimientos.reduce((s, m) => s + (m.debe || 0), 0);
    const sumaHaber = movimientos.reduce((s, m) => s + (m.haber || 0), 0);
    const saldoFinal = sumaDebe - sumaHaber;

    const body = movimientos.map(m => [
        new Date(m.fecha).toLocaleDateString('es-ES'),
        `#${m.asiento_numero}`,
        m.concepto_linea || '',
        m.debe ? formatNumber(m.debe) : '',
        m.haber ? formatNumber(m.haber) : '',
        formatNumber(m.saldo)
    ]);

    body.push([
        { content: 'SUMAS Y SALDO FINAL', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right' } },
        { content: formatNumber(sumaDebe), styles: { fontStyle: 'bold', halign: 'right' } },
        { content: formatNumber(sumaHaber), styles: { fontStyle: 'bold', halign: 'right' } },
        { content: `${formatNumber(Math.abs(saldoFinal))} ${saldoFinal >= 0 ? 'D' : 'A'}`, styles: { fontStyle: 'bold', halign: 'right' } }
    ]);

    autoTable(doc, {
        startY: 45,
        head: [['Fecha', 'Asiento', 'Concepto', 'Debe (€)', 'Haber (€)', 'Saldo (€)']],
        body,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 16 },
            3: { halign: 'right', cellWidth: 24 },
            4: { halign: 'right', cellWidth: 24 },
            5: { halign: 'right', cellWidth: 26 }
        }
    });

    doc.save(`Mayor_${cuenta.codigo}_${ejercicio.nombre}.pdf`);
};

export const exportToPDF = (type, data, ejercicio) => {
    const doc = new jsPDF();
    const title = type === 'sumas' ? 'Balance de Sumas y Saldos' :
        type === 'situacion' ? 'Balance de Situación' :
            'Cuenta de Pérdidas y Ganancias';

    // Header
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(title, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Empresa/Ejercicio: ${ejercicio.nombre}`, 14, 30);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 35);

    let startY = 45;

    if (type === 'sumas') {
        generateSumasTable(doc, data, startY);
    } else if (type === 'situacion') {
        generateSituacionTable(doc, data, startY);
    } else if (type === 'pyg') {
        generatePyGTable(doc, data, startY);
    }

    doc.save(`${title.replace(/\s+/g, '_')}_${ejercicio.nombre}.pdf`);
};



const generateSumasTable = (doc, data, startY) => {
    const tableData = data.map(row => [
        row.codigo,
        row.nombre,
        formatCurrency(row.sumaDebe),
        formatCurrency(row.sumaHaber),
        formatCurrency(row.saldoDeudor),
        formatCurrency(row.saldoAcreedor)
    ]);

    // Totales
    const totalSumaDebe = data.reduce((acc, curr) => acc + curr.sumaDebe, 0);
    const totalSumaHaber = data.reduce((acc, curr) => acc + curr.sumaHaber, 0);
    const totalSaldoDeudor = data.reduce((acc, curr) => acc + curr.saldoDeudor, 0);
    const totalSaldoAcreedor = data.reduce((acc, curr) => acc + curr.saldoAcreedor, 0);

    tableData.push([
        { content: 'TOTALES', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } },
        { content: formatCurrency(totalSumaDebe), styles: { fontStyle: 'bold' } },
        { content: formatCurrency(totalSumaHaber), styles: { fontStyle: 'bold' } },
        { content: formatCurrency(totalSaldoDeudor), styles: { fontStyle: 'bold' } },
        { content: formatCurrency(totalSaldoAcreedor), styles: { fontStyle: 'bold' } }
    ]);

    autoTable(doc, {
        startY: startY,
        head: [['Cuenta', 'Nombre', 'Suma Debe', 'Suma Haber', 'S. Deudor', 'S. Acreedor']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] }, // Blue
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 'auto' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' }
        },
        styles: { fontSize: 8 }
    });
};

const generateSituacionTable = (doc, data, startY) => {
    // Flatten helper
    const flatten = (nodes, level = 0) => {
        let rows = [];
        nodes.forEach(node => {
            // Mostrar solo si tiene importe o es un grupo principal (level <= 1)
            if (node.amount !== 0 || level <= 1) {
                const indent = " ".repeat(level * 4); // Indentación visual con espacios
                rows.push({
                    label: indent + node.label,
                    amount: node.amount,
                    level: level
                });
                if (node.children) {
                    rows = rows.concat(flatten(node.children, level + 1));
                }
            }
        });
        return rows;
    };

    const activoRows = flatten(data.activo);
    const pasivoRows = flatten(data.patrimonioPasivo);

    const totalActivo = data.activo.reduce((acc, node) => acc + node.amount, 0);
    const totalPasivo = data.patrimonioPasivo.reduce((acc, node) => acc + node.amount, 0);

    // ACTIVO
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('ACTIVO', 14, startY);

    autoTable(doc, {
        startY: startY + 5,
        head: [['Concepto', 'Importe']],
        body: [
            ...activoRows.map(r => [
                { content: r.label, styles: { fontStyle: r.level === 0 ? 'bold' : 'normal' } },
                { content: formatCurrency(r.amount), styles: { halign: 'right', fontStyle: r.level === 0 ? 'bold' : 'normal' } }
            ]),
            [
                { content: 'TOTAL ACTIVO', styles: { fontStyle: 'bold', fillColor: [240, 253, 244] } },
                { content: formatCurrency(totalActivo), styles: { fontStyle: 'bold', halign: 'right', fillColor: [240, 253, 244] } }
            ]
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1.5 },
        columnStyles: { 1: { cellWidth: 40 } }
    });

    // PASIVO (Nueva página o debajo si cabe)
    let finalY = doc.lastAutoTable.finalY + 15;

    // Check if enough space, else new page
    if (finalY > 250) {
        doc.addPage();
        finalY = 20;
    }

    doc.setFontSize(12);
    doc.text('PATRIMONIO NETO Y PASIVO', 14, finalY);

    autoTable(doc, {
        startY: finalY + 5,
        head: [['Concepto', 'Importe']],
        body: [
            ...pasivoRows.map(r => [
                { content: r.label, styles: { fontStyle: r.level === 0 ? 'bold' : 'normal' } },
                { content: formatCurrency(r.amount), styles: { halign: 'right', fontStyle: r.level === 0 ? 'bold' : 'normal' } }
            ]),
            [
                { content: 'TOTAL PATRIMONIO NETO Y PASIVO', styles: { fontStyle: 'bold', fillColor: [254, 242, 242] } },
                { content: formatCurrency(totalPasivo), styles: { fontStyle: 'bold', halign: 'right', fillColor: [254, 242, 242] } }
            ]
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1.5 },
        columnStyles: { 1: { cellWidth: 40 } }
    });
};

const generatePyGTable = (doc, data, startY) => {
    const tableData = data
        .filter(row => row) // Filter nulls
        .map(row => {
            const isTotal = row.isTotal;
            const isResult = row.id === 'D_RES_EJERCICIO';

            return [
                {
                    content: row.label,
                    styles: {
                        fontStyle: isTotal ? 'bold' : 'normal',
                        fillColor: isResult ? [240, 253, 244] : (isTotal ? [248, 250, 252] : [255, 255, 255])
                    }
                },
                {
                    content: formatCurrency(row.amount),
                    styles: {
                        halign: 'right',
                        fontStyle: isTotal ? 'bold' : 'normal',
                        textColor: row.amount < 0 ? [239, 68, 68] : [0, 0, 0],
                        fillColor: isResult ? [240, 253, 244] : (isTotal ? [248, 250, 252] : [255, 255, 255])
                    }
                }
            ];
        });

    autoTable(doc, {
        startY: startY,
        head: [['Concepto', 'Importe']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 1: { cellWidth: 40 } }
    });
};
