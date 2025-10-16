'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

import styles from './page.module.css';

export default function AnalyticsPage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Analytics & Reporting</h1>
                <p className={styles.subtitle}>Data insights and performance analytics</p>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🌱</span>
                        <h3>Production Analytics</h3>
                    </div>
                    <p>Analyze production performance and trends</p>
                    <div className={styles.stats}>
                        <span className={styles.statGreen}>+12% This Month</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>💰</span>
                        <h3>Financial Reports</h3>
                    </div>
                    <p>Revenue, costs, and profitability analysis</p>
                    <div className={styles.stats}>
                        <span className={styles.statValue}>$45,620 MTD</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>📊</span>
                        <h3>Yield Analysis</h3>
                    </div>
                    <p>Track and optimize crop yields</p>
                    <div className={styles.stats}>
                        <span className={styles.statGreen}>95% Target</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🌍</span>
                        <h3>Sustainability Metrics</h3>
                    </div>
                    <p>Environmental impact and sustainability</p>
                    <div className={styles.stats}>
                        <span className={styles.statGreen}>Carbon Neutral</span>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2>Recent Analytics Activity</h2>
                <div className={styles.activityList}>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>📈</span>
                        <span>Monthly production report generated</span>
                        <span className={styles.activityTime}>2 hours ago</span>
                    </div>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>💹</span>
                        <span>Q4 financial analysis completed</span>
                        <span className={styles.activityTime}>1 day ago</span>
                    </div>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>🌿</span>
                        <span>Sustainability audit report published</span>
                        <span className={styles.activityTime}>3 days ago</span>
                    </div>
                </div>
            </div>
        </div>
    );
} 