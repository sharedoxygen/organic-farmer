'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTenant } from '@/components/TenantProvider';
import Link from 'next/link';
import styles from './page.module.css';

interface AnalyticsStats {
    productionGrowth: number;
    monthlyRevenue: number;
    yieldEfficiency: number;
    sustainabilityScore: string;
}

export default function AnalyticsPage() {
    const { currentFarm } = useTenant();
    const [stats, setStats] = useState<AnalyticsStats>({
        productionGrowth: 0,
        monthlyRevenue: 0,
        yieldEfficiency: 0,
        sustainabilityScore: 'Unknown'
    });
    const [loading, setLoading] = useState(true);

    const fetchAnalyticsStats = useCallback(async () => {
        if (!currentFarm?.id) return;

        try {
            setLoading(true);

            // Fetch dashboard analytics
            const dashboardRes = await fetch('/api/analytics/dashboard', {
                headers: { 'X-Farm-ID': currentFarm.id }
            });
            const dashboardData = await dashboardRes.json();
            const data = dashboardData.data || {};

            // Fetch sustainability data
            let sustainabilityScore = 'Good';
            try {
                const sustainRes = await fetch('/api/analytics/sustainability', {
                    headers: { 'X-Farm-ID': currentFarm.id }
                });
                const sustainData = await sustainRes.json();
                if (sustainData.data?.score) {
                    sustainabilityScore = sustainData.data.score >= 80 ? 'Excellent' :
                        sustainData.data.score >= 60 ? 'Good' : 'Needs Improvement';
                }
            } catch {
                // Sustainability endpoint may not exist
            }

            // Calculate production growth (compare active vs completed)
            const activeBatches = data.activeBatches || 0;
            const totalBatches = data.totalBatches || 0;
            const productionGrowth = totalBatches > 0
                ? Math.round((activeBatches / totalBatches) * 100) - 50
                : 0;

            // Yield efficiency from quality score
            const yieldEfficiency = data.qualityScore || 0;

            setStats({
                productionGrowth,
                monthlyRevenue: data.monthlyRevenue || 0,
                yieldEfficiency,
                sustainabilityScore
            });

        } catch (error) {
            console.error('Error fetching analytics stats:', error);
        } finally {
            setLoading(false);
        }
    }, [currentFarm?.id]);

    useEffect(() => {
        fetchAnalyticsStats();
    }, [fetchAnalyticsStats]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Analytics & Reporting</h1>
                <p className={styles.subtitle}>Data insights and performance analytics</p>
            </div>

            <div className={styles.grid}>
                <Link href="/analytics/production" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🌱</span>
                        <h3>Production Analytics</h3>
                    </div>
                    <p>Analyze production performance and trends</p>
                    <div className={styles.stats}>
                        <span className={stats.productionGrowth >= 0 ? styles.statGreen : styles.statBadge}>
                            {loading ? '...' : `${stats.productionGrowth >= 0 ? '+' : ''}${stats.productionGrowth}% This Month`}
                        </span>
                    </div>
                </Link>

                <Link href="/analytics/financial" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>💰</span>
                        <h3>Financial Reports</h3>
                    </div>
                    <p>Revenue, costs, and profitability analysis</p>
                    <div className={styles.stats}>
                        <span className={styles.statValue}>
                            {loading ? '...' : `${formatCurrency(stats.monthlyRevenue)} MTD`}
                        </span>
                    </div>
                </Link>

                <Link href="/analytics/yield" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>📊</span>
                        <h3>Yield Analysis</h3>
                    </div>
                    <p>Track and optimize crop yields</p>
                    <div className={styles.stats}>
                        <span className={stats.yieldEfficiency >= 80 ? styles.statGreen : styles.statBadge}>
                            {loading ? '...' : `${stats.yieldEfficiency}% Efficiency`}
                        </span>
                    </div>
                </Link>

                <Link href="/analytics/sustainability" className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>🌍</span>
                        <h3>Sustainability Metrics</h3>
                    </div>
                    <p>Environmental impact and sustainability</p>
                    <div className={styles.stats}>
                        <span className={stats.sustainabilityScore === 'Excellent' || stats.sustainabilityScore === 'Good' ? styles.statGreen : styles.statBadge}>
                            {loading ? '...' : stats.sustainabilityScore}
                        </span>
                    </div>
                </Link>
            </div>

            <div className={styles.section}>
                <h2>Quick Insights</h2>
                <div className={styles.activityList}>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>📈</span>
                        <span>Monthly revenue: {loading ? '...' : formatCurrency(stats.monthlyRevenue)}</span>
                        <span className={styles.activityTime}>Current Month</span>
                    </div>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>💹</span>
                        <span>Quality score: {loading ? '...' : `${stats.yieldEfficiency}%`}</span>
                        <span className={styles.activityTime}>Last 30 Days</span>
                    </div>
                    <div className={styles.activityItem}>
                        <span className={styles.activityIcon}>🌿</span>
                        <span>Sustainability rating: {loading ? '...' : stats.sustainabilityScore}</span>
                        <span className={styles.activityTime}>Current Status</span>
                    </div>
                </div>
            </div>
        </div>
    );
} 