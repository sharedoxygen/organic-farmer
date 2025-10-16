'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface Metrics {
    organicSeedVarietiesPercent: number;
    organicBatchesPercent: number;
    complianceByStatus: Record<string, number>;
    totalEquipmentPowerConsumption: number;
    packagingItemsCount: number;
    qualityFollowUpRatePercent: number;
    wasteLogEvents: number;
}

export default function SustainabilityMetricsPage() {
    const [data, setData] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const farmId = typeof window !== 'undefined' ? localStorage.getItem('ofms_farm_id') : null;
                const userData = typeof window !== 'undefined' ? localStorage.getItem('ofms_user') : null;

                const headers: Record<string, string> = { 'X-Farm-ID': farmId || '' };
                if (userData) {
                    const u = JSON.parse(userData);
                    if (u?.id) headers['Authorization'] = `Bearer ${u.id}`;
                }

                const res = await fetch('/api/analytics/sustainability', { headers });
                const json = await res.json();
                if (res.ok && json.success) setData(json.data as Metrics);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className={styles.container}><p>Loading sustainability metrics…</p></div>
        );
    }

    if (!data) {
        return (
            <div className={styles.container}><p>No data available.</p></div>
        );
    }

    const statusEntries = Object.entries(data.complianceByStatus || {});

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Sustainability Metrics</h1>
            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3>Organic Seed Varieties</h3>
                    <p className={styles.metric}>{data.organicSeedVarietiesPercent}%</p>
                </div>
                <div className={styles.card}>
                    <h3>Organic Batches</h3>
                    <p className={styles.metric}>{data.organicBatchesPercent}%</p>
                </div>
                <div className={styles.card}>
                    <h3>Equipment Power Consumption</h3>
                    <p className={styles.metric}>{data.totalEquipmentPowerConsumption.toFixed(2)} kWh</p>
                </div>
                <div className={styles.card}>
                    <h3>Packaging SKUs</h3>
                    <p className={styles.metric}>{data.packagingItemsCount}</p>
                </div>
                <div className={styles.card}>
                    <h3>Quality Follow-up Rate</h3>
                    <p className={styles.metric}>{data.qualityFollowUpRatePercent}%</p>
                </div>
                <div className={styles.card}>
                    <h3>Waste Log Events</h3>
                    <p className={styles.metric}>{data.wasteLogEvents}</p>
                </div>
            </div>

            <div className={styles.section}>
                <h3>Compliance Status</h3>
                <ul className={styles.list}>
                    {statusEntries.length === 0 && <li>No records</li>}
                    {statusEntries.map(([k, v]) => (
                        <li key={k}>{k}: {v}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}



