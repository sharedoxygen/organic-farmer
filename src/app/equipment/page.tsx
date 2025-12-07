'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTenant } from '@/components/TenantProvider';
import Link from 'next/link';
import styles from './page.module.css';

interface EquipmentStats {
    totalEquipment: number;
    operationalCount: number;
    maintenanceDue: number;
    environmentStatus: string;
    sensorCount: number;
}

interface EquipmentActivity {
    id: string;
    icon: string;
    description: string;
    time: string;
}

export default function EquipmentPage() {
    const { currentFarm } = useTenant();
    const [stats, setStats] = useState<EquipmentStats>({
        totalEquipment: 0,
        operationalCount: 0,
        maintenanceDue: 0,
        environmentStatus: 'Unknown',
        sensorCount: 0
    });
    const [recentActivity, setRecentActivity] = useState<EquipmentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEquipmentStats = useCallback(async () => {
        if (!currentFarm?.id) return;

        try {
            setLoading(true);

            // Fetch equipment
            const equipmentRes = await fetch('/api/equipment', {
                headers: { 'X-Farm-ID': currentFarm.id }
            });
            const equipmentData = await equipmentRes.json();
            const equipment = equipmentData.data || [];

            // Fetch environments
            const envRes = await fetch('/api/environments', {
                headers: { 'X-Farm-ID': currentFarm.id }
            });
            const envData = await envRes.json();
            const environments = envData.data || [];

            // Calculate stats
            const totalEquipment = equipment.length;
            const operationalCount = equipment.filter((e: any) =>
                e.status === 'OPERATIONAL' || e.status === 'ACTIVE'
            ).length;

            // Check maintenance due
            const now = new Date();
            const maintenanceDue = equipment.filter((e: any) => {
                if (!e.nextMaintenance) return false;
                const nextMaint = new Date(e.nextMaintenance);
                const daysUntil = (nextMaint.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                return daysUntil <= 7; // Due within 7 days
            }).length;

            // Environment status
            const hasAlerts = environments.some((e: any) =>
                e.status === 'ALERT' || e.status === 'WARNING'
            );
            const environmentStatus = hasAlerts ? 'Needs Attention' : 'Optimal';

            // Count sensors (equipment of type SENSOR)
            const sensorCount = equipment.filter((e: any) =>
                e.type === 'SENSOR' || e.type?.toLowerCase().includes('sensor')
            ).length;

            setStats({
                totalEquipment,
                operationalCount,
                maintenanceDue,
                environmentStatus,
                sensorCount
            });

            // Generate recent activity from equipment
            const activities: EquipmentActivity[] = equipment
                .slice(0, 5)
                .map((item: any) => ({
                    id: item.id,
                    icon: item.status === 'OPERATIONAL' ? '✅' :
                        item.status === 'MAINTENANCE' ? '🔧' : '⚠️',
                    description: `${item.name} - ${item.status}`,
                    time: new Date(item.updatedAt || item.createdAt).toLocaleDateString()
                }));
            setRecentActivity(activities);

        } catch (error) {
            console.error('Error fetching equipment stats:', error);
        } finally {
            setLoading(false);
        }
    }, [currentFarm?.id]);

    useEffect(() => {
        fetchEquipmentStats();
    }, [fetchEquipmentStats]);

    const allOperational = stats.operationalCount === stats.totalEquipment && stats.totalEquipment > 0;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Equipment & Facilities</h1>
                <p className={styles.subtitle}>Manage equipment and facility operations</p>
            </div>

            <div className={styles.grid}>
                <Link href="/equipment/management" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>⚙️</span>
                        <h3>Equipment Management</h3>
                    </div>
                    <p>Track and maintain equipment inventory</p>
                    <div className={styles.stats}>
                        <span className={allOperational ? styles.statGreen : styles.statBadge}>
                            {loading ? '...' : (allOperational ? 'All Operational' : `${stats.operationalCount}/${stats.totalEquipment} Operational`)}
                        </span>
                    </div>
                </Link>

                <Link href="/equipment/maintenance" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🔧</span>
                        <h3>Maintenance Schedules</h3>
                    </div>
                    <p>Schedule and track maintenance activities</p>
                    <div className={styles.stats}>
                        <span className={stats.maintenanceDue > 0 ? styles.statBadge : styles.statGreen}>
                            {loading ? '...' : (stats.maintenanceDue > 0 ? `${stats.maintenanceDue} Due Soon` : 'All Current')}
                        </span>
                    </div>
                </Link>

                <Link href="/production/environments" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🌡️</span>
                        <h3>Environmental Controls</h3>
                    </div>
                    <p>Monitor and control growing environment</p>
                    <div className={styles.stats}>
                        <span className={stats.environmentStatus === 'Optimal' ? styles.statGreen : styles.statBadge}>
                            {loading ? '...' : stats.environmentStatus}
                        </span>
                    </div>
                </Link>

                <Link href="/equipment/sensors" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>📡</span>
                        <h3>IoT Sensors</h3>
                    </div>
                    <p>Monitor sensor data and alerts</p>
                    <div className={styles.stats}>
                        <span className={styles.statValue}>
                            {loading ? '...' : `${stats.sensorCount} Active`}
                        </span>
                    </div>
                </Link>
            </div>

            <div className={styles.section}>
                <h2>Recent Equipment Activity</h2>
                <div className={styles.activityList}>
                    {loading ? (
                        <div className={styles.activityItem}>
                            <span>Loading recent activity...</span>
                        </div>
                    ) : recentActivity.length > 0 ? (
                        recentActivity.map((activity) => (
                            <div key={activity.id} className={styles.activityItem}>
                                <span className={styles.activityIcon}>{activity.icon}</span>
                                <span>{activity.description}</span>
                                <span className={styles.activityTime}>{activity.time}</span>
                            </div>
                        ))
                    ) : (
                        <div className={styles.activityItem}>
                            <span>No recent equipment activity</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 