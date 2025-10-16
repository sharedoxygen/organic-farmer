'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

import styles from './page.module.css';

export default function EquipmentPage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Equipment & Facilities</h1>
                <p className={styles.subtitle}>Manage equipment and facility operations</p>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>⚙️</span>
                        <h3>Equipment Management</h3>
                    </div>
                    <p>Track and maintain equipment inventory</p>
                    <div className={styles.stats}>
                        <span className={styles.statGreen}>All Operational</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🔧</span>
                        <h3>Maintenance Schedules</h3>
                    </div>
                    <p>Schedule and track maintenance activities</p>
                    <div className={styles.stats}>
                        <span className={styles.statBadge}>2 Due Soon</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🌡️</span>
                        <h3>Environmental Controls</h3>
                    </div>
                    <p>Monitor and control growing environment</p>
                    <div className={styles.stats}>
                        <span className={styles.statGreen}>Optimal</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>📡</span>
                        <h3>IoT Sensors</h3>
                    </div>
                    <p>Monitor sensor data and alerts</p>
                    <div className={styles.stats}>
                        <span className={styles.statValue}>24 Active</span>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2>Recent Equipment Activity</h2>
                <div className={styles.activityList}>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>🔧</span>
                        <span>Irrigation pump #3 maintenance completed</span>
                        <span className={styles.activityTime}>4 hours ago</span>
                    </div>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>📡</span>
                        <span>Temperature sensor calibration scheduled</span>
                        <span className={styles.activityTime}>1 day ago</span>
                    </div>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>⚡</span>
                        <span>Backup generator test completed successfully</span>
                        <span className={styles.activityTime}>3 days ago</span>
                    </div>
                </div>
            </div>
        </div>
    );
} 