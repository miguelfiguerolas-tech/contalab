// Grupos del PGC, para filtros de navegación
export const PGC_GRUPOS = {
    '1': 'Financiación Básica',
    '2': 'Inmovilizado',
    '3': 'Existencias',
    '4': 'Acreedores y Deudores',
    '5': 'Cuentas Financieras',
    '6': 'Compras y Gastos',
    '7': 'Ventas e Ingresos'
};

export const BALANCE_STRUCTURE = {
    activo: [
        {
            id: 'A_NC',
            label: 'A) ACTIVO NO CORRIENTE',
            children: [
                {
                    id: 'A_NC_I',
                    label: 'I. Inmovilizado intangible',
                    accounts: ['20', '280', '290']
                },
                {
                    id: 'A_NC_II',
                    label: 'II. Inmovilizado material',
                    accounts: ['21', '23', '281', '291']
                },
                {
                    id: 'A_NC_III',
                    label: 'III. Inversiones inmobiliarias',
                    accounts: ['22', '282', '292']
                },
                {
                    id: 'A_NC_IV',
                    label: 'IV. Inversiones en empresas del grupo y asociadas a largo plazo',
                    accounts: ['240', '241', '242', '249', '293', '294', '295']
                },
                {
                    id: 'A_NC_V',
                    label: 'V. Inversiones financieras a largo plazo',
                    accounts: ['24', '25', '26', '29'] // Excluyendo las anteriores por orden de match o especificidad
                },
                {
                    id: 'A_NC_VI',
                    label: 'VI. Activos por impuesto diferido',
                    accounts: ['474']
                }
            ]
        },
        {
            id: 'A_C',
            label: 'B) ACTIVO CORRIENTE',
            children: [
                {
                    id: 'A_C_I',
                    label: 'I. Activos no corrientes mantenidos para la venta',
                    accounts: ['580', '581', '582', '583', '584', '599']
                },
                {
                    id: 'A_C_II',
                    label: 'II. Existencias',
                    accounts: ['30', '31', '32', '33', '34', '35', '36', '39']
                },
                {
                    id: 'A_C_III',
                    label: 'III. Deudores comerciales y otras cuentas a cobrar',
                    accounts: ['43', '44', '470', '471', '472', '558']
                },
                {
                    id: 'A_C_IV',
                    label: 'IV. Inversiones en empresas del grupo y asociadas a corto plazo',
                    accounts: ['530', '531', '532', '533', '534', '535', '539', '593', '594', '595']
                },
                {
                    id: 'A_C_V',
                    label: 'V. Inversiones financieras a corto plazo',
                    accounts: ['53', '54', '56', '59']
                },
                {
                    id: 'A_C_VI',
                    label: 'VI. Periodificaciones a corto plazo',
                    accounts: ['480', '567']
                },
                {
                    id: 'A_C_VII',
                    label: 'VII. Efectivo y otros activos líquidos equivalentes',
                    accounts: ['57']
                }
            ]
        }
    ],
    patrimonio_pasivo: [
        {
            id: 'PN',
            label: 'A) PATRIMONIO NETO',
            children: [
                {
                    id: 'PN_A1',
                    label: 'A-1) Fondos Propios',
                    children: [
                        { id: 'PN_A1_I', label: 'I. Capital', accounts: ['100', '101', '102'] },
                        { id: 'PN_A1_II', label: 'II. Prima de emisión', accounts: ['110'] },
                        { id: 'PN_A1_III', label: 'III. Reservas', accounts: ['112', '113', '114', '115', '119'] },
                        { id: 'PN_A1_IV', label: 'IV. (Acciones y participaciones en patrimonio propias)', accounts: ['108', '109'] },
                        { id: 'PN_A1_V', label: 'V. Resultados de ejercicios anteriores', accounts: ['120', '121'] },
                        { id: 'PN_A1_VI', label: 'VI. Otras aportaciones de socios', accounts: ['118'] },
                        { id: 'PN_A1_VII', label: 'VII. Resultado del ejercicio', accounts: ['129'] },
                        { id: 'PN_A1_VIII', label: 'VIII. (Dividendo a cuenta)', accounts: ['557'] }
                    ]
                },
                {
                    id: 'PN_A2',
                    label: 'A-2) Ajustes por cambios de valor',
                    accounts: ['133', '134', '135', '136']
                },
                {
                    id: 'PN_A3',
                    label: 'A-3) Subvenciones, donaciones y legados recibidos',
                    accounts: ['130', '131', '132']
                }
            ]
        },
        {
            id: 'P_NC',
            label: 'B) PASIVO NO CORRIENTE',
            children: [
                {
                    id: 'P_NC_I',
                    label: 'I. Provisiones a largo plazo',
                    accounts: ['14']
                },
                {
                    id: 'P_NC_II',
                    label: 'II. Deudas a largo plazo',
                    accounts: ['16', '17', '18']
                },
                {
                    id: 'P_NC_III',
                    label: 'III. Deudas con empresas del grupo y asociadas a largo plazo',
                    accounts: ['160', '161', '162', '163']
                },
                {
                    id: 'P_NC_IV',
                    label: 'IV. Pasivos por impuesto diferido',
                    accounts: ['479']
                }
            ]
        },
        {
            id: 'P_C',
            label: 'C) PASIVO CORRIENTE',
            children: [
                {
                    id: 'P_C_I',
                    label: 'I. Pasivos vinculados con activos no corrientes mantenidos para la venta',
                    accounts: ['585', '586', '587', '588', '589']
                },
                {
                    id: 'P_C_II',
                    label: 'II. Provisiones a corto plazo',
                    accounts: ['499', '529']
                },
                {
                    id: 'P_C_III',
                    label: 'III. Deudas a corto plazo',
                    accounts: ['50', '51', '52', '550', '559', '560', '561', '190', '192', '194']
                },
                {
                    id: 'P_C_IV',
                    label: 'IV. Deudas con empresas del grupo y asociadas a corto plazo',
                    accounts: ['510', '511', '512', '513', '514']
                },
                {
                    id: 'P_C_V',
                    label: 'V. Acreedores comerciales y otras cuentas a pagar',
                    accounts: ['40', '41', '438', '46', '475', '476', '477']
                },
                {
                    id: 'P_C_VI',
                    label: 'VI. Periodificaciones a corto plazo',
                    accounts: ['485', '568']
                }
            ]
        }
    ]
};

