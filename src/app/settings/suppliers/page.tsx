'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card, Button } from '@/components/ui';
import styles from './page.module.css';

interface Supplier {
    id: string;
    name: string;
    contact: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function SuppliersPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        email: '',
        phone: '',
        address: '',
    });

    const fetchSuppliers = useCallback(async () => {
        if (!currentFarm?.id) return;

        setLoading(true);
        try {
            const response = await fetch('/api/suppliers', {
                headers: { 'X-Farm-ID': currentFarm.id },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setSuppliers(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch suppliers:', error);
        } finally {
            setLoading(false);
        }
    }, [currentFarm?.id]);

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/auth/signin');
            return;
        }
        fetchSuppliers();
    }, [isAuthLoading, isAuthenticated, router, fetchSuppliers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentFarm?.id) return;

        try {
            const url = editingSupplier
                ? `/api/suppliers/${editingSupplier.id}`
                : '/api/suppliers';

            const response = await fetch(url, {
                method: editingSupplier ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Farm-ID': currentFarm.id,
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setShowModal(false);
                setEditingSupplier(null);
                setFormData({ name: '', contact: '', email: '', phone: '', address: '' });
                fetchSuppliers();
            }
        } catch (error) {
            console.error('Failed to save supplier:', error);
        }
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            contact: supplier.contact || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!currentFarm?.id || !confirm('Are you sure you want to delete this supplier?')) return;

        try {
            const response = await fetch(`/api/suppliers/${id}`, {
                method: 'DELETE',
                headers: { 'X-Farm-ID': currentFarm.id },
                credentials: 'include',
            });

            if (response.ok) {
                fetchSuppliers();
            }
        } catch (error) {
            console.error('Failed to delete supplier:', error);
        }
    };

    const handleAddNew = () => {
        setEditingSupplier(null);
        setFormData({ name: '', contact: '', email: '', phone: '', address: '' });
        setShowModal(true);
    };

    if (isAuthLoading || loading) {
        return <div className={styles.loading}>Loading suppliers...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>🏢 Supplier Management</h1>
                    <p>Manage supplier information, contacts, and relationships</p>
                </div>
                <Button variant="primary" onClick={handleAddNew}>
                    + Add Supplier
                </Button>
            </div>

            <div className={styles.suppliersGrid}>
                {suppliers.length === 0 ? (
                    <Card className={styles.emptyState}>
                        <p>No suppliers found. Add your first supplier to get started.</p>
                        <Button variant="primary" onClick={handleAddNew}>
                            Add Supplier
                        </Button>
                    </Card>
                ) : (
                    suppliers.map((supplier) => (
                        <Card key={supplier.id} className={styles.supplierCard}>
                            <div className={styles.supplierHeader}>
                                <h3>{supplier.name}</h3>
                                <div className={styles.actions}>
                                    <button onClick={() => handleEdit(supplier)} className={styles.editBtn}>
                                        ✏️
                                    </button>
                                    <button onClick={() => handleDelete(supplier.id)} className={styles.deleteBtn}>
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            <div className={styles.supplierDetails}>
                                {supplier.contact && (
                                    <div className={styles.detail}>
                                        <span className={styles.label}>Contact:</span>
                                        <span>{supplier.contact}</span>
                                    </div>
                                )}
                                {supplier.email && (
                                    <div className={styles.detail}>
                                        <span className={styles.label}>Email:</span>
                                        <a href={`mailto:${supplier.email}`}>{supplier.email}</a>
                                    </div>
                                )}
                                {supplier.phone && (
                                    <div className={styles.detail}>
                                        <span className={styles.label}>Phone:</span>
                                        <a href={`tel:${supplier.phone}`}>{supplier.phone}</a>
                                    </div>
                                )}
                                {supplier.address && (
                                    <div className={styles.detail}>
                                        <span className={styles.label}>Address:</span>
                                        <span>{supplier.address}</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Supplier name"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Contact Person</label>
                                <input
                                    type="text"
                                    value={formData.contact}
                                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                    placeholder="Contact person name"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Full address"
                                    rows={3}
                                />
                            </div>
                            <div className={styles.formActions}>
                                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary">
                                    {editingSupplier ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
