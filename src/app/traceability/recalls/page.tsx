'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from '../page.module.css';
import { Card, Button } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';

interface RecallItem {
    id: string;
    entityType: string;
    entityId: string;
    quantity: number;
    unit: string;
    status: string;
    notes: string;
}

interface RecallCase {
    id: string;
    recallNumber: string;
    status: string;
    reason: string;
    scope: string;
    initiatedAt: string;
    notes: string;
    items: RecallItem[];
}

export default function RecallManagementPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [recalls, setRecalls] = useState<RecallCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecall, setSelectedRecall] = useState<RecallCase | null>(null);

    const fetchRecalls = useCallback(async () => {
        if (!currentFarm?.id) return;
        try {
            setLoading(true);
            const response = await fetch('/api/traceability/recalls', {
                headers: { 'X-Farm-ID': currentFarm.id },
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setRecalls(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching recalls:', error);
        } finally {
            setLoading(false);
        }
    }, [currentFarm?.id]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/signin');
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        fetchRecalls();
    }, [fetchRecalls]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CLOSED': return '#22c55e';
            case 'IN_PROGRESS': return '#f59e0b';
            case 'OPEN': return '#ef4444';
            default: return '#6b7280';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>⚠️ Recall Management</h1>
                    <p>Initiate, track, and document recalls with full traceability.</p>
                </div>
                <Button variant="secondary" onClick={fetchRecalls}>🔄 Refresh</Button>
            </div>

            {/* Recall Statistics */}
            <div className={styles.statsGrid}>
                <Card className={styles.statCard}>
                    <div className={styles.statValue}>{recalls.length}</div>
                    <div className={styles.statLabel}>Total Recalls</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: '#ef4444' }}>
                        {recalls.filter(r => r.status === 'OPEN').length}
                    </div>
                    <div className={styles.statLabel}>Open</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: '#f59e0b' }}>
                        {recalls.filter(r => r.status === 'IN_PROGRESS').length}
                    </div>
                    <div className={styles.statLabel}>In Progress</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statValue} style={{ color: '#22c55e' }}>
                        {recalls.filter(r => r.status === 'CLOSED').length}
                    </div>
                    <div className={styles.statLabel}>Closed</div>
                </Card>
            </div>

            {/* Active Recalls List */}
            <Card className={styles.recallsCard}>
                <h3>Recall Cases</h3>
                {loading ? (
                    <p>Loading recalls...</p>
                ) : recalls.length === 0 ? (
                    <p>No recall cases found.</p>
                ) : (
                    <div className={styles.recallsList}>
                        {recalls.map(recall => (
                            <div
                                key={recall.id}
                                className={`${styles.recallItem} ${selectedRecall?.id === recall.id ? styles.selected : ''}`}
                                onClick={() => setSelectedRecall(recall)}
                            >
                                <div className={styles.recallHeader}>
                                    <span className={styles.recallNumber}>{recall.recallNumber}</span>
                                    <span
                                        className={styles.recallStatus}
                                        style={{ backgroundColor: getStatusColor(recall.status), color: 'white' }}
                                    >
                                        {recall.status}
                                    </span>
                                </div>
                                <p className={styles.recallReason}>{recall.reason}</p>
                                <div className={styles.recallMeta}>
                                    <span>Scope: {recall.scope}</span>
                                    <span>Items: {recall.items?.length || 0}</span>
                                    <span>Initiated: {new Date(recall.initiatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Selected Recall Details */}
            {selectedRecall && (
                <Card className={styles.recallDetails}>
                    <h3>Recall Details: {selectedRecall.recallNumber}</h3>
                    <div className={styles.detailsGrid}>
                        <div className={styles.detailItem}>
                            <strong>Status:</strong> {selectedRecall.status}
                        </div>
                        <div className={styles.detailItem}>
                            <strong>Scope:</strong> {selectedRecall.scope}
                        </div>
                        <div className={styles.detailItem}>
                            <strong>Initiated:</strong> {new Date(selectedRecall.initiatedAt).toLocaleString()}
                        </div>
                    </div>
                    <div className={styles.detailSection}>
                        <strong>Reason:</strong>
                        <p>{selectedRecall.reason}</p>
                    </div>
                    <div className={styles.detailSection}>
                        <strong>Notes:</strong>
                        <p>{selectedRecall.notes}</p>
                    </div>
                    {selectedRecall.items && selectedRecall.items.length > 0 && (
                        <div className={styles.detailSection}>
                            <strong>Affected Items:</strong>
                            <table className={styles.itemsTable}>
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Quantity</th>
                                        <th>Status</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedRecall.items.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.entityType}</td>
                                            <td>{item.quantity} {item.unit}</td>
                                            <td>{item.status}</td>
                                            <td>{item.notes}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {/* How Recalls Work */}
            <Card className={styles.instructionsCard}>
                <h3>How Recalls Work</h3>
                <div className={styles.instructions}>
                    <div className={styles.instructionItem}>
                        <h4>Identify Affected Lots</h4>
                        <p>Use seed-to-sale and lot tracking to identify all affected product.</p>
                        <ul>
                            <li>Trace upstream to seeds, inputs, and batches</li>
                            <li>Trace downstream to orders and customers</li>
                        </ul>
                    </div>
                    <div className={styles.instructionItem}>
                        <h4>Notify Stakeholders</h4>
                        <p>Generate notification lists for internal teams and customers.</p>
                        <ul>
                            <li>Export CSV with contacts and orders</li>
                            <li>Attach evidence and CAPA documentation</li>
                        </ul>
                    </div>
                    <div className={styles.instructionItem}>
                        <h4>Remediate and Close</h4>
                        <p>Document remediation steps and close the recall with a supervisor sign‑off.</p>
                        <ul>
                            <li>Track product returns and disposals</li>
                            <li>Maintain permanent audit trail</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
}


