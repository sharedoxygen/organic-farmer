'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { isBatchStatusActive, getStatusColor, getStatusIcon } from '@/lib/utils/batchStatusUtils';
import styles from './page.module.css';

interface Batch {
    id: string;
    batchNumber: string;
    seedVariety: string;
    plantDate: string;
    expectedHarvestDate: string;
    actualHarvestDate?: string;
    status: 'PLANTED' | 'GERMINATING' | 'GROWING' | 'READY_TO_HARVEST' | 'HARVESTED';
    quantity: number;
    unit: string;
    zone: string;
    qualityGrade?: 'A' | 'B' | 'C';
    yieldAmount?: number;
    notes?: string;
    createdBy: string;
    updatedAt: string;
}

interface BatchFilters {
    status: string;
    zone: string;
    dateRange: string;
    search: string;
}

export default function ProductionBatchesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm } = useTenant();

    const [batches, setBatches] = useState<Batch[]>([]);
    const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);
    const [filters, setFilters] = useState<BatchFilters>({
        status: searchParams?.get('filter') || 'all',
        zone: 'all',
        dateRange: 'all',
        search: ''
    });
    const [loading, setLoading] = useState(true);
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const loadBatches = useCallback(async () => {
        console.log('🚀 LOAD BATCHES CALLED');
        setLoading(true);

        try {
            console.log('📦 Current state:', {
                farmId: currentFarm?.id,
                farmName: currentFarm?.farm_name,
                user: user?.email,
                isAuthenticated,
                filters: filters
            });

            // ✅ CRITICAL FIX: Proper farm context validation
            if (!currentFarm?.id) {
                console.error('❌ CRITICAL: No farm context available');
                alert('No farm context available. Please refresh the page or contact support.');
                setBatches([]);
                setLoading(false);
                return;
            }

            if (!isAuthenticated) {
                console.error('❌ CRITICAL: User not authenticated');
                alert('User not authenticated. Please refresh the page.');
                setBatches([]);
                setLoading(false);
                return;
            }

            const queryParams = new URLSearchParams();
            queryParams.append('page', '1');
            queryParams.append('limit', '50');

            // Only append direct status filters that map to actual DB statuses
            const directStatusFilters = new Set([
                'PLANTED',
                'GERMINATING',
                'GROWING',
                'READY_TO_HARVEST',
                'HARVESTED',
                'FAILED',
                // Cannabis-specific statuses that exist in database
                'VEGETATIVE',
                'FLOWERING_WEEK_1',
                'FLOWERING_WEEK_2',
                'FLOWERING_WEEK_3',
                'FLOWERING_WEEK_4',
                'FLOWERING_WEEK_5',
                'FLOWERING_WEEK_6',
                'FLOWERING_WEEK_7',
                'FLOWERING_WEEK_8'
            ]);

            if (filters.status !== 'all' && directStatusFilters.has(filters.status)) {
                queryParams.append('status', filters.status);
            }

            // Get user data for authorization
            const userData = localStorage.getItem('ofms_user');
            console.log('🔐 User data from localStorage:', userData ? 'EXISTS' : 'MISSING');

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Farm-ID': currentFarm.id,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            };

            if (userData) {
                const userObj = JSON.parse(userData);
                headers['Authorization'] = `Bearer ${userObj.id}`;
                console.log('🔐 Authorization header set for user:', userObj.email);
            } else {
                console.warn('⚠️ No user data found in localStorage');
            }

            const apiUrl = `/api/batches?${queryParams}`;
            console.log('🔄 Making API call to:', apiUrl);
            console.log('📋 Headers:', headers);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers,
                cache: 'no-store'
            });

            console.log('📡 Response status:', response.status, response.statusText);

            if (!response.ok) {
                console.error('❌ API call failed:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                alert(`API Error: ${response.status} - ${response.statusText}`);
                setBatches([]);
                setLoading(false);
                return;
            }

            const data = await response.json();
            console.log('📦 Raw response data:', data);

            if (data.success) {
                console.log(`✅ API returned ${data.data.length} batches`);
                console.log('📋 First batch sample:', data.data[0] || 'NO BATCHES');

                if (data.data.length === 0) {
                    console.warn('⚠️ API returned 0 batches - this might be the issue');
                    alert('API returned 0 batches. Check if you have permission to view this farm.');
                }

                const transformedBatches = data.data.map((batch: any, index: number) => {
                    try {
                        console.log(`🔄 Transforming batch ${index + 1}:`, batch.batchNumber);
                        const transformed = {
                            id: batch.id,
                            batchNumber: batch.batchNumber,
                            seedVariety: batch.seed_varieties?.name || 'Unknown',
                            plantDate: new Date(batch.plantDate).toISOString(),
                            expectedHarvestDate: new Date(batch.expectedHarvestDate).toISOString(),
                            actualHarvestDate: batch.actualHarvestDate ? new Date(batch.actualHarvestDate).toISOString() : undefined,
                            status: batch.status,
                            quantity: batch.quantity,
                            unit: batch.unit,
                            zone: batch.growingZone || 'N/A',
                            qualityGrade: batch.qualityGrade || 'Pending',
                            notes: batch.notes || '',
                            createdBy: batch.users_batches_createdByTousers ? `${batch.users_batches_createdByTousers.firstName} ${batch.users_batches_createdByTousers.lastName}` : 'Unknown',
                            updatedAt: new Date(batch.updatedAt).toISOString(),
                        };
                        console.log(`✅ Transformed batch ${index + 1}:`, transformed.batchNumber, transformed.status);
                        return transformed;
                    } catch (transformError) {
                        console.error(`❌ Error transforming batch ${index + 1}:`, transformError, batch);
                        return null;
                    }
                }).filter(Boolean);

                console.log(`✅ Final transformed batches count: ${transformedBatches.length}`);
                setBatches(transformedBatches);

                if (transformedBatches.length === 0 && data.data.length > 0) {
                    console.error('❌ All batches failed transformation!');
                    alert('Data transformation failed. Check console for details.');
                }
            } else {
                console.error('❌ API success=false:', data.error);
                alert(`API Error: ${data.error}`);
                setBatches([]);
            }
        } catch (error) {
            console.error('❌ Network or parsing error:', error);
            alert(`Network Error: ${error.message}`);
            setBatches([]);
        } finally {
            setLoading(false);
        }
    }, [filters.status, currentFarm?.id, isAuthenticated, user?.email]);

    const applyFilters = useCallback(() => {
        console.log('🔍 APPLYING FILTERS');
        console.log('📋 Input batches count:', batches.length);
        console.log('🎛️ Filters:', filters);

        let filtered = [...batches];

        // Status filter
        if (filters.status !== 'all') {
            const beforeCount = filtered.length;
            if (filters.status === 'active') {
                filtered = filtered.filter(batch => isBatchStatusActive(batch.status));
                console.log(`🎯 Status filter (active): ${beforeCount} -> ${filtered.length}`);
            } else if (filters.status === 'ready') {
                filtered = filtered.filter(batch => batch.status === 'READY_TO_HARVEST');
                console.log(`🎯 Status filter (ready): ${beforeCount} -> ${filtered.length}`);
            } else {
                filtered = filtered.filter(batch => batch.status === filters.status);
                console.log(`🎯 Status filter (${filters.status}): ${beforeCount} -> ${filtered.length}`);
            }
        }

        // Zone filter
        if (filters.zone !== 'all') {
            const beforeCount = filtered.length;
            filtered = filtered.filter(batch => batch.zone === filters.zone);
            console.log(`🏢 Zone filter (${filters.zone}): ${beforeCount} -> ${filtered.length}`);
        }

        // Search filter
        if (filters.search) {
            const beforeCount = filtered.length;
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(batch =>
                batch.batchNumber.toLowerCase().includes(searchLower) ||
                batch.seedVariety.toLowerCase().includes(searchLower) ||
                batch.createdBy.toLowerCase().includes(searchLower)
            );
            console.log(`🔍 Search filter (${filters.search}): ${beforeCount} -> ${filtered.length}`);
        }

        // Date range filter
        if (filters.dateRange !== 'all') {
            const beforeCount = filtered.length;
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            filtered = filtered.filter(batch => {
                const plantDate = new Date(batch.plantDate);
                switch (filters.dateRange) {
                    case '7days':
                        return plantDate >= sevenDaysAgo;
                    case '30days':
                        return plantDate >= thirtyDaysAgo;
                    default:
                        return true;
                }
            });
            console.log(`📅 Date filter (${filters.dateRange}): ${beforeCount} -> ${filtered.length}`);
        }

        console.log(`✅ Final filtered count: ${filtered.length}`);
        setFilteredBatches(filtered);
    }, [batches, filters]);

    useEffect(() => {
        if (!isAuthLoading) {
            if (isAuthenticated) {
                loadBatches();
            } else {
                router.push('/auth/signin');
            }
        }
    }, [isAuthLoading, isAuthenticated, router, loadBatches]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    // Reload batches when farm changes
    useEffect(() => {
        if (currentFarm && isAuthenticated) {
            console.log('🏢 Farm changed, reloading batches for:', currentFarm.farm_name, 'ID:', currentFarm.id);
            loadBatches();
        } else {
            console.log('⏳ Waiting for farm context or authentication...');
        }
    }, [currentFarm?.id, isAuthenticated, loadBatches]);

    // Handle direct batch viewing from URL parameter
    useEffect(() => {
        const batchParam = searchParams?.get('batch');
        if (batchParam && batches.length > 0 && !selectedBatch) {
            const targetBatch = batches.find(batch => batch.id === batchParam);
            if (targetBatch) {
                console.log('🎯 Auto-opening batch from URL:', batchParam);
                setSelectedBatch(targetBatch);
            } else {
                console.warn('⚠️ Batch not found:', batchParam);
            }
        }
    }, [searchParams, batches, selectedBatch]);

    const handleFilterChange = (filterType: keyof BatchFilters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    // Status display functions are now imported from utility

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getDaysToHarvest = (expectedDate: string, actualDate?: string) => {
        if (actualDate) return null;
        const now = new Date();
        const expected = new Date(expectedDate);
        const diffTime = expected.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const handleCreateBatch = () => {
        setShowCreateModal(true);
    };

    const handleViewBatch = (batch: Batch) => {
        setSelectedBatch(batch);
    };

    const handleEditBatch = (batch: Batch) => {
        setEditingBatch(batch);
        setIsEditMode(true);
    };

    const handleDeleteBatch = (batch: Batch) => {
        if (confirm(`Are you sure you want to delete batch ${batch.batchNumber}? This action cannot be undone.`)) {
            // ✅ CRITICAL FIX: Proper farm context validation
            if (!currentFarm?.id) {
                alert('No farm context available. Please select a farm.');
                return;
            }

            fetch(`/api/batches/${batch.id}`, {
                method: 'DELETE',
                headers: {
                    'X-Farm-ID': currentFarm.id
                }
            })
                .then(response => {
                    if (response.ok) {
                        loadBatches();
                    } else {
                        alert('Failed to delete batch. Please try again.');
                    }
                })
                .catch(error => {
                    console.error('Error deleting batch:', error);
                    alert('Failed to delete batch. Please try again.');
                });
        }
    };

    const handleHarvestBatch = (batch: Batch) => {
        // Set the batch to harvested status and open edit modal to record harvest details
        setEditingBatch({
            ...batch,
            status: 'HARVESTED',
            actualHarvestDate: new Date().toISOString()
        });
        setIsEditMode(true);
    };

    if (loading || isAuthLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <h1>🌱 Loading Batches...</h1>
                    <p>Getting production data...</p>
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
                        <h1 className={styles.title}>🌱 Production Batches</h1>
                        <p className={styles.subtitle}>
                            Track and manage all production batches from seed to harvest
                        </p>
                    </div>
                    <div className={styles.headerActions}>
                        <Button variant="secondary" onClick={() => router.push('/dashboard')}>
                            ← Dashboard
                        </Button>
                        <Button variant="primary" onClick={handleCreateBatch}>
                            + New Batch
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
                            placeholder="Search batches..."
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
                            <option value="active">Active (Growing)</option>
                            <option value="ready">Ready to Harvest</option>
                            <option value="PLANTED">Planted</option>
                            <option value="GERMINATING">Germinating</option>
                            <option value="GROWING">Growing</option>
                            <option value="READY_TO_HARVEST">Ready to Harvest</option>
                            <option value="HARVESTED">Harvested</option>
                        </select>

                        <select
                            value={filters.zone}
                            onChange={(e) => handleFilterChange('zone', e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">All Zones</option>
                            <option value="Zone A">Zone A</option>
                            <option value="Zone B">Zone B</option>
                            <option value="Zone C">Zone C</option>
                        </select>

                        <select
                            value={filters.dateRange}
                            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">All Time</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Batch Stats */}
            <div className={styles.statsGrid}>
                <Card className={styles.statCard}>
                    <div className={styles.statIcon}>📦</div>
                    <div className={styles.statValue}>{filteredBatches.length}</div>
                    <div className={styles.statLabel}>Total Batches</div>
                </Card>

                <Card className={styles.statCard}>
                    <div className={styles.statIcon}>🌱</div>
                    <div className={styles.statValue}>
                        {filteredBatches.filter(b => isBatchStatusActive(b.status)).length}
                    </div>
                    <div className={styles.statLabel}>Active Growing</div>
                </Card>

                <Card className={styles.statCard}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statValue}>
                        {filteredBatches.filter(b => b.status === 'READY_TO_HARVEST').length}
                    </div>
                    <div className={styles.statLabel}>Ready to Harvest</div>
                </Card>

                <Card className={styles.statCard}>
                    <div className={styles.statIcon}>📈</div>
                    <div className={styles.statValue}>
                        {filteredBatches.filter(b => b.status === 'HARVESTED').length}
                    </div>
                    <div className={styles.statLabel}>Completed</div>
                </Card>
            </div>

            {/* Batches Grid */}
            <div className={styles.batchesGrid}>
                {filteredBatches.map((batch) => {
                    const daysToHarvest = getDaysToHarvest(batch.expectedHarvestDate, batch.actualHarvestDate);

                    return (
                        <Card key={batch.id} className={styles.batchCard}>
                            <div className={styles.batchHeader}>
                                <div className={styles.batchNumber}>
                                    <span className={styles.batchIcon}>{getStatusIcon(batch.status)}</span>
                                    {batch.batchNumber}
                                </div>
                                <div
                                    className={styles.batchStatus}
                                    style={{ backgroundColor: getStatusColor(batch.status) }}
                                >
                                    {batch.status.replace('_', ' ')}
                                </div>
                            </div>

                            <div className={styles.batchInfo}>
                                <h3 className={styles.seedVariety}>{batch.seedVariety}</h3>
                                <div className={styles.batchDetails}>
                                    <div className={styles.detail}>
                                        <span className={styles.label}>Zone:</span>
                                        <span className={styles.value}>{batch.zone}</span>
                                    </div>
                                    <div className={styles.detail}>
                                        <span className={styles.label}>Quantity:</span>
                                        <span className={styles.value}>{batch.quantity} {batch.unit}</span>
                                    </div>
                                    <div className={styles.detail}>
                                        <span className={styles.label}>Planted:</span>
                                        <span className={styles.value}>{formatDate(batch.plantDate)}</span>
                                    </div>
                                    <div className={styles.detail}>
                                        <span className={styles.label}>Expected Harvest:</span>
                                        <span className={styles.value}>{formatDate(batch.expectedHarvestDate)}</span>
                                    </div>
                                    {daysToHarvest !== null && (
                                        <div className={styles.detail}>
                                            <span className={styles.label}>Days to Harvest:</span>
                                            <span className={`${styles.value} ${daysToHarvest <= 0 ? styles.urgent : ''}`}>
                                                {daysToHarvest <= 0 ? 'Ready!' : `${daysToHarvest} days`}
                                            </span>
                                        </div>
                                    )}
                                    {batch.qualityGrade && (
                                        <div className={styles.detail}>
                                            <span className={styles.label}>Quality Grade:</span>
                                            <span className={styles.value}>Grade {batch.qualityGrade}</span>
                                        </div>
                                    )}
                                    {batch.yieldAmount && (
                                        <div className={styles.detail}>
                                            <span className={styles.label}>Yield:</span>
                                            <span className={styles.value}>{batch.yieldAmount} kg</span>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.batchMeta}>
                                    <span>👤 {batch.createdBy}</span>
                                    <span>📅 Updated {formatDate(batch.updatedAt)}</span>
                                </div>

                                {batch.notes && (
                                    <div className={styles.batchNotes}>
                                        <strong>Notes:</strong> {batch.notes}
                                    </div>
                                )}
                            </div>

                            <div className={styles.batchActions}>
                                <Button variant="secondary" size="sm" onClick={() => handleViewBatch(batch)}>
                                    View
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => handleEditBatch(batch)}>
                                    Edit
                                </Button>
                                {batch.status === 'READY_TO_HARVEST' && (
                                    <Button variant="primary" size="sm" onClick={() => handleHarvestBatch(batch)}>
                                        Harvest
                                    </Button>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {filteredBatches.length === 0 && (
                <Card className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🌱</div>
                    <h3>No batches found</h3>
                    <p>Try adjusting your filters or create a new batch to get started.</p>
                    <Button variant="primary" onClick={handleCreateBatch}>
                        Create First Batch
                    </Button>
                </Card>
            )}

            {/* Create Modal Placeholder */}
            {showCreateModal && (
                <div className={styles.modalOverlay}>
                    <Card className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>Create New Batch</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => setShowCreateModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);

                            try {
                                // ✅ CRITICAL FIX: Proper farm context validation
                                if (!currentFarm?.id) {
                                    alert('No farm context available. Please select a farm.');
                                    return;
                                }

                                const response = await fetch('/api/batches', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-Farm-ID': currentFarm.id
                                    },
                                    body: JSON.stringify({
                                        batchNumber: formData.get('batchNumber'),
                                        seedVarietyId: formData.get('seedVarietyId'),
                                        plantDate: formData.get('plantDate'),
                                        expectedHarvestDate: formData.get('expectedHarvestDate'),
                                        quantity: formData.get('quantity'),
                                        unit: formData.get('unit'),
                                        growingZone: formData.get('growingZone'),
                                        notes: formData.get('notes'),
                                        status: 'PLANTED'
                                    })
                                });

                                if (response.ok) {
                                    await loadBatches();
                                    setShowCreateModal(false);
                                } else {
                                    const error = await response.json();
                                    alert(error.error || 'Failed to create batch');
                                }
                            } catch (error) {
                                console.error('Failed to create batch:', error);
                                alert('Failed to create batch. Please try again.');
                            }
                        }}>
                            <div className={styles.modalContent}>
                                <div className={styles.formGrid}>
                                    <div className={styles.formField}>
                                        <label>Batch Number *</label>
                                        <input
                                            type="text"
                                            name="batchNumber"
                                            placeholder="e.g., ACT-SPN-2025-001"
                                            required
                                        />
                                    </div>

                                    <div className={styles.formField}>
                                        <label>Seed Variety *</label>
                                        <select name="seedVarietyId" required>
                                            <option value="">Select a variety</option>
                                            <option value="seed-001">Arugula</option>
                                            <option value="seed-002">Broccoli</option>
                                            <option value="seed-003">Radish</option>
                                            <option value="seed-004">Pea Shoots</option>
                                            <option value="seed-005">Sunflower</option>
                                        </select>
                                    </div>

                                    <div className={styles.formField}>
                                        <label>Plant Date *</label>
                                        <input
                                            type="date"
                                            name="plantDate"
                                            required
                                            defaultValue={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    <div className={styles.formField}>
                                        <label>Expected Harvest Date *</label>
                                        <input
                                            type="date"
                                            name="expectedHarvestDate"
                                            required
                                            defaultValue={new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                        />
                                    </div>

                                    <div className={styles.formField}>
                                        <label>Quantity *</label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            placeholder="e.g., 20"
                                            required
                                            min="1"
                                            step="1"
                                        />
                                    </div>

                                    <div className={styles.formField}>
                                        <label>Unit *</label>
                                        <select name="unit" required>
                                            <option value="trays">Trays</option>
                                            <option value="kg">Kilograms</option>
                                            <option value="g">Grams</option>
                                            <option value="units">Units</option>
                                        </select>
                                    </div>

                                    <div className={styles.formField}>
                                        <label>Growing Zone *</label>
                                        <select name="growingZone" required>
                                            <option value="Zone A">Zone A</option>
                                            <option value="Zone B">Zone B</option>
                                            <option value="Zone C">Zone C</option>
                                            <option value="Zone D">Zone D</option>
                                        </select>
                                    </div>

                                    <div className={styles.formField} style={{ gridColumn: '1 / -1' }}>
                                        <label>Notes</label>
                                        <textarea
                                            name="notes"
                                            rows={3}
                                            className={styles.textarea}
                                            placeholder="Any special instructions or notes..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </Button>
                                <Button variant="primary" type="submit">
                                    Create Batch
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* View Modal */}
            {selectedBatch && (
                <div className={styles.modalOverlay}>
                    <Card className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>Batch Details: {selectedBatch.batchNumber}</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => {
                                    setSelectedBatch(null);
                                    // Clear the batch parameter from URL
                                    const url = new URL(window.location.href);
                                    url.searchParams.delete('batch');
                                    router.replace(url.pathname + url.search);
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalContent}>
                            <div className={styles.detailsGrid}>
                                {/* Basic Information */}
                                <div className={styles.detailSection}>
                                    <h3>Basic Information</h3>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Batch Number:</span>
                                        <span className={styles.detailValue}>{selectedBatch.batchNumber}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Status:</span>
                                        <span
                                            className={styles.detailValue}
                                            style={{
                                                color: getStatusColor(selectedBatch.status),
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {getStatusIcon(selectedBatch.status)} {selectedBatch.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Seed Variety:</span>
                                        <span className={styles.detailValue}>{selectedBatch.seedVariety}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Growing Zone:</span>
                                        <span className={styles.detailValue}>{selectedBatch.zone}</span>
                                    </div>
                                </div>

                                {/* Quantity Information */}
                                <div className={styles.detailSection}>
                                    <h3>Quantity & Yield</h3>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Planted Quantity:</span>
                                        <span className={styles.detailValue}>{selectedBatch.quantity} {selectedBatch.unit}</span>
                                    </div>
                                    {selectedBatch.yieldAmount && (
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Actual Yield:</span>
                                            <span className={styles.detailValue}>{selectedBatch.yieldAmount} kg</span>
                                        </div>
                                    )}
                                    {selectedBatch.qualityGrade && (
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Quality Grade:</span>
                                            <span className={styles.detailValue}>Grade {selectedBatch.qualityGrade}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Timeline Information */}
                                <div className={styles.detailSection}>
                                    <h3>Timeline</h3>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Plant Date:</span>
                                        <span className={styles.detailValue}>{formatDate(selectedBatch.plantDate)}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Expected Harvest:</span>
                                        <span className={styles.detailValue}>{formatDate(selectedBatch.expectedHarvestDate)}</span>
                                    </div>
                                    {selectedBatch.actualHarvestDate && (
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Actual Harvest:</span>
                                            <span className={styles.detailValue}>{formatDate(selectedBatch.actualHarvestDate)}</span>
                                        </div>
                                    )}
                                    {(() => {
                                        const days = getDaysToHarvest(selectedBatch.expectedHarvestDate, selectedBatch.actualHarvestDate);
                                        return days !== null ? (
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Days to Harvest:</span>
                                                <span className={`${styles.detailValue} ${days <= 0 ? styles.urgent : ''}`}>
                                                    {days <= 0 ? 'Ready for Harvest!' : `${days} days`}
                                                </span>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>

                                {/* Metadata */}
                                <div className={styles.detailSection}>
                                    <h3>Additional Information</h3>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Created By:</span>
                                        <span className={styles.detailValue}>{selectedBatch.createdBy}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Last Updated:</span>
                                        <span className={styles.detailValue}>{formatDate(selectedBatch.updatedAt)}</span>
                                    </div>
                                    {selectedBatch.notes && (
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Notes:</span>
                                            <span className={styles.detailValue}>{selectedBatch.notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <Button variant="secondary" onClick={() => {
                                    setSelectedBatch(null);
                                    // Clear the batch parameter from URL
                                    const url = new URL(window.location.href);
                                    url.searchParams.delete('batch');
                                    router.replace(url.pathname + url.search);
                                }}>
                                    Close
                                </Button>
                                <Button variant="primary" onClick={() => {
                                    setSelectedBatch(null);
                                    // Clear the batch parameter from URL
                                    const url = new URL(window.location.href);
                                    url.searchParams.delete('batch');
                                    router.replace(url.pathname + url.search);
                                    handleEditBatch(selectedBatch);
                                }}>
                                    Edit Batch
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Edit Modal */}
            {isEditMode && editingBatch && (
                <div className={styles.modalOverlay}>
                    <Card className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>Edit Batch: {editingBatch.batchNumber}</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => {
                                    setIsEditMode(false);
                                    setEditingBatch(null);
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                // ✅ CRITICAL FIX: Proper farm context validation
                                if (!currentFarm?.id) {
                                    alert('No farm context available. Please select a farm.');
                                    return;
                                }

                                const response = await fetch(`/api/batches/${editingBatch.id}`, {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-Farm-ID': currentFarm.id
                                    },
                                    body: JSON.stringify(editingBatch)
                                });

                                if (response.ok) {
                                    await loadBatches();
                                    setIsEditMode(false);
                                    setEditingBatch(null);
                                }
                            } catch (error) {
                                console.error('Failed to update batch:', error);
                            }
                        }}>
                            <div className={styles.modalContent}>
                                <div className={styles.formGrid}>
                                    <div className={styles.formField}>
                                        <label>Batch Number</label>
                                        <input
                                            type="text"
                                            value={editingBatch.batchNumber}
                                            readOnly
                                            className={styles.readOnlyInput}
                                        />
                                    </div>

                                    <div className={styles.formField}>
                                        <label>Status</label>
                                        <select
                                            value={editingBatch.status}
                                            onChange={(e) => setEditingBatch({
                                                ...editingBatch,
                                                status: e.target.value as Batch['status']
                                            })}
                                        >
                                            <option value="PLANTED">Planted</option>
                                            <option value="GERMINATING">Germinating</option>
                                            <option value="GROWING">Growing</option>
                                            <option value="READY_TO_HARVEST">Ready to Harvest</option>
                                            <option value="HARVESTED">Harvested</option>
                                        </select>
                                    </div>

                                    <div className={styles.formField}>
                                        <label>Seed Variety</label>
                                        <input
                                            type="text"
                                            value={editingBatch.seedVariety}
                                            onChange={(e) => setEditingBatch({
                                                ...editingBatch,
                                                seedVariety: e.target.value
                                            })}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formField}>
                                        <label>Growing Zone</label>
                                        <select
                                            value={editingBatch.zone}
                                            onChange={(e) => setEditingBatch({
                                                ...editingBatch,
                                                zone: e.target.value
                                            })}
                                        >
                                            <option value="Zone A">Zone A</option>
                                            <option value="Zone B">Zone B</option>
                                            <option value="Zone C">Zone C</option>
                                            <option value="Zone D">Zone D</option>
                                        </select>
                                    </div>

                                    <div className={styles.formField}>
                                        <label>Quantity</label>
                                        <input
                                            type="number"
                                            value={editingBatch.quantity}
                                            onChange={(e) => setEditingBatch({
                                                ...editingBatch,
                                                quantity: parseInt(e.target.value) || 0
                                            })}
                                            required
                                            min="0"
                                        />
                                    </div>

                                    <div className={styles.formField}>
                                        <label>Unit</label>
                                        <select
                                            value={editingBatch.unit}
                                            onChange={(e) => setEditingBatch({
                                                ...editingBatch,
                                                unit: e.target.value
                                            })}
                                        >
                                            <option value="trays">Trays</option>
                                            <option value="kg">Kilograms</option>
                                            <option value="g">Grams</option>
                                            <option value="units">Units</option>
                                        </select>
                                    </div>

                                    <div className={styles.formField}>
                                        <label>Plant Date</label>
                                        <input
                                            type="date"
                                            value={editingBatch.plantDate.split('T')[0]}
                                            onChange={(e) => setEditingBatch({
                                                ...editingBatch,
                                                plantDate: new Date(e.target.value).toISOString()
                                            })}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formField}>
                                        <label>Expected Harvest Date</label>
                                        <input
                                            type="date"
                                            value={editingBatch.expectedHarvestDate.split('T')[0]}
                                            onChange={(e) => setEditingBatch({
                                                ...editingBatch,
                                                expectedHarvestDate: new Date(e.target.value).toISOString()
                                            })}
                                            required
                                        />
                                    </div>

                                    {editingBatch.status === 'HARVESTED' && (
                                        <>
                                            <div className={styles.formField}>
                                                <label>Actual Harvest Date</label>
                                                <input
                                                    type="date"
                                                    value={editingBatch.actualHarvestDate?.split('T')[0] || ''}
                                                    onChange={(e) => setEditingBatch({
                                                        ...editingBatch,
                                                        actualHarvestDate: e.target.value ? new Date(e.target.value).toISOString() : undefined
                                                    })}
                                                />
                                            </div>

                                            <div className={styles.formField}>
                                                <label>Yield Amount (kg)</label>
                                                <input
                                                    type="number"
                                                    value={editingBatch.yieldAmount || ''}
                                                    onChange={(e) => setEditingBatch({
                                                        ...editingBatch,
                                                        yieldAmount: parseFloat(e.target.value) || undefined
                                                    })}
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className={styles.formField}>
                                        <label>Quality Grade</label>
                                        <select
                                            value={editingBatch.qualityGrade || ''}
                                            onChange={(e) => setEditingBatch({
                                                ...editingBatch,
                                                qualityGrade: e.target.value as 'A' | 'B' | 'C' | undefined
                                            })}
                                        >
                                            <option value="">Pending</option>
                                            <option value="A">Grade A</option>
                                            <option value="B">Grade B</option>
                                            <option value="C">Grade C</option>
                                        </select>
                                    </div>

                                    <div className={styles.formField} style={{ gridColumn: '1 / -1' }}>
                                        <label>Notes</label>
                                        <textarea
                                            value={editingBatch.notes || ''}
                                            onChange={(e) => setEditingBatch({
                                                ...editingBatch,
                                                notes: e.target.value
                                            })}
                                            rows={3}
                                            className={styles.textarea}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={() => {
                                        setIsEditMode(false);
                                        setEditingBatch(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button variant="primary" type="submit">
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
} 