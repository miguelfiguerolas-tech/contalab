import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Calendar, Activity } from 'lucide-react';
import { getSumasYSaldos, getCuentaResultados } from '../../db/balances';
import { getAsientos } from '../../db';
import { formatCurrency } from '../../utils/format';
import { STORE_REVIEW_URL, FEEDBACK_MAILTO } from '../../utils/links';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardHome({ ejercicio }) {
    const [kpis, setKpis] = useState({
        ingresos: 0,
        gastos: 0,
        resultado: 0,
        tesoreria: 0
    });
    const [gastosData, setGastosData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReview, setShowReview] = useState(false);

    useEffect(() => {
        loadData();
    }, [ejercicio.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [sumas, pyg, asientos] = await Promise.all([
                getSumasYSaldos(ejercicio.id),
                getCuentaResultados(ejercicio.id), // This returns {ingresos: [], gastos: []} rows from structure
                getAsientos(ejercicio.id)
            ]);

            // 1. KPIs
            // We need raw totals, pyg returns structured rows.
            // Let's use sumas for raw calculation to be safe or parse pyg.
            // Actually, let's use sumas for flexibility.

            let totalIngresos = 0;
            let totalGastos = 0;
            let totalTesoreria = 0;

            sumas.forEach(c => {
                if (c.codigo.startsWith('7')) totalIngresos += c.saldoAcreedor - c.saldoDeudor; // G7 usually Acreedor
                if (c.codigo.startsWith('6')) totalGastos += c.saldoDeudor - c.saldoAcreedor;   // G6 usually Deudor
                if (c.codigo.startsWith('57')) totalTesoreria += c.saldoDeudor - c.saldoAcreedor; // Tesoreria usually Deudor
            });

            const resultado = totalIngresos - totalGastos;

            setKpis({
                ingresos: totalIngresos,
                gastos: totalGastos,
                resultado,
                tesoreria: totalTesoreria
            });

            // 2. Gastos Distribution (Pie Chart)
            // Filter Group 6 accounts with balance > 0
            const gastosCuentas = sumas
                .filter(c => c.codigo.startsWith('6') && (c.saldoDeudor - c.saldoAcreedor) > 0)
                .map(c => ({
                    name: c.nombre,
                    value: c.saldoDeudor - c.saldoAcreedor
                }))
                .sort((a, b) => b.value - a.value);

            // Take top 5 and group others
            let finalGastos = [];
            if (gastosCuentas.length > 5) {
                const top5 = gastosCuentas.slice(0, 5);
                const others = gastosCuentas.slice(5).reduce((acc, curr) => acc + curr.value, 0);
                finalGastos = [...top5, { name: 'Otros', value: others }];
            } else {
                finalGastos = gastosCuentas;
            }
            setGastosData(finalGastos);

            // Pedir valoración cuando ya hay uso real y aún no se ha valorado
            setShowReview(asientos.length >= 5 && !localStorage.getItem('contalab_review_done'));

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando panel de control...</div>;

    // Al valorar o enviar sugerencias, no volver a pedir nunca
    const handleReviewDone = () => {
        localStorage.setItem('contalab_review_done', '1');
        setShowReview(false);
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
            {/* Header */}
            {/* Header Date Only */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <div style={{ textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Calendar size={16} />
                        {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Petición de valoración */}
            {showReview && (
                <div className="card" style={{
                    marginBottom: '2rem',
                    background: 'linear-gradient(to right, #eff6ff, #f5f3ff)',
                    border: '1px solid #bfdbfe',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1.5rem',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ flex: 1, minWidth: '260px' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>¿Te está siendo útil ContaLab? ⭐</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            Una valoración de 5 estrellas en la Chrome Web Store ayuda a que llegue a más estudiantes.
                            Y si algo se puede mejorar, cuéntamelo.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <a
                            href={STORE_REVIEW_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={handleReviewDone}
                            className="btn btn-primary"
                            style={{ textDecoration: 'none', fontSize: '0.875rem' }}
                        >
                            ⭐ Valorar con 5 estrellas
                        </a>
                        <a
                            href={FEEDBACK_MAILTO}
                            onClick={handleReviewDone}
                            className="btn btn-secondary"
                            style={{ textDecoration: 'none', fontSize: '0.875rem' }}
                        >
                            Enviar sugerencias
                        </a>
                        <button
                            className="btn"
                            onClick={() => setShowReview(false)}
                            style={{ background: 'transparent', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}
                        >
                            Ahora no
                        </button>
                    </div>
                </div>
            )}

            {/* KPIs Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <KpiCard
                    title="Ingresos Totales"
                    amount={kpis.ingresos}
                    icon={<TrendingUp size={24} color="#059669" />}
                    bg="#ecfdf5"
                    border="#a7f3d0"
                />
                <KpiCard
                    title="Gastos Totales"
                    amount={kpis.gastos}
                    icon={<TrendingDown size={24} color="#e11d48" />}
                    bg="#fff1f2"
                    border="#fecdd3"
                />
                <KpiCard
                    title="Resultado Neto"
                    amount={kpis.resultado}
                    icon={<DollarSign size={24} color="#2563eb" />}
                    bg="#eff6ff"
                    border="#bfdbfe"
                />
                <KpiCard
                    title="Tesorería"
                    amount={kpis.tesoreria}
                    icon={<Wallet size={24} color="#7c3aed" />}
                    bg="#f5f3ff"
                    border="#ddd6fe"
                />
            </div>

            {/* Ranking de Gastos */}
            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h3 className="title-md" style={{ marginBottom: '1.5rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={20} />
                    Ranking de Gastos Principales
                </h3>

                {gastosData.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {gastosData.map((item, index) => {
                            const percentage = kpis.gastos > 0 ? (item.value / kpis.gastos) * 100 : 0;
                            const color = COLORS[index % COLORS.length];

                            return (
                                <div key={index}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                        <span style={{ fontWeight: 500, color: '#334155' }}>{item.name}</span>
                                        <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{formatCurrency(item.value)}</span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        background: '#f1f5f9',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${percentage}%`,
                                            height: '100%',
                                            background: color,
                                            borderRadius: '4px',
                                            transition: 'width 1s ease-in-out'
                                        }} />
                                    </div>
                                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                        {percentage.toFixed(1)}% del total
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <p>No hay gastos registrados todavía.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function KpiCard({ title, amount, icon, bg, border }) {
    return (
        <div style={{
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b', marginBottom: '0.25rem' }}>{title}</p>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b' }}>
                        {formatCurrency(amount)}
                    </h3>
                </div>
                <div style={{
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.6)',
                    borderRadius: '0.5rem',
                    backdropFilter: 'blur(4px)'
                }}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
