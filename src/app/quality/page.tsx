'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

import styles from './page.module.css';

export default function QualityPage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Quality & Compliance</h1>
                <p className={styles.subtitle}>Ensure product quality and regulatory compliance</p>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🔍</span>
                        <h3>Quality Control</h3>
                    </div>
                    <p>Monitor and maintain product quality standards</p>
                    <div className={styles.stats}>
                        <span className={styles.statBadge}>3 Pending Checks</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🛡️</span>
                        <h3>Food Safety</h3>
                    </div>
                    <p>Maintain food safety protocols and procedures</p>
                    <div className={styles.stats}>
                        <span className={styles.statGreen}>All Systems Good</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🌿</span>
                        <h3>USDA Organic Compliance</h3>
                    </div>
                    <p>Track organic certification requirements</p>
                    <div className={styles.stats}>
                        <span className={styles.statGreen}>Compliant</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>📜</span>
                        <h3>Certifications</h3>
                    </div>
                    <p>Manage certifications and documentation</p>
                    <div className={styles.stats}>
                        <span className={styles.statValue}>5 Active</span>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2>Recent Quality Activities</h2>
                <div className={styles.activityList}>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>✅</span>
                        <span>Batch QC-2024-001 passed quality inspection</span>
                        <span className={styles.activityTime}>2 hours ago</span>
                    </div>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>📋</span>
                        <span>USDA organic audit scheduled for next week</span>
                        <span className={styles.activityTime}>1 day ago</span>
                    </div>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>🔍</span>
                        <span>Pre-harvest quality check completed</span>
                        <span className={styles.activityTime}>2 days ago</span>
                    </div>
                </div>
            </div>
        </div>
    );
} 