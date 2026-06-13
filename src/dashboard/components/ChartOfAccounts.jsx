import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, AlertCircle, Edit2, Save, X } from 'lucide-react';
import { getCuentas, addCuenta, updateCuenta, deleteCuenta } from '../../db';
import ConfirmModal from './ConfirmModal';
import GroupFilter from './GroupFilter';

export default function ChartOfAccounts({ ejercicio }) {
    const [cuentas, setCuentas] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [grupoFiltro, setGrupoFiltro] = useState('');
    const [formData, setFormData] = useState({ codigo: '', nombre: '' });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Estado para el modal de confirmación
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
    });

    useEffect(() => {
        loadCuentas();
    }, [ejercicio.id]);

    const loadCuentas = async () => {
        const list = await getCuentas(ejercicio.id);
        list.sort((a, b) => a.codigo.localeCompare(b.codigo));
        setCuentas(list);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validaciones
        if (!formData.codigo || !formData.nombre) {
            setError('Todos los campos son obligatorios.');
            return;
        }

        // Entre 3 y 6 dígitos: el PGC precargado usa códigos de 3-4 dígitos
        // y las subcuentas personalizadas suelen ser de 5-6.
        if (!/^\d{3,6}$/.test(formData.codigo)) {
            setError('El código de cuenta debe tener entre 3 y 6 dígitos numéricos.');
            return;
        }

        // Verificar duplicados (excluyendo la propia cuenta si estamos editando)
        const duplicado = cuentas.find(c => c.codigo === formData.codigo && c.id !== editingId);
        if (duplicado) {
            setError('Ya existe una cuenta con este código.');
            return;
        }

        if (editingId) {
            // Confirmación para editar
            setConfirmModal({
                isOpen: true,
                title: 'Confirmar Modificación',
                message: '¿Estás seguro de modificar la cuenta? Si has cambiado el código, se actualizarán automáticamente todos los asientos asociados.',
                onConfirm: async () => {
                    try {
                        await updateCuenta(editingId, formData.codigo, formData.nombre);
                        setSuccess(`Cuenta ${formData.codigo} actualizada correctamente.`);
                        setFormData({ codigo: '', nombre: '' });
                        setEditingId(null);
                        loadCuentas();
                    } catch (err) {
                        console.error(err);
                        setError(err.message || 'Error al guardar la cuenta.');
                    }
                }
            });
        } else {
            try {
                await addCuenta(ejercicio.id, formData.codigo, formData.nombre);
                setSuccess(`Cuenta ${formData.codigo} creada correctamente.`);
                setFormData({ codigo: '', nombre: '' });
                loadCuentas();
            } catch (err) {
                console.error(err);
                setError(err.message || 'Error al guardar la cuenta.');
            }
        }
    };

    const handleEdit = (cuenta) => {
        setEditingId(cuenta.id);
        setFormData({ codigo: cuenta.codigo, nombre: cuenta.nombre });
        setError('');
        setSuccess('');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ codigo: '', nombre: '' });
        setError('');
        setSuccess('');
    };

    const handleDelete = (id, codigo) => {
        setConfirmModal({
            isOpen: true,
            title: 'Confirmar Eliminación',
            message: `¿Estás seguro de eliminar la cuenta ${codigo}? Esta acción no se puede deshacer.`,
            onConfirm: async () => {
                try {
                    await deleteCuenta(id);
                    setSuccess(`Cuenta ${codigo} eliminada correctamente.`);
                    loadCuentas();
                    if (editingId === id) handleCancelEdit();
                } catch (err) {
                    console.error(err);
                    setError(err.message); // Mostrar error si tiene asientos asociados
                }
            }
        });
    };

    const filteredCuentas = cuentas.filter(c =>
        (!grupoFiltro || c.codigo.startsWith(grupoFiltro)) &&
        (c.codigo.includes(searchTerm) || c.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 150px)', position: 'relative' }}>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />

            {/* Panel Izquierdo: Lista de Cuentas */}
            <div className="card" style={{ flex: 2, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="title-md">Plan de Cuentas ({cuentas.length})</h3>
                    <div style={{ position: 'relative', width: '250px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar cuenta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem 0.5rem 0.5rem 2rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)'
                            }}
                        />
                    </div>
                </div>

                <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--color-border)', background: '#f8fafc' }}>
                    <GroupFilter value={grupoFiltro} onChange={setGrupoFiltro} />
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <table className="table-std">
                        <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                            <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem 1.5rem', width: '20%' }}>Código</th>
                                <th style={{ padding: '0.75rem 1.5rem', width: '60%' }}>Nombre de la Cuenta</th>
                                <th style={{ padding: '0.75rem 1.5rem', width: '20%', textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCuentas.map(c => (
                                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', background: editingId === c.id ? '#eff6ff' : 'transparent' }}>
                                    <td style={{ padding: '0.75rem 1.5rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                        {c.codigo}
                                    </td>
                                    <td style={{ padding: '0.75rem 1.5rem' }}>
                                        {c.nombre}
                                    </td>
                                    <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleEdit(c)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(c.id, c.codigo)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCuentas.length === 0 && (
                                <tr>
                                    <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        No se encontraron cuentas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Panel Derecho: Formulario (Crear / Editar) */}
            <div style={{ flex: 1 }}>
                <div className="card" style={{ position: 'sticky', top: 0, border: editingId ? '2px solid var(--color-primary)' : '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 className="title-md" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: editingId ? 'var(--color-primary)' : 'inherit' }}>
                            {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
                            {editingId ? 'Editar Cuenta' : 'Nueva Cuenta'}
                        </h3>
                        {editingId && (
                            <button onClick={handleCancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {error && (
                        <div style={{ padding: '0.75rem', background: '#fef2f2', color: '#991b1b', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem', display: 'flex', gap: '0.5rem' }}>
                            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{ padding: '0.75rem', background: '#f0fdf4', color: '#166534', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Código (3 a 6 dígitos)</label>
                            <input
                                type="text"
                                value={formData.codigo}
                                onChange={(e) => {
                                    // Solo permitir números y máximo 6 caracteres
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setFormData({ ...formData, codigo: val });
                                }}
                                placeholder="Ej: 430001"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontFamily: 'monospace', fontSize: '1rem' }}
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                {editingId ? 'Si cambias el código, se actualizarán todos los asientos.' : 'Debe pertenecer a un grupo existente (ej. 430...).'}
                            </p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Nombre de la Cuenta</label>
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Ej: Clientes (Empresa X)"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="btn"
                                    style={{ flex: 1, justifyContent: 'center', background: '#f1f5f9', color: 'var(--color-text-main)' }}
                                >
                                    Cancelar
                                </button>
                            )}
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ flex: 1, justifyContent: 'center' }}
                                disabled={!formData.codigo || !formData.nombre || formData.codigo.length < 3}
                            >
                                {editingId ? 'Guardar Cambios' : 'Crear Cuenta'}
                            </button>
                        </div>
                    </form>
                </div>

                {!editingId && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                        <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>💡 Consejo:</p>
                        <p>Las cuentas se ordenan automáticamente. Si creas la cuenta <strong>430001</strong>, aparecerá justo debajo de la <strong>430000</strong> en todos los listados.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
