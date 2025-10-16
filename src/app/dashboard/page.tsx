'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Tooltip } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import styles from './page.module.css';

interface DashboardMetrics {
    totalBatches: number;
    activeBatches: number;
    readyToHarvest: number;
    monthlyRevenue: number;
    qualityScore: number;
    completedTasks: number;
}

interface RecentActivity {
    id: string;
    type: 'harvest' | 'planting' | 'quality' | 'maintenance' | 'order';
    description: string;
    timestamp: string;
    user: string;
    status: 'completed' | 'pending' | 'in-progress';
}

interface Alert {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, logout, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm, availableFarms, switchFarm, isLoading: isTenantLoading } = useTenant();
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        totalBatches: 0,
        activeBatches: 0,
        readyToHarvest: 0,
        monthlyRevenue: 0,
        qualityScore: 0,
        completedTasks: 0
    });
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const loadDashboardData = useCallback(async () => {
        try {
            setError(null);

            // Debug logging
            console.log('🔍 Dashboard loading for farm:', {
                farmId: currentFarm?.id,
                farmName: currentFarm?.farm_name,
                isAuthenticated,
                user: user?.email
            });

            // ⚡ PERFORMANCE OPTIMIZATION: Reduced timeout and enabled caching
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // Reduced to 5 seconds

            // ✅ CRITICAL FIX: Proper farm context validation
            if (!currentFarm?.id) {
                throw new Error('No farm context available. Please select a farm.');
            }

            // Get user data for authorization
            const userData = localStorage.getItem('ofms_user');
            const authHeaders: Record<string, string> = {
                'X-Farm-ID': currentFarm.id,
            };

            if (userData) {
                const user = JSON.parse(userData);
                authHeaders['Authorization'] = `Bearer ${user.id}`;
            }

            const response = await fetch('/api/analytics/dashboard', {
                headers: authHeaders,
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (response.ok) {
                // Handle the API response structure correctly
                const apiData = data.success ? data.data : data;

                console.log('📊 Dashboard API Response:', {
                    hasSuccess: !!data.success,
                    structure: data.success ? 'nested' : 'flat',
                    totalBatches: apiData.totalBatches,
                    activeBatches: apiData.activeBatches,
                    readyToHarvest: apiData.readyToHarvest,
                    monthlyRevenue: apiData.monthlyRevenue
                });

                // Update metrics from API data
                setMetrics({
                    totalBatches: apiData.totalBatches || 0,
                    activeBatches: apiData.activeBatches || 0,
                    readyToHarvest: apiData.readyToHarvest || 0, // Correctly using ready to harvest count
                    monthlyRevenue: apiData.monthlyRevenue || 0,
                    qualityScore: apiData.qualityScore || 0, // Dynamic from API
                    completedTasks: apiData.completedTasks || 0 // Dynamic from API
                });

                // Update recent activity from batches
                if (apiData.recentBatches && apiData.recentBatches.length > 0) {
                    const batchActivity = apiData.recentBatches.map((batch: any) => ({
                        id: batch.id,
                        type: batch.status === 'PLANTED' ? 'planting' : 'harvest',
                        description: `Batch ${batch.batchNumber} ${batch.status.toLowerCase().replace(/_/g, ' ')} ${batch.seed_varieties?.name ? `(${batch.seed_varieties.name})` : ''}`,
                        timestamp: batch.plantDate,
                        user: 'Farm Staff',
                        status: batch.status === 'HARVESTED' ? 'completed' : 'in-progress'
                    }));
                    setRecentActivity(batchActivity);
                }

                // Update alerts based on data
                const newAlerts = [];

                if (apiData.activeBatches > 20) {
                    newAlerts.push({
                        id: '1',
                        type: 'warning' as const,
                        message: `${apiData.activeBatches} active batches - consider harvesting ready batches`,
                        timestamp: new Date().toISOString(),
                        priority: 'high' as const
                    });
                }

                if (apiData.pendingOrders > 0) {
                    newAlerts.push({
                        id: '2',
                        type: 'info' as const,
                        message: `${apiData.pendingOrders} orders pending fulfillment`,
                        timestamp: new Date().toISOString(),
                        priority: 'medium' as const
                    });
                }

                if (apiData.monthlyRevenue > 5000) {
                    newAlerts.push({
                        id: '3',
                        type: 'success' as const,
                        message: `Monthly revenue target achieved (${formatCurrency(apiData.monthlyRevenue)})`,
                        timestamp: new Date().toISOString(),
                        priority: 'low' as const
                    });
                }

                setAlerts(newAlerts);
                setRetryCount(0); // Reset retry count on success
            } else {
                throw new Error(data.error || 'Dashboard API returned error');
            }

        } catch (error: any) {
            console.error('Failed to load dashboard data:', error);

            if (error.name === 'AbortError') {
                setError('Request timeout. Please check your connection.');
            } else {
                setError(`Unable to load dashboard data. ${error.message}`);
            }

            // Retry logic with exponential backoff
            if (retryCount < 3) {
                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                    loadDashboardData();
                }, 1000 * Math.pow(2, retryCount)); // 1s, 2s, 4s
            } else {
                setError('Unable to connect to server after multiple retries. Please refresh the page.');
                setAlerts([{
                    id: 'error',
                    type: 'error',
                    message: 'Dashboard data unavailable. Working offline.',
                    timestamp: new Date().toISOString(),
                    priority: 'critical' as const
                }]);
            }
        } finally {
            setLoading(false);
        }
    }, [retryCount, currentFarm?.id, isAuthenticated, user]);

    // ⚡ PERFORMANCE: Consolidated useEffect to reduce cascade loading
    useEffect(() => {
        if (!isAuthLoading && !isTenantLoading) {
            if (isAuthenticated && currentFarm) {
                console.log('🏢 Loading dashboard data for:', currentFarm.farm_name);
                loadDashboardData();
            } else if (!isAuthenticated) {
                router.push('/auth/signin');
            }
        }

        // Smooth farm switch refresh: refetch when Provider broadcasts farm changed event
        const handler = () => loadDashboardData();
        if (typeof window !== 'undefined') {
            window.addEventListener('ofms:farm:changed', handler);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('ofms:farm:changed', handler);
            }
        };
    }, [isAuthLoading, isTenantLoading, isAuthenticated, currentFarm?.id, router, loadDashboardData]);

    // Set document title
    useEffect(() => {
        document.title = 'Dashboard - Organic Farmer Management System';
    }, []);

    // ⚡ PERFORMANCE: Memoize expensive formatting functions
    const currencyFormatter = useMemo(() => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        });
    }, []);

    const formatCurrency = useCallback((amount: number) => {
        return currencyFormatter.format(amount);
    }, [currencyFormatter]);

    const formatTimeAgo = useCallback((timestamp: string) => {
        if (!timestamp) return '...';
        const now = new Date();
        const time = new Date(timestamp);
        const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

        if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)}h ago`;
        } else {
            return `${Math.floor(diffInMinutes / 1440)}d ago`;
        }
    }, []);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'harvest': return '🌾';
            case 'planting': return '🌱';
            case 'quality': return '🔍';
            case 'maintenance': return '🔧';
            case 'order': return '📦';
            default: return '📋';
        }
    };

    const getAlertIcon = useCallback((type: string) => {
        switch (type) {
            case 'error': return '🚨';
            case 'warning': return '⚠️';
            case 'success': return '✅';
            case 'info': return 'ℹ️';
            default: return '📢';
        }
    }, []);

    // ⚡ PERFORMANCE: Memoized metric cards to prevent unnecessary re-renders
    const metricCards = useMemo(() => [
        {
            id: 'total-batches',
            icon: '📦',
            value: metrics.totalBatches,
            label: 'Total Batches',
            onClick: () => router.push('/production/batches'),
            tooltip: 'View all production batches including active, completed, and failed batches'
        },
        {
            id: 'active-batches',
            icon: '🌱',
            value: metrics.activeBatches,
            label: 'Active Growing',
            onClick: () => router.push('/production/batches?filter=active')
        },
        {
            id: 'ready-harvest',
            icon: '✅',
            value: metrics.readyToHarvest,
            label: 'Ready to Harvest',
            onClick: () => router.push('/production/harvesting')
        },
        {
            id: 'monthly-revenue',
            icon: '💰',
            value: formatCurrency(metrics.monthlyRevenue),
            label: 'Monthly Revenue',
            onClick: () => router.push('/analytics/financial')
        },
        {
            id: 'quality-score',
            icon: '🎯',
            value: `${metrics.qualityScore}%`,
            label: 'Quality Score',
            onClick: () => router.push('/quality/control'),
            tooltip: 'Overall quality score based on recent quality checks and customer feedback. Target: >90%'
        },
        {
            id: 'completed-tasks',
            icon: '📋',
            value: metrics.completedTasks,
            label: 'Tasks Complete',
            onClick: () => router.push('/tasks/daily')
        }
    ], [metrics, router, formatCurrency]);

    if (loading || isAuthLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <h1>📊 Loading Dashboard...</h1>
                    <p>Getting your farm data...</p>
                    {error && <p className={styles.errorMessage}>{error}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.welcome}>
                        <h1 className={styles.title}>🌱 Organic Farmer</h1>
                        <p className={styles.greeting}>
                            Welcome back, {user?.name || 'Farmer'}! Here's your farm overview.
                        </p>
                    </div>
                </div>
            </div>

            {/* Farm Context Banner */}
            <div className={styles.farmContext}>
                <div className={styles.farmInfo}>
                    <div className={styles.farmHeader}>
                        <div className={styles.farmIcon}>🏢</div>
                        <div className={styles.farmDetails}>
                            <h2 className={styles.farmName}>
                                {currentFarm?.farm_name || 'Loading Farm...'}
                            </h2>
                            <p className={styles.farmSubtitle}>
                                {currentFarm?.business_name && currentFarm.business_name !== currentFarm.farm_name
                                    ? currentFarm.business_name
                                    : 'Farm Operations Dashboard'
                                }
                            </p>
                        </div>
                        {availableFarms.length > 1 && (
                            <div className={styles.farmSwitcher}>
                                <select
                                    value={currentFarm?.id || ''}
                                    onChange={(e) => {
                                        if (e.target.value && e.target.value !== currentFarm?.id) {
                                            switchFarm(e.target.value).catch(err => {
                                                console.error('Failed to switch farm:', err);
                                                setError('Failed to switch farms. Please try again.');
                                            });
                                        }
                                    }}
                                    className={styles.farmSelect}
                                    disabled={isTenantLoading}
                                >
                                    {availableFarms.map(farm => (
                                        <option key={farm.id} value={farm.id}>
                                            {farm.farm_name}
                                        </option>
                                    ))}
                                </select>
                                <span className={styles.farmCount}>
                                    ({availableFarms.length} farms available)
                                </span>
                            </div>
                        )}
                    </div>
                    <div className={styles.farmMeta}>
                        <span className={styles.metaItem}>
                            📊 Viewing: <strong>This Farm's Data Only</strong>
                        </span>
                        {currentFarm && (
                            <span className={styles.metaItem}>
                                🆔 Farm ID: {currentFarm.id.slice(-8)}
                            </span>
                        )}
                        <span className={styles.metaItem}>
                            👥 Your Role: <strong>{user?.role || 'Farm Staff'}</strong>
                        </span>
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {error && !loading && (
                <div className={styles.errorBanner}>
                    <span>{error}</span>
                    <Button size="sm" onClick={loadDashboardData}>Retry</Button>
                </div>
            )}

            {/* ⚡ PERFORMANCE: Optimized Metrics Grid */}
            <div className={styles.metricsGrid}>
                {metricCards.map((card) => (
                    card.tooltip ? (
                        <Tooltip key={card.id} content={card.tooltip}>
                            <Card className={styles.metricCard} onClick={card.onClick}>
                                <div className={styles.metricIcon}>{card.icon}</div>
                                <div className={styles.metricValue}>{card.value}</div>
                                <div className={styles.metricLabel}>{card.label}</div>
                            </Card>
                        </Tooltip>
                    ) : (
                        <Card key={card.id} className={styles.metricCard} onClick={card.onClick}>
                            <div className={styles.metricIcon}>{card.icon}</div>
                            <div className={styles.metricValue}>{card.value}</div>
                            <div className={styles.metricLabel}>{card.label}</div>
                        </Card>
                    )
                ))}
            </div>

            {/* Main Content Grid */}
            <div className={styles.contentGrid}>
                {/* Recent Activity */}
                <Card className={styles.activityCard}>
                    <div className={styles.cardHeader}>
                        <h2>📋 Recent Activity</h2>
                        <Button variant="secondary" size="sm" onClick={() => router.push('/tasks/daily')}>
                            View All
                        </Button>
                    </div>
                    <div className={styles.activityList}>
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity) => (
                                <div key={activity.id} className={styles.activityItem}>
                                    <div className={styles.activityIcon}>
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className={styles.activityContent}>
                                        <div className={styles.activityDescription}>{activity.description}</div>
                                        <div className={styles.activityMeta}>
                                            <span className={styles.activityUser}>{activity.user}</span>
                                            <span className={styles.activityTime}>{formatTimeAgo(activity.timestamp)}</span>
                                        </div>
                                    </div>
                                    <div className={`${styles.activityStatus} ${styles[activity.status]}`}>
                                        {activity.status}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                <p>No recent activity to display</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Alerts */}
                <Card className={styles.alertsCard}>
                    <div className={styles.cardHeader}>
                        <h2>🚨 Alerts & Notifications</h2>
                        <Button variant="secondary" size="sm" onClick={() => router.push('/settings/notifications')}>
                            View All
                        </Button>
                    </div>
                    <div className={styles.alertsList}>
                        {alerts.length > 0 ? (
                            alerts.map((alert) => (
                                <div key={alert.id} className={`${styles.alertItem} ${styles[alert.type]}`}>
                                    <div className={styles.alertIcon}>
                                        {getAlertIcon(alert.type)}
                                    </div>
                                    <div className={styles.alertContent}>
                                        <div className={styles.alertMessage}>{alert.message}</div>
                                        <div className={styles.alertTime}>{formatTimeAgo(alert.timestamp)}</div>
                                    </div>
                                    <div className={`${styles.alertPriority} ${styles[alert.priority]}`}>
                                        {alert.priority}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                <p>No alerts at this time</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Quick Navigation */}
            <Card className={styles.navigationCard}>
                <div className={styles.cardHeader}>
                    <h2>🧭 Quick Navigation</h2>
                </div>
                <div className={styles.navigationGrid}>
                    <button className={styles.navItem} onClick={() => router.push('/production/batches')}>
                        <div className={styles.navIcon}>🌱</div>
                        <div className={styles.navLabel}>Production</div>
                    </button>
                    <button className={styles.navItem} onClick={() => router.push('/inventory/stock')}>
                        <div className={styles.navIcon}>📦</div>
                        <div className={styles.navLabel}>Inventory</div>
                    </button>
                    <button className={styles.navItem} onClick={() => router.push('/quality/control')}>
                        <div className={styles.navIcon}>🔍</div>
                        <div className={styles.navLabel}>Quality</div>
                    </button>
                    <button className={styles.navItem} onClick={() => router.push('/analytics')}>
                        <div className={styles.navIcon}>📊</div>
                        <div className={styles.navLabel}>Analytics</div>
                    </button>
                    <button className={styles.navItem} onClick={() => router.push('/sales/orders')}>
                        <div className={styles.navIcon}>💰</div>
                        <div className={styles.navLabel}>Sales</div>
                    </button>
                    <button className={styles.navItem} onClick={() => router.push('/tasks/daily')}>
                        <div className={styles.navIcon}>📋</div>
                        <div className={styles.navLabel}>Tasks</div>
                    </button>
                    <button className={styles.navItem} onClick={() => router.push('/equipment/management')}>
                        <div className={styles.navIcon}>⚙️</div>
                        <div className={styles.navLabel}>Equipment</div>
                    </button>
                    <button className={styles.navItem} onClick={() => router.push('/compliance')}>
                        <div className={styles.navIcon}>📋</div>
                        <div className={styles.navLabel}>Compliance</div>
                    </button>
                </div>
            </Card>
        </div>
    );
} 