'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTenant } from '@/components/TenantProvider';
import Link from 'next/link';
import styles from './page.module.css';

interface QualityStats {
    pendingChecks: number;
    passedChecks: number;
    failedChecks: number;
    foodSafetyStatus: string;
    organicCompliant: boolean;
    activeCertifications: number;
}

interface QualityActivity {
    id: string;
    icon: string;
    description: string;
    time: string;
}

export default function QualityPage() {
    const { currentFarm } = useTenant();
    const [stats, setStats] = useState<QualityStats>({
        pendingChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        foodSafetyStatus: 'Unknown',
        organicCompliant: false,
        activeCertifications: 0
    });
    const [recentActivity, setRecentActivity] = useState<QualityActivity[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchQualityStats = useCallback(async () => {
        if (!currentFarm?.id) return;

        try {
            setLoading(true);

            // Fetch quality checks
            const checksRes = await fetch('/api/quality-checks', {
                headers: { 'X-Farm-ID': currentFarm.id }
            });
            const checksData = await checksRes.json();
            const checks = checksData.data || [];

            // Fetch food safety data
            const safetyRes = await fetch('/api/compliance/fda-fsma', {
                headers: { 'X-Farm-ID': currentFarm.id }
            });
            const safetyData = await safetyRes.json();

            // Fetch organic compliance
            const organicRes = await fetch('/api/compliance/usda-organic', {
                headers: { 'X-Farm-ID': currentFarm.id }
            });
            const organicData = await organicRes.json();

            // Calculate stats
            const pendingChecks = checks.filter((c: any) => c.status === 'PENDING').length;
            const passedChecks = checks.filter((c: any) => c.status === 'PASSED').length;
            const failedChecks = checks.filter((c: any) => c.status === 'FAILED').length;

            // Determine food safety status
            const hasFailures = failedChecks > 0;
            const foodSafetyStatus = hasFailures ? 'Needs Attention' : 'All Systems Good';

            // Check organic compliance
            const organicCompliant = organicData.data?.isCompliant !== false;

            setStats({
                pendingChecks,
                passedChecks,
                failedChecks,
                foodSafetyStatus,
                organicCompliant,
                activeCertifications: organicData.data?.certifications?.length || 0
            });

            // Generate recent activity from quality checks
            const activities: QualityActivity[] = checks
                .slice(0, 5)
                .map((check: any) => ({
                    id: check.id,
                    icon: check.status === 'PASSED' ? '✅' : check.status === 'FAILED' ? '❌' : '🔍',
                    description: `${check.checkType || 'Quality'} check for batch ${check.batchId?.substring(0, 8) || 'Unknown'} - ${check.status}`,
                    time: new Date(check.checkDate || check.createdAt).toLocaleDateString()
                }));
            setRecentActivity(activities);

        } catch (error) {
            console.error('Error fetching quality stats:', error);
        } finally {
            setLoading(false);
        }
    }, [currentFarm?.id]);

    useEffect(() => {
        fetchQualityStats();
    }, [fetchQualityStats]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Quality & Compliance</h1>
                <p className={styles.subtitle}>Ensure product quality and regulatory compliance</p>
            </div>

            <div className={styles.grid}>
                <Link href="/quality/control" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🔍</span>
                        <h3>Quality Control</h3>
                    </div>
                    <p>Monitor and maintain product quality standards</p>
                    <div className={styles.stats}>
                        <span className={styles.statBadge}>
                            {loading ? '...' : `${stats.pendingChecks} Pending Checks`}
                        </span>
                    </div>
                </Link>

                <Link href="/quality/food-safety" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🛡️</span>
                        <h3>Food Safety</h3>
                    </div>
                    <p>Maintain food safety protocols and procedures</p>
                    <div className={styles.stats}>
                        <span className={stats.foodSafetyStatus === 'All Systems Good' ? styles.statGreen : styles.statBadge}>
                            {loading ? '...' : stats.foodSafetyStatus}
                        </span>
                    </div>
                </Link>

                <Link href="/quality/organic" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🌿</span>
                        <h3>USDA Organic Compliance</h3>
                    </div>
                    <p>Track organic certification requirements</p>
                    <div className={styles.stats}>
                        <span className={stats.organicCompliant ? styles.statGreen : styles.statBadge}>
                            {loading ? '...' : (stats.organicCompliant ? 'Compliant' : 'Review Needed')}
                        </span>
                    </div>
                </Link>

                <Link href="/quality/certifications" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>📜</span>
                        <h3>Certifications</h3>
                    </div>
                    <p>Manage certifications and documentation</p>
                    <div className={styles.stats}>
                        <span className={styles.statValue}>
                            {loading ? '...' : `${stats.activeCertifications} Active`}
                        </span>
                    </div>
                </Link>
            </div>

            <div className={styles.section}>
                <h2>Recent Quality Activities</h2>
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
                            <span>No recent quality activities</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 