export const PYG_STRUCTURE = [
    {
        id: '1',
        label: '1. Importe neto de la cifra de negocios',
        accounts: ['700', '701', '702', '703', '704', '705', '706', '708', '709'],
        sign: 1
    },
    {
        id: '2',
        label: '2. Variación de existencias de productos terminados y en curso de fabricación',
        accounts: ['6930', '71', '7930'],
        sign: 1
    },
    {
        id: '3',
        label: '3. Trabajos realizados por la empresa para su activo',
        accounts: ['73'],
        sign: 1
    },
    {
        id: '4',
        label: '4. Aprovisionamientos',
        accounts: ['60', '61', '6931', '6932', '6933', '7931', '7932', '7933'],
        sign: -1
    },
    {
        id: '5',
        label: '5. Otros ingresos de explotación',
        accounts: ['74', '75'],
        sign: 1
    },
    {
        id: '6',
        label: '6. Gastos de personal',
        accounts: ['64'],
        sign: -1
    },
    {
        id: '7',
        label: '7. Otros gastos de explotación',
        accounts: ['62', '63', '65', '694', '695', '794', '7954'],
        sign: -1
    },
    {
        id: '8',
        label: '8. Amortización del inmovilizado',
        accounts: ['68'],
        sign: -1
    },
    {
        id: '9',
        label: '9. Imputación de subvenciones de inmovilizado no financiero y otras',
        accounts: ['746'],
        sign: 1
    },
    {
        id: '10',
        label: '10. Excesos de provisiones',
        accounts: ['7951', '7952', '7955', '7956'],
        sign: 1
    },
    {
        id: '11',
        label: '11. Deterioro y resultado por enajenaciones del inmovilizado',
        accounts: ['670', '671', '672', '690', '691', '692', '770', '771', '772', '790', '791', '792'],
        sign: 1 // Neto
    },
    {
        id: 'A_RES_EXPLOTACION',
        label: 'A) RESULTADO DE EXPLOTACIÓN',
        isTotal: true,
        sumIds: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
    },
    {
        id: '12',
        label: '12. Ingresos financieros',
        accounts: ['760', '761', '762', '767', '769'],
        sign: 1
    },
    {
        id: '13',
        label: '13. Gastos financieros',
        accounts: ['660', '661', '662', '664', '665', '669'],
        sign: -1
    },
    {
        id: '14',
        label: '14. Variación de valor razonable en instrumentos financieros',
        accounts: ['663', '763'],
        sign: 1 // Neto
    },
    {
        id: '15',
        label: '15. Diferencias de cambio',
        accounts: ['668', '768'],
        sign: 1 // Neto
    },
    {
        id: '16',
        label: '16. Deterioro y resultado por enajenaciones de instrumentos financieros',
        accounts: ['666', '667', '673', '675', '696', '697', '698', '699', '766', '773', '775', '796', '797', '798', '799'],
        sign: 1 // Neto
    },
    {
        id: 'B_RES_FINANCIERO',
        label: 'B) RESULTADO FINANCIERO',
        isTotal: true,
        sumIds: ['12', '13', '14', '15', '16']
    },
    {
        id: 'C_RES_ANTES_IMPUESTOS',
        label: 'C) RESULTADO ANTES DE IMPUESTOS',
        isTotal: true,
        sumIds: ['A_RES_EXPLOTACION', 'B_RES_FINANCIERO']
    },
    {
        id: '17',
        label: '17. Impuestos sobre beneficios',
        accounts: ['630', '633', '638'],
        sign: -1
    },
    {
        id: 'D_RES_EJERCICIO',
        label: 'D) RESULTADO DEL EJERCICIO',
        isTotal: true,
        sumIds: ['C_RES_ANTES_IMPUESTOS', '17']
    }
];
