'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/components/TenantProvider';
import styles from './CropPlanModal.module.css';
import { crudService } from '@/lib/api/crudService';

interface Zone {
    id: string;
    name: string;
    type: string;
}

interface SeedVariety {
    id: string;
    name: string;
    scientificName?: string;
    daysToHarvest?: number;
}

interface CropPlan {
    id: string;
    crop: {
        id: string;
        name: string;
        scientificName?: string;
        daysToHarvest?: number;
    };
    planName: string;
    status: string;
    priority: string;
    plantingDate: string;
    harvestDate: string;
    actualStartDate?: string;
    actualEndDate?: string;
    plannedQuantity: number;
    plannedUnit: string;
    actualQuantity?: number;
    actualUnit?: string;
    expectedYield: number;
    actualYield?: number;
    zone: {
        id: string;
        name: string;
        type: string;
    };
    growingMethod: string;
    notes: string;
}

interface CropPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (cropPlan: any) => void;
    cropPlan?: CropPlan | null;
    mode: 'add' | 'edit';
}

export default function CropPlanModal({
    isOpen,
    onClose,
    onSave,
    cropPlan = null,
    mode = 'add'
}: CropPlanModalProps) {
    const { currentFarm } = useTenant();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [zones, setZones] = useState<Zone[]>([]);
    const [seedVarieties, setSeedVarieties] = useState<SeedVariety[]>([]);
    const [ready, setReady] = useState(false);

    const [formData, setFormData] = useState({
        cropName: '',
        planName: '',
        status: 'planned',
        priority: 'medium',
        zoneId: '',
        seedVarietyId: '',
        plannedStartDate: '',
        plannedEndDate: '',
        actualStartDate: '',
        actualEndDate: '',
        plannedQuantity: 0,
        plannedUnit: 'trays',
        actualQuantity: 0,
        actualUnit: 'trays',
        expectedYield: 0,
        actualYield: 0,
        growingMethod: 'soil',
        notes: ''
    });

    // Load zones and seed varieties
    useEffect(() => {
        if (isOpen && currentFarm) {
            loadZonesAndVarieties();
        }
    }, [isOpen, currentFarm]);

    // Populate form when editing
    useEffect(() => {
        if (mode === 'edit' && cropPlan) {
            setFormData({
                cropName: cropPlan.crop.name || '',
                planName: cropPlan.planName || '',
                status: cropPlan.status || 'planned',
                priority: cropPlan.priority || 'medium',
                zoneId: cropPlan.zone.id || '',
                seedVarietyId: cropPlan.crop.id || '',
                plannedStartDate: cropPlan.plantingDate ? cropPlan.plantingDate.split('T')[0] : '',
                plannedEndDate: cropPlan.harvestDate ? cropPlan.harvestDate.split('T')[0] : '',
                actualStartDate: cropPlan.actualStartDate ? cropPlan.actualStartDate.split('T')[0] : '',
                actualEndDate: cropPlan.actualEndDate ? cropPlan.actualEndDate.split('T')[0] : '',
                plannedQuantity: cropPlan.plannedQuantity || 0,
                plannedUnit: cropPlan.plannedUnit || 'trays',
                actualQuantity: cropPlan.actualQuantity || 0,
                actualUnit: cropPlan.actualUnit || 'trays',
                expectedYield: cropPlan.expectedYield || 0,
                actualYield: cropPlan.actualYield || 0,
                growingMethod: cropPlan.growingMethod || 'soil',
                notes: cropPlan.notes || ''
            });
        } else {
            // Reset form for add mode
            setFormData({
                cropName: '',
                planName: '',
                status: 'planned',
                priority: 'medium',
                zoneId: '',
                seedVarietyId: '',
                plannedStartDate: '',
                plannedEndDate: '',
                actualStartDate: '',
                actualEndDate: '',
                plannedQuantity: 0,
                plannedUnit: 'trays',
                actualQuantity: 0,
                actualUnit: 'trays',
                expectedYield: 0,
                actualYield: 0,
                growingMethod: 'soil',
                notes: ''
            });
        }
    }, [mode, cropPlan]);

    const loadZonesAndVarieties = async () => {
        if (!currentFarm) return;

        try {
            console.log('Fetching zones and varieties using CrudApiService...');

            const [zonesRes, varietiesRes] = await Promise.all([
                crudService.zones.list(),
                crudService.seedVarieties.list()
            ]);

            // Note: The `list` method returns the array directly, not an object with a `success` property.
            setZones(zonesRes);
            console.log(`✅ Loaded ${zonesRes.length} zones.`);

            setSeedVarieties(varietiesRes);
            console.log(`✅ Loaded ${varietiesRes.length} seed varieties.`);

            // Initialize defaults when available
            setFormData(prev => ({
                ...prev,
                zoneId: prev.zoneId || (zonesRes[0]?.id || ''),
                seedVarietyId: prev.seedVarietyId || (varietiesRes[0]?.id || ''),
            }));
            setReady(true);

        } catch (error) {
            console.error('Error loading zones and varieties:', error);
            setError('A network error occurred. Please try again.');
            setReady(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentFarm?.id) {
            setError('No farm context available');
            return;
        }

        // Client-side validation with visible errors
        const validationErrors: Record<string, string> = {};
        if (!formData.planName?.trim()) validationErrors.planName = 'Plan name is required';
        if (!formData.seedVarietyId) validationErrors.seedVarietyId = 'Seed variety is required';
        if (!formData.zoneId) validationErrors.zoneId = 'Zone is required';
        if (!formData.plannedStartDate) validationErrors.plannedStartDate = 'Start date is required';
        if (!formData.plannedEndDate) validationErrors.plannedEndDate = 'End date is required';

        setFieldErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) {
            setError('Please correct the highlighted fields.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                ...(mode === 'edit' && { id: cropPlan?.id })
            };

            let savedPlan;
            if (mode === 'edit') {
                savedPlan = await crudService.cropPlans.update(payload.id, payload);
            } else {
                savedPlan = await crudService.cropPlans.create(payload);
            }

            onSave(savedPlan);
            onClose();

        } catch (err) {
            console.error('Error saving crop plan:', err);
            setError(err instanceof Error ? err.message : 'Failed to save crop plan');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['plannedQuantity', 'actualQuantity', 'expectedYield', 'actualYield'].includes(name)
                ? Number(value)
                : value
        }));
    };

    // Auto-populate crop name when seed variety changes
    const handleSeedVarietyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const seedVarietyId = e.target.value;
        const variety = seedVarieties.find(v => v.id === seedVarietyId);

        setFormData(prev => ({
            ...prev,
            seedVarietyId,
            cropName: variety?.name || prev.cropName
        }));
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2>{mode === 'add' ? 'Add New Crop Plan' : 'Edit Crop Plan'}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalBody}>
                    {error && (
                        <div className={`${styles.error} error`}>
                            {error}
                        </div>
                    )}

                    <div className={styles.formGrid}>
                        {/* Basic Information */}
                        <div className={styles.formSection}>
                            <h3>Basic Information</h3>

                            <div className={styles.formGroup}>
                                <label>Plan Name *</label>
                                <input
                                    type="text"
                                    name="planName"
                                    value={formData.planName}
                                    onChange={handleChange}
                                    placeholder="e.g., Basil Production Q1"
                                />
                                {fieldErrors.planName && (
                                    <div className={`${styles.error} error`}>{fieldErrors.planName}</div>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label>Seed Variety *</label>
                                <select
                                    name="seedVarietyId"
                                    value={formData.seedVarietyId}
                                    onChange={handleSeedVarietyChange}
                                >
                                    <option value="">Select seed variety</option>
                                    {seedVarieties.map((variety) => (
                                        <option key={variety.id} value={variety.id}>
                                            {variety.name} {variety.scientificName && `(${variety.scientificName})`}
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.seedVarietyId && (
                                    <div className={`${styles.error} error`}>{fieldErrors.seedVarietyId}</div>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label>Crop Name *</label>
                                <input
                                    type="text"
                                    name="cropName"
                                    value={formData.cropName}
                                    onChange={handleChange}
                                    placeholder="e.g., Basil"
                                />
                                {fieldErrors.cropName && (
                                    <div className={`${styles.error} error`}>{fieldErrors.cropName}</div>
                                )}
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="planned">Planned</option>
                                        <option value="active">Active</option>
                                        <option value="growing">Growing</option>
                                        <option value="harvesting">Harvesting</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Priority</label>
                                    <select
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Location & Method */}
                        <div className={styles.formSection}>
                            <h3>Location & Method</h3>

                            <div className={styles.formGroup}>
                                <label>Growing Zone *</label>
                                <select
                                    name="zoneId"
                                    value={formData.zoneId}
                                    onChange={handleChange}
                                >
                                    <option value="">Select zone</option>
                                    {zones.map((zone) => (
                                        <option key={zone.id} value={zone.id}>
                                            {zone.name} ({zone.type})
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.zoneId && (
                                    <div className={`${styles.error} error`}>{fieldErrors.zoneId}</div>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label>Growing Method</label>
                                <select
                                    name="growingMethod"
                                    value={formData.growingMethod}
                                    onChange={handleChange}
                                >
                                    <option value="soil">Soil</option>
                                    <option value="hydroponic">Hydroponic</option>
                                    <option value="aeroponic">Aeroponic</option>
                                    <option value="aquaponic">Aquaponic</option>
                                    <option value="organic">Organic Soil</option>
                                </select>
                            </div>
                        </div>

                        {/* Planned Timeline */}
                        <div className={styles.formSection}>
                            <h3>Planned Timeline</h3>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Planned Start Date *</label>
                                    <input
                                        type="date"
                                        name="plannedStartDate"
                                        value={formData.plannedStartDate}
                                        onChange={handleChange}
                                    />
                                    {fieldErrors.plannedStartDate && (
                                        <div className={`${styles.error} error`}>{fieldErrors.plannedStartDate}</div>
                                    )}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Planned End Date *</label>
                                    <input
                                        type="date"
                                        name="plannedEndDate"
                                        value={formData.plannedEndDate}
                                        onChange={handleChange}
                                    />
                                    {fieldErrors.plannedEndDate && (
                                        <div className={`${styles.error} error`}>{fieldErrors.plannedEndDate}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actual Timeline (only show for edit mode or if there are actual dates) */}
                        {(mode === 'edit' || formData.actualStartDate || formData.actualEndDate) && (
                            <div className={styles.formSection}>
                                <h3>Actual Timeline</h3>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Actual Start Date</label>
                                        <input
                                            type="date"
                                            name="actualStartDate"
                                            value={formData.actualStartDate}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Actual End Date</label>
                                        <input
                                            type="date"
                                            name="actualEndDate"
                                            value={formData.actualEndDate}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Planned Quantities */}
                        <div className={styles.formSection}>
                            <h3>Planned Quantities</h3>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Planned Quantity</label>
                                    <input
                                        type="number"
                                        name="plannedQuantity"
                                        value={formData.plannedQuantity}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.1"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Unit</label>
                                    <select
                                        name="plannedUnit"
                                        value={formData.plannedUnit}
                                        onChange={handleChange}
                                    >
                                        <option value="trays">Trays</option>
                                        <option value="plants">Plants</option>
                                        <option value="seeds">Seeds</option>
                                        <option value="square_feet">Square Feet</option>
                                        <option value="square_meters">Square Meters</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Expected Yield (lbs)</label>
                                <input
                                    type="number"
                                    name="expectedYield"
                                    value={formData.expectedYield}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.1"
                                />
                            </div>
                        </div>

                        {/* Actual Quantities (only show for edit mode) */}
                        {mode === 'edit' && (
                            <div className={styles.formSection}>
                                <h3>Actual Quantities</h3>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Actual Quantity</label>
                                        <input
                                            type="number"
                                            name="actualQuantity"
                                            value={formData.actualQuantity}
                                            onChange={handleChange}
                                            min="0"
                                            step="0.1"
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Unit</label>
                                        <select
                                            name="actualUnit"
                                            value={formData.actualUnit}
                                            onChange={handleChange}
                                        >
                                            <option value="trays">Trays</option>
                                            <option value="plants">Plants</option>
                                            <option value="seeds">Seeds</option>
                                            <option value="square_feet">Square Feet</option>
                                            <option value="square_meters">Square Meters</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Actual Yield (lbs)</label>
                                    <input
                                        type="number"
                                        name="actualYield"
                                        value={formData.actualYield}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.1"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div className={styles.formSection}>
                            <h3>Notes</h3>

                            <div className={styles.formGroup}>
                                <label>Production Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Add any production notes, special requirements, or observations..."
                                />
                            </div>
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
                            {loading ? 'Saving...' : mode === 'add' ? 'Create Plan' : 'Update Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 