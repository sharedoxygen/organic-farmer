'use client';

import styles from '../page.module.css';
import { Card, Button } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { useEffect, useState, useCallback } from 'react';

interface CustodyEvent {
    id: string;
    entityType: string;
    entityId: string;
    stage: string;
    timestamp: string;
    performedBy: string;
    location: string;
    notes: string;
    signature: string;
}

export default function ChainOfCustodyPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [custodyEvents, setCustodyEvents] = useState<CustodyEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCustodyEvents = useCallback(async () => {
        if (!currentFarm?.id) return;
        try {
            setLoading(true);
            const response = await fetch('/api/traceability/custody', {
                headers: { 'X-Farm-ID': currentFarm.id },
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setCustodyEvents(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching custody events:', error);
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
        fetchCustodyEvents();
    }, [fetchCustodyEvents]);

    // Group events by entity
    const eventsByEntity = custodyEvents.reduce((acc, event) => {
        const key = `${event.entityType}-${event.entityId}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(event);
        return acc;
    }, {} as Record<string, CustodyEvent[]>);

    const getStageIcon = (stage: string) => {
        switch (stage) {
            case 'HARVEST': return '🌿';
            case 'DRYING': return '💨';
            case 'TRIMMING': return '✂️';
            case 'CURING': return '🫙';
            case 'TESTING': return '🔬';
            case 'PACKAGING': return '📦';
            case 'VAULT_STORAGE': return '🔐';
            case 'DISTRIBUTION': return '🚚';
            default: return '📋';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>📋 Chain of Custody</h1>
                    <p>Track every handoff from harvest to consumer with signatures and timestamps.</p>
                </div>
                <Button variant="secondary" onClick={fetchCustodyEvents}>🔄 Refresh</Button>
            </div>

            {/* Custody Statistics */}
            <div className={styles.statsGrid}>
                <Card className={styles.statCard}>
                    <div className={styles.statValue}>{custodyEvents.length}</div>
                    <div className={styles.statLabel}>Total Events</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statValue}>{Object.keys(eventsByEntity).length}</div>
                    <div className={styles.statLabel}>Tracked Batches</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statValue}>
                        {custodyEvents.filter(e => e.stage === 'DISTRIBUTION').length}
                    </div>
                    <div className={styles.statLabel}>Distributed</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statValue}>
                        {new Set(custodyEvents.map(e => e.location)).size}
                    </div>
                    <div className={styles.statLabel}>Locations</div>
                </Card>
            </div>

            {/* Recent Custody Events */}
            <Card className={styles.eventsCard}>
                <h3>Recent Custody Events</h3>
                {loading ? (
                    <p>Loading custody events...</p>
                ) : custodyEvents.length === 0 ? (
                    <p>No custody events recorded.</p>
                ) : (
                    <table className={styles.eventsTable}>
                        <thead>
                            <tr>
                                <th>Stage</th>
                                <th>Entity</th>
                                <th>Location</th>
                                <th>Performed By</th>
                                <th>Timestamp</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {custodyEvents.slice(0, 20).map(event => (
                                <tr key={event.id}>
                                    <td>
                                        <span className={styles.stageTag}>
                                            {getStageIcon(event.stage)} {event.stage}
                                        </span>
                                    </td>
                                    <td>{event.entityType}: {event.entityId.slice(0, 8)}...</td>
                                    <td>{event.location}</td>
                                    <td>{event.performedBy}</td>
                                    <td>{new Date(event.timestamp).toLocaleString()}</td>
                                    <td className={styles.notesCell}>{event.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>

            <Card className={styles.chainCard}>
                <h3>Standard Custody Timeline</h3>
                <div className={styles.chainTimeline}>
                    <div className={styles.chainStage}>
                        <div className={styles.stageNumber}>1</div>
                        <div className={styles.stageContent}>
                            <div className={styles.stageHeader}>
                                <h4>Harvest</h4>
                                <span className={styles.stageDate}>Timestamp • Operator Signature</span>
                            </div>
                            <p className={styles.stageAction}>Batch harvested and recorded with weight and humidity.</p>
                            <div className={styles.stageDetails}>
                                <span>Batch ID</span>
                                <span>Lot Number</span>
                                <span>Room/Zone</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.chainStage}>
                        <div className={styles.stageNumber}>2</div>
                        <div className={styles.stageContent}>
                            <div className={styles.stageHeader}>
                                <h4>Post‑Harvest Handling</h4>
                                <span className={styles.stageDate}>Timestamp • Supervisor Signature</span>
                            </div>
                            <p className={styles.stageAction}>Drying/curing/packaging with QC checks and labels applied.</p>
                            <div className={styles.stageDetails}>
                                <span>QC Result</span>
                                <span>Package IDs</span>
                                <span>Weights</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.chainStage}>
                        <div className={styles.stageNumber}>3</div>
                        <div className={styles.stageContent}>
                            <div className={styles.stageHeader}>
                                <h4>Distribution</h4>
                                <span className={styles.stageDate}>Timestamp • Driver Signature</span>
                            </div>
                            <p className={styles.stageAction}>Packages transferred to delivery with manifest and temperature log.</p>
                            <div className={styles.stageDetails}>
                                <span>Manifest ID</span>
                                <span>Vehicle</span>
                                <span>Route</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.chainStage}>
                        <div className={styles.stageNumber}>4</div>
                        <div className={styles.stageContent}>
                            <div className={styles.stageHeader}>
                                <h4>Customer Receipt</h4>
                                <span className={styles.stageDate}>Timestamp • Customer Signature</span>
                            </div>
                            <p className={styles.stageAction}>Order delivered and verified. Chain of custody closed.</p>
                            <div className={styles.stageDocuments}>
                                <strong>Documents:</strong> COA, Manifest, Delivery Receipt
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}


