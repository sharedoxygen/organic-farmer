'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, CrudModal, CrudField } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { createCrudService } from '@/lib/api/crudService';
import styles from './page.module.css';

interface Equipment {
    id: string;
    name: string;
    type: string;
    model: string;
    manufacturer: string;
    serialNumber: string;
    location: string;
    installDate: string;
    warrantyExpiration?: string;
    status: string;
    maintenanceFrequency: string;
    lastMaintenance?: string;
    nextMaintenance: string;
    specifications?: string;
    powerConsumption?: number;
    maintenanceCost?: number;
    replacementCost?: number;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
}

interface EquipmentFilters {
    status: string;
    type: string;
    location: string;
    search: string;
}

// Create API service for equipment
const equipmentService = createCrudService('equipment', {
    farmScoped: true,
    transformFromApi: (data: any) => ({
        id: data.id,
        name: data.name,
        type: data.type,
        model: data.model,
        manufacturer: data.manufacturer,
        serialNumber: data.serialNumber,
        location: data.location,
        installDate: data.installDate,
        warrantyExpiration: data.warrantyExpiration,
        status: data.status,
        maintenanceFrequency: data.maintenanceFrequency,
        lastMaintenance: data.lastMaintenance,
        nextMaintenance: data.nextMaintenance,
        specifications: data.specifications,
        powerConsumption: data.powerConsumption,
        maintenanceCost: data.maintenanceCost,
        replacementCost: data.replacementCost,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdBy: data.createdBy,
        updatedBy: data.updatedBy
    }),
    transformForApi: (data: any) => ({
        name: data.name,
        type: data.type,
        model: data.model,
        manufacturer: data.manufacturer,
        serialNumber: data.serialNumber,
        location: data.location,
        installDate: data.installDate ? new Date(data.installDate).toISOString() : new Date().toISOString(),
        warrantyExpiration: data.warrantyExpiration ? new Date(data.warrantyExpiration).toISOString() : null,
        status: data.status,
        maintenanceFrequency: data.maintenanceFrequency,
        lastMaintenance: data.lastMaintenance ? new Date(data.lastMaintenance).toISOString() : null,
        nextMaintenance: data.nextMaintenance ? new Date(data.nextMaintenance).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        specifications: data.specifications || '',
        powerConsumption: data.powerConsumption ? parseFloat(data.powerConsumption) : null,
        maintenanceCost: data.maintenanceCost ? parseFloat(data.maintenanceCost) : null,
        replacementCost: data.replacementCost ? parseFloat(data.replacementCost) : null
    })
});

