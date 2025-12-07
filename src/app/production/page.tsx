'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTenant } from '@/components/TenantProvider';
import Link from 'next/link';
import { Card } from '@/components/ui';
import styles from './page.module.css';

interface ProductionStats {
    activeBatches: number;
    completedBatches: number;
    pendingBatches: number;
    totalZones: number;
    optimalZones: number;
    zoneAlerts: number;
    seedVarieties: number;
    stockLevel: number;
    pendingOrders: number;
    readyToHarvest: number;
    scheduledHarvests: number;
    processedBatches: number;
    processingBatches: number;
    packagedBatches: number;
    shippedBatches: number;
}

interface RecentActivity {
    id: string;
    icon: string;
    description: string;
    time: string;
    status: string;
}

export default function ProductionPage() {
    const { currentFarm } = useTenant();
    const [stats, setStats] = useState<ProductionStats>({
        activeBatches: 0,
        completedBatches: 0,
        pendingBatches: 0,
        totalZones: 0,
        optimalZones: 0,
        zoneAlerts: 0,
        seedVarieties: 0,
        stockLevel: 0,
        pendingOrders: 0,
        readyToHarvest: 0,
        scheduledHarvests: 0,
        processedBatches: 0,
        processingBatches: 0,
        packagedBatches: 0,
        shippedBatches: 0
    });
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProductionStats = useCallback(async () => {
        if (!currentFarm?.id) return;

        try {
            setLoading(true);

            // Fetch batches data
            const batchesRes = await fetch('/api/batches?limit=100', {
                headers: { 'X-Farm-ID': currentFarm.id }
            });
            const batchesData = await batchesRes.json();
            const batches = batchesData.data || [];

            // Fetch environments data
            const envRes = await fetch('/api/environments', {
                headers: { 'X-Farm-ID': currentFarm.id }
            });
            const envData = await envRes.json();
            const environments = envData.data || [];

            // Fetch seed varieties
            const seedsRes = await fetch('/api/seed-varieties', {
                headers: { 'X-Farm-ID': currentFarm.id }
            });
            const seedsData = await seedsRes.json();
            const seeds = seedsData.data || [];

            // Calculate stats from real data
            const activeBatches = batches.filter((b: any) =>
                ['PLANTED', 'GERMINATING', 'GROWING'].includes(b.status)
            ).length;
            const completedBatches = batches.filter((b: any) =>
                b.status === 'HARVESTED' || b.status === 'SOLD'
            ).length;
            const pendingBatches = batches.filter((b: any) =>
                b.status === 'PLANTED'
            ).length;
            const readyToHarvest = batches.filter((b: any) =>
                b.status === 'READY_TO_HARVEST'
            ).length;
            const packagedBatches = batches.filter((b: any) =>
                b.status === 'PACKAGED'
            ).length;

            // Environment stats
            const totalZones = environments.length;
            const optimalZones = environments.filter((e: any) =>
                e.status === 'OPTIMAL' || e.status === 'ACTIVE'
            ).length;
            const zoneAlerts = environments.filter((e: any) =>
                e.status === 'ALERT' || e.status === 'WARNING'
            ).length;

            // Seed stats
            const seedVarieties = seeds.length;
            const totalStock = seeds.reduce((sum: number, s: any) => sum + (s.stockQuantity || 0), 0);
            const totalMinStock = seeds.reduce((sum: number, s: any) => sum + (s.minStockLevel || 0), 0);
            const stockLevel = totalMinStock > 0 ? Math.round((totalStock / totalMinStock) * 100) : 100;

            setStats({
                activeBatches,
                completedBatches,
                pendingBatches,
                totalZones,
                optimalZones,
                zoneAlerts,
                seedVarieties,
                stockLevel: Math.min(stockLevel, 100),
                pendingOrders: 0,
                readyToHarvest,
                scheduledHarvests: batches.filter((b: any) => b.status === 'GROWING').length,
                processedBatches: completedBatches,
                processingBatches: batches.filter((b: any) => b.status === 'READY_TO_HARVEST').length,
                packagedBatches,
                shippedBatches: batches.filter((b: any) => b.status === 'SOLD').length
            });

            // Generate recent activity from batches
            const activities: RecentActivity[] = batches
                .slice(0, 5)
                .map((batch: any) => ({
                    id: batch.id,
                    icon: batch.status === 'READY_TO_HARVEST' ? '🌱' :
                        batch.status === 'HARVESTED' ? '✂️' :
                            batch.status === 'PACKAGED' ? '📦' : '🏠',
                    description: `Batch ${batch.batchNumber} (${batch.seed_varieties?.name || 'Unknown'}) - ${batch.status}`,
                    time: new Date(batch.updatedAt || batch.createdAt).toLocaleDateString(),
                    status: batch.status
                }));
            setRecentActivity(activities);

        } catch (error) {
            console.error('Error fetching production stats:', error);
        } finally {
            setLoading(false);
        }
    }, [currentFarm?.id]);

    useEffect(() => {
        fetchProductionStats();
    }, [fetchProductionStats]);

    // Calculate efficiency
    const efficiency = stats.activeBatches > 0
        ? Math.round((stats.optimalZones / Math.max(stats.totalZones, 1)) * 100)
        : 0;

    const productionModules = [
        {
            id: 'batches',
            title: 'Batch Management',
            icon: '🌿',
            description: 'Track and manage production batches from seed to harvest',
            href: '/production/batches',
            stats: { active: stats.activeBatches, completed: stats.completedBatches, pending: stats.pendingBatches },
            urgent: false
        },
        {
            id: 'environments',
            title: 'Growing Environments',
            icon: '🏠',
            description: 'Monitor and control growing conditions across facilities',
            href: '/production/environments',
            stats: { zones: stats.totalZones, optimal: stats.optimalZones, alerts: stats.zoneAlerts },
            urgent: stats.zoneAlerts > 0
        },
        {
            id: 'seeds',
            title: 'Seeds & Genetics',
            icon: '🌰',
            description: 'Manage seed inventory, varieties, and genetic records',
            href: '/production/seeds',
            stats: { varieties: stats.seedVarieties, stock: `${stats.stockLevel}%`, orders: stats.pendingOrders },
            urgent: stats.stockLevel < 20
        },
        {
            id: 'harvesting',
            title: 'Harvesting & Processing',
            icon: '✂️',
            description: 'Schedule and track harvesting operations',
            href: '/production/harvesting',
            stats: { ready: stats.readyToHarvest, scheduled: stats.scheduledHarvests, processed: stats.processedBatches },
            urgent: stats.readyToHarvest > 5
        },
        {
            id: 'post-harvest',
            title: 'Post-Harvest Handling',
            icon: '📦',
            description: 'Manage washing, packaging, and storage operations',
            href: '/production/post-harvest',
            stats: { processing: stats.processingBatches, packaged: stats.packagedBatches, shipped: stats.shippedBatches },
            urgent: false
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>
                        🌱 Production Operations
                    </h1>
                    <p className={styles.subtitle}>
                        Manage all aspects of your microgreens production from seed to harvest
                    </p>
                </div>

                <div className={styles.quickStats}>
                    <div className={styles.stat}>
                        <span className={styles.statNumber}>{loading ? '...' : stats.activeBatches}</span>
                        <span className={styles.statLabel}>Active Batches</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statNumber}>{loading ? '...' : stats.totalZones}</span>
                        <span className={styles.statLabel}>Growing Zones</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statNumber}>{loading ? '...' : `${efficiency}%`}</span>
                        <span className={styles.statLabel}>Efficiency</span>
                    </div>
                </div>
            </div>

            <div className={styles.moduleGrid}>
                {productionModules.map((module) => (
                    <Link key={module.id} href={module.href} className={styles.moduleLink}>
                        <Card className={`${styles.moduleCard} ${module.urgent ? styles.urgent : ''}`}>
                            <div className={styles.moduleHeader}>
                                <div className={styles.moduleIcon}>{module.icon}</div>
                                <div className={styles.moduleInfo}>
                                    <h3 className={styles.moduleTitle}>{module.title}</h3>
                                    <p className={styles.moduleDescription}>{module.description}</p>
                                </div>
                                {module.urgent && (
                                    <div className={styles.urgentBadge}>
                                        ⚠️ Needs Attention
                                    </div>
                                )}
                            </div>

                            <div className={styles.moduleStats}>
                                {Object.entries(module.stats).map(([key, value]) => (
                                    <div key={key} className={styles.moduleStat}>
                                        <span className={styles.moduleStatValue}>{value}</span>
                                        <span className={styles.moduleStatLabel}>{key}</span>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.moduleActions}>
                                <span className={styles.viewDetails}>View Details →</span>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className={styles.recentActivity}>
                <Card>
                    <div className={styles.activityHeader}>
                        <h2>Recent Production Activity</h2>
                        <Link href="/tasks/daily" className={styles.viewAllLink}>
                            View All Tasks
                        </Link>
                    </div>

                    <div className={styles.activityList}>
                        {loading ? (
                            <div className={styles.activityItem}>
                                <div className={styles.activityContent}>
                                    <p className={styles.activityDescription}>Loading recent activity...</p>
                                </div>
                            </div>
                        ) : recentActivity.length > 0 ? (
                            recentActivity.map((activity) => (
                                <div key={activity.id} className={styles.activityItem}>
                                    <div className={styles.activityIcon}>{activity.icon}</div>
                                    <div className={styles.activityContent}>
                                        <p className={styles.activityDescription}>
                                            {activity.description}
                                        </p>
                                        <span className={styles.activityTime}>{activity.time}</span>
                                    </div>
                                    <div className={styles.activityStatus}>{activity.status}</div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.activityItem}>
                                <div className={styles.activityContent}>
                                    <p className={styles.activityDescription}>No recent activity</p>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
} 