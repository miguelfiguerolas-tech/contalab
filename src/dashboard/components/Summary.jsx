import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Scale, Lock } from 'lucide-react';
import { getAsientos } from '../../db';
import { getSumasYSaldos, getBalanceSituacion, getCuentaResultados } from '../../db/balances';
import { crearAsientoRegularizacion, crearAsientoCierre } from '../../db/cierre';
import { formatCurrency } from '../../utils/format';

export default function Summary({ ejercicio, onVerCuenta }) {
    const [audit, setAudit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cierreMsg, setCierreMsg] = useState({ type: '', text: '' });
    const [working, setWorking] = useState(false);

    useEffect(() => {
        runAudit();
    }, [ejercicio.id]);

    const runAudit = async () => {
        setLoading(true);
        try {
            const [asientos, sumas, balance, pyg] = await Promise.all([
                getAsientos(ejercicio.id),
                getSumasYSaldos(ejercicio.id),
                getBalanceSituacion(ejercicio.id),
                getCuentaResultados(ejercicio.id)
            ]);

            // 1. Validar Cuadre Diario Global
            const totalDebe = sumas.reduce((acc, c) => acc + c.sumaDebe, 0);
            const totalHaber = sumas.reduce((acc, c) => acc + c.sumaHaber, 0);
            const descuadreDiario = Math.abs(totalDebe - totalHaber);

            // 2. Validar Tesorería Negativa (Cuentas 57...)
            const tesoreriaRoja = sumas.filter(c => c.codigo.startsWith('57') && c.saldoAcreedor > 0);

            // 3. Validar Ecuación Contable
            const totalActivo = balance.activo.reduce((s, node) => s + node.amount, 0);
            const totalPatrimonioPasivo = balance.patrimonioPasivo.reduce((s, node) => s + node.amount, 0);
            const ecuacionDiff = Math.abs(totalActivo - totalPatrimonioPasivo);

            // 4. Obtener Resultado del Ejercicio
            const filaResultado = pyg.find(row => row.id === 'D_RES_EJERCICIO');
            const resultadoPyG = filaResultado ? filaResultado.amount : 0;

            // 5. Detectar Apertura y Cierre
            // getAsientos devuelve orden descendente: ordenamos por número para
            // mirar el primero y el último asiento reales del diario.
            const porNumero = [...asientos].sort((a, b) => a.numero - b.numero);
            const tieneApertura = porNumero.length > 0 && porNumero[0].concepto.toLowerCase().includes('apertura');
            const tieneCierre = porNumero.length > 0 && porNumero[porNumero.length - 1].concepto.toLowerCase().includes('cierre');

            // 5b. Rango de redacción (cuándo se crearon los asientos), para la ficha de entrega
            const fechasCreacion = asientos.map(a => a.created_at).filter(Boolean).sort();
            const redaccion = fechasCreacion.length > 0
                ? { desde: fechasCreacion[0], hasta: fechasCreacion[fechasCreacion.length - 1] }
                : null;

            // 6. Saldos Antinaturales
            const saldosAntinaturales = sumas.filter(c => {
                const esProveedor = (c.codigo.startsWith('40') || c.codigo.startsWith('41')) && c.saldoDeudor > c.saldoAcreedor;
                const esCliente = c.codigo.startsWith('43') && c.saldoAcreedor > c.saldoDeudor;
                return esProveedor || esCliente;
            });

            // 6b. Gastos/Ingresos con saldo invertido (suele ser un asiento al revés).
            // Se excluyen las cuentas que legítimamente llevan signo contrario:
            // 606/608/609 (rappels y devoluciones de compras), 706/708/709 (de ventas)
            // y la variación de existencias (61/71), que puede ir en ambos sentidos.
            const esExcepcionSigno = (codigo) =>
                /^(606|608|609|706|708|709|61|71)/.test(codigo);
            const gastosIngresosInvertidos = sumas.filter(c => {
                if (esExcepcionSigno(c.codigo)) return false;
                const gastoAcreedor = c.codigo.startsWith('6') && c.saldoAcreedor > c.saldoDeudor;
                const ingresoDeudor = c.codigo.startsWith('7') && c.saldoDeudor > c.saldoAcreedor;
                return gastoAcreedor || ingresoDeudor;
            });

            // 7. Olvido de Amortización
            const tieneInmovilizado = sumas.some(c => c.codigo.startsWith('2'));
            const tieneGastoAmortizacion = sumas.some(c => c.codigo.startsWith('68'));
            const olvidoAmortizacion = tieneInmovilizado && !tieneGastoAmortizacion;

            // 8. Olvido de Variación de Existencias
            const tieneExistencias = sumas.some(c => c.codigo.startsWith('3'));
            const tieneVariacion = sumas.some(c => c.codigo.startsWith('61') || c.codigo.startsWith('71'));
            const olvidoVariacion = tieneExistencias && !tieneVariacion;

            setAudit({
                totalDebe,
                totalHaber,
                descuadreDiario,
                tesoreriaRoja,
                resultado: resultadoPyG,
                totalActivo,
                numAsientos: asientos.length,
                tieneApertura,
                tieneCierre,
                redaccion,
                ecuacionDiff,
                saldosAntinaturales,
                gastosIngresosInvertidos,
                olvidoAmortizacion,
                olvidoVariacion
            });

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegularizar = async () => {
        if (!confirm(`Se creará el asiento de regularización a 31/12/${ejercicio.anyo}: salda todas las cuentas de los grupos 6 y 7 contra la 129. ¿Continuar?`)) return;
        setWorking(true);
        setCierreMsg({ type: '', text: '' });
        try {
            const resultado = await crearAsientoRegularizacion(ejercicio.id, ejercicio.anyo);
            setCierreMsg({ type: 'success', text: `Asiento de regularización creado. Resultado del ejercicio: ${formatCurrency(resultado)}. Puedes verlo (o borrarlo para deshacer) en el Libro Diario.` });
            runAudit();
        } catch (error) {
            setCierreMsg({ type: 'error', text: error.message });
        } finally {
            setWorking(false);
        }
    };

    const handleCerrar = async () => {
        if (!confirm(`Se creará el asiento de cierre a 31/12/${ejercicio.anyo}: salda TODAS las cuentas y deja los balances a cero. ¿Continuar?`)) return;
        setWorking(true);
        setCierreMsg({ type: '', text: '' });
        try {
            await crearAsientoCierre(ejercicio.id, ejercicio.anyo);
            setCierreMsg({ type: 'success', text: 'Asiento de cierre creado. Es normal que ahora los balances queden a cero: el ejercicio está cerrado. Bórralo en el Diario si quieres deshacerlo.' });
            runAudit();
        } catch (error) {
            setCierreMsg({ type: 'error', text: error.message });
        } finally {
            setWorking(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Analizando contabilidad...</div>;

    if (!audit) return null;

    const fmtFecha = (iso) => iso ? new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

            {/* FICHA DE ENTREGA: solo para ejercicios importados */}
            {ejercicio.entrega && (
                <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--color-primary)' }}>
                    <h4 className="title-md" style={{ marginBottom: '1rem' }}>
                        📋 Ficha de entrega (ejercicio importado)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                        <div>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Nombre original</p>
                            <p style={{ fontWeight: 500 }}>{ejercicio.entrega.nombre_original || '—'}</p>
                        </div>
                        <div>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Huella del contenido</p>
                            <p style={{ fontWeight: 500, fontFamily: 'monospace' }}>{ejercicio.entrega.huella || 'sin huella (export antiguo)'}</p>
                        </div>
                        <div>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Instalación de origen</p>
                            <p style={{ fontWeight: 500, fontFamily: 'monospace' }}>{ejercicio.entrega.instalacion_id ? ejercicio.entrega.instalacion_id.slice(0, 8) : '—'}</p>
                        </div>
                        <div>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Exportado el</p>
                            <p style={{ fontWeight: 500 }}>{fmtFecha(ejercicio.entrega.fecha_exportacion)}</p>
                        </div>
                        {audit.redaccion && (
                            <div>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Asientos redactados entre</p>
                                <p style={{ fontWeight: 500 }}>{fmtFecha(audit.redaccion.desde)} y {fmtFecha(audit.redaccion.hasta)}</p>
                            </div>
                        )}
                    </div>
                    <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        Dos entregas con la misma <strong>huella</strong> son archivos con idéntico contenido contable (copia directa).
                        La misma <strong>instalación de origen</strong> indica que salieron del mismo navegador.
                    </p>
                </div>
            )}

            {/* SECCIÓN 1: VALIDACIONES CRÍTICAS (SEMÁFORO) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

                <StatusCard
                    title="Integridad del Diario"
                    status={audit.descuadreDiario < 0.01 ? 'ok' : 'error'}
                    value={audit.descuadreDiario < 0.01 ? 'Cuadrado' : `Descuadre: ${formatCurrency(audit.descuadreDiario)}`}
                    description="Suma del Debe vs Suma del Haber en todos los asientos."
                />

                <StatusCard
                    title="Coherencia Tesorería (57)"
                    status={audit.tesoreriaRoja.length === 0 ? 'ok' : 'warning'}
                    value={audit.tesoreriaRoja.length === 0 ? 'Correcto' : `${audit.tesoreriaRoja.length} cta(s) en negativo`}
                    description={audit.tesoreriaRoja.length > 0 ? 'Revisar en el Mayor:' : "No hay saldos acreedores en Caja/Bancos."}
                    accounts={audit.tesoreriaRoja.map(c => c.codigo)}
                    onAccountClick={onVerCuenta}
                />

                <StatusCard
                    title="Ecuación Contable"
                    status={audit.ecuacionDiff < 0.01 ? 'ok' : 'warning'}
                    value={audit.ecuacionDiff < 0.01 ? 'Cuadrada' : 'Posible Error'}
                    description="Activo = Pasivo + Neto + Resultado"
                />

                <StatusCard
                    title="Saldos Coherentes"
                    status={audit.saldosAntinaturales.length === 0 ? 'ok' : 'warning'}
                    value={audit.saldosAntinaturales.length === 0 ? 'Correcto' : `${audit.saldosAntinaturales.length} cta(s) extrañas`}
                    description={audit.saldosAntinaturales.length > 0 ? 'Revisar en el Mayor:' : "Clientes y Proveedores con signo correcto."}
                    accounts={audit.saldosAntinaturales.map(c => c.codigo)}
                    onAccountClick={onVerCuenta}
                />

                <StatusCard
                    title="Amortización Inmovilizado"
                    status={!audit.olvidoAmortizacion ? 'ok' : 'error'}
                    value={!audit.olvidoAmortizacion ? 'Correcto' : 'Falta Amortizar'}
                    description={!audit.olvidoAmortizacion
                        ? "Se detectan gastos de amortización o no hay activos."
                        : "Tienes activos (G2) pero no has amortizado (68)."}
                />

                <StatusCard
                    title="Signo de Gastos e Ingresos"
                    status={audit.gastosIngresosInvertidos.length === 0 ? 'ok' : 'error'}
                    value={audit.gastosIngresosInvertidos.length === 0 ? 'Correcto' : `${audit.gastosIngresosInvertidos.length} cta(s) invertidas`}
                    description={audit.gastosIngresosInvertidos.length > 0
                        ? 'Gasto al Haber o ingreso al Debe: suele ser un asiento al revés.'
                        : 'Gastos con saldo deudor e ingresos con saldo acreedor.'}
                    accounts={audit.gastosIngresosInvertidos.map(c => c.codigo)}
                    onAccountClick={onVerCuenta}
                />

                <StatusCard
                    title="Ciclo Contable"
                    status={audit.tieneApertura && audit.tieneCierre ? 'ok' : 'warning'}
                    value={
                        audit.tieneApertura && audit.tieneCierre ? 'Completo' :
                            audit.tieneApertura ? 'Falta cierre' :
                                audit.tieneCierre ? 'Falta apertura' : 'Sin apertura ni cierre'
                    }
                    description={'Se busca "apertura" en el primer asiento y "cierre" en el último. Puede no aplicar a tu ejercicio.'}
                />

                <StatusCard
                    title="Variación de Existencias"
                    status={!audit.olvidoVariacion ? 'ok' : 'error'}
                    value={!audit.olvidoVariacion ? 'Correcto' : 'Falta Variación'}
                    description={!audit.olvidoVariacion
                        ? "Se detecta variación o no hay existencias."
                        : "Tienes existencias (G3) pero no has regularizado (61/71)."}
                />
            </div>

            {/* SECCIÓN 2: DATOS CLAVE PARA LA NOTA */}
            <h4 className="title-md" style={{ marginBottom: '1rem' }}>Cifras Clave del Ejercicio</h4>
            <div className="card" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', textAlign: 'center' }}>
                <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Resultado (Beneficio/Pérdida)</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: audit.resultado >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {formatCurrency(audit.resultado)}
                    </p>
                </div>
                <div style={{ borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Total Activo</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                        {formatCurrency(audit.totalActivo)}
                    </p>
                </div>
                <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Nº de Asientos</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                        {audit.numAsientos}
                    </p>
                </div>
            </div>

            {/* SECCIÓN 3: ASISTENTE DE CIERRE */}
            <h4 className="title-md" style={{ marginBottom: '1rem' }}>Cierre del Ejercicio (Asistente)</h4>
            <div className="card" style={{ marginBottom: '2rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                    Genera los asientos reales del ciclo contable a 31/12/{ejercicio.anyo}, en dos pasos y en este orden.
                    Ambos aparecen en el Libro Diario como asientos normales: puedes revisarlos y borrarlos para deshacer.
                </p>

                {cierreMsg.text && (
                    <div style={{
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                        background: cierreMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                        color: cierreMsg.type === 'success' ? '#166534' : '#991b1b',
                        border: `1px solid ${cierreMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                    }}>
                        {cierreMsg.text}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleRegularizar}
                        disabled={working}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Scale size={18} />
                        1. Asiento de Regularización (6/7 → 129)
                    </button>
                    <button
                        className="btn"
                        onClick={handleCerrar}
                        disabled={working}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid var(--color-border)' }}
                    >
                        <Lock size={18} />
                        2. Asiento de Cierre
                    </button>
                </div>
            </div>

        </div>
    );
}

function StatusCard({ title, status, value, description, accounts = [], onAccountClick }) {
    const colors = {
        ok: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', icon: <CheckCircle size={24} /> },
        warning: { bg: '#fefce8', border: '#fde047', text: '#854d0e', icon: <AlertTriangle size={24} /> },
        error: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: <XCircle size={24} /> }
    };
    const c = colors[status];

    return (
        <div style={{
            background: c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: c.text }}>
                {c.icon}
                <span style={{ fontWeight: 'bold' }}>{title}</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#1e293b' }}>
                {value}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                {description}
            </div>
            {accounts.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
                    {accounts.map(codigo => (
                        <button
                            key={codigo}
                            onClick={() => onAccountClick && onAccountClick(codigo)}
                            title={`Ver el mayor de la cuenta ${codigo}`}
                            style={{
                                fontFamily: 'monospace',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                border: `1px solid ${c.border}`,
                                background: 'rgba(255,255,255,0.7)',
                                color: c.text,
                                cursor: onAccountClick ? 'pointer' : 'default'
                            }}
                        >
                            {codigo} →
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}