// Define form fields for equipment
const equipmentFields: CrudField[] = [
    {
        name: 'name',
        label: 'Equipment Name',
        type: 'text',
        required: true,
        placeholder: 'e.g., LED Growing System #1'
    },
    {
        name: 'type',
        label: 'Equipment Type',
        type: 'select',
        required: true,
        options: [
            { value: 'HVAC', label: 'HVAC System' },
            { value: 'IRRIGATION', label: 'Irrigation System' },
            { value: 'LIGHTING', label: 'Lighting System' },
            { value: 'SEEDING', label: 'Seeding Equipment' },
            { value: 'HARVESTING', label: 'Harvesting Equipment' },
            { value: 'CLIMATE_CONTROL', label: 'Climate Control' },
            { value: 'MONITORING', label: 'Monitoring Equipment' },
            { value: 'PROCESSING', label: 'Processing Equipment' },
            { value: 'OTHER', label: 'Other' }
        ]
    },
    {
        name: 'manufacturer',
        label: 'Manufacturer',
        type: 'text',
        required: true,
        placeholder: 'e.g., SpectraGrow Industries'
    },
    {
        name: 'model',
        label: 'Model',
        type: 'text',
        required: true,
        placeholder: 'e.g., SpectraGrow Pro 1000'
    },
    {
        name: 'serialNumber',
        label: 'Serial Number',
        type: 'text',
        required: true,
        placeholder: 'e.g., SG-2024-001'
    },
    {
        name: 'location',
        label: 'Location',
        type: 'text',
        required: true,
        placeholder: 'e.g., Greenhouse A, Zone 1'
    },
    {
        name: 'installDate',
        label: 'Install Date',
        type: 'date',
        required: true
    },
    {
        name: 'warrantyExpiration',
        label: 'Warranty Expiration',
        type: 'date'
    },
    {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
            { value: 'OPERATIONAL', label: 'Operational' },
            { value: 'MAINTENANCE', label: 'Under Maintenance' },
            { value: 'OFFLINE', label: 'Offline' },
            { value: 'REPAIR', label: 'Needs Repair' },
            { value: 'RETIRED', label: 'Retired' }
        ]
    },
    {
        name: 'maintenanceFrequency',
        label: 'Maintenance Frequency',
        type: 'select',
        required: true,
        options: [
            { value: 'WEEKLY', label: 'Weekly' },
            { value: 'MONTHLY', label: 'Monthly' },
            { value: 'QUARTERLY', label: 'Quarterly' },
            { value: 'SEMI_ANNUAL', label: 'Semi-Annual' },
            { value: 'ANNUAL', label: 'Annual' },
            { value: 'AS_NEEDED', label: 'As Needed' }
        ]
    },
    {
        name: 'lastMaintenance',
        label: 'Last Maintenance Date',
        type: 'date'
    },
    {
        name: 'nextMaintenance',
        label: 'Next Maintenance Date',
        type: 'date',
        required: true
    },
    {
        name: 'powerConsumption',
        label: 'Power Consumption (kWh)',
        type: 'number',
        min: 0,
        step: 0.1
    },
    {
        name: 'maintenanceCost',
        label: 'Annual Maintenance Cost ($)',
        type: 'number',
        min: 0,
        step: 0.01
    },
    {
        name: 'replacementCost',
        label: 'Replacement Cost ($)',
        type: 'number',
        min: 0,
        step: 0.01
    },
    {
        name: 'specifications',
        label: 'Specifications',
        type: 'textarea',
        rows: 4,
        fullWidth: true,
        placeholder: 'Technical specifications, notes, features...'
    }
];

