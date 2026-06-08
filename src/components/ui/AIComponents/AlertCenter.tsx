'use client';

import React, { useState, useEffect } from 'react';
import styles from './AIComponents.module.css';

interface Alert {
    id: string;
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    title: string;
    message: string;
    aiInsight?: string;
    actionRequired: boolean;
    createdAt: Date;
    acknowledged: boolean;
}

interface AlertCenterProps {
    farmId: string;
    maxAlerts?: number;
    onAlertClick?: (alert: Alert) => void;
}

const getAlertIcon = (type: string): string => {
    switch (type) {
        case 'WEATHER_WARNING': return '🌤️';
        case 'DISEASE_OUTBREAK': return '🦠';
        case 'HARVEST_OPTIMAL': return '🌾';
        case 'MARKET_OPPORTUNITY': return '📈';
        case 'RESOURCE_LOW': return '📦';
        case 'BATCH_ATTENTION': return '🌱';
        case 'QUALITY_ISSUE': return '✅';
        default: return '⚠️';
    }
};

export function AlertCenter({ farmId, maxAlerts = 10, onAlertClick }: AlertCenterProps) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/ai/alerts', {
                    headers: { 'X-Farm-ID': farmId }
                });

                if (response.ok) {
                    const data = await response.json();
                    setAlerts(data.alerts.map((a: any) => ({
                        ...a,
                        createdAt: new Date(a.createdAt)
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch alerts:', error);
                setAlerts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
    }, [farmId]);

    const filteredAlerts = alerts.filter(alert => {
        if (filter === 'all') return true;
        if (filter === 'critical') return alert.severity === 'CRITICAL' || alert.severity === 'HIGH';
        if (filter === 'action') return alert.actionRequired;
        return true;
    }).slice(0, maxAlerts);

    const acknowledgeAlert = async (alertId: string) => {
        try {
            await fetch('/api/ai/alerts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Farm-ID': farmId
                },
                body: JSON.stringify({ alertId })
            });
            setAlerts(prev => prev.map(a =>
                a.id === alertId ? { ...a, acknowledged: true } : a
            ));
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
        }
    };

    const criticalCount = alerts.filter(a =>
        (a.severity === 'CRITICAL' || a.severity === 'HIGH') && !a.acknowledged
    ).length;

    if (loading) {
        return (
            <div className={styles.alertCenter}>
                <div className={styles.alertHeader}>
                    <h3>⚠️ Alert Center</h3>
                </div>
                <div style={{ padding: 'var(--spacing-8)' }}>
                    <div className={styles.shimmer} style={{ height: '60px', marginBottom: 'var(--spacing-3)', borderRadius: 'var(--border-radius-lg)' }} />
                    <div className={styles.shimmer} style={{ height: '60px', marginBottom: 'var(--spacing-3)', borderRadius: 'var(--border-radius-lg)' }} />
                    <div className={styles.shimmer} style={{ height: '60px', borderRadius: 'var(--border-radius-lg)' }} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.alertCenter}>
            <div className={styles.alertHeader}>
                <h3>
                    ⚠️ Alert Center
                    {criticalCount > 0 && (
                        <span className={styles.alertBadge}>{criticalCount}</span>
                    )}
                </h3>
                <div className={styles.alertFilters}>
                    <button
                        className={`${styles.alertFilter} ${filter === 'all' ? styles.active : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`${styles.alertFilter} ${filter === 'critical' ? styles.active : ''}`}
                        onClick={() => setFilter('critical')}
                    >
                        Critical
                    </button>
                    <button
                        className={`${styles.alertFilter} ${filter === 'action' ? styles.active : ''}`}
                        onClick={() => setFilter('action')}
                    >
                        Action Required
                    </button>
                </div>
            </div>

            <div className={styles.alertList}>
                {filteredAlerts.length === 0 ? (
                    <div className={styles.alertEmpty}>
                        <div className={styles.alertEmptyIcon}>✅</div>
                        <p>No alerts at this time</p>
                    </div>
                ) : (
                    filteredAlerts.map(alert => (
                        <div
                            key={alert.id}
                            className={styles.alertItem}
                            onClick={() => onAlertClick?.(alert)}
                            style={{ opacity: alert.acknowledged ? 0.6 : 1 }}
                        >
                            <div className={`${styles.alertIcon} ${styles[alert.severity.toLowerCase()]}`}>
                                {getAlertIcon(alert.type)}
                            </div>
                            <div className={styles.alertContent}>
                                <div className={styles.alertTitle}>{alert.title}</div>
                                <div className={styles.alertMessage}>{alert.message}</div>
                                {alert.aiInsight && (
                                    <div style={{
                                        fontSize: 'var(--font-size-xs)',
                                        color: 'var(--primary-color)',
                                        marginTop: 'var(--spacing-1)'
                                    }}>
                                        💡 {alert.aiInsight}
                                    </div>
                                )}
                                <div className={styles.alertMeta}>
                                    <span className={`${styles.alertSeverity} ${styles[alert.severity.toLowerCase()]}`}>
                                        {alert.severity}
                                    </span>
                                    <span>
                                        {alert.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.alertActions}>
                                {alert.actionRequired && !alert.acknowledged && (
                                    <button
                                        className={`${styles.alertAction} ${styles.primary}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            acknowledgeAlert(alert.id);
                                        }}
                                    >
                                        Acknowledge
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
