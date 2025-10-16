'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

import styles from './page.module.css';

export default function IntegrationsPage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Integrations</h1>
                <p className={styles.subtitle}>Connect with external systems and services</p>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🌤️</span>
                        <h3>Weather Data</h3>
                    </div>
                    <p>Real-time weather monitoring and forecasts</p>
                    <div className={styles.stats}>
                        <span className={styles.statGreen}>Connected</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🛒</span>
                        <h3>E-commerce Platforms</h3>
                    </div>
                    <p>Online store and marketplace integrations</p>
                    <div className={styles.stats}>
                        <span className={styles.statValue}>3 Active</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>💼</span>
                        <h3>Accounting Systems</h3>
                    </div>
                    <p>Financial software and accounting integration</p>
                    <div className={styles.stats}>
                        <span className={styles.statGreen}>Synced</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🧪</span>
                        <h3>Laboratory Systems</h3>
                    </div>
                    <p>Quality testing and lab result integration</p>
                    <div className={styles.stats}>
                        <span className={styles.statValue}>2 Labs</span>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2>Recent Integration Activity</h2>
                <div className={styles.activityList}>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>🔄</span>
                        <span>Weather data synchronized successfully</span>
                        <span className={styles.activityTime}>15 min ago</span>
                    </div>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>💰</span>
                        <span>Daily sales data exported to accounting system</span>
                        <span className={styles.activityTime}>2 hours ago</span>
                    </div>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>🛒</span>
                        <span>E-commerce inventory levels updated</span>
                        <span className={styles.activityTime}>6 hours ago</span>
                    </div>
                </div>
            </div>
        </div>
    );
} 