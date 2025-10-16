'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

import styles from './page.module.css';

export default function InventoryPage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Inventory Management</h1>
                <p className={styles.subtitle}>Track and manage all inventory levels</p>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>📊</span>
                        <h3>Stock Levels</h3>
                    </div>
                    <p>Monitor current inventory levels</p>
                    <div className={styles.stats}>
                        <span className={styles.statValue}>85% Stocked</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🧪</span>
                        <h3>Ingredients & Supplies</h3>
                    </div>
                    <p>Manage growing supplies and nutrients</p>
                    <div className={styles.stats}>
                        <span className={styles.statBadge}>3 Low Stock</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>📦</span>
                        <h3>Packaging Materials</h3>
                    </div>
                    <p>Track packaging inventory</p>
                    <div className={styles.stats}>
                        <span className={styles.statGreen}>Well Stocked</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🔧</span>
                        <h3>Equipment & Tools</h3>
                    </div>
                    <p>Manage tools and equipment inventory</p>
                    <div className={styles.stats}>
                        <span className={styles.statValue}>12 Items</span>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2>Recent Inventory Activity</h2>
                <div className={styles.activityList}>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>📈</span>
                        <span>Coconut coir restocked - 50 bags received</span>
                        <span className={styles.activityTime}>3 hours ago</span>
                    </div>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>⚠️</span>
                        <span>Organic nutrient solution running low</span>
                        <span className={styles.activityTime}>1 day ago</span>
                    </div>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>📦</span>
                        <span>New packaging materials delivered</span>
                        <span className={styles.activityTime}>2 days ago</span>
                    </div>
                </div>
            </div>
        </div>
    );
} 