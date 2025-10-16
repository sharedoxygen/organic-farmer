'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

import styles from './page.module.css';

export default function SalesPage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Sales & Orders</h1>
                <p className={styles.subtitle}>Manage customer orders and sales operations</p>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>📋</span>
                        <h3>Order Management</h3>
                    </div>
                    <p>Process and track customer orders</p>
                    <div className={styles.stats}>
                        <span className={styles.statBadge}>5 Pending</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🏢</span>
                        <h3>B2B Customers</h3>
                    </div>
                    <p>Manage business customers and accounts</p>
                    <div className={styles.stats}>
                        <span className={styles.statValue}>24 Active</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>👥</span>
                        <h3>B2C Customers</h3>
                    </div>
                    <p>Individual customer management</p>
                    <div className={styles.stats}>
                        <span className={styles.statValue}>156 Active</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🚚</span>
                        <h3>Delivery & Logistics</h3>
                    </div>
                    <p>Track deliveries and logistics</p>
                    <div className={styles.stats}>
                        <span className={styles.statGreen}>On Schedule</span>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2>Recent Sales Activity</h2>
                <div className={styles.activityList}>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>💰</span>
                        <span>New order from Farm to Table Restaurant - $485</span>
                        <span className={styles.activityTime}>1 hour ago</span>
                    </div>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>📦</span>
                        <span>Order #ORD-2024-005 shipped to Green Grocer</span>
                        <span className={styles.activityTime}>3 hours ago</span>
                    </div>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>✅</span>
                        <span>Weekly B2B orders processed successfully</span>
                        <span className={styles.activityTime}>1 day ago</span>
                    </div>
                </div>
            </div>
        </div>
    );
} 