export default function EquipmentManagementPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm } = useTenant();

    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
    const [filters, setFilters] = useState<EquipmentFilters>({
        status: 'all',
        type: 'all',
        location: 'all',
        search: ''
    });
    const [loading, setLoading] = useState(true);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create' | 'maintenance'>('view');
    const [modalOpen, setModalOpen] = useState(false);

    const loadEquipment = useCallback(async () => {
        setLoading(true);
        try {
            const equipmentData = await equipmentService.list();
            setEquipment(equipmentData);
        } catch (error) {
            console.error('Error loading equipment:', error);
            setEquipment([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const applyFilters = useCallback(() => {
        let filtered = [...equipment];

        // Status filter
        if (filters.status !== 'all') {
            filtered = filtered.filter(item => item.status === filters.status);
        }

        // Type filter
        if (filters.type !== 'all') {
            filtered = filtered.filter(item => item.type === filters.type);
        }

        // Location filter
        if (filters.location !== 'all') {
            filtered = filtered.filter(item => item.location.includes(filters.location));
        }

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(searchLower) ||
                item.manufacturer.toLowerCase().includes(searchLower) ||
                item.model.toLowerCase().includes(searchLower) ||
                item.serialNumber.toLowerCase().includes(searchLower)
            );
        }

        setFilteredEquipment(filtered);
    }, [equipment, filters]);

    useEffect(() => {
        if (!isAuthLoading) {
            if (isAuthenticated) {
                loadEquipment();
            } else {
                router.push('/auth/signin');
            }
        }
    }, [isAuthLoading, isAuthenticated, router, loadEquipment]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    // Reload when farm changes
    useEffect(() => {
        if (currentFarm && isAuthenticated) {
            loadEquipment();
        }
    }, [currentFarm?.id, isAuthenticated, loadEquipment]);

    const handleFilterChange = (filterType: keyof EquipmentFilters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPERATIONAL': return '#22c55e';
            case 'MAINTENANCE': return '#f59e0b';
            case 'OFFLINE': return '#ef4444';
            case 'REPAIR': return '#dc2626';
            case 'RETIRED': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'OPERATIONAL': return '✅';
            case 'MAINTENANCE': return '🔧';
            case 'OFFLINE': return '❌';
            case 'REPAIR': return '⚠️';
            case 'RETIRED': return '🚫';
            default: return '❓';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'HVAC': return '🌡️';
            case 'IRRIGATION': return '💧';
            case 'LIGHTING': return '💡';
            case 'SEEDING': return '🌱';
            case 'HARVESTING': return '🌾';
            case 'CLIMATE_CONTROL': return '🌡️';
            case 'MONITORING': return '📊';
            case 'PROCESSING': return '⚙️';
            default: return '🔧';
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        if (amount === null || amount === undefined) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const isMaintenanceDue = (nextMaintenanceDate: string) => {
        if (!nextMaintenanceDate) return false;
        const nextDate = new Date(nextMaintenanceDate);
        const now = new Date();
        const daysUntilMaintenance = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilMaintenance <= 7; // Due within 7 days
    };

    const getDaysUntilMaintenance = (nextMaintenanceDate: string) => {
        if (!nextMaintenanceDate) return 'N/A';
        const nextDate = new Date(nextMaintenanceDate);
        const now = new Date();
        const daysUntilMaintenance = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilMaintenance < 0) {
            return `${Math.abs(daysUntilMaintenance)} days overdue`;
        } else if (daysUntilMaintenance === 0) {
            return 'Due today';
        } else if (daysUntilMaintenance === 1) {
            return 'Due tomorrow';
        } else {
            return `${daysUntilMaintenance} days`;
        }
    };

    // Modal handlers
    const handleCreateEquipment = () => {
        setSelectedEquipment(null);
        setModalMode('create');
        setModalOpen(true);
    };

    const handleViewEquipment = (item: Equipment) => {
        setSelectedEquipment(item);
        setModalMode('view');
        setModalOpen(true);
    };

    const handleEditEquipment = (item: Equipment) => {
        setSelectedEquipment(item);
        setModalMode('edit');
        setModalOpen(true);
    };

    const handleScheduleMaintenance = (item: Equipment) => {
        const maintenanceData = {
            ...item,
            lastMaintenance: new Date().toISOString(),
            nextMaintenance: getNextMaintenanceDate(item.maintenanceFrequency)
        };
        setSelectedEquipment(maintenanceData as any);
        setModalMode('maintenance');
        setModalOpen(true);
    };

    const getNextMaintenanceDate = (frequency: string) => {
        const now = new Date();
        switch (frequency) {
            case 'WEEKLY':
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
            case 'MONTHLY':
                return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
            case 'QUARTERLY':
                return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
            case 'SEMI_ANNUAL':
                return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();
            case 'ANNUAL':
                return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
            default:
                return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }
    };

    const handleSave = async (data: any) => {
        try {
            if (modalMode === 'create') {
                await equipmentService.create(data);
            } else if (modalMode === 'edit' || modalMode === 'maintenance') {
                await equipmentService.update(selectedEquipment!.id, data);
            }
            await loadEquipment();
        } catch (error) {
            console.error('Failed to save equipment:', error);
            throw error;
        }
    };

    const handleDelete = async () => {
        if (!selectedEquipment) return;
        try {
            await equipmentService.delete(selectedEquipment.id);
            await loadEquipment();
        } catch (error) {
            console.error('Failed to delete equipment:', error);
            throw error;
        }
    };

    // Calculate summary stats
    const operationalCount = filteredEquipment.filter(item => item.status === 'OPERATIONAL').length;
    const maintenanceCount = filteredEquipment.filter(item => item.status === 'MAINTENANCE').length;
    const offlineCount = filteredEquipment.filter(item => item.status === 'OFFLINE').length;
    const maintenanceDueCount = filteredEquipment.filter(item => isMaintenanceDue(item.nextMaintenance)).length;
    const totalMaintenanceCost = filteredEquipment.reduce((sum, item) => sum + (item.maintenanceCost || 0), 0);

    if (loading || isAuthLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <h1>⚙️ Loading Equipment...</h1>
                    <p>Getting your equipment data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div>
                        <h1 className={styles.title}>⚙️ Equipment Management</h1>
                        <p className={styles.subtitle}>
                            Monitor, maintain, and manage all your farm equipment and machinery
                        </p>
                    </div>
                    <div className={styles.headerActions}>
                        <Button variant="secondary" onClick={() => router.push('/dashboard')}>
                            ← Dashboard
                        </Button>
                        <Button variant="primary" onClick={handleCreateEquipment}>
                            + Add Equipment
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card className={styles.filtersCard}>
                <div className={styles.filtersContent}>
                    <div className={styles.searchSection}>
                        <input
                            type="text"
                            placeholder="Search equipment..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.filterSection}>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">All Status</option>
                            <option value="OPERATIONAL">Operational</option>
                            <option value="MAINTENANCE">Under Maintenance</option>
                            <option value="OFFLINE">Offline</option>
                            <option value="REPAIR">Needs Repair</option>
                            <option value="RETIRED">Retired</option>
                        </select>

                        <select
                            value={filters.type}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">All Types</option>
                            <option value="HVAC">HVAC Systems</option>
                            <option value="IRRIGATION">Irrigation</option>
                            <option value="LIGHTING">Lighting</option>
                            <option value="SEEDING">Seeding</option>
                            <option value="HARVESTING">Harvesting</option>
                            <option value="MONITORING">Monitoring</option>
                            <option value="OTHER">Other</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Filter by location..."
                            value={filters.location}
                            onChange={(e) => handleFilterChange('location', e.target.value)}
                            className={styles.filterSelect}
                        />
                    </div>
                </div>
            </Card>

            {/* Summary Stats */}
            <div className={styles.statsGrid}>
                <Card className={styles.statCard}>
                    <div className={styles.statIcon}>📋</div>
                    <div className={styles.statValue}>{filteredEquipment.length}</div>
                    <div className={styles.statLabel}>Total Equipment</div>
                </Card>

                <Card className={styles.statCard}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statValue}>{operationalCount}</div>
                    <div className={styles.statLabel}>Operational</div>
                </Card>

                <Card className={styles.statCard}>
                    <div className={styles.statIcon}>🔧</div>
                    <div className={styles.statValue}>{maintenanceDueCount}</div>
                    <div className={styles.statLabel}>Maintenance Due</div>
                </Card>

                <Card className={styles.statCard}>
                    <div className={styles.statIcon}>💰</div>
                    <div className={styles.statValue}>{formatCurrency(totalMaintenanceCost)}</div>
                    <div className={styles.statLabel}>Annual Maintenance</div>
                </Card>
            </div>

            {/* Equipment Grid */}
            <div className={styles.equipmentGrid}>
                {filteredEquipment.map((item) => {
                    const maintenanceDue = isMaintenanceDue(item.nextMaintenance);
                    const daysUntilMaintenance = getDaysUntilMaintenance(item.nextMaintenance);

                    return (
                        <Card key={item.id} className={`${styles.equipmentCard} ${maintenanceDue ? styles.maintenanceDue : ''}`}>
                            <div className={styles.equipmentHeader}>
                                <div className={styles.equipmentInfo}>
                                    <div className={styles.equipmentIcon}>
                                        {getTypeIcon(item.type)}
                                    </div>
                                    <div>
                                        <div className={styles.equipmentName}>{item.name}</div>
                                        <div className={styles.equipmentModel}>{item.manufacturer} {item.model}</div>
                                    </div>
                                </div>
                                <div className={styles.equipmentBadges}>
                                    <span
                                        className={styles.statusBadge}
                                        style={{ backgroundColor: getStatusColor(item.status) }}
                                    >
                                        {getStatusIcon(item.status)} {item.status}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.equipmentContent}>
                                <div className={styles.equipmentMeta}>
                                    <div className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Serial Number:</span>
                                        <span className={styles.metaValue}>{item.serialNumber}</span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Location:</span>
                                        <span className={styles.metaValue}>{item.location}</span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Install Date:</span>
                                        <span className={styles.metaValue}>{formatDate(item.installDate)}</span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Next Maintenance:</span>
                                        <span className={`${styles.metaValue} ${maintenanceDue ? styles.urgent : ''}`}>
                                            {formatDate(item.nextMaintenance)} ({daysUntilMaintenance})
                                        </span>
                                    </div>
                                </div>

                                {item.specifications && (
                                    <div className={styles.specifications}>
                                        <strong>Specifications:</strong>
                                        <p>{item.specifications.substring(0, 100)}{item.specifications.length > 100 ? '...' : ''}</p>
                                    </div>
                                )}

                                <div className={styles.costInfo}>
                                    {item.powerConsumption && (
                                        <div className={styles.costItem}>
                                            <span>Power: {item.powerConsumption} kWh</span>
                                        </div>
                                    )}
                                    {item.maintenanceCost && (
                                        <div className={styles.costItem}>
                                            <span>Maintenance: {formatCurrency(item.maintenanceCost)}/year</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.equipmentActions}>
                                <Button variant="secondary" size="sm" onClick={() => handleViewEquipment(item)}>
                                    View
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => handleEditEquipment(item)}>
                                    Edit
                                </Button>
                                <Button variant="primary" size="sm" onClick={() => handleScheduleMaintenance(item)}>
                                    Maintenance
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {filteredEquipment.length === 0 && (
                <Card className={styles.emptyState}>
                    <div className={styles.emptyIcon}>⚙️</div>
                    <h3>No equipment found</h3>
                    <p>Try adjusting your filters or add your first piece of equipment to get started.</p>
                    <Button variant="primary" onClick={handleCreateEquipment}>
                        Add First Equipment
                    </Button>
                </Card>
            )}

            {/* CRUD Modal */}
            <CrudModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={
                    modalMode === 'create'
                        ? 'Add New Equipment'
                        : modalMode === 'edit'
                            ? `Edit Equipment: ${selectedEquipment?.name || ''}`
                            : modalMode === 'maintenance'
                                ? `Schedule Maintenance: ${selectedEquipment?.name || ''}`
                                : `Equipment Details: ${selectedEquipment?.name || ''}`
                }
                mode={modalMode === 'maintenance' ? 'edit' : modalMode}
                data={selectedEquipment}
                fields={equipmentFields}
                onSave={handleSave}
                onDelete={modalMode === 'edit' ? handleDelete : undefined}
                sections={[
                    { title: 'Basic Information', fields: ['name', 'type', 'manufacturer', 'model', 'serialNumber', 'location'] },
                    { title: 'Installation & Warranty', fields: ['installDate', 'warrantyExpiration', 'status'] },
                    { title: 'Maintenance Schedule', fields: ['maintenanceFrequency', 'lastMaintenance', 'nextMaintenance'] },
                    { title: 'Performance & Costs', fields: ['powerConsumption', 'maintenanceCost', 'replacementCost'] },
                    { title: 'Additional Details', fields: ['specifications'] }
                ]}
            />
        </div>
    );
} 