'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card } from '@/components/ui';
import { RadialGauge, LinearMeter } from '@/components/ui/Instrument';
import styles from './page.module.css';

interface ObservabilityData {
    healthScore: number;
    auditEvents24h: number;
    auditEvents7d: number;
    entityCounts: Record<string, number>;
    apiLatencyMs: { p50: number; p95: number; p99: number };
    aiMetrics: {
        inferenceCalls24h: number;
        avgConfidence: number;
        modelVersion: string;
        agentActions24h: number;
    };
    recentAudit: Array<{ id: string; action: string; entity: string; timestamp: string }>;
}

export default function ObservabilityPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [data, setData] = useState<ObservabilityData | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!currentFarm?.id) return;
        setLoading(true);
        try {
            const res = await fetch('/api/observability/metrics', {
                headers: { 'X-Farm-ID': currentFarm.id },
                credentials: 'include',
            });
            const json = await res.json();
            if (json.success) setData(json.data);
        } finally {
            setLoading(false);
        }
    }, [currentFarm?.id]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push('/auth/signin');
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (currentFarm?.id) load();
    }, [currentFarm?.id, load]);

    if (loading || !data) {
        return <div className={styles.container}><p>Loading observability…</p></div>;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>📡 Observability Hub</h1>
                <p>Application, AI, and business metrics for {currentFarm?.farm_name}</p>
            </header>

            <div className={styles.topRow}>
                <Card className={styles.healthCard}>
                    <RadialGauge label="Platform Health" value={data.healthScore} max={100} unit="%" status="excellent" size="lg" />
                </Card>
                <Card>
                    <h3>API Latency (ms)</h3>
                    <LinearMeter label="p50" value={data.apiLatencyMs.p50} max={200} status="excellent" />
                    <LinearMeter label="p95" value={data.apiLatencyMs.p95} max={300} status="good" />
                    <LinearMeter label="p99" value={data.apiLatencyMs.p99} max={500} status="watch" />
                </Card>
                <Card>
                    <h3>🤖 AI / Agent Metrics</h3>
                    <div className={styles.statGrid}>
                        <div><span>Inferences (24h)</span><strong>{data.aiMetrics.inferenceCalls24h}</strong></div>
                        <div><span>Agent Actions (24h)</span><strong>{data.aiMetrics.agentActions24h}</strong></div>
                        <div><span>Avg Confidence</span><strong>{(data.aiMetrics.avgConfidence * 100).toFixed(0)}%</strong></div>
                        <div><span>Model</span><strong>{data.aiMetrics.modelVersion}</strong></div>
                    </div>
                </Card>
            </div>

            <Card>
                <h3>Entity Inventory</h3>
                <div className={styles.entityGrid}>
                    {Object.entries(data.entityCounts).map(([k, v]) => (
                        <div key={k} className={styles.entityItem}>
                            <span>{k}</span>
                            <strong>{v}</strong>
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <h3>Audit Trail (recent)</h3>
                <p className={styles.auditMeta}>{data.auditEvents24h} events (24h) · {data.auditEvents7d} (7d)</p>
                <ul className={styles.auditList}>
                    {data.recentAudit.map((row) => (
                        <li key={row.id}>
                            <span className={styles.auditAction}>{row.action}</span>
                            <span className={styles.auditEntity}>{row.entity}</span>
                            <time>{new Date(row.timestamp).toLocaleString()}</time>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
}
