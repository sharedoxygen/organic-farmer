'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTenant } from '@/components/TenantProvider';
import { Card } from '@/components/ui';
import styles from './page.module.css';

interface TraceabilityItem {
    id: string;
    batchNumber: string;
    variety: string;
    status: string;
    plantDate: string;
    harvestDate?: string;
    quantity: number;
    location: string;
}

export default function TraceabilityPage(): JSX.Element {
    const { currentFarm } = useTenant();
    const [traceabilityItems, setTraceabilityItems] = useState<TraceabilityItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTraceabilityData = useCallback(async () => {
        if (!currentFarm?.id) return;

        try {
            setLoading(true);

            // Fetch batches for traceability
            const batchesRes = await fetch('/api/batches?limit=100', {
                headers: { 'X-Farm-ID': currentFarm.id }
            });
            const batchesData = await batchesRes.json();
            const batches = batchesData.data || [];

            // Transform batches to traceability items
            const items: TraceabilityItem[] = batches.map((batch: any) => ({
                id: batch.id,
                batchNumber: batch.batchNumber,
                variety: batch.seed_varieties?.name || 'Unknown',
                status: batch.status,
                plantDate: batch.plantDate ? new Date(batch.plantDate).toLocaleDateString() : 'N/A',
                harvestDate: batch.actualHarvestDate ? new Date(batch.actualHarvestDate).toLocaleDateString() : undefined,
                quantity: batch.quantity || 0,
                location: batch.growingZone || 'Unknown'
            }));

            setTraceabilityItems(items);

        } catch (error) {
            console.error('Error fetching traceability data:', error);
        } finally {
            setLoading(false);
        }
    }, [currentFarm?.id]);

    useEffect(() => {
        fetchTraceabilityData();
    }, [fetchTraceabilityData]);

    // Calculate stats
    const growingCount = traceabilityItems.filter(item =>
        ['PLANTED', 'GERMINATING', 'GROWING'].includes(item.status)
    ).length;
    const packagedCount = traceabilityItems.filter(item =>
        item.status === 'PACKAGED'
    ).length;
    const completedCount = traceabilityItems.filter(item =>
        ['HARVESTED', 'SOLD'].includes(item.status)
    ).length;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Traceability</h1>
                <p>Track your microgreens from seed to sale</p>
            </div>

            <div className={styles.content}>
                <div className={styles.statsGrid}>
                    <Card className={styles.statCard}>
                        <div className={styles.statIcon}>📊</div>
                        <div className={styles.statContent}>
                            <h3>Total Batches</h3>
                            <p className={styles.statValue}>
                                {loading ? '...' : traceabilityItems.length}
                            </p>
                        </div>
                    </Card>

                    <Card className={styles.statCard}>
                        <div className={styles.statIcon}>🌱</div>
                        <div className={styles.statContent}>
                            <h3>Currently Growing</h3>
                            <p className={styles.statValue}>
                                {loading ? '...' : growingCount}
                            </p>
                        </div>
                    </Card>

                    <Card className={styles.statCard}>
                        <div className={styles.statIcon}>📦</div>
                        <div className={styles.statContent}>
                            <h3>Ready to Ship</h3>
                            <p className={styles.statValue}>
                                {loading ? '...' : packagedCount}
                            </p>
                        </div>
                    </Card>

                    <Card className={styles.statCard}>
                        <div className={styles.statIcon}>✅</div>
                        <div className={styles.statContent}>
                            <h3>Completed</h3>
                            <p className={styles.statValue}>
                                {loading ? '...' : completedCount}
                            </p>
                        </div>
                    </Card>
                </div>

                <Card className={styles.traceabilityTable}>
                    <div className={styles.tableHeader}>
                        <h2>Batch Tracking</h2>
                    </div>
                    <div className={styles.tableContent}>
                        {loading ? (
                            <p style={{ padding: '1rem', textAlign: 'center' }}>Loading traceability data...</p>
                        ) : traceabilityItems.length === 0 ? (
                            <p style={{ padding: '1rem', textAlign: 'center' }}>No batches found</p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Batch #</th>
                                        <th>Variety</th>
                                        <th>Status</th>
                                        <th>Plant Date</th>
                                        <th>Harvest Date</th>
                                        <th>Quantity</th>
                                        <th>Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {traceabilityItems.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.batchNumber}</td>
                                            <td>{item.variety}</td>
                                            <td>
                                                <span className={`${styles.status} ${styles[item.status.toLowerCase()]}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td>{item.plantDate}</td>
                                            <td>{item.harvestDate || 'N/A'}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.location}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
} 