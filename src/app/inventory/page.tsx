'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTenant } from '@/components/TenantProvider';
import Link from 'next/link';
import styles from './page.module.css';

interface InventoryStats {
    totalItems: number;
    stockedPercentage: number;
    lowStockItems: number;
    packagingStatus: string;
    equipmentCount: number;
}

interface InventoryActivity {
    id: string;
    icon: string;
    description: string;
    time: string;
}

export default function InventoryPage() {
    const { currentFarm } = useTenant();
    const [stats, setStats] = useState<InventoryStats>({
        totalItems: 0,
        stockedPercentage: 0,
        lowStockItems: 0,
        packagingStatus: 'Unknown',
        equipmentCount: 0
    });
    const [recentActivity, setRecentActivity] = useState<InventoryActivity[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInventoryStats = useCallback(async () => {
        if (!currentFarm?.id) return;

        try {
            setLoading(true);

            // Fetch inventory items
            const inventoryRes = await fetch('/api/inventory', {
                headers: { 'X-Farm-ID': currentFarm.id }
            });
            const inventoryData = await inventoryRes.json();
            const items = inventoryData.data || [];

            // Fetch equipment
            const equipmentRes = await fetch('/api/equipment', {
                headers: { 'X-Farm-ID': currentFarm.id }
            });
            const equipmentData = await equipmentRes.json();
            const equipment = equipmentData.data || [];

            // Calculate stats
            const totalItems = items.length;
            const lowStockItems = items.filter((i: any) =>
                i.currentStock <= i.minStockLevel
            ).length;
            const wellStockedItems = items.filter((i: any) =>
                i.currentStock > i.minStockLevel
            ).length;
            const stockedPercentage = totalItems > 0
                ? Math.round((wellStockedItems / totalItems) * 100)
                : 0;

            // Packaging status
            const packagingItems = items.filter((i: any) =>
                i.category === 'PACKAGING' || i.category?.toLowerCase().includes('packaging')
            );
            const packagingLow = packagingItems.some((i: any) => i.currentStock <= i.minStockLevel);
            const packagingStatus = packagingLow ? 'Low Stock' : 'Well Stocked';

            setStats({
                totalItems,
                stockedPercentage,
                lowStockItems,
                packagingStatus,
                equipmentCount: equipment.length
            });

            // Generate recent activity from inventory items
            const activities: InventoryActivity[] = items
                .slice(0, 5)
                .map((item: any) => ({
                    id: item.id,
                    icon: item.currentStock <= item.minStockLevel ? '⚠️' : '📈',
                    description: `${item.name} - ${item.currentStock} ${item.unit} (${item.currentStock <= item.minStockLevel ? 'Low Stock' : 'In Stock'})`,
                    time: new Date(item.updatedAt || item.createdAt).toLocaleDateString()
                }));
            setRecentActivity(activities);

        } catch (error) {
            console.error('Error fetching inventory stats:', error);
        } finally {
            setLoading(false);
        }
    }, [currentFarm?.id]);

    useEffect(() => {
        fetchInventoryStats();
    }, [fetchInventoryStats]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Inventory Management</h1>
                <p className={styles.subtitle}>Track and manage all inventory levels</p>
            </div>

            <div className={styles.grid}>
                <Link href="/inventory/stock" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>📊</span>
                        <h3>Stock Levels</h3>
                    </div>
                    <p>Monitor current inventory levels</p>
                    <div className={styles.stats}>
                        <span className={styles.statValue}>
                            {loading ? '...' : `${stats.stockedPercentage}% Stocked`}
                        </span>
                    </div>
                </Link>

                <Link href="/inventory/supplies" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🧪</span>
                        <h3>Ingredients & Supplies</h3>
                    </div>
                    <p>Manage growing supplies and nutrients</p>
                    <div className={styles.stats}>
                        <span className={stats.lowStockItems > 0 ? styles.statBadge : styles.statGreen}>
                            {loading ? '...' : (stats.lowStockItems > 0 ? `${stats.lowStockItems} Low Stock` : 'All Stocked')}
                        </span>
                    </div>
                </Link>

                <Link href="/inventory/packaging" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>📦</span>
                        <h3>Packaging Materials</h3>
                    </div>
                    <p>Track packaging inventory</p>
                    <div className={styles.stats}>
                        <span className={stats.packagingStatus === 'Well Stocked' ? styles.statGreen : styles.statBadge}>
                            {loading ? '...' : stats.packagingStatus}
                        </span>
                    </div>
                </Link>

                <Link href="/inventory/equipment" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🔧</span>
                        <h3>Equipment & Tools</h3>
                    </div>
                    <p>Manage tools and equipment inventory</p>
                    <div className={styles.stats}>
                        <span className={styles.statValue}>
                            {loading ? '...' : `${stats.equipmentCount} Items`}
                        </span>
                    </div>
                </Link>
            </div>

            <div className={styles.section}>
                <h2>Recent Inventory Activity</h2>
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
                            <span>No recent inventory activity</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 