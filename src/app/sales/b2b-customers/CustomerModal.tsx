'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/components/TenantProvider';
import styles from './CustomerModal.module.css';

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (customer: any) => void;
    customer?: any;
    mode: 'add' | 'edit';
}

export default function CustomerModal({
    isOpen,
    onClose,
    onSave,
    customer = null,
    mode = 'add'
}: CustomerModalProps) {
    const { currentFarm } = useTenant();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        businessName: '',
        businessType: 'Restaurant',
        contactPerson: '',
        street: '',
        city: '',
        state: 'OR',
        zipCode: '',
        country: 'USA',
        paymentTerms: 'Net 30',
        creditLimit: 5000,
        orderFrequency: 'Weekly',
        preferredVarieties: 'Microgreens assortment',
        status: 'ACTIVE'
    });

    // Populate form when editing
    useEffect(() => {
        if (mode === 'edit' && customer) {
            // For editing, extract address components from the combined address string
            const addressParts = customer.address ? customer.address.split(' ') : [];
            const extractedZip = addressParts.length > 0 ? addressParts[addressParts.length - 1] : '';
            const extractedState = addressParts.length > 1 ? addressParts[addressParts.length - 2] : 'OR';

            setFormData({
                name: customer.name || customer.businessName || '',
                email: customer.email || '',
                phone: customer.phone || '',
                businessName: customer.businessName || customer.name || '',
                businessType: customer.businessType || 'Restaurant',
                contactPerson: customer.contactPerson || '',
                street: customer.street || '',
                city: customer.city || '',
                state: customer.state || extractedState || 'OR',
                zipCode: customer.zipCode || extractedZip || '',
                country: customer.country || 'USA',
                paymentTerms: customer.paymentTerms || 'Net 30',
                creditLimit: customer.creditLimit || 5000,
                orderFrequency: customer.orderFrequency || 'Weekly',
                preferredVarieties: customer.preferredVarieties || 'Microgreens assortment',
                status: customer.status || 'ACTIVE'
            });
        } else {
            // Reset form for add mode
            setFormData({
                name: '',
                email: '',
                phone: '',
                businessName: '',
                businessType: 'Restaurant',
                contactPerson: '',
                street: '',
                city: '',
                state: 'OR',
                zipCode: '',
                country: 'USA',
                paymentTerms: 'Net 30',
                creditLimit: 5000,
                orderFrequency: 'Weekly',
                preferredVarieties: 'Microgreens assortment',
                status: 'ACTIVE'
            });
        }
    }, [mode, customer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentFarm?.id) {
            setError('No farm context available');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const method = mode === 'edit' ? 'PUT' : 'POST';
            const url = mode === 'edit' ? `/api/customers/${customer.id}` : '/api/customers';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Farm-ID': currentFarm.id
                },
                body: JSON.stringify({
                    ...formData,
                    name: formData.businessName, // Set name to businessName for consistency
                    type: 'B2B' // Always B2B for this modal
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save customer');
            }

            const savedCustomer = await response.json();
            onSave(savedCustomer.data);
            onClose();

        } catch (err) {
            console.error('Error saving customer:', err);
            setError(err instanceof Error ? err.message : 'Failed to save customer');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'creditLimit' ? Number(value) : value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2>{mode === 'add' ? 'Add New B2B Customer' : 'Edit Customer'}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalBody}>
                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Business Name *</label>
                            <input
                                type="text"
                                name="businessName"
                                value={formData.businessName}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Green Earth Restaurant"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Business Type *</label>
                            <select
                                name="businessType"
                                value={formData.businessType}
                                onChange={handleChange}
                                required
                            >
                                <option value="Restaurant">Restaurant</option>
                                <option value="Cafe">Cafe</option>
                                <option value="Retail">Retail Store</option>
                                <option value="Juice Bar">Juice Bar</option>
                                <option value="Market">Market</option>
                                <option value="Deli">Deli</option>
                                <option value="Grocery">Grocery Store</option>
                                <option value="Distributor">Distributor</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Contact Person *</label>
                            <input
                                type="text"
                                name="contactPerson"
                                value={formData.contactPerson}
                                onChange={handleChange}
                                required
                                placeholder="e.g., John Smith"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="contact@business.com"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="(555) 123-4567"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Street Address</label>
                            <input
                                type="text"
                                name="street"
                                value={formData.street}
                                onChange={handleChange}
                                placeholder="123 Main St"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>City</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Portland"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>State</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                placeholder="OR"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>ZIP Code</label>
                            <input
                                type="text"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleChange}
                                placeholder="97201"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Payment Terms</label>
                            <select
                                name="paymentTerms"
                                value={formData.paymentTerms}
                                onChange={handleChange}
                            >
                                <option value="Net 15">Net 15</option>
                                <option value="Net 30">Net 30</option>
                                <option value="Net 60">Net 60</option>
                                <option value="COD">Cash on Delivery</option>
                                <option value="Prepaid">Prepaid</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Credit Limit</label>
                            <input
                                type="number"
                                name="creditLimit"
                                value={formData.creditLimit}
                                onChange={handleChange}
                                min="0"
                                step="100"
                                placeholder="5000"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Order Frequency</label>
                            <select
                                name="orderFrequency"
                                value={formData.orderFrequency}
                                onChange={handleChange}
                            >
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Bi-weekly">Bi-weekly</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Seasonal">Seasonal</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="SUSPENDED">Suspended</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Preferred Varieties</label>
                            <input
                                type="text"
                                name="preferredVarieties"
                                value={formData.preferredVarieties}
                                onChange={handleChange}
                                placeholder="Microgreens assortment"
                            />
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={styles.saveButton}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : mode === 'add' ? 'Add Customer' : 'Update Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 