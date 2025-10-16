'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import styles from './SeedManagementModal.module.css';

interface SeedVariety {
    id?: string;
    name: string;
    scientificName: string;
    supplier: string;
    stockQuantity: number;
    minStockLevel: number;
    unit: string;
    costPerUnit: number;
    germinationRate: number;
    daysToGermination: number;
    daysToHarvest: number;
    storageTemp: number;
    storageHumidity: number;
    lightExposure: string;
    status: string;
    isOrganic: boolean;
    lotNumber: string;
    seedSource: string;
}

interface SeedManagementModalProps {
    seed?: SeedVariety;
    isOpen: boolean;
    onClose: () => void;
    onSave: (seed: SeedVariety) => Promise<void>;
}

export default function SeedManagementModal({ seed, isOpen, onClose, onSave }: SeedManagementModalProps) {
    const [formData, setFormData] = useState<SeedVariety>({
        name: seed?.name || '',
        scientificName: seed?.scientificName || '',
        supplier: seed?.supplier || '',
        stockQuantity: seed?.stockQuantity || 0,
        minStockLevel: seed?.minStockLevel || 0,
        unit: seed?.unit || 'grams',
        costPerUnit: seed?.costPerUnit || 0,
        germinationRate: seed?.germinationRate || 0,
        daysToGermination: seed?.daysToGermination || 0,
        daysToHarvest: seed?.daysToHarvest || 0,
        storageTemp: seed?.storageTemp || 4,
        storageHumidity: seed?.storageHumidity || 50,
        lightExposure: seed?.lightExposure || 'PARTIAL',
        status: seed?.status || 'ADEQUATE',
        isOrganic: seed?.isOrganic || true,
        lotNumber: seed?.lotNumber || '',
        seedSource: seed?.seedSource || '',
        ...seed
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (field: keyof SeedVariety, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.scientificName.trim()) newErrors.scientificName = 'Scientific name is required';
        if (!formData.supplier.trim()) newErrors.supplier = 'Supplier is required';
        if (formData.stockQuantity < 0) newErrors.stockQuantity = 'Stock quantity cannot be negative';
        if (formData.minStockLevel < 0) newErrors.minStockLevel = 'Minimum stock level cannot be negative';
        if (formData.costPerUnit <= 0) newErrors.costPerUnit = 'Cost per unit must be greater than 0';
        if (formData.germinationRate < 0 || formData.germinationRate > 1) {
            newErrors.germinationRate = 'Germination rate must be between 0 and 1';
        }
        if (!formData.lotNumber.trim()) newErrors.lotNumber = 'Lot number is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving seed variety:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{seed ? 'Edit Seed Variety' : 'Add New Seed Variety'}</h2>
                    <button onClick={onClose} className={styles.closeButton}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Basic Information */}
                    <div className={styles.section}>
                        <h3>Basic Information</h3>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Name *</label>
                                <input name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className={errors.name ? styles.error : ''}
                                    placeholder="e.g., Arugula"
                                />
                                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                            </div>
                            <div className={styles.field}>
                                <label>Scientific Name *</label>
                                <input name="scientificName"
                                    type="text"
                                    value={formData.scientificName}
                                    onChange={(e) => handleInputChange('scientificName', e.target.value)}
                                    className={errors.scientificName ? styles.error : ''}
                                    placeholder="e.g., Eruca vesicaria"
                                />
                                {errors.scientificName && <span className={styles.errorText}>{errors.scientificName}</span>}
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Supplier *</label>
                                <input name="supplier"
                                    type="text"
                                    value={formData.supplier}
                                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                                    className={errors.supplier ? styles.error : ''}
                                    placeholder="e.g., Organic Seeds USA"
                                />
                                {errors.supplier && <span className={styles.errorText}>{errors.supplier}</span>}
                            </div>
                            <div className={styles.field}>
                                <label>Lot Number *</label>
                                <input name="lotNumber"
                                    type="text"
                                    value={formData.lotNumber}
                                    onChange={(e) => handleInputChange('lotNumber', e.target.value)}
                                    className={errors.lotNumber ? styles.error : ''}
                                    placeholder="e.g., ORG-ARU-2024-001"
                                />
                                {errors.lotNumber && <span className={styles.errorText}>{errors.lotNumber}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Inventory Information */}
                    <div className={styles.section}>
                        <h3>Inventory</h3>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Current Stock *</label>
                                <input name="stockQuantity"
                                    type="number"
                                    step="0.1"
                                    value={formData.stockQuantity}
                                    onChange={(e) => handleInputChange('stockQuantity', parseFloat(e.target.value) || 0)}
                                    className={errors.stockQuantity ? styles.error : ''}
                                />
                                {errors.stockQuantity && <span className={styles.errorText}>{errors.stockQuantity}</span>}
                            </div>
                            <div className={styles.field}>
                                <label>Minimum Stock Level *</label>
                                <input name="minStockLevel"
                                    type="number"
                                    step="0.1"
                                    value={formData.minStockLevel}
                                    onChange={(e) => handleInputChange('minStockLevel', parseFloat(e.target.value) || 0)}
                                    className={errors.minStockLevel ? styles.error : ''}
                                />
                                {errors.minStockLevel && <span className={styles.errorText}>{errors.minStockLevel}</span>}
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Unit</label>
                                <select name="unit"
                                    value={formData.unit}
                                    onChange={(e) => handleInputChange('unit', e.target.value)}
                                >
                                    <option value="grams">Grams</option>
                                    <option value="ounces">Ounces</option>
                                    <option value="pounds">Pounds</option>
                                    <option value="kilograms">Kilograms</option>
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label>Cost per Unit *</label>
                                <input name="costPerUnit"
                                    type="number"
                                    step="0.01"
                                    value={formData.costPerUnit}
                                    onChange={(e) => handleInputChange('costPerUnit', parseFloat(e.target.value) || 0)}
                                    className={errors.costPerUnit ? styles.error : ''}
                                />
                                {errors.costPerUnit && <span className={styles.errorText}>{errors.costPerUnit}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Growing Information */}
                    <div className={styles.section}>
                        <h3>Growing Characteristics</h3>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Germination Rate (0-1) *</label>
                                <input name="germinationRate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={formData.germinationRate}
                                    onChange={(e) => handleInputChange('germinationRate', parseFloat(e.target.value) || 0)}
                                    className={errors.germinationRate ? styles.error : ''}
                                />
                                {errors.germinationRate && <span className={styles.errorText}>{errors.germinationRate}</span>}
                            </div>
                            <div className={styles.field}>
                                <label>Days to Germination</label>
                                <input name="daysToGermination"
                                    type="number"
                                    value={formData.daysToGermination}
                                    onChange={(e) => handleInputChange('daysToGermination', parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Days to Harvest</label>
                                <input name="daysToHarvest"
                                    type="number"
                                    value={formData.daysToHarvest}
                                    onChange={(e) => handleInputChange('daysToHarvest', parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Light Exposure</label>
                                <select name="lightExposure"
                                    value={formData.lightExposure}
                                    onChange={(e) => handleInputChange('lightExposure', e.target.value)}
                                >
                                    <option value="DARK">Dark</option>
                                    <option value="PARTIAL">Partial Light</option>
                                    <option value="FULL">Full Light</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Storage Conditions */}
                    <div className={styles.section}>
                        <h3>Storage Conditions</h3>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Storage Temperature (°C)</label>
                                <input name="storageTemp"
                                    type="number"
                                    step="0.1"
                                    value={formData.storageTemp}
                                    onChange={(e) => handleInputChange('storageTemp', parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Storage Humidity (%)</label>
                                <input name="storageHumidity"
                                    type="number"
                                    step="0.1"
                                    value={formData.storageHumidity}
                                    onChange={(e) => handleInputChange('storageHumidity', parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Seed Source</label>
                                <input name="seedSource"
                                    type="text"
                                    value={formData.seedSource}
                                    onChange={(e) => handleInputChange('seedSource', e.target.value)}
                                    placeholder="e.g., Certified Organic Supplier"
                                />
                            </div>
                            <div className={styles.field}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input name="isOrganic"
                                        type="checkbox"
                                        checked={formData.isOrganic}
                                        onChange={(e) => handleInputChange('isOrganic', e.target.checked)}
                                    />
                                    Organic Certified
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'Saving...' : seed ? 'Update Variety' : 'Add Variety'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
} 