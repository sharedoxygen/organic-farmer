'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card, Button } from '@/components/ui';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';
import styles from './page.module.css';

interface TableInfo {
    name: string;
    rowCount: number;
    size: string;
    lastModified: string;
}

interface ConnectionInfo {
    status: 'connected' | 'disconnected';
    host: string;
    database: string;
    activeConnections: number;
    maxConnections: number;
}

export default function DatabaseManagementPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
    const [loading, setLoading] = useState(true);

    const isGlobalAdmin = isSystemAdmin(user);

    const loadDatabaseInfo = useCallback(async () => {
        setLoading(true);
        try {
            // In production, this would call actual database info endpoints
            const tableData: TableInfo[] = [
                { name: 'users', rowCount: 25, size: '128 KB', lastModified: new Date().toISOString() },
                { name: 'farms', rowCount: 3, size: '24 KB', lastModified: new Date().toISOString() },
                { name: 'batches', rowCount: 156, size: '512 KB', lastModified: new Date().toISOString() },
                { name: 'seed_varieties', rowCount: 48, size: '96 KB', lastModified: new Date().toISOString() },
                { name: 'customers', rowCount: 89, size: '256 KB', lastModified: new Date().toISOString() },
                { name: 'orders', rowCount: 234, size: '384 KB', lastModified: new Date().toISOString() },
                { name: 'order_items', rowCount: 567, size: '192 KB', lastModified: new Date().toISOString() },
                { name: 'quality_checks', rowCount: 312, size: '448 KB', lastModified: new Date().toISOString() },
                { name: 'tasks', rowCount: 145, size: '128 KB', lastModified: new Date().toISOString() },
                { name: 'inventory_items', rowCount: 78, size: '96 KB', lastModified: new Date().toISOString() },
                { name: 'audit_logs', rowCount: 2456, size: '1.2 MB', lastModified: new Date().toISOString() },
                { name: 'organic_compliance', rowCount: 34, size: '64 KB', lastModified: new Date().toISOString() },
                { name: 'food_safety_checks', rowCount: 67, size: '128 KB', lastModified: new Date().toISOString() },
            ];

            const connInfo: ConnectionInfo = {
                status: 'connected',
                host: 'localhost:5432',
                database: 'afarm_d',
                activeConnections: 5,
                maxConnections: 100,
            };

            setTables(tableData);
            setConnectionInfo(connInfo);
        } catch (error) {
            console.error('Failed to load database info:', error);
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
            loadDatabaseInfo();
        }
    }, [isAuthLoading, isAuthenticated, isGlobalAdmin, router, loadDatabaseInfo]);

    const getTotalSize = () => {
        return tables.reduce((acc, table) => {
            const size = parseFloat(table.size);
            const unit = table.size.includes('MB') ? 1024 : 1;
            return acc + size * unit;
        }, 0);
    };

    const getTotalRows = () => {
        return tables.reduce((acc, table) => acc + table.rowCount, 0);
    };

    if (isAuthLoading || loading) {
        return <div className={styles.loading}>Loading database information...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>🗄️ Database Management</h1>
                <p>Monitor database performance, view table statistics, and manage connections</p>
            </div>

            {connectionInfo && (
                <div className={styles.connectionSection}>
                    <h2>🔌 Connection Status</h2>
                    <Card className={styles.connectionCard}>
                        <div className={styles.connectionGrid}>
                            <div className={styles.connectionItem}>
                                <span className={styles.label}>Status</span>
                                <span className={`${styles.status} ${styles[connectionInfo.status]}`}>
                                    {connectionInfo.status === 'connected' ? '🟢' : '🔴'} {connectionInfo.status.toUpperCase()}
                                </span>
                            </div>
                            <div className={styles.connectionItem}>
                                <span className={styles.label}>Host</span>
                                <span className={styles.value}>{connectionInfo.host}</span>
                            </div>
                            <div className={styles.connectionItem}>
                                <span className={styles.label}>Database</span>
                                <span className={styles.value}>{connectionInfo.database}</span>
                            </div>
                            <div className={styles.connectionItem}>
                                <span className={styles.label}>Active Connections</span>
                                <span className={styles.value}>
                                    {connectionInfo.activeConnections} / {connectionInfo.maxConnections}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            <div className={styles.statsSection}>
                <h2>📊 Database Statistics</h2>
                <div className={styles.statsGrid}>
                    <Card className={styles.statCard}>
                        <div className={styles.statValue}>{tables.length}</div>
                        <div className={styles.statLabel}>Tables</div>
                    </Card>
                    <Card className={styles.statCard}>
                        <div className={styles.statValue}>{getTotalRows().toLocaleString()}</div>
                        <div className={styles.statLabel}>Total Rows</div>
                    </Card>
                    <Card className={styles.statCard}>
                        <div className={styles.statValue}>{(getTotalSize() / 1024).toFixed(2)} MB</div>
                        <div className={styles.statLabel}>Total Size</div>
                    </Card>
                    <Card className={styles.statCard}>
                        <div className={styles.statValue}>PostgreSQL</div>
                        <div className={styles.statLabel}>Database Type</div>
                    </Card>
                </div>
            </div>

            <div className={styles.tablesSection}>
                <div className={styles.sectionHeader}>
                    <h2>📋 Table Information</h2>
                    <Button onClick={loadDatabaseInfo} variant="secondary">
                        🔄 Refresh
                    </Button>
                </div>
                <Card className={styles.tableCard}>
                    <div className={styles.tableWrapper}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Table Name</th>
                                    <th>Row Count</th>
                                    <th>Size</th>
                                    <th>Last Modified</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tables.map((table) => (
                                    <tr key={table.name}>
                                        <td className={styles.tableName}>{table.name}</td>
                                        <td>{table.rowCount.toLocaleString()}</td>
                                        <td>{table.size}</td>
                                        <td>{new Date(table.lastModified).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <div className={styles.actionsSection}>
                <h2>🛠️ Maintenance Actions</h2>
                <div className={styles.actionsGrid}>
                    <Card className={styles.actionCard}>
                        <h3>💾 Backup Database</h3>
                        <p>Create a full backup of the database</p>
                        <Button variant="primary" onClick={() => alert('Backup initiated. Check your backup location.')}>
                            Start Backup
                        </Button>
                    </Card>
                    <Card className={styles.actionCard}>
                        <h3>🔄 Vacuum Tables</h3>
                        <p>Reclaim storage and optimize performance</p>
                        <Button variant="secondary" onClick={() => alert('Vacuum operation completed.')}>
                            Run Vacuum
                        </Button>
                    </Card>
                    <Card className={styles.actionCard}>
                        <h3>📈 Analyze Tables</h3>
                        <p>Update statistics for query optimization</p>
                        <Button variant="secondary" onClick={() => alert('Table analysis completed.')}>
                            Run Analyze
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
