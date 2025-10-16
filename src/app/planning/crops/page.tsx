'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card, Button, ExpandableCard } from '@/components/ui';
import type { CardMetric, CardStatus } from '@/components/ui';
import CropPlanModal from './CropPlanModal';
import styles from './page.module.css';

interface Crop {
    id: string;
    name: string;
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
    yield: number;
    zone: {
        id: string;
        name: string;
        type: string;
    };
    growingMethod: string;
    notes: string;
    createdAt?: string;
    updatedAt?: string;
}

interface Zone {
    id: string;
    name: string;
    capacity: number;
    currentUtilization: number;
    activeProductions: number;
}

export default function CropPlanningPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm, isLoading: isTenantLoading } = useTenant();
    const [plans, setPlans] = useState<CropPlan[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState('all');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<CropPlan | null>(null);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

    const loadCropPlans = useCallback(async () => {
        if (!currentFarm) {
            console.log('No current farm, skipping crop plans load');
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            console.log('🌾 Loading crop plans for farm:', currentFarm.farm_name, currentFarm.id);

            // Fetch crop plans from API with proper farm context
            const response = await fetch('/api/crop-plans', {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Farm-ID': currentFarm.id,
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Crop plans loaded:', data.count, 'plans');
                setPlans(data.success ? data.data : []);
            } else {
                console.error('Failed to fetch crop plans');
                setPlans([]);
            }
        } catch (error) {
            console.error('Error loading crop plans:', error);
            setPlans([]);
        } finally {
            setLoading(false);
        }
    }, [currentFarm]);

    useEffect(() => {
        if (!isAuthLoading && !isTenantLoading) {
            if (isAuthenticated && currentFarm) {
                loadCropPlans();
            } else if (!isAuthenticated) {
                router.push('/auth/signin');
            }
        }
    }, [isAuthLoading, isTenantLoading, isAuthenticated, currentFarm, router, loadCropPlans]);

    if (isAuthLoading || isTenantLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading crop planning...</p>
                </div>
            </div>
        );
    }

    if (!currentFarm) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <h3>🚜 No Farm Selected</h3>
                    <p>Please select a farm to view crop plans.</p>
                </div>
            </div>
        );
    }

    const getFilteredPlans = () => {
        if (selectedZone === 'all') return plans;
        return plans.filter(plan => plan.crop.name === selectedZone);
    };

    // Handler functions for crop plan actions
    const handleEditPlan = (planId: string) => {
        const plan = plans.find(p => p.id === planId);
        if (plan) {
            setEditingPlan(plan);
            setModalMode('edit');
            setShowModal(true);
        }
    };

    const handleViewBatch = (planId: string | undefined) => {
        if (!planId) {
            console.warn('No plan ID provided for batch viewing');
            return;
        }

        console.log('Navigating to production batches for crop plan:', planId);

        // Navigate to production batches page where user can find related batches
        // In the future, we'll add API endpoint to get batch ID directly from crop plan
        router.push('/production/batches');
    };

    const handleUpdateStatus = (planId: string) => {
        console.log('Updating status for plan:', planId);
        alert(`Update Status: ${planId}\n\nThis will open a status update modal with options:\n- Planned → Active\n- Active → Growing\n- Growing → Harvested\n- Add progress notes\n\n(Status update functionality will be implemented)`);
    };

    const handleDeletePlan = async (planId: string) => {
        if (!currentFarm || !confirm('Are you sure you want to delete this crop plan?')) {
            return;
        }

        try {
            const response = await fetch(`/api/crop-plans?id=${planId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Farm-ID': currentFarm.id,
                },
            });

            if (response.ok) {
                console.log('✅ Crop plan deleted successfully');
                // Refresh the crop plans list
                await loadCropPlans();
            } else {
                const error = await response.json();
                console.error('Failed to delete crop plan:', error);
                alert(`Failed to delete crop plan: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting crop plan:', error);
            alert('Failed to delete crop plan. Please try again.');
        }
    };

    const handleNewCropPlan = () => {
        setEditingPlan(null);
        setModalMode('add');
        setShowModal(true);
    };

    const handleViewCalendar = () => {
        console.log('Opening calendar view');
        alert('View Calendar\n\nThis will open the production calendar showing:\n- All crop plans timeline\n- Planting schedules\n- Harvest dates\n- Zone utilization\n- Seasonal planning\n\n(Calendar view will be implemented)');
    };

    // Modal handlers
    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPlan(null);
    };

    const handleSaveCropPlan = async (savedPlan: any) => {
        console.log('Crop plan saved:', savedPlan);
        // Refresh the crop plans list
        await loadCropPlans();
    };

    // Summary card click handlers
    const handleTotalPlansClick = () => {
        setSelectedZone('all');
        console.log('Showing all plans');
    };

    const handleActiveGrowingClick = () => {
        setSelectedZone('all');
        console.log('Filtering to active/growing plans');
    };

    const handleCompletedClick = () => {
        setSelectedZone('all');
        console.log('Filtering to completed plans');
    };

    const handleCardClick = (planId: string) => {
        console.log('Card clicked for plan:', planId);
        // This will be handled by the ExpandableCard component automatically
    };

    const getPlanCardStatus = (plan: CropPlan): CardStatus => {
        const status = plan.status?.toLowerCase() || plan.crop.name.toLowerCase();

        if (status === 'completed' || status === 'harvested') {
            return { label: 'Completed', color: '#22c55e', variant: 'solid' };
        } else if (status === 'growing' || status === 'planted' || status === 'active') {
            return { label: 'Active', color: '#3b82f6', variant: 'solid' };
        } else if (status === 'planned') {
            return { label: 'Planned', color: '#f59e0b', variant: 'solid' };
        } else {
            return { label: 'Unknown', color: '#6b7280', variant: 'outlined' };
        }
    };

    const getPlanCardMetrics = (plan: CropPlan): CardMetric[] => {
        const metrics: CardMetric[] = [
            {
                label: 'Expected Yield',
                value: `${plan.expectedYield || plan.yield || 0} lbs`,
                icon: '🌾',
                color: '#d97706'
            }
        ];

        return metrics;
    };

    const renderPlanDetails = (plan: CropPlan) => (
        <div className={styles.planDetails}>
            <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                    <label>Crop Type</label>
                    <span>{plan.crop.name}</span>
                </div>
                <div className={styles.detailItem}>
                    <label>Plan Name</label>
                    <span>{plan.planName || 'N/A'}</span>
                </div>
                <div className={styles.detailItem}>
                    <label>Planting Date</label>
                    <span>{plan.plantingDate ? new Date(plan.plantingDate).toLocaleDateString() : 'Not set'}</span>
                </div>
                <div className={styles.detailItem}>
                    <label>Expected Harvest</label>
                    <span>{plan.harvestDate ? new Date(plan.harvestDate).toLocaleDateString() : 'Not set'}</span>
                </div>
                <div className={styles.detailItem}>
                    <label>Status</label>
                    <span className={styles.statusText}>{plan.status || 'Planned'}</span>
                </div>
                <div className={styles.detailItem}>
                    <label>Growing Zone</label>
                    <span>{plan.zone?.name || 'Not assigned'}</span>
                </div>
                <div className={styles.detailItem}>
                    <label>Expected Yield</label>
                    <span>{plan.expectedYield || plan.yield || 0} lbs</span>
                </div>
                <div className={styles.detailItem}>
                    <label>Growing Method</label>
                    <span>{plan.growingMethod || 'Not specified'}</span>
                </div>
                {plan.notes && (
                    <div className={styles.detailItem}>
                        <label>Notes</label>
                        <span>{plan.notes}</span>
                    </div>
                )}
            </div>
        </div>
    );

    const filteredPlans = getFilteredPlans();
    const activePlans = filteredPlans.filter(plan =>
        ['growing', 'planted', 'active'].includes((plan.status || plan.crop.name).toLowerCase())
    ).length;
    const completedPlans = filteredPlans.filter(plan =>
        ['completed', 'harvested'].includes((plan.status || plan.crop.name).toLowerCase())
    ).length;

    return (
        <div className={styles.container}>
            {/* Standard Header - Following Analytics/Sales Pattern */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div>
                        <h1 className={styles.title}>🌾 Crop Planning & Rotation</h1>
                        <p className={styles.subtitle}>Smart production scheduling across all growing zones</p>
                    </div>
                    <div className={styles.headerActions}>
                        <select
                            className={styles.modernSelect}
                            value={selectedZone}
                            onChange={(e) => setSelectedZone(e.target.value)}
                        >
                            <option value="all">All Crops ({zones.length})</option>
                            {zones.map((zone) => (
                                <option key={zone.id} value={zone.name}>
                                    {zone.name} ({zone.activeProductions}/{zone.capacity})
                                </option>
                            ))}
                        </select>
                        <Button variant="primary" onClick={handleNewCropPlan}>
                            ➕ New Crop Plan
                        </Button>
                    </div>
                </div>
            </div>

            {/* Statistics Grid - Clickable */}
            <div className={styles.statsGrid}>
                <Card className={`${styles.statCard} ${styles.clickableCard}`} onClick={handleTotalPlansClick}>
                    <div className={styles.statContent}>
                        <div className={styles.statIcon}>📋</div>
                        <div className={styles.statDetails}>
                            <div className={styles.statNumber}>{filteredPlans.length}</div>
                            <div className={styles.statLabel}>Total Plans</div>
                        </div>
                    </div>
                </Card>
                <Card className={`${styles.statCard} ${styles.clickableCard}`} onClick={handleActiveGrowingClick}>
                    <div className={styles.statContent}>
                        <div className={styles.statIcon}>🌱</div>
                        <div className={styles.statDetails}>
                            <div className={styles.statNumber}>{activePlans}</div>
                            <div className={styles.statLabel}>Active Growing</div>
                        </div>
                    </div>
                </Card>
                <Card className={`${styles.statCard} ${styles.clickableCard}`} onClick={handleCompletedClick}>
                    <div className={styles.statContent}>
                        <div className={styles.statIcon}>✅</div>
                        <div className={styles.statDetails}>
                            <div className={styles.statNumber}>{completedPlans}</div>
                            <div className={styles.statLabel}>Completed</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Crop Plans Grid */}
            <div className={styles.mainContent}>
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>🌾 Crop Production Plans</h2>
                        <Button variant="secondary" onClick={handleViewCalendar}>View Calendar</Button>
                    </div>

                    {loading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                            <p>Loading crop plans...</p>
                        </div>
                    ) : filteredPlans.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No crop plans found for the selected zone.</p>
                            <Button variant="primary" onClick={handleNewCropPlan}>Create First Plan</Button>
                        </div>
                    ) : (
                        <div className={styles.cardGrid}>
                            {filteredPlans.map((plan) => (
                                <ExpandableCard
                                    key={plan.id}
                                    title={`${plan.planName || plan.crop.name}`}
                                    subtitle={`Planted: ${plan.plantingDate ? new Date(plan.plantingDate).toLocaleDateString() : 'Not set'}`}
                                    description={`Expected Harvest: ${plan.harvestDate ? new Date(plan.harvestDate).toLocaleDateString() : 'Not set'}`}
                                    icon="🌾"
                                    status={getPlanCardStatus(plan)}
                                    metrics={getPlanCardMetrics(plan)}
                                    actions={[
                                        {
                                            label: 'Edit Plan',
                                            onClick: () => handleEditPlan(plan.id),
                                            variant: 'primary' as const,
                                            icon: '✏️'
                                        },
                                        {
                                            label: 'View Batch',
                                            onClick: () => handleViewBatch(plan.id),
                                            variant: 'secondary' as const,
                                            icon: '👁️'
                                        },
                                        {
                                            label: 'Update Status',
                                            onClick: () => handleUpdateStatus(plan.id),
                                            variant: 'secondary' as const,
                                            icon: '🔄'
                                        },
                                        {
                                            label: 'Delete',
                                            onClick: () => handleDeletePlan(plan.id),
                                            variant: 'danger' as const,
                                            icon: '🗑️'
                                        }
                                    ]}
                                    detailsContent={renderPlanDetails(plan)}
                                    expandMode="both"
                                    variant="elevated"
                                    size="md"
                                    priority={plan.priority === 'high' || plan.crop.name === 'Basil' ? 'high' : 'medium'}
                                    className={styles.planCard}
                                    onClick={() => handleCardClick(plan.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Crop Plan Modal */}
            <CropPlanModal
                isOpen={showModal}
                onClose={handleCloseModal}
                onSave={handleSaveCropPlan}
                cropPlan={editingPlan}
                mode={modalMode}
            />
        </div>
    );
}