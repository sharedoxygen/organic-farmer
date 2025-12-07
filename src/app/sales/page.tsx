'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTenant } from '@/components/TenantProvider';
import Link from 'next/link';
import styles from './page.module.css';

interface SalesStats {
    pendingOrders: number;
    completedOrders: number;
    b2bCustomers: number;
    b2cCustomers: number;
    deliveryStatus: string;
    totalRevenue: number;
}

interface SalesActivity {
    id: string;
    icon: string;
    description: string;
    time: string;
}

export default function SalesPage() {
    const { currentFarm } = useTenant();
    const [stats, setStats] = useState<SalesStats>({
        pendingOrders: 0,
        completedOrders: 0,
        b2bCustomers: 0,
        b2cCustomers: 0,
        deliveryStatus: 'Unknown',
        totalRevenue: 0
    });
    const [recentActivity, setRecentActivity] = useState<SalesActivity[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSalesStats = useCallback(async () => {
        if (!currentFarm?.id) return;

        try {
            setLoading(true);

            // Fetch orders
            const ordersRes = await fetch('/api/orders', {
                headers: { 'X-Farm-ID': currentFarm.id }
            });
            const ordersData = await ordersRes.json();
            const orders = ordersData.data || [];

            // Fetch customers
            const customersRes = await fetch('/api/customers', {
                headers: { 'X-Farm-ID': currentFarm.id }
            });
            const customersData = await customersRes.json();
            const customers = customersData.data || [];

            // Calculate stats
            const pendingOrders = orders.filter((o: any) =>
                o.status === 'PENDING' || o.status === 'PROCESSING'
            ).length;
            const completedOrders = orders.filter((o: any) =>
                o.status === 'COMPLETED' || o.status === 'DELIVERED'
            ).length;
            const shippedOrders = orders.filter((o: any) => o.status === 'SHIPPED').length;

            // Customer breakdown
            const b2bCustomers = customers.filter((c: any) =>
                c.type === 'B2B' || c.businessType
            ).length;
            const b2cCustomers = customers.filter((c: any) =>
                c.type === 'B2C' || !c.businessType
            ).length;

            // Delivery status
            const deliveryStatus = shippedOrders > 0 ? 'In Transit' :
                pendingOrders > 0 ? 'Orders Pending' : 'On Schedule';

            // Calculate revenue
            const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

            setStats({
                pendingOrders,
                completedOrders,
                b2bCustomers,
                b2cCustomers,
                deliveryStatus,
                totalRevenue
            });

            // Generate recent activity from orders
            const activities: SalesActivity[] = orders
                .slice(0, 5)
                .map((order: any) => ({
                    id: order.id,
                    icon: order.status === 'COMPLETED' ? '✅' :
                        order.status === 'SHIPPED' ? '📦' : '💰',
                    description: `Order ${order.orderNumber} - ${order.customers?.businessName || order.customers?.name || 'Customer'} - $${order.total?.toFixed(2) || '0.00'}`,
                    time: new Date(order.createdAt).toLocaleDateString()
                }));
            setRecentActivity(activities);

        } catch (error) {
            console.error('Error fetching sales stats:', error);
        } finally {
            setLoading(false);
        }
    }, [currentFarm?.id]);

    useEffect(() => {
        fetchSalesStats();
    }, [fetchSalesStats]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Sales & Orders</h1>
                <p className={styles.subtitle}>Manage customer orders and sales operations</p>
            </div>

            <div className={styles.grid}>
                <Link href="/sales/orders" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>📋</span>
                        <h3>Order Management</h3>
                    </div>
                    <p>Process and track customer orders</p>
                    <div className={styles.stats}>
                        <span className={styles.statBadge}>
                            {loading ? '...' : `${stats.pendingOrders} Pending`}
                        </span>
                    </div>
                </Link>

                <Link href="/sales/customers" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>👥</span>
                        <h3>Customers</h3>
                    </div>
                    <p>Manage all customer relationships (B2B & B2C)</p>
                    <div className={styles.stats}>
                        <span className={styles.statValue}>
                            {loading ? '...' : `${stats.b2bCustomers + stats.b2cCustomers} Total`}
                        </span>
                    </div>
                </Link>

                <Link href="/sales/delivery" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🚚</span>
                        <h3>Delivery & Logistics</h3>
                    </div>
                    <p>Track deliveries and logistics</p>
                    <div className={styles.stats}>
                        <span className={stats.deliveryStatus === 'On Schedule' ? styles.statGreen : styles.statBadge}>
                            {loading ? '...' : stats.deliveryStatus}
                        </span>
                    </div>
                </Link>
            </div>

            <div className={styles.section}>
                <h2>Recent Sales Activity</h2>
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
                            <span>No recent sales activity</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 