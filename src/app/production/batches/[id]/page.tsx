'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card, Button } from '@/components/ui';
import styles from './page.module.css';

interface BatchDetails {
    id: string;
    batchNumber: string;
    variety: string;
    scientificName: string;
    quantity: number;
    unit: string;
    status: string;
    plantDate: string;
    expectedHarvestDate: string;
    actualHarvestDate?: string;
    growingZone: string;
    growingMedium: string;
    qualityGrade?: string;
    notes?: string;
    organicCompliant: boolean;
    irrigationSource: string;
    fertilizersUsed: string;
    pestControlMethods: string;
    storageConditions: string;
    createdAt: string;
    updatedAt: string;
}

export default function BatchDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const batchId = params.id as string;
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [batch, setBatch] = useState<BatchDetails | null>(null);
    const [plantScans, setPlantScans] = useState<Array<{
        id: string;
        timestamp: string;
        diagnosis?: string;
        severity?: string;
        confidence?: number;
        overallHealth?: number;
        aiModel?: string;
    }>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthLoading && isAuthenticated && currentFarm && batchId) {
            loadBatchDetails();
        }
    }, [isAuthLoading, isAuthenticated, currentFarm, batchId]);

    const loadBatchDetails = async () => {
        if (!currentFarm?.id || !batchId) return;
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/batches?limit=200`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Farm-ID': currentFarm.id,
                },
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const foundBatch = data.data.find((b: any) => b.id === batchId);
                if (foundBatch) {
                    setBatch({
                        id: foundBatch.id,
                        batchNumber: foundBatch.batchNumber,
                        variety: foundBatch.seed_varieties?.name || 'Unknown',
                        scientificName: foundBatch.seed_varieties?.scientificName || '',
                        quantity: foundBatch.quantity,
                        unit: foundBatch.unit,
                        status: foundBatch.status,
                        plantDate: foundBatch.plantDate,
                        expectedHarvestDate: foundBatch.expectedHarvestDate,
                        actualHarvestDate: foundBatch.actualHarvestDate,
                        growingZone: foundBatch.growingZone || 'Not specified',
                        growingMedium: foundBatch.growingMedium || 'Not specified',
                        qualityGrade: foundBatch.qualityGrade,
                        notes: foundBatch.notes,
                        organicCompliant: foundBatch.organicCompliant || false,
                        irrigationSource: foundBatch.irrigationSource || 'Not specified',
                        fertilizersUsed: foundBatch.fertilizersUsed || 'None',
                        pestControlMethods: foundBatch.pestControlMethods || 'None',
                        storageConditions: foundBatch.storageConditions || 'Not specified',
                        createdAt: foundBatch.createdAt,
                        updatedAt: foundBatch.updatedAt
                    });
                } else {
                    setError('Batch not found');
                }

                const scanResponse = await fetch(
                    `/api/ai/crop-analysis/history?batchId=${batchId}&days=180`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Farm-ID': currentFarm.id,
                        },
                        credentials: 'include',
                    }
                );
                if (scanResponse.ok) {
                    const scanData = await scanResponse.json();
                    setPlantScans(scanData.history || []);
                }
            } else {
                setError(data.error || 'Failed to load batch');
            }
        } catch (err) {
            console.error('Error loading batch:', err);
            setError('Failed to load batch details');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'GROWING': return '#3b82f6';
            case 'READY_TO_HARVEST': return '#f59e0b';
            case 'HARVESTED': return '#10b981';
            case 'PROCESSING': return '#8b5cf6';
            case 'PACKAGED': return '#06b6d4';
            case 'STORED': return '#22c55e';
            default: return '#6b7280';
        }
    };

    if (loading || isAuthLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <p>Loading batch details...</p>
                </div>
            </div>
        );
    }

    if (error || !batch) {
        return (
            <div className={styles.container}>
                <div className={styles.errorState}>
                    <h2>❌ {error || 'Batch not found'}</h2>
                    <Button variant="secondary" onClick={() => router.back()}>
                        ← Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Button variant="secondary" onClick={() => router.back()}>
                        ← Back
                    </Button>
                    <div className={styles.titleSection}>
                        <h1 className={styles.title}>{batch.batchNumber}</h1>
                        <p className={styles.subtitle}>{batch.variety} ({batch.scientificName})</p>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <Button
                        variant="primary"
                        onClick={() => router.push(`/mobile/plant-scan?batchId=${batch.id}`)}
                    >
                        📷 Plant Vision Scan
                    </Button>
                    <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: getStatusColor(batch.status) }}
                    >
                        {batch.status}
                    </span>
                </div>
            </div>

            <div className={styles.grid}>
                <Card className={styles.card}>
                    <h3 className={styles.cardTitle}>📊 Batch Information</h3>
                    <div className={styles.detailGrid}>
                        <div className={styles.detail}>
                            <span className={styles.label}>Quantity</span>
                            <span className={styles.value}>{batch.quantity} {batch.unit}</span>
                        </div>
                        <div className={styles.detail}>
                            <span className={styles.label}>Quality Grade</span>
                            <span className={styles.value}>{batch.qualityGrade || 'Not graded'}</span>
                        </div>
                        <div className={styles.detail}>
                            <span className={styles.label}>Growing Zone</span>
                            <span className={styles.value}>{batch.growingZone}</span>
                        </div>
                        <div className={styles.detail}>
                            <span className={styles.label}>Growing Medium</span>
                            <span className={styles.value}>{batch.growingMedium}</span>
                        </div>
                    </div>
                </Card>

                <Card className={styles.card}>
                    <h3 className={styles.cardTitle}>📅 Timeline</h3>
                    <div className={styles.detailGrid}>
                        <div className={styles.detail}>
                            <span className={styles.label}>Plant Date</span>
                            <span className={styles.value}>{formatDate(batch.plantDate)}</span>
                        </div>
                        <div className={styles.detail}>
                            <span className={styles.label}>Expected Harvest</span>
                            <span className={styles.value}>{formatDate(batch.expectedHarvestDate)}</span>
                        </div>
                        {batch.actualHarvestDate && (
                            <div className={styles.detail}>
                                <span className={styles.label}>Actual Harvest</span>
                                <span className={styles.value}>{formatDate(batch.actualHarvestDate)}</span>
                            </div>
                        )}
                        <div className={styles.detail}>
                            <span className={styles.label}>Last Updated</span>
                            <span className={styles.value}>{formatDate(batch.updatedAt)}</span>
                        </div>
                    </div>
                </Card>

                <Card className={styles.card}>
                    <h3 className={styles.cardTitle}>🌱 Organic Compliance</h3>
                    <div className={styles.detailGrid}>
                        <div className={styles.detail}>
                            <span className={styles.label}>Organic Compliant</span>
                            <span className={styles.value}>{batch.organicCompliant ? '✅ Yes' : '❌ No'}</span>
                        </div>
                        <div className={styles.detail}>
                            <span className={styles.label}>Irrigation Source</span>
                            <span className={styles.value}>{batch.irrigationSource}</span>
                        </div>
                        <div className={styles.detail}>
                            <span className={styles.label}>Fertilizers Used</span>
                            <span className={styles.value}>{batch.fertilizersUsed}</span>
                        </div>
                        <div className={styles.detail}>
                            <span className={styles.label}>Pest Control</span>
                            <span className={styles.value}>{batch.pestControlMethods}</span>
                        </div>
                    </div>
                </Card>

                <Card className={styles.card}>
                    <h3 className={styles.cardTitle}>📷 Plant Vision History</h3>
                    {plantScans.length === 0 ? (
                        <p className={styles.emptyScans}>
                            No plant scans linked to this batch yet. Use Plant Vision Scan to capture field health data for traceability.
                        </p>
                    ) : (
                        <ul className={styles.scanList}>
                            {plantScans.map((scan) => (
                                <li key={scan.id} className={styles.scanItem}>
                                    <div>
                                        <strong>{String(scan.diagnosis || 'Plant scan')}</strong>
                                        <span className={styles.scanMeta}>
                                            {new Date(scan.timestamp).toLocaleString()}
                                            {scan.severity ? ` · ${scan.severity}` : ''}
                                            {typeof scan.confidence === 'number'
                                                ? ` · ${Math.round(scan.confidence * 100)}%`
                                                : ''}
                                        </span>
                                    </div>
                                    {scan.aiModel && (
                                        <span className={styles.scanModel}>{scan.aiModel}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card className={styles.card}>
                    <h3 className={styles.cardTitle}>📦 Storage & Handling</h3>
                    <div className={styles.detailGrid}>
                        <div className={styles.detail}>
                            <span className={styles.label}>Storage Conditions</span>
                            <span className={styles.value}>{batch.storageConditions}</span>
                        </div>
                    </div>
                    {batch.notes && (
                        <div className={styles.notes}>
                            <span className={styles.label}>Notes</span>
                            <p>{batch.notes}</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
