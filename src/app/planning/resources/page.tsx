'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import styles from './page.module.css';

interface Zone {
    id: string;
    name: string;
    type: string;
    maxBatches: number;
    currentBatches: number;
    utilization: number;
    status: string;
    equipment: string[];
    notes?: string;
}

interface Resource {
    id: string;
    name: string;
    type: 'equipment' | 'supply' | 'infrastructure' | 'labor' | 'materials' | 'space';
    status: 'available' | 'in-use' | 'maintenance' | 'unavailable' | 'critical' | 'high' | 'normal';
    location: string;
    quantity?: number;
    unit?: string;
    lastMaintenance?: string;
    nextMaintenance?: string;
    category: string;
    total: number;
    used: number;
    available: number;
    lastUpdated: string;
    utilization: number;
}

interface ResourceUtilization {
    zoneId: string;
    zoneName: string;
    utilizationRate: number;
    efficiency: number;
    bottlenecks: string[];
    recommendations: string[];
}

export default function ResourcePlanningPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm } = useTenant();

    const [zones, setZones] = useState<Zone[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [utilization, setUtilization] = useState<ResourceUtilization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

    const fetchResourceData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // ✅ CRITICAL FIX: Ensure farm context before making API calls
            if (!currentFarm?.id) {
                throw new Error('No farm context available. Please select a farm.');
            }

            // Get user data for authorization
            const userData = localStorage.getItem('ofms_user');
            const headers: Record<string, string> = {
                'X-Farm-ID': currentFarm.id,
                'Cache-Control': 'no-store'
            };

            if (userData) {
                const user = JSON.parse(userData);
                headers['Authorization'] = `Bearer ${user.id}`;
            }

            console.log('🏗️ Loading resource data for farm:', currentFarm.farm_name);

            const [zonesRes, batchesRes, equipmentRes, inventoryRes] = await Promise.all([
                fetch('/api/zones', { headers }),
                fetch('/api/batches?limit=100', { headers }),
                fetch('/api/equipment', { headers }),
                fetch('/api/inventory', { headers })
            ]);

            const [zonesData, batchesData, equipmentData, inventoryData] = await Promise.all([
                zonesRes.json(),
                batchesRes.json(),
                equipmentRes.json(),
                inventoryRes.json()
            ]);

            if (zonesRes.ok && batchesRes.ok && equipmentRes.ok && inventoryRes.ok) {
                const resourceList: Resource[] = [];
                const utilizationList: ResourceUtilization[] = [];

                // Get zones from API
                const zonesList = zonesData.success ? zonesData.data : [];
                console.log(`📊 Loaded ${zonesList.length} zones from API`);

                // Get batches data to calculate zone utilization
                const batchesList = batchesData.success ? batchesData.data : [];

                // Calculate utilization for each zone
                const processedZones = zonesList.map((zone: any) => {
                    // Count batches in this zone
                    const zoneBatches = batchesList.filter((batch: any) =>
                        batch.growingZone === zone.name &&
                        batch.status === 'active'
                    );

                    const currentBatches = zoneBatches.length;
                    const maxBatches = zone.capacity || 10; // Use capacity or default to 10
                    const utilization = maxBatches > 0 ? Math.round((currentBatches / maxBatches) * 100) : 0;

                    return {
                        ...zone,
                        currentBatches,
                        maxBatches,
                        utilization,
                        equipment: [], // Default empty array
                        notes: zone.description || undefined
                    };
                });

                // Process zones for utilization analysis
                processedZones.forEach((zone: any) => {
                    const bottlenecks: string[] = [];
                    const recommendations: string[] = [];

                    if (zone.utilization > 90) {
                        bottlenecks.push('Zone at maximum capacity');
                        recommendations.push('Consider expanding growing area or optimizing batch scheduling');
                    }

                    if (zone.utilization < 30) {
                        recommendations.push('Zone has available capacity for new plantings');
                    }

                    if (zone.currentBatches === 0) {
                        recommendations.push('Zone is completely available for new production');
                    }

                    utilizationList.push({
                        zoneId: zone.id,
                        zoneName: zone.name,
                        utilizationRate: zone.utilization,
                        efficiency: Math.max(80, 100 - (zone.utilization > 80 ? (zone.utilization - 80) * 2 : 0)),
                        bottlenecks,
                        recommendations
                    });
                });

                // Equipment resources
                const equipment = Array.isArray(equipmentData) ? equipmentData : [];
                const operationalEquipment = equipment.filter((e: any) => e.status === 'OPERATIONAL').length;
                const totalEquipment = equipment.length;

                if (totalEquipment > 0) {
                    resourceList.push({
                        id: 'equipment-overall',
                        name: 'Farm Equipment',
                        type: 'equipment',
                        category: 'Infrastructure',
                        total: totalEquipment,
                        used: equipment.filter((e: any) => e.status === 'MAINTENANCE' || e.status === 'REPAIR').length,
                        available: operationalEquipment,
                        unit: 'units',
                        utilization: Math.round((operationalEquipment / totalEquipment) * 100),
                        status: operationalEquipment / totalEquipment > 0.8 ? 'normal' : 'high',
                        location: 'Various',
                        lastUpdated: new Date().toISOString()
                    });
                }

                // Inventory resources
                const inventory = Array.isArray(inventoryData) ? inventoryData : [];
                const lowStockItems = inventory.filter((item: any) =>
                    item.quantity <= item.reorderPoint
                ).length;

                if (inventory.length > 0) {
                    resourceList.push({
                        id: 'inventory-overall',
                        name: 'Inventory Supplies',
                        type: 'supply',
                        category: 'Materials',
                        total: inventory.length,
                        used: lowStockItems,
                        available: inventory.length - lowStockItems,
                        unit: 'items',
                        utilization: inventory.length > 0 ? Math.round(((inventory.length - lowStockItems) / inventory.length) * 100) : 0,
                        status: lowStockItems > inventory.length * 0.3 ? 'critical' : lowStockItems > 0 ? 'high' : 'normal',
                        location: 'Warehouse',
                        lastUpdated: new Date().toISOString()
                    });
                }

                // Labor resource (estimated based on active plans)
                const totalActivePlans = processedZones.reduce((sum: number, zone: any) => sum + (zone.currentBatches || 0), 0);
                const estimatedLaborHours = totalActivePlans * 2; // 2 hours per active plan
                const availableLaborHours = 40;

                resourceList.push({
                    id: 'labor-overall',
                    name: 'Labor Resources',
                    type: 'labor',
                    category: 'Human Resources',
                    total: availableLaborHours,
                    used: Math.min(estimatedLaborHours, availableLaborHours),
                    available: Math.max(0, availableLaborHours - estimatedLaborHours),
                    unit: 'hours/week',
                    utilization: Math.round((Math.min(estimatedLaborHours, availableLaborHours) / availableLaborHours) * 100),
                    status: estimatedLaborHours > availableLaborHours ? 'critical' : estimatedLaborHours > availableLaborHours * 0.8 ? 'high' : 'normal',
                    location: 'Farm Operations',
                    lastUpdated: new Date().toISOString()
                });

                setZones(processedZones);
                setResources(resourceList);
                setUtilization(utilizationList);
            } else {
                console.error('Failed to load resource data');
                setError('Failed to load resource data');
                setZones([]);
                setResources([]);
                setUtilization([]);
            }
        } catch (error) {
            console.error('Error loading resources:', error);
            setError('Error loading resource data');
            setZones([]);
            setResources([]);
            setUtilization([]);
        } finally {
            setLoading(false);
        }
    }, [currentFarm?.id]);

    useEffect(() => {
        if (!isAuthLoading) {
            if (isAuthenticated) {
                fetchResourceData();
            } else {
                router.push('/auth/signin');
            }
        }
    }, [isAuthLoading, isAuthenticated, router, fetchResourceData]);

    // Reload when farm changes
    useEffect(() => {
        if (currentFarm && isAuthenticated) {
            fetchResourceData();
        }
    }, [currentFarm?.id, isAuthenticated, fetchResourceData]);

    const getUtilizationColor = (utilization: number): string => {
        if (utilization >= 90) return '#ef4444';
        if (utilization >= 75) return '#f59e0b';
        if (utilization >= 50) return '#10b981';
        return '#6b7280';
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'available': return '#10b981';
            case 'in-use': return '#3b82f6';
            case 'maintenance': return '#f59e0b';
            case 'unavailable': return '#ef4444';
            case 'critical': return '#ef4444';
            case 'high': return '#f59e0b';
            case 'normal': return '#10b981';
            default: return '#6b7280';
        }
    };

    const openZoneDetails = (zone: Zone) => {
        setSelectedZone(zone);
    };

    const handleEditZone = () => {
        if (selectedZone) {
            // Navigate to zones management page for editing
            router.push(`/planning/zones?edit=${selectedZone.id}`);
        }
    };

    const handleViewAnalytics = () => {
        if (selectedZone) {
            // Navigate to analytics page with zone context
            router.push(`/analytics/production?zone=${selectedZone.id}`);
        }
    };

    const handleOptimizeResources = () => {
        // Navigate to resource optimization tools
        router.push('/planning/optimization');
    };

    const handleSchedulePlanning = () => {
        // Navigate to production planning calendar
        router.push('/planning/calendar');
    };

    if (isAuthLoading || loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <h1>📊 Loading Resource Planning...</h1>
                    <p>Analyzing your farm resources...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.errorState}>
                    <h2>⚠️ Resource Planning Error</h2>
                    <p>{error}</p>
                    <Button variant="primary" onClick={fetchResourceData}>
                        Retry
                    </Button>
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
                        <h1 className={styles.title}>📊 Resource Planning</h1>
                        <p className={styles.subtitle}>
                            Optimize your farm resources and zone utilization for maximum efficiency
                        </p>
                    </div>
                    <div className={styles.headerActions}>
                        <Button variant="secondary" onClick={() => router.push('/dashboard')}>
                            ← Dashboard
                        </Button>
                        <Button variant="secondary" onClick={handleOptimizeResources}>
                            🔧 Optimize
                        </Button>
                        <Button variant="primary" onClick={handleSchedulePlanning}>
                            📅 Plan Schedule
                        </Button>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className={styles.metricsGrid}>
                <Card className={styles.metricCard}>
                    <div className={styles.metricContent}>
                        <div className={styles.metricIcon}>🏭</div>
                        <div className={styles.metricDetails}>
                            <div className={styles.metricValue}>{zones.length}</div>
                            <div className={styles.metricLabel}>Active Zones</div>
                        </div>
                    </div>
                </Card>
                <Card className={styles.metricCard}>
                    <div className={styles.metricContent}>
                        <div className={styles.metricIcon}>📊</div>
                        <div className={styles.metricDetails}>
                            <div className={styles.metricValue}>
                                {zones.length > 0 ? Math.round(zones.reduce((sum, zone) => sum + zone.utilization, 0) / zones.length) : 0}%
                            </div>
                            <div className={styles.metricLabel}>Avg Utilization</div>
                        </div>
                    </div>
                </Card>
                <Card className={styles.metricCard}>
                    <div className={styles.metricContent}>
                        <div className={styles.metricIcon}>💰</div>
                        <div className={styles.metricDetails}>
                            <div className={styles.metricValue}>
                                ${zones.reduce((sum, zone) => sum + (zone.currentBatches * 150), 0).toLocaleString()}
                            </div>
                            <div className={styles.metricLabel}>Est. Revenue</div>
                        </div>
                    </div>
                </Card>
                <Card className={styles.metricCard}>
                    <div className={styles.metricContent}>
                        <div className={styles.metricIcon}>⚠️</div>
                        <div className={styles.metricDetails}>
                            <div className={styles.metricValue}>
                                {utilization.reduce((sum, util) => sum + util.bottlenecks.length, 0)}
                            </div>
                            <div className={styles.metricLabel}>Bottlenecks</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Zone Utilization Cards */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Zone Utilization</h2>
                <div className={styles.zonesGrid}>
                    {zones.map((zone) => (
                        <Card
                            key={zone.id}
                            className={styles.zoneCard}
                            onClick={() => openZoneDetails(zone)}
                        >
                            <div className={styles.zoneHeader}>
                                <h3 className={styles.zoneName}>{zone.name}</h3>
                                <span className={styles.zoneType}>{zone.type}</span>
                            </div>

                            <div className={styles.utilizationDisplay}>
                                <div className={styles.utilizationBar}>
                                    <div
                                        className={styles.utilizationFill}
                                        style={{
                                            width: `${zone.utilization}%`,
                                            backgroundColor: getUtilizationColor(zone.utilization)
                                        }}
                                    />
                                </div>
                                <span className={styles.utilizationText}>
                                    {zone.utilization}% utilized
                                </span>
                            </div>

                            <div className={styles.zoneStats}>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Current:</span>
                                    <span className={styles.statValue}>{zone.currentBatches}</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Capacity:</span>
                                    <span className={styles.statValue}>{zone.maxBatches}</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statLabel}>Available:</span>
                                    <span className={styles.statValue}>{zone.maxBatches - zone.currentBatches}</span>
                                </div>
                            </div>

                            <div className={styles.zoneEquipment}>
                                <span className={styles.equipmentLabel}>Equipment:</span>
                                <div className={styles.equipmentList}>
                                    {zone.equipment.slice(0, 2).map((equipment, index) => (
                                        <span key={index} className={styles.equipmentTag}>
                                            {equipment}
                                        </span>
                                    ))}
                                    {zone.equipment.length > 2 && (
                                        <span className={styles.equipmentMore}>
                                            +{zone.equipment.length - 2} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {zones.length === 0 && (
                    <Card className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🏭</div>
                        <h3>No zones found</h3>
                        <p>Start by creating some production batches to see zone utilization.</p>
                        <Button variant="primary" onClick={() => router.push('/production/batches')}>
                            Create Batches
                        </Button>
                    </Card>
                )}
            </div>

            {/* Resource Status */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Resource Status</h2>
                <div className={styles.resourcesGrid}>
                    {resources.map((resource) => (
                        <Card key={resource.id} className={styles.resourceCard}>
                            <div className={styles.resourceHeader}>
                                <h3>{resource.name}</h3>
                                <span
                                    className={styles.resourceStatus}
                                    style={{ backgroundColor: getStatusColor(resource.status) }}
                                >
                                    {resource.status.toUpperCase()}
                                </span>
                            </div>
                            <div className={styles.resourceContent}>
                                <div className={styles.resourceMetrics}>
                                    <div className={styles.resourceMetric}>
                                        <span className={styles.resourceValue}>{resource.utilization}%</span>
                                        <span className={styles.resourceLabel}>Utilization</span>
                                    </div>
                                    <div className={styles.resourceMetric}>
                                        <span className={styles.resourceValue}>{resource.available}</span>
                                        <span className={styles.resourceLabel}>Available</span>
                                    </div>
                                </div>
                                <div className={styles.resourceProgress}>
                                    <div
                                        className={styles.resourceProgressFill}
                                        style={{
                                            width: `${resource.utilization}%`,
                                            backgroundColor: getStatusColor(resource.status)
                                        }}
                                    />
                                </div>
                                <div className={styles.resourceDetails}>
                                    <span>{resource.used}/{resource.total} {resource.unit}</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {resources.length === 0 && (
                    <Card className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📦</div>
                        <h3>No resources found</h3>
                        <p>Add equipment and inventory to see resource utilization.</p>
                        <Button variant="primary" onClick={() => router.push('/equipment/management')}>
                            Manage Equipment
                        </Button>
                    </Card>
                )}
            </div>

            {/* Utilization Analysis */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Utilization Analysis</h2>
                <div className={styles.analysisList}>
                    {utilization.map((analysis) => (
                        <Card key={analysis.zoneId} className={styles.analysisCard}>
                            <div className={styles.analysisHeader}>
                                <h4>{analysis.zoneName}</h4>
                                <div className={styles.scores}>
                                    <span className={styles.score}>
                                        Utilization: {analysis.utilizationRate}%
                                    </span>
                                    <span className={styles.score}>
                                        Efficiency: {analysis.efficiency}%
                                    </span>
                                </div>
                            </div>

                            {analysis.bottlenecks.length > 0 && (
                                <div className={styles.bottlenecks}>
                                    <h5>⚠️ Bottlenecks:</h5>
                                    <ul>
                                        {analysis.bottlenecks.map((bottleneck, index) => (
                                            <li key={index}>{bottleneck}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {analysis.recommendations.length > 0 && (
                                <div className={styles.recommendations}>
                                    <h5>💡 Recommendations:</h5>
                                    <ul>
                                        {analysis.recommendations.map((recommendation, index) => (
                                            <li key={index}>{recommendation}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>

                {utilization.length === 0 && (
                    <Card className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📊</div>
                        <h3>No analysis available</h3>
                        <p>Zone utilization analysis will appear when you have active production.</p>
                    </Card>
                )}
            </div>

            {/* Zone Detail Modal */}
            {selectedZone && (
                <div className={styles.modal} onClick={() => setSelectedZone(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Zone Details: {selectedZone.name}</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => setSelectedZone(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.zoneDetailGrid}>
                                <div className={styles.detailSection}>
                                    <h3>Capacity Information</h3>
                                    <div className={styles.capacityDetails}>
                                        <div className={styles.capacityItem}>
                                            <span>Current Batches:</span>
                                            <span>{selectedZone.currentBatches}</span>
                                        </div>
                                        <div className={styles.capacityItem}>
                                            <span>Maximum Capacity:</span>
                                            <span>{selectedZone.maxBatches}</span>
                                        </div>
                                        <div className={styles.capacityItem}>
                                            <span>Available Space:</span>
                                            <span>{selectedZone.maxBatches - selectedZone.currentBatches}</span>
                                        </div>
                                        <div className={styles.capacityItem}>
                                            <span>Utilization Rate:</span>
                                            <span>{selectedZone.utilization}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.detailSection}>
                                    <h3>Equipment & Resources</h3>
                                    <div className={styles.equipmentDetails}>
                                        {selectedZone.equipment.map((equipment, index) => (
                                            <div key={index} className={styles.equipmentItem}>
                                                <span className={styles.equipmentIcon}>⚙️</span>
                                                <span>{equipment}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedZone.notes && (
                                    <div className={styles.detailSection}>
                                        <h3>Notes</h3>
                                        <p>{selectedZone.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <Button variant="secondary" onClick={() => setSelectedZone(null)}>
                                Close
                            </Button>
                            <Button variant="secondary" onClick={handleViewAnalytics}>
                                📊 View Analytics
                            </Button>
                            <Button variant="primary" onClick={handleEditZone}>
                                ✏️ Edit Zone
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 