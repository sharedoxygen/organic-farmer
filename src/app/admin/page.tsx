'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { useTenant, useFarmPermissions } from '@/components/TenantProvider';
import { useAuth } from '@/components/AuthProvider';
import { tenantApiService } from '@/lib/api/tenantApiService';
import { isSystemAdmin, getSystemAdminCapabilities } from '@/lib/utils/systemAdmin';
import styles from './page.module.css';

interface AggregateStats {
    totalFarms: number;
    totalUsers: number;
    totalBatches: number;
    totalOrders: number;
    totalRevenue: number;
    storageUsed: number;
    activeSubscriptions: number;
    farmBreakdown: {
        farmId: string;
        farmName: string;
        userCount: number;
        batchCount: number;
        orderCount: number;
        revenue: number;
        storageUsed: number;
        lastActivity: Date;
    }[];
}

export default function AdminDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const { currentFarm, availableFarms } = useTenant();
    const { canManageFarm, canManageUsers, canManageBilling, hasRole } = useFarmPermissions();

    const [isLoading, setIsLoading] = useState(true);
    const [aggregateStats, setAggregateStats] = useState<AggregateStats | null>(null);

    // Check if user has admin access
    const isAdmin = hasRole('OWNER') || hasRole('ADMIN');
    const isFarmManager = hasRole('FARM_MANAGER');

    // ✅ CLEAN: Check if user is system admin (NO HARDCODED DATA)
    const isGlobalAdmin = isSystemAdmin(user);
    const systemAdminCapabilities = getSystemAdminCapabilities(user);

    useEffect(() => {
        const loadAdminData = async () => {
            try {
                setIsLoading(true);

                if (isGlobalAdmin) {
                    // Global admin sees ALL farms
                    const farms = await tenantApiService.getAllFarms();

                    // Calculate aggregate statistics
                    let totalUsers = 0;
                    let totalBatches = 0;
                    let totalOrders = 0;
                    let totalRevenue = 0;
                    let totalStorage = 0;
                    let activeSubscriptions = 0;
                    const farmBreakdown = [];

                    for (const farm of farms) {
                        const usage = await tenantApiService.getFarmUsage(farm.id);
                        const farmData = {
                            farmId: farm.id,
                            farmName: farm.farm_name,
                            userCount: usage.userCount || 0,
                            batchCount: usage.batchCount || 0,
                            orderCount: usage.orderCount || 0,
                            revenue: usage.revenue || 0,
                            storageUsed: usage.storageUsed || 0,
                            lastActivity: usage.lastActivity || new Date()
                        };

                        farmBreakdown.push(farmData);
                        totalUsers += farmData.userCount;
                        totalBatches += farmData.batchCount;
                        totalOrders += farmData.orderCount;
                        totalRevenue += farmData.revenue;
                        totalStorage += farmData.storageUsed;

                        if (usage.hasActiveSubscription) {
                            activeSubscriptions++;
                        }
                    }

                    setAggregateStats({
                        totalFarms: farms.length,
                        totalUsers,
                        totalBatches,
                        totalOrders,
                        totalRevenue,
                        storageUsed: totalStorage,
                        activeSubscriptions,
                        farmBreakdown
                    });
                } else {
                    // Regular admin/manager sees only their farms
                    const usage = await tenantApiService.getFarmUsage(currentFarm!.id);
                    setAggregateStats({
                        totalFarms: availableFarms.length,
                        totalUsers: usage.userCount || 0,
                        totalBatches: usage.batchCount || 0,
                        totalOrders: usage.orderCount || 0,
                        totalRevenue: usage.revenue || 0,
                        storageUsed: usage.storageUsed || 0,
                        activeSubscriptions: usage.hasActiveSubscription ? 1 : 0,
                        farmBreakdown: [{
                            farmId: currentFarm!.id,
                            farmName: currentFarm!.farm_name,
                            userCount: usage.userCount || 0,
                            batchCount: usage.batchCount || 0,
                            orderCount: usage.orderCount || 0,
                            revenue: usage.revenue || 0,
                            storageUsed: usage.storageUsed || 0,
                            lastActivity: new Date()
                        }]
                    });
                }
            } catch (error) {
                console.error('Failed to load admin data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (isAdmin || isFarmManager) {
            loadAdminData();
        }
    }, [currentFarm, isAdmin, isFarmManager, isGlobalAdmin, availableFarms]);

    if (!isAdmin && !isFarmManager && !isGlobalAdmin) {
        return (
            <div className={styles.container}>
                <div className={styles.accessDenied}>
                    <Card className={styles.errorCard}>
                        <h1>Access Denied</h1>
                        <p>You don&apos;t have permission to access the admin dashboard.</p>
                        <button onClick={() => window.history.back()}>Go Back</button>
                    </Card>
                </div>
            </div>
        );
    }

    const handleMetricClick = (metric: string) => {
        // Navigate to detailed view based on metric type
        switch (metric) {
            case 'farms':
                router.push('/admin/farms');
                break;
            case 'users':
                router.push('/admin/users');
                break;
            case 'batches':
                router.push('/admin/analytics?view=batches');
                break;
            case 'orders':
                router.push('/admin/analytics?view=orders');
                break;
            case 'revenue':
                router.push('/admin/analytics?view=financial');
                break;
            case 'storage':
                router.push('/admin/data');
                break;
            case 'subscriptions':
                router.push('/admin/billing');
                break;
        }
    };

    const adminCategories = [
        // Farm Management
        {
            id: 'farm-management',
            title: 'Farm Management',
            description: isGlobalAdmin
                ? 'Manage all farms in the system, add new farms, and configure settings.'
                : 'Manage farm details, settings, and configuration for your organization.',
            icon: '🏢',
            action: 'Manage',
            href: '/admin/farms',
            category: 'Farm Operations',
            show: canManageFarm() || isGlobalAdmin,
            stats: `${isGlobalAdmin ? aggregateStats?.totalFarms || 0 : availableFarms.length} farm${(isGlobalAdmin ? aggregateStats?.totalFarms : availableFarms.length) !== 1 ? 's' : ''}`
        },
        // User Management  
        {
            id: 'user-management',
            title: 'User Management',
            description: isGlobalAdmin
                ? 'Manage all users across all farms, assign roles, and control access.'
                : 'Invite team members, assign roles, and manage user permissions.',
            icon: '👥',
            action: 'Manage',
            href: '/admin/users',
            category: 'Administration',
            show: canManageUsers() || isGlobalAdmin,
            stats: `${aggregateStats?.totalUsers || 0} users`
        },
        // Farm Switching (not for global admin)
        {
            id: 'farm-switcher',
            title: 'Switch Farm',
            description: 'Quickly switch between different farms you have access to.',
            icon: '🔄',
            action: 'Switch',
            href: '/admin/switch-farm',
            category: 'Navigation',
            show: !isGlobalAdmin && availableFarms.length > 1,
            stats: `${availableFarms.length} available`
        },
        // Billing & Subscriptions
        {
            id: 'billing',
            title: 'Billing & Subscriptions',
            description: isGlobalAdmin
                ? 'Manage all farm subscriptions, billing, and payment information.'
                : 'Manage subscription plans, billing, and payment information.',
            icon: '💳',
            action: 'Manage',
            href: '/admin/billing',
            category: 'Financial',
            show: canManageBilling() || isGlobalAdmin,
            stats: isGlobalAdmin
                ? `${aggregateStats?.activeSubscriptions || 0} active subscriptions`
                : 'Subscription active'
        },
        // Farm Analytics
        {
            id: 'analytics',
            title: 'System Analytics',
            description: isGlobalAdmin
                ? 'View system-wide performance metrics, usage statistics, and insights.'
                : 'View farm performance metrics, usage statistics, and insights.',
            icon: '📊',
            action: 'View',
            href: '/admin/analytics',
            category: 'Insights',
            show: true,
            stats: `${aggregateStats?.totalBatches || 0} batches tracked`
        },
        // Data & Storage
        {
            id: 'data-management',
            title: 'Data & Storage',
            description: isGlobalAdmin
                ? 'Monitor system-wide data usage, manage storage, and configure retention.'
                : 'Monitor data usage, manage storage, and configure data retention.',
            icon: '💾',
            action: 'Monitor',
            href: '/admin/data',
            category: 'Technical',
            show: isAdmin || isGlobalAdmin,
            stats: `${Math.round(aggregateStats?.storageUsed || 0)} MB used`
        },
        // Feedback Management
        {
            id: 'feedback-management',
            title: 'Feedback Management',
            description: isGlobalAdmin
                ? 'Review and respond to feedback from all farms in the system.'
                : 'Review and respond to user feedback, bug reports, and feature requests.',
            icon: '💬',
            action: 'Manage',
            href: '/admin/feedback',
            category: 'User Experience',
            show: isAdmin || isGlobalAdmin,
            stats: 'View all feedback'
        }
    ];

    const handleAdminAction = (href: string) => {
        router.push(href);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    {isGlobalAdmin ? '🌐 Global System Administration' : '🏢 Farm Administration'}
                </h1>
                <p className={styles.subtitle}>
                    {isGlobalAdmin
                        ? 'Manage all farms, users, billing, and system configuration'
                        : `Manage farms, users, billing, and system administration for ${currentFarm?.farm_name}`
                    }
                </p>
                {isLoading && (
                    <div className={styles.loadingIndicator}>
                        <span>Loading {isGlobalAdmin ? 'system' : 'farm'} data...</span>
                    </div>
                )}
            </div>

            {/* Aggregate Metrics Section */}
            {aggregateStats && (
                <div className={styles.metricsSection}>
                    <h2 className={styles.metricsTitle}>
                        {isGlobalAdmin ? 'System-wide Metrics' : 'Farm Metrics'}
                    </h2>
                    <div className={styles.metricsGrid}>
                        <Card
                            className={styles.metricCard}
                            onClick={() => handleMetricClick('farms')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.metricContent}>
                                <div className={styles.metricIcon}>🏢</div>
                                <div className={styles.metricValue}>{aggregateStats.totalFarms}</div>
                                <div className={styles.metricLabel}>Total Farms</div>
                                <div className={styles.metricAction}>View Details →</div>
                            </div>
                        </Card>

                        <Card
                            className={styles.metricCard}
                            onClick={() => handleMetricClick('users')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.metricContent}>
                                <div className={styles.metricIcon}>👥</div>
                                <div className={styles.metricValue}>{aggregateStats.totalUsers}</div>
                                <div className={styles.metricLabel}>Total Users</div>
                                <div className={styles.metricAction}>View Details →</div>
                            </div>
                        </Card>

                        <Card
                            className={styles.metricCard}
                            onClick={() => handleMetricClick('batches')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.metricContent}>
                                <div className={styles.metricIcon}>🌱</div>
                                <div className={styles.metricValue}>{aggregateStats.totalBatches}</div>
                                <div className={styles.metricLabel}>Production Batches</div>
                                <div className={styles.metricAction}>View Details →</div>
                            </div>
                        </Card>

                        <Card
                            className={styles.metricCard}
                            onClick={() => handleMetricClick('orders')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.metricContent}>
                                <div className={styles.metricIcon}>📦</div>
                                <div className={styles.metricValue}>{aggregateStats.totalOrders}</div>
                                <div className={styles.metricLabel}>Total Orders</div>
                                <div className={styles.metricAction}>View Details →</div>
                            </div>
                        </Card>

                        <Card
                            className={styles.metricCard}
                            onClick={() => handleMetricClick('revenue')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.metricContent}>
                                <div className={styles.metricIcon}>💰</div>
                                <div className={styles.metricValue}>${aggregateStats.totalRevenue.toLocaleString()}</div>
                                <div className={styles.metricLabel}>Total Revenue</div>
                                <div className={styles.metricAction}>View Details →</div>
                            </div>
                        </Card>

                        <Card
                            className={styles.metricCard}
                            onClick={() => handleMetricClick('storage')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.metricContent}>
                                <div className={styles.metricIcon}>💾</div>
                                <div className={styles.metricValue}>{Math.round(aggregateStats.storageUsed)} MB</div>
                                <div className={styles.metricLabel}>Storage Used</div>
                                <div className={styles.metricAction}>View Details →</div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* Current Farm Info (only for non-global admins) */}
            {!isGlobalAdmin && currentFarm && (
                <div className={styles.currentFarmInfo}>
                    <Card className={styles.farmInfoCard}>
                        <div className={styles.farmInfoContent}>
                            <div className={styles.farmIcon}>🌱</div>
                            <div className={styles.farmDetails}>
                                <h3>{currentFarm.farm_name}</h3>
                                <p>{currentFarm.business_name}</p>
                                <span className={styles.userRole}>
                                    Your Role: {hasRole('OWNER') ? 'Owner' : hasRole('ADMIN') ? 'Administrator' : 'Farm Manager'}
                                </span>
                            </div>
                            <div className={styles.farmStats}>
                                <div className={styles.stat}>
                                    <span className={styles.statValue}>{aggregateStats?.totalUsers || 0}</span>
                                    <span className={styles.statLabel}>Users</span>
                                </div>
                                <div className={styles.stat}>
                                    <span className={styles.statValue}>{aggregateStats?.totalBatches || 0}</span>
                                    <span className={styles.statLabel}>Batches</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Admin Actions Grid */}
            <div className={styles.adminActionsSection}>
                <h2 className={styles.sectionTitle}>Administrative Actions</h2>
                <div className={styles.utilitiesGrid}>
                    {adminCategories
                        .filter(category => category.show)
                        .map((category) => (
                            <Card
                                key={category.id}
                                className={styles.utilityCard}
                                onClick={() => handleAdminAction(category.href)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className={styles.utilityContent}>
                                    <div className={styles.utilityIcon}>
                                        {category.icon}
                                    </div>
                                    <div className={styles.utilityInfo}>
                                        <h3 className={styles.utilityTitle}>
                                            {category.title}
                                        </h3>
                                        <p className={styles.utilityDescription}>
                                            {category.description}
                                        </p>
                                        <div className={styles.utilityMeta}>
                                            <span className={styles.categoryBadge}>
                                                {category.category}
                                            </span>
                                            {category.stats && (
                                                <span className={styles.statsBadge}>
                                                    {category.stats}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.utilityAction}>
                                        <button
                                            className={styles.actionButton}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAdminAction(category.href);
                                            }}
                                        >
                                            {category.action} →
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                </div>
            </div>

            {!isGlobalAdmin && availableFarms.length === 0 && (
                <div className={styles.emptyState}>
                    <Card className={styles.emptyCard}>
                        <h3>No Farms Available</h3>
                        <p>You don&apos;t have access to any farms yet.</p>
                        <p>Contact your administrator to get access.</p>
                    </Card>
                </div>
            )}
        </div>
    );
} 