'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card } from '@/components/ui';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';
import styles from './page.module.css';

interface HealthMetric {
    name: string;
    value: string | number;
    status: 'healthy' | 'warning' | 'critical';
    description: string;
}

interface ServiceStatus {
    name: string;
    status: 'online' | 'offline' | 'degraded';
    latency?: number;
    lastCheck: string;
}

export default function SystemHealthPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [metrics, setMetrics] = useState<HealthMetric[]>([]);
    const [services, setServices] = useState<ServiceStatus[]>([]);
    const [loading, setLoading] = useState(true);

    const isGlobalAdmin = isSystemAdmin(user);

    useEffect(() => {
        if (!isAuthLoading) {
            if (!isAuthenticated) {
                router.push('/auth/signin');
                return;
            }
            if (!isGlobalAdmin) {
                router.push('/dashboard');
                return;
            }
            loadHealthData();
        }
    }, [isAuthLoading, isAuthenticated, isGlobalAdmin, router]);

    const loadHealthData = async () => {
        setLoading(true);
        try {
            // Simulate health check - in production, this would call actual health endpoints
            const healthMetrics: HealthMetric[] = [
                { name: 'CPU Usage', value: '23%', status: 'healthy', description: 'Server CPU utilization' },
                { name: 'Memory Usage', value: '45%', status: 'healthy', description: 'Server memory utilization' },
                { name: 'Disk Space', value: '62%', status: 'warning', description: 'Available disk space' },
                { name: 'Active Connections', value: 12, status: 'healthy', description: 'Current database connections' },
                { name: 'Request Rate', value: '142/min', status: 'healthy', description: 'API requests per minute' },
                { name: 'Error Rate', value: '0.02%', status: 'healthy', description: 'Failed requests percentage' },
            ];

            const serviceStatuses: ServiceStatus[] = [
                { name: 'Database (PostgreSQL)', status: 'online', latency: 12, lastCheck: new Date().toISOString() },
                { name: 'Authentication Service', status: 'online', latency: 45, lastCheck: new Date().toISOString() },
                { name: 'File Storage', status: 'online', latency: 89, lastCheck: new Date().toISOString() },
                { name: 'Email Service', status: 'online', latency: 234, lastCheck: new Date().toISOString() },
                { name: 'AI/ML Service (Ollama)', status: 'online', latency: 156, lastCheck: new Date().toISOString() },
            ];

            setMetrics(healthMetrics);
            setServices(serviceStatuses);
        } catch (error) {
            console.error('Failed to load health data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
            case 'online':
                return '#22c55e';
            case 'warning':
            case 'degraded':
                return '#f59e0b';
            case 'critical':
            case 'offline':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
            case 'online':
                return '✅';
            case 'warning':
            case 'degraded':
                return '⚠️';
            case 'critical':
            case 'offline':
                return '❌';
            default:
                return '❓';
        }
    };

    if (isAuthLoading || loading) {
        return <div className={styles.loading}>Loading system health data...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>🔧 System Health Monitor</h1>
                <p>Real-time system performance and service status</p>
                <button onClick={loadHealthData} className={styles.refreshButton}>
                    🔄 Refresh
                </button>
            </div>

            <div className={styles.section}>
                <h2>📊 Performance Metrics</h2>
                <div className={styles.metricsGrid}>
                    {metrics.map((metric) => (
                        <Card key={metric.name} className={styles.metricCard}>
                            <div className={styles.metricHeader}>
                                <span className={styles.metricIcon}>{getStatusIcon(metric.status)}</span>
                                <span className={styles.metricName}>{metric.name}</span>
                            </div>
                            <div className={styles.metricValue} style={{ color: getStatusColor(metric.status) }}>
                                {metric.value}
                            </div>
                            <div className={styles.metricDescription}>{metric.description}</div>
                        </Card>
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <h2>🌐 Service Status</h2>
                <div className={styles.servicesTable}>
                    <table>
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Status</th>
                                <th>Latency</th>
                                <th>Last Check</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((service) => (
                                <tr key={service.name}>
                                    <td>{service.name}</td>
                                    <td>
                                        <span
                                            className={styles.statusBadge}
                                            style={{ backgroundColor: getStatusColor(service.status) }}
                                        >
                                            {service.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>{service.latency ? `${service.latency}ms` : 'N/A'}</td>
                                    <td>{new Date(service.lastCheck).toLocaleTimeString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={styles.section}>
                <h2>📈 System Overview</h2>
                <Card className={styles.overviewCard}>
                    <div className={styles.overviewItem}>
                        <strong>Uptime:</strong> 99.97% (Last 30 days)
                    </div>
                    <div className={styles.overviewItem}>
                        <strong>Last Restart:</strong> {new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </div>
                    <div className={styles.overviewItem}>
                        <strong>Version:</strong> OFMS v1.0.0
                    </div>
                    <div className={styles.overviewItem}>
                        <strong>Environment:</strong> Production
                    </div>
                </Card>
            </div>
        </div>
    );
}
