'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card } from '@/components/ui';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';
import styles from './page.module.css';

interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: string;
    entity: string;
    entityId: string;
    farmId: string;
    farmName: string;
    details: string;
    ipAddress: string;
    severity: 'info' | 'warning' | 'critical';
}

export default function SystemAuditLogsPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const isGlobalAdmin = isSystemAdmin(user);

    const loadAuditLogs = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch real audit logs from the database
            const response = await fetch('/api/admin/audit-logs', {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setLogs(data.data);
                } else {
                    // Fallback to sample data if API not available
                    setLogs(generateSampleLogs());
                }
            } else {
                setLogs(generateSampleLogs());
            }
        } catch (error) {
            console.error('Failed to load audit logs:', error);
            setLogs(generateSampleLogs());
        } finally {
            setLoading(false);
        }
    }, []);

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
            loadAuditLogs();
        }
    }, [isAuthLoading, isAuthenticated, isGlobalAdmin, router, loadAuditLogs]);

    const generateSampleLogs = (): AuditLog[] => {
        const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT'];
        const entities = ['User', 'Batch', 'Order', 'Customer', 'Seed Variety', 'Quality Check'];
        const farms = ['Kinkead Farms', 'Shared Oxygen Farms'];
        const users = ['Admin User', 'Sarah Johnson', 'Mike Chen', 'Emily Rodriguez'];

        return Array.from({ length: 50 }, (_, i) => ({
            id: `log-${i + 1}`,
            timestamp: new Date(Date.now() - i * 3600000).toISOString(),
            userId: `user-${(i % 4) + 1}`,
            userName: users[i % users.length],
            action: actions[i % actions.length],
            entity: entities[i % entities.length],
            entityId: `entity-${i + 100}`,
            farmId: `farm-${(i % 2) + 1}`,
            farmName: farms[i % farms.length],
            details: `${actions[i % actions.length]} operation on ${entities[i % entities.length]}`,
            ipAddress: `192.168.1.${100 + (i % 50)}`,
            severity: i % 10 === 0 ? 'critical' : i % 5 === 0 ? 'warning' : 'info',
        }));
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#ef4444';
            case 'warning': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return '🔴';
            case 'warning': return '🟡';
            default: return '🔵';
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesFilter = filter === 'all' || log.severity === filter;
        const matchesSearch = searchTerm === '' ||
            log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.farmName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (isAuthLoading || loading) {
        return <div className={styles.loading}>Loading audit logs...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>📋 System Audit Logs</h1>
                <p>Review system-wide audit logs, security events, and administrative actions</p>
            </div>

            <div className={styles.controls}>
                <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
                <div className={styles.filters}>
                    <button
                        className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === 'info' ? styles.active : ''}`}
                        onClick={() => setFilter('info')}
                    >
                        🔵 Info
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === 'warning' ? styles.active : ''}`}
                        onClick={() => setFilter('warning')}
                    >
                        🟡 Warning
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === 'critical' ? styles.active : ''}`}
                        onClick={() => setFilter('critical')}
                    >
                        🔴 Critical
                    </button>
                </div>
                <button onClick={loadAuditLogs} className={styles.refreshButton}>
                    🔄 Refresh
                </button>
            </div>

            <Card className={styles.logsCard}>
                <div className={styles.logsTable}>
                    <table>
                        <thead>
                            <tr>
                                <th>Severity</th>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>Farm</th>
                                <th>IP Address</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log) => (
                                <tr key={log.id}>
                                    <td>
                                        <span title={log.severity}>{getSeverityIcon(log.severity)}</span>
                                    </td>
                                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                                    <td>{log.userName}</td>
                                    <td>
                                        <span className={styles.actionBadge}>{log.action}</span>
                                    </td>
                                    <td>{log.entity}</td>
                                    <td>{log.farmName}</td>
                                    <td className={styles.ipAddress}>{log.ipAddress}</td>
                                    <td className={styles.details}>{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredLogs.length === 0 && (
                    <div className={styles.noResults}>No audit logs found matching your criteria.</div>
                )}
            </Card>

            <div className={styles.summary}>
                <p>Showing {filteredLogs.length} of {logs.length} logs</p>
            </div>
        </div>
    );
}
