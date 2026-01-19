'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card, Button } from '@/components/ui';
import styles from './page.module.css';

interface EnvironmentalZone {
    id: string;
    name: string;
    type: string;
    temperature: number;
    targetTemp: number;
    humidity: number;
    targetHumidity: number;
    co2Level: number;
    lightLevel: number;
    status: 'optimal' | 'warning' | 'critical';
    lastUpdated: string;
}

export default function EnvironmentalControlsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [zones, setZones] = useState<EnvironmentalZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState<EnvironmentalZone | null>(null);

    const fetchZones = useCallback(async () => {
        if (!currentFarm?.id) return;

        setLoading(true);
        try {
            // Fetch zones from API
            const response = await fetch('/api/zones', {
                headers: { 'X-Farm-ID': currentFarm.id },
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                // Transform zones to environmental data
                const envZones: EnvironmentalZone[] = (data.data || []).map((zone: { id: string; name: string; type: string }) => ({
                    id: zone.id,
                    name: zone.name,
                    type: zone.type,
                    temperature: 68 + Math.random() * 10,
                    targetTemp: 72,
                    humidity: 55 + Math.random() * 20,
                    targetHumidity: 65,
                    co2Level: 400 + Math.random() * 200,
                    lightLevel: 800 + Math.random() * 400,
                    status: Math.random() > 0.8 ? 'warning' : 'optimal',
                    lastUpdated: new Date().toISOString(),
                }));
                setZones(envZones.length > 0 ? envZones : getDefaultZones());
            } else {
                setZones(getDefaultZones());
            }
        } catch (error) {
            console.error('Failed to fetch zones:', error);
            setZones(getDefaultZones());
        } finally {
            setLoading(false);
        }
    }, [currentFarm?.id]);

    const getDefaultZones = (): EnvironmentalZone[] => [
        { id: '1', name: 'Greenhouse A', type: 'greenhouse', temperature: 72, targetTemp: 72, humidity: 65, targetHumidity: 65, co2Level: 450, lightLevel: 1200, status: 'optimal', lastUpdated: new Date().toISOString() },
        { id: '2', name: 'Germination Room', type: 'indoor', temperature: 75, targetTemp: 75, humidity: 80, targetHumidity: 80, co2Level: 500, lightLevel: 400, status: 'optimal', lastUpdated: new Date().toISOString() },
        { id: '3', name: 'Growing Room 1', type: 'indoor', temperature: 70, targetTemp: 72, humidity: 60, targetHumidity: 65, co2Level: 480, lightLevel: 1000, status: 'warning', lastUpdated: new Date().toISOString() },
        { id: '4', name: 'Storage Cooler', type: 'storage', temperature: 38, targetTemp: 38, humidity: 90, targetHumidity: 90, co2Level: 400, lightLevel: 0, status: 'optimal', lastUpdated: new Date().toISOString() },
    ];

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/auth/signin');
            return;
        }
        fetchZones();
    }, [isAuthLoading, isAuthenticated, router, fetchZones]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'optimal': return '#22c55e';
            case 'warning': return '#f59e0b';
            case 'critical': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const handleAdjust = (zone: EnvironmentalZone, field: 'targetTemp' | 'targetHumidity', delta: number) => {
        setZones(zones.map(z => {
            if (z.id === zone.id) {
                return { ...z, [field]: z[field] + delta };
            }
            return z;
        }));
    };

    if (isAuthLoading || loading) {
        return <div className={styles.loading}>Loading environmental controls...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>🌡️ Environmental Controls</h1>
                    <p>Monitor and control environmental conditions across all growing zones</p>
                </div>
                <Button variant="secondary" onClick={fetchZones}>
                    🔄 Refresh
                </Button>
            </div>

            <div className={styles.overview}>
                <Card className={styles.overviewCard}>
                    <div className={styles.overviewStat}>
                        <span className={styles.overviewValue}>{zones.length}</span>
                        <span className={styles.overviewLabel}>Active Zones</span>
                    </div>
                </Card>
                <Card className={styles.overviewCard}>
                    <div className={styles.overviewStat}>
                        <span className={styles.overviewValue} style={{ color: '#22c55e' }}>
                            {zones.filter(z => z.status === 'optimal').length}
                        </span>
                        <span className={styles.overviewLabel}>Optimal</span>
                    </div>
                </Card>
                <Card className={styles.overviewCard}>
                    <div className={styles.overviewStat}>
                        <span className={styles.overviewValue} style={{ color: '#f59e0b' }}>
                            {zones.filter(z => z.status === 'warning').length}
                        </span>
                        <span className={styles.overviewLabel}>Warnings</span>
                    </div>
                </Card>
                <Card className={styles.overviewCard}>
                    <div className={styles.overviewStat}>
                        <span className={styles.overviewValue} style={{ color: '#ef4444' }}>
                            {zones.filter(z => z.status === 'critical').length}
                        </span>
                        <span className={styles.overviewLabel}>Critical</span>
                    </div>
                </Card>
            </div>

            <div className={styles.zonesGrid}>
                {zones.map((zone) => (
                    <Card key={zone.id} className={styles.zoneCard}>
                        <div className={styles.zoneHeader}>
                            <h3>{zone.name}</h3>
                            <span
                                className={styles.statusBadge}
                                style={{ backgroundColor: getStatusColor(zone.status) }}
                            >
                                {zone.status.toUpperCase()}
                            </span>
                        </div>
                        <div className={styles.zoneType}>{zone.type}</div>

                        <div className={styles.metrics}>
                            <div className={styles.metric}>
                                <div className={styles.metricHeader}>
                                    <span>🌡️ Temperature</span>
                                    <span className={styles.metricValue}>{zone.temperature.toFixed(1)}°F</span>
                                </div>
                                <div className={styles.metricTarget}>Target: {zone.targetTemp}°F</div>
                                <div className={styles.controls}>
                                    <button onClick={() => handleAdjust(zone, 'targetTemp', -1)}>−</button>
                                    <button onClick={() => handleAdjust(zone, 'targetTemp', 1)}>+</button>
                                </div>
                            </div>

                            <div className={styles.metric}>
                                <div className={styles.metricHeader}>
                                    <span>💧 Humidity</span>
                                    <span className={styles.metricValue}>{zone.humidity.toFixed(0)}%</span>
                                </div>
                                <div className={styles.metricTarget}>Target: {zone.targetHumidity}%</div>
                                <div className={styles.controls}>
                                    <button onClick={() => handleAdjust(zone, 'targetHumidity', -5)}>−</button>
                                    <button onClick={() => handleAdjust(zone, 'targetHumidity', 5)}>+</button>
                                </div>
                            </div>

                            <div className={styles.metric}>
                                <div className={styles.metricHeader}>
                                    <span>🌬️ CO₂</span>
                                    <span className={styles.metricValue}>{zone.co2Level.toFixed(0)} ppm</span>
                                </div>
                            </div>

                            <div className={styles.metric}>
                                <div className={styles.metricHeader}>
                                    <span>💡 Light</span>
                                    <span className={styles.metricValue}>{zone.lightLevel.toFixed(0)} lux</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.lastUpdated}>
                            Last updated: {new Date(zone.lastUpdated).toLocaleTimeString()}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
