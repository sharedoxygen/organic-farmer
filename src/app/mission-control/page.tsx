'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card, Button } from '@/components/ui';
import { RadialGauge, FlowPipeline, LinearMeter } from '@/components/ui/Instrument';
import type { ShowcaseMetrics } from '@/lib/showcase/farmMetrics';
import styles from './page.module.css';

export default function MissionControlPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [metrics, setMetrics] = useState<ShowcaseMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!currentFarm?.id) return;
        setLoading(true);
        try {
            const res = await fetch('/api/showcase/metrics', {
                headers: { 'X-Farm-ID': currentFarm.id },
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success) setMetrics(data.data);
        } catch (e) {
            console.error(e);
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

    const isCannabis = metrics?.farmType === 'CANNABIS_CULTIVATION';

    if (authLoading || loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Initializing Mission Control…</div>
            </div>
        );
    }

    if (!currentFarm || !metrics) {
        return (
            <div className={styles.container}>
                <Card><p>Select a farm to enter Mission Control.</p></Card>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.hero}>
                <div className={styles.heroLeft}>
                    <span className={styles.badge}>{isCannabis ? '🌿 Cannabis' : '🥬 Organic'}</span>
                    <h1>Mission Control</h1>
                    <p className={styles.tagline}>{metrics.tagline}</p>
                    <p className={styles.farmName}>{metrics.farmName}</p>
                </div>
                <div className={styles.heroRight}>
                    <RadialGauge
                        label="Operations Health"
                        value={metrics.heroScore}
                        max={100}
                        unit="%"
                        status="excellent"
                        size="lg"
                    />
                </div>
            </header>

            <div className={styles.actions}>
                <Button variant="primary" onClick={() => router.push('/ai-dashboard')}>🧠 AI Command Center</Button>
                <Button variant="secondary" onClick={() => router.push('/traceability/seed-to-sale')}>🔗 Seed-to-Sale</Button>
                <Button variant="secondary" onClick={() => router.push('/observability')}>📡 Observability</Button>
                <Button variant="secondary" onClick={() => router.push('/admin/operations')}>⚙️ Operations</Button>
                <Button variant="secondary" onClick={load}>🔄 Refresh</Button>
            </div>

            <Card className={styles.aiCard}>
                <h3>🤖 Agent Insight</h3>
                <p>{metrics.aiSummary}</p>
            </Card>

            <section className={styles.gaugeGrid}>
                {metrics.gauges.map((g) => (
                    <Card key={g.id} className={styles.gaugeCard}>
                        <RadialGauge
                            label={g.label}
                            value={g.value}
                            max={g.max}
                            unit={g.unit}
                            status={g.status}
                            icon={g.icon}
                            trend={g.trend}
                        />
                    </Card>
                ))}
            </section>

            <Card className={styles.flowCard}>
                <h3>{isCannabis ? 'Seed-to-Sale Pipeline' : 'Farm-to-Table Flow'}</h3>
                <FlowPipeline steps={metrics.flowSteps} />
            </Card>

            <section className={styles.highlights}>
                {metrics.highlights.map((h) => (
                    <Card key={h.label} className={styles.highlightCard}>
                        <span className={styles.highlightLabel}>{h.label}</span>
                        <span className={styles.highlightValue}>{h.value}</span>
                        {h.delta && <span className={styles.highlightDelta}>{h.delta}</span>}
                    </Card>
                ))}
            </section>

            <Card className={styles.meterCard}>
                <h3>System Pulse</h3>
                <div className={styles.meterStack}>
                    <LinearMeter label="Data Integrity" value={metrics.heroScore} max={100} unit="%" status="excellent" />
                    <LinearMeter label="Traceability Coverage" value={metrics.gauges.find(g => g.id === 'custody' || g.id === 'organic')?.value ?? 85} max={100} unit="%" status="good" />
                    <LinearMeter label="Active Production" value={metrics.flowSteps.find(s => s.status === 'active')?.count ?? 0} max={Math.max(metrics.flowSteps[1]?.count ?? 10, 10)} status="good" />
                </div>
            </Card>
        </div>
    );
}
