'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Button } from '@/components/ui';
import { useTenant } from '@/components/TenantProvider';
import { useAuth } from '@/components/AuthProvider';
import SeedManagementModal from './SeedManagementModal';
import styles from './page.module.css';

interface SeedVariety {
    id: string;
    name: string;
    scientificName: string;
    supplier: string;
    stockQuantity: number;
    minStockLevel: number;
    status: string;
    germinationRate: number;
    daysToHarvest: number;
    costPerUnit: number;
    activeBatches?: number;
}

export default function SeedsPage() {
    const { currentFarm } = useTenant();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('inventory');
    const [seedVarieties, setSeedVarieties] = useState<SeedVariety[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedSeed, setSelectedSeed] = useState<SeedVariety | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchSeedVarieties = useCallback(async () => {
        if (!currentFarm?.id || !user?.id) {
            setError('Farm context or user authentication required');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (statusFilter) params.append('status', statusFilter);
            params.append('limit', '100'); // Get all varieties

            console.log('🌱 Fetching seed varieties for farm:', currentFarm.farm_name);

            const response = await fetch(`/api/seed-varieties?${params}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Farm-ID': currentFarm.id,
                    'Authorization': `Bearer ${user.id}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to fetch seed varieties (${response.status})`);
            }

            const result = await response.json();
            console.log('✅ Seed varieties loaded:', result.data?.length || 0, 'items');
            setSeedVarieties(result.data || []);
        } catch (err) {
            console.error('❌ Error fetching seed varieties:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilter, currentFarm?.id, user?.id]);

    useEffect(() => {
        fetchSeedVarieties();
    }, [fetchSeedVarieties]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ADEQUATE': return 'var(--success-color)';
            case 'LOW': return 'var(--warning-color)';
            case 'CRITICAL': return 'var(--danger-color)';
            case 'OUT_OF_STOCK': return 'var(--danger-color)';
            default: return 'var(--text-muted)';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ADEQUATE': return '✅';
            case 'LOW': return '⚠️';
            case 'CRITICAL': return '🚨';
            case 'OUT_OF_STOCK': return '❌';
            default: return '❓';
        }
    };

    const handleRowClick = (seed: SeedVariety) => {
        setSelectedSeed(seed);
        setShowEditModal(true);
    };

    const handleEditClick = (e: React.MouseEvent, seed: SeedVariety) => {
        e.stopPropagation(); // Prevent row click
        setSelectedSeed(seed);
        setShowEditModal(true);
    };

    const handleCreateClick = () => {
        setSelectedSeed(null);
        setShowCreateModal(true);
    };

    const handleSaveSeed = async (seedData: Partial<SeedVariety>) => {
        if (!currentFarm?.id || !user?.id) {
            throw new Error('Farm context or user authentication required');
        }

        try {
            const url = selectedSeed
                ? `/api/seed-varieties/${selectedSeed.id}`
                : '/api/seed-varieties';
            const method = selectedSeed ? 'PUT' : 'POST';

            console.log(`🌱 ${method === 'POST' ? 'Creating' : 'Updating'} seed variety:`, seedData.name);

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Farm-ID': currentFarm.id,
                    'Authorization': `Bearer ${user.id}`
                },
                body: JSON.stringify(seedData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to save seed variety (${response.status})`);
            }

            console.log('✅ Seed variety saved successfully');
            await fetchSeedVarieties(); // Refresh the list
            setShowEditModal(false);
            setShowCreateModal(false);
            setSelectedSeed(null);
        } catch (err) {
            console.error('❌ Error saving seed variety:', err);
            throw err; // Re-throw to show error in modal
        }
    };

    const handleCloseModal = () => {
        setShowEditModal(false);
        setShowCreateModal(false);
        setSelectedSeed(null);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Seeds & Genetics</h1>
                    <p className={styles.subtitle}>Loading...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Seeds & Genetics</h1>
                    <p className={styles.subtitle} style={{ color: 'var(--danger-color)' }}>
                        Error: {error}
                    </p>
                </div>
                <Card>
                    <Button onClick={fetchSeedVarieties}>Retry</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>Seeds & Genetics</h1>
                    <p className={styles.subtitle}>
                        Manage seed inventory, varieties, and genetic records
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <Button variant="secondary" size="md" onClick={fetchSeedVarieties}>
                        🔄 Refresh
                    </Button>
                    <Button variant="primary" size="md" onClick={handleCreateClick}>
                        ➕ Add New Variety
                    </Button>
                </div>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'inventory' ? styles.active : ''}`}
                    onClick={() => setActiveTab('inventory')}
                >
                    Seed Inventory ({seedVarieties.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'varieties' ? styles.active : ''}`}
                    onClick={() => setActiveTab('varieties')}
                >
                    Variety Management
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    Seed Orders
                </button>
            </div>

            {activeTab === 'inventory' && (
                <div className={styles.inventorySection}>
                    <div className={styles.summary}>
                        <Card className={styles.summaryCard}>
                            <h3>📊 Inventory Summary</h3>
                            <div className={styles.summaryStats}>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryNumber}>{seedVarieties.length}</span>
                                    <span className={styles.summaryLabel}>Total Varieties</span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span
                                        className={styles.summaryNumber}
                                        style={{ color: 'var(--danger-color)' }}
                                    >
                                        {seedVarieties.filter(s => s.status === 'CRITICAL' || s.status === 'OUT_OF_STOCK').length}
                                    </span>
                                    <span className={styles.summaryLabel}>Critical Stock</span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryNumber}>
                                        {seedVarieties.length > 0
                                            ? (seedVarieties.reduce((sum, s) => sum + s.germinationRate, 0) / seedVarieties.length * 100).toFixed(1)
                                            : 0}%
                                    </span>
                                    <span className={styles.summaryLabel}>Avg Germination</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className={styles.seedTable}>
                        <div className={styles.tableHeader}>
                            <h3>Current Seed Inventory</h3>
                            <div className={styles.tableFilters}>
                                <input
                                    type="text"
                                    className={styles.filter}
                                    placeholder="Search varieties..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <select
                                    className={styles.filter}
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="ADEQUATE">Adequate</option>
                                    <option value="LOW">Low Stock</option>
                                    <option value="CRITICAL">Critical</option>
                                    <option value="OUT_OF_STOCK">Out of Stock</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.table}>
                            <div className={styles.tableHead}>
                                <div className={styles.tableCell}>Variety</div>
                                <div className={styles.tableCell}>Stock Level</div>
                                <div className={styles.tableCell}>Status</div>
                                <div className={styles.tableCell}>Germination</div>
                                <div className={styles.tableCell}>Harvest Days</div>
                                <div className={styles.tableCell}>Cost/Unit</div>
                                <div className={styles.tableCell}>Actions</div>
                            </div>

                            {seedVarieties.map((seed) => (
                                <div
                                    key={seed.id}
                                    className={styles.tableRow}
                                    data-entity-id={seed.id}
                                    onClick={() => handleRowClick(seed)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleRowClick(seed);
                                        }
                                    }}
                                    aria-label={`Edit ${seed.name} variety details`}
                                >
                                    <div className={styles.tableCell}>
                                        <div className={styles.varietyInfo}>
                                            <strong>{seed.name}</strong>
                                            <small>{seed.scientificName}</small>
                                        </div>
                                    </div>
                                    <div className={styles.tableCell}>
                                        <div className={styles.stockInfo}>
                                            <span className={styles.stockCurrent}>{seed.stockQuantity}g</span>
                                            <span className={styles.stockMin}>Min: {seed.minStockLevel}g</span>
                                        </div>
                                    </div>
                                    <div className={styles.tableCell}>
                                        <div
                                            className={styles.status}
                                            style={{ color: getStatusColor(seed.status) }}
                                        >
                                            {getStatusIcon(seed.status)} {seed.status.replace('_', ' ').toLowerCase()}
                                        </div>
                                    </div>
                                    <div className={styles.tableCell}>
                                        <span className={styles.germination}>
                                            {(seed.germinationRate * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className={styles.tableCell}>
                                        <span className={styles.harvestDays}>{seed.daysToHarvest} days</span>
                                    </div>
                                    <div className={styles.tableCell}>
                                        <span className={styles.cost}>${seed.costPerUnit.toFixed(2)}</span>
                                    </div>
                                    <div className={styles.tableCell}>
                                        <div className={styles.actionButtons}>
                                            {seed.status === 'CRITICAL' || seed.status === 'LOW' || seed.status === 'OUT_OF_STOCK' ? (
                                                <Button
                                                    className="reorder-button"
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                    }}
                                                >
                                                    🛒 Reorder
                                                </Button>
                                            ) : (
                                                <Button
                                                    className="edit-button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={(e) => handleEditClick(e, seed)}
                                                >
                                                    📝 Edit
                                                </Button>
                                            )}
                                            <Button
                                                className="delete-button"
                                                variant="danger"
                                                size="sm"
                                                onClick={async (e) => {
                                                    e.stopPropagation()
                                                    if (!currentFarm?.id || !user?.id) return
                                                    if (!confirm(`Delete ${seed.name}?`)) return
                                                    const res = await fetch('/api/seed-varieties', {
                                                        method: 'DELETE',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'X-Farm-ID': currentFarm.id,
                                                            'Authorization': `Bearer ${user.id}`
                                                        },
                                                        body: JSON.stringify({ id: seed.id })
                                                    })
                                                    if (res.ok) {
                                                        await fetchSeedVarieties()
                                                    } else {
                                                        const data = await res.json().catch(() => ({}))
                                                        alert(data.error || 'Failed to delete')
                                                    }
                                                }}
                                            >
                                                🗑️ Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'varieties' && (
                <Card className={styles.varietiesSection}>
                    <div className={styles.comingSoon}>
                        <div className={styles.comingSoonIcon}>🧬</div>
                        <h4>Variety Management</h4>
                        <p>Advanced genetic tracking and variety development tools coming soon.</p>
                    </div>
                </Card>
            )}

            {activeTab === 'orders' && (
                <Card className={styles.ordersSection}>
                    <div className={styles.comingSoon}>
                        <div className={styles.comingSoonIcon}>📦</div>
                        <h4>Seed Orders</h4>
                        <p>Seed procurement and supplier order management coming soon.</p>
                    </div>
                </Card>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedSeed && (
                <SeedManagementModal
                    seed={{
                        id: selectedSeed.id,
                        name: selectedSeed.name,
                        scientificName: selectedSeed.scientificName,
                        supplier: selectedSeed.supplier,
                        stockQuantity: selectedSeed.stockQuantity,
                        minStockLevel: selectedSeed.minStockLevel,
                        unit: 'grams',
                        costPerUnit: selectedSeed.costPerUnit,
                        germinationRate: selectedSeed.germinationRate,
                        daysToGermination: 0,
                        daysToHarvest: selectedSeed.daysToHarvest,
                        storageTemp: 4,
                        storageHumidity: 50,
                        lightExposure: 'PARTIAL',
                        status: selectedSeed.status,
                        isOrganic: true,
                        lotNumber: '',
                        seedSource: ''
                    }}
                    isOpen={showEditModal}
                    onClose={handleCloseModal}
                    onSave={handleSaveSeed}
                />
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <SeedManagementModal
                    seed={undefined}
                    isOpen={showCreateModal}
                    onClose={handleCloseModal}
                    onSave={handleSaveSeed}
                />
            )}
        </div>
    );
} 