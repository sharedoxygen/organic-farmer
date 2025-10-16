'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card } from '@/components/ui';
import styles from './page.module.css';

interface YieldData {
    id: string;
    batchNumber: string;
    variety: string;
    plantDate: string;
    harvestDate: string;
    plannedYield: number;
    actualYield: number;
    zone: string;
    area: number; // square feet
    yieldPerSqFt: number;
    efficiency: number; // percentage
    quality: 'premium' | 'standard' | 'below_standard';
    issues?: string[];
}

export default function YieldAnalysisPage() {
    const { isAuthenticated } = useAuth();
    const { currentFarm } = useTenant();
    const [yieldData, setYieldData] = useState<YieldData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

    useEffect(() => {
        const loadYieldData = async () => {
            // Ensure we have farm context before making API calls
            if (!currentFarm?.id) {
                setError('No farm context available');
                setLoading(false);
                return;
            }

            try {
                setError(null);
                // OFMS COMPLIANT: Include farm context in API call
                // Get user data for authorization
                const userData = localStorage.getItem('ofms_user');
                const headers: Record<string, string> = {
                    'X-Farm-ID': currentFarm.id,
                    'Content-Type': 'application/json'
                };

                if (userData) {
                    const user = JSON.parse(userData);
                    headers['Authorization'] = `Bearer ${user.id}`;
                }

                const response = await fetch('/api/batches?status=HARVESTED&limit=100', {
                    headers
                });
                const data = await response.json();

                if (response.ok && data.success) {
                    console.log(`📊 Found ${data.data?.length || 0} harvested batches for farm ${currentFarm.farm_name}`);

                    // Transform batch data into yield analysis
                    const transformedYieldData: YieldData[] = data.data
                        .filter((batch: any) => batch.actualHarvestDate && batch.harvestQuantity)
                        .map((batch: any) => {
                            const plannedYield = batch.expectedYield || 100;
                            const actualYield = batch.harvestQuantity || 0;
                            const area = batch.zones?.area || 50; // Default 50 sq ft if no zone area
                            const efficiency = plannedYield > 0 ? (actualYield / plannedYield) * 100 : 0;

                            // Determine quality based on efficiency and notes
                            let quality: 'premium' | 'standard' | 'below_standard' = 'standard';
                            if (efficiency >= 95) quality = 'premium';
                            else if (efficiency < 80) quality = 'below_standard';

                            // Extract issues from notes
                            const issues: string[] = [];
                            if (batch.notes) {
                                if (batch.notes.toLowerCase().includes('pest')) issues.push('Pest pressure detected');
                                if (batch.notes.toLowerCase().includes('temperature')) issues.push('Temperature fluctuations');
                                if (batch.notes.toLowerCase().includes('nutrient')) issues.push('Nutrient issues');
                            }

                            return {
                                id: batch.id,
                                batchNumber: batch.batchNumber,
                                variety: batch.seed_varieties?.name || 'Unknown',
                                plantDate: batch.plantDate,
                                harvestDate: batch.actualHarvestDate,
                                plannedYield,
                                actualYield,
                                zone: batch.zones?.name || 'Unknown Zone',
                                area,
                                yieldPerSqFt: area > 0 ? Math.round((actualYield / area) * 100) / 100 : 0,
                                efficiency: Math.round(efficiency * 10) / 10,
                                quality,
                                issues
                            };
                        });

                    setYieldData(transformedYieldData);
                } else {
                    console.error('Failed to load yield data:', data.error);
                    setError(data.error || 'Failed to load yield data');
                    setYieldData([]);
                }
            } catch (error) {
                console.error('Error loading yield data:', error);
                setError(error instanceof Error ? error.message : 'Failed to load yield data');
                setYieldData([]);
            } finally {
                setLoading(false);
            }
        };

        loadYieldData();
    }, [timeframe, currentFarm?.id]);

    const getEfficiencyColor = (efficiency: number) => {
        if (efficiency >= 95) return '#22c55e';
        if (efficiency >= 85) return '#3b82f6';
        if (efficiency >= 75) return '#f59e0b';
        return '#ef4444';
    };

    const getQualityColor = (quality: YieldData['quality']) => {
        switch (quality) {
            case 'premium': return '#22c55e';
            case 'standard': return '#3b82f6';
            case 'below_standard': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getTotalStats = () => {
        // Protect against empty dataset
        if (!yieldData || yieldData.length === 0) {
            return {
                totalPlanned: 0,
                totalActual: 0,
                totalArea: 0,
                avgEfficiency: 0,
                avgYieldPerSqFt: 0,
                overallEfficiency: 0
            };
        }

        const totalPlanned = yieldData.reduce((sum, item) => sum + (item.plannedYield || 0), 0);
        const totalActual = yieldData.reduce((sum, item) => sum + (item.actualYield || 0), 0);
        const totalArea = yieldData.reduce((sum, item) => sum + (item.area || 0), 0);

        // Calculate average efficiency properly (arithmetic mean)
        const avgEfficiency = yieldData.reduce((sum, item) => sum + (item.efficiency || 0), 0) / yieldData.length;

        // Protect against division by zero for area calculations
        const avgYieldPerSqFt = totalArea > 0 ? totalActual / totalArea : 0;

        // Protect against division by zero for overall efficiency
        const overallEfficiency = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

        return {
            totalPlanned,
            totalActual,
            totalArea,
            avgEfficiency: Math.round(avgEfficiency * 10) / 10, // Round to 1 decimal place
            avgYieldPerSqFt: Math.round(avgYieldPerSqFt * 100) / 100, // Round to 2 decimal places
            overallEfficiency: Math.round(overallEfficiency * 10) / 10 // Round to 1 decimal place
        };
    };

    const stats = getTotalStats();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Show loading during authentication check
    if (!isAuthenticated) {
        return null; // ConditionalLayout will handle this
    }

    // Show error if no farm context
    if (!currentFarm) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <h2>No Farm Context</h2>
                    <p>Please select a farm to view yield analysis.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading yield analysis for {currentFarm.farm_name}...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <h2>Error Loading Yield Data</h2>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>📊 Yield Analysis</h1>
                <p className={styles.subtitle}>
                    Track and analyze crop yields across all production batches for {currentFarm.farm_name}
                </p>
            </div>

            <div className={styles.timeframeSelector}>
                {(['week', 'month', 'quarter', 'year'] as const).map(period => (
                    <button
                        key={period}
                        className={`${styles.timeframeButton} ${timeframe === period ? styles.active : ''}`}
                        onClick={() => setTimeframe(period)}
                    >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                ))}
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.totalActual.toLocaleString()}</div>
                    <div className={styles.statLabel}>Total Yield (lbs)</div>
                    <div className={styles.statChange}>
                        vs {stats.totalPlanned.toLocaleString()} planned
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.overallEfficiency}%</div>
                    <div className={styles.statLabel}>Overall Efficiency</div>
                    <div className={styles.statChange}>
                        {stats.overallEfficiency >= 95 ? '🟢' : stats.overallEfficiency >= 85 ? '🟡' : '🔴'} Performance
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.avgYieldPerSqFt}</div>
                    <div className={styles.statLabel}>Avg Yield/Sq Ft</div>
                    <div className={styles.statChange}>
                        {stats.totalArea.toLocaleString()} sq ft total
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{yieldData.length}</div>
                    <div className={styles.statLabel}>Batches Analyzed</div>
                    <div className={styles.statChange}>
                        Current {timeframe}
                    </div>
                </div>
            </div>

            <div className={styles.yieldGrid}>
                {yieldData.length === 0 ? (
                    <div className={styles.emptyState}>
                        <h3>No Harvested Batches Found</h3>
                        <p>No batches with harvest data were found for the selected timeframe.</p>
                        <p>To see yield analysis:</p>
                        <ul>
                            <li>Ensure you have batches with status "HARVESTED"</li>
                            <li>Make sure harvest dates and quantities are recorded</li>
                            <li>Try selecting a different timeframe</li>
                        </ul>
                    </div>
                ) : (
                    yieldData.map((batch) => (
                        <Card key={batch.id} className={styles.yieldCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.batchInfo}>
                                    <h3 className={styles.batchNumber}>{batch.batchNumber}</h3>
                                    <p className={styles.variety}>{batch.variety}</p>
                                    <p className={styles.zone}>{batch.zone}</p>
                                </div>
                                <div className={styles.badges}>
                                    <div
                                        className={styles.efficiencyBadge}
                                        style={{
                                            color: getEfficiencyColor(batch.efficiency),
                                            backgroundColor: `${getEfficiencyColor(batch.efficiency)}20`
                                        }}
                                    >
                                        {batch.efficiency}% Efficient
                                    </div>
                                    <div
                                        className={styles.qualityBadge}
                                        style={{
                                            color: getQualityColor(batch.quality),
                                            backgroundColor: `${getQualityColor(batch.quality)}20`
                                        }}
                                    >
                                        {batch.quality.replace('_', ' ')}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.yieldComparison}>
                                <div className={styles.yieldMetric}>
                                    <span className={styles.label}>Planned</span>
                                    <span className={styles.value}>{batch.plannedYield} lbs</span>
                                </div>
                                <div className={styles.yieldMetric}>
                                    <span className={styles.label}>Actual</span>
                                    <span className={styles.value}>{batch.actualYield} lbs</span>
                                </div>
                                <div className={styles.yieldMetric}>
                                    <span className={styles.label}>Per Sq Ft</span>
                                    <span className={styles.value}>{batch.yieldPerSqFt} lbs</span>
                                </div>
                            </div>

                            <div className={styles.batchDetails}>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Plant Date</span>
                                    <span className={styles.detailValue}>{formatDate(batch.plantDate)}</span>
                                </div>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Harvest Date</span>
                                    <span className={styles.detailValue}>{formatDate(batch.harvestDate)}</span>
                                </div>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Growing Area</span>
                                    <span className={styles.detailValue}>{batch.area} sq ft</span>
                                </div>
                            </div>

                            {batch.issues && batch.issues.length > 0 && (
                                <div className={styles.issues}>
                                    <div className={styles.issuesLabel}>Issues Noted:</div>
                                    <ul className={styles.issuesList}>
                                        {batch.issues.map((issue, index) => (
                                            <li key={index}>{issue}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}