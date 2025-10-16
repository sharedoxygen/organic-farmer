'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card } from '@/components/ui';
import styles from './page.module.css';

interface LotRecord {
    id: string;
    lotNumber: string;
    variety: string;
    quantity: number;
    unit: string;
    status: 'active' | 'processed' | 'shipped' | 'recalled';
    plantDate: string;
    harvestDate?: string;
    processingDate?: string;
    shippingDate?: string;
    batchNumber: string;
    zone: string;
    seedLot: string;
    qualityGrade: 'A' | 'B' | 'C' | 'Rejected';
    customerOrders: string[];
    traceabilityChain: TraceabilityStep[];
}

interface TraceabilityStep {
    id: string;
    timestamp: string;
    action: string;
    location: string;
    performedBy: string;
    notes?: string;
}

export default function LotTrackingPage() {
    const [lots, setLots] = useState<LotRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLot, setSelectedLot] = useState<LotRecord | null>(null);
    const [showTraceability, setShowTraceability] = useState(false);
    const { currentFarm } = useTenant();

    useEffect(() => {
        const loadLotData = async () => {
            try {
                if (!currentFarm?.id) return;
                const headers: Record<string, string> = { 'X-Farm-ID': currentFarm.id };
                const userData = typeof window !== 'undefined' ? localStorage.getItem('ofms_user') : null;
                if (userData) {
                    const u = JSON.parse(userData);
                    if (u?.id) headers['Authorization'] = `Bearer ${u.id}`;
                }
                // Fetch batches to create lot tracking records
                const response = await fetch('/api/batches?limit=200', { headers });
                const data = await response.json();

                if (response.ok && data.success) {
                    // Transform batches into lot records
                    const lotRecords: LotRecord[] = data.data.map((batch: any) => ({
                        id: batch.id,
                        lotNumber: batch.batchNumber,
                        variety: batch.seed_varieties?.scientificName || batch.seed_varieties?.name || 'Unknown',
                        quantity: Number(batch.quantity || batch.expectedYield || 0),
                        unit: batch.unit || 'trays',
                        status: ((): LotRecord['status'] => {
                            if (batch.status === 'HARVESTED') return 'processed';
                            if (batch.status === 'READY_TO_HARVEST') return 'processed';
                            if (batch.status === 'GROWING') return 'active';
                            return 'active';
                        })(),
                        plantDate: batch.plantDate || new Date().toISOString(),
                        harvestDate: batch.actualHarvestDate || undefined,
                        batchNumber: batch.batchNumber,
                        zone: batch.growingZone || 'Unknown',
                        seedLot: `SEED-${batch.seedVarietyId || batch.id}`,
                        qualityGrade: 'A',
                        customerOrders: [],
                        traceabilityChain: []
                    }));

                    setLots(lotRecords);
                } else {
                    console.error('Failed to load lot data:', data.error);
                    setLots([]);
                }
            } catch (error) {
                console.error('Error loading lot records:', error);
                setLots([]);
            } finally {
                setLoading(false);
            }
        };

        loadLotData();
    }, [currentFarm?.id]);

    const getStatusColor = (status: LotRecord['status']) => {
        switch (status) {
            case 'active': return '#3b82f6';
            case 'processed': return '#f59e0b';
            case 'shipped': return '#22c55e';
            case 'recalled': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getGradeColor = (grade: LotRecord['qualityGrade']) => {
        switch (grade) {
            case 'A': return '#22c55e';
            case 'B': return '#3b82f6';
            case 'C': return '#f59e0b';
            case 'Rejected': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const openTraceability = (lot: LotRecord) => {
        setSelectedLot(lot);
        setShowTraceability(true);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading lot tracking data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>🏷️ Lot Tracking</h1>
                <p className={styles.subtitle}>
                    Track individual lots through the complete production chain
                </p>
            </div>

            <div className={styles.lotsGrid}>
                {lots.map((lot) => (
                    <Card key={lot.id} className={styles.lotCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.lotInfo}>
                                <h3 className={styles.lotNumber}>{lot.lotNumber}</h3>
                                <p className={styles.variety}>{lot.variety}</p>
                                <p className={styles.batch}>Batch: {lot.batchNumber}</p>
                            </div>
                            <div className={styles.badges}>
                                <div
                                    className={styles.statusBadge}
                                    style={{
                                        color: getStatusColor(lot.status),
                                        backgroundColor: `${getStatusColor(lot.status)}20`
                                    }}
                                >
                                    {lot.status}
                                </div>
                                <div
                                    className={styles.gradeBadge}
                                    style={{
                                        color: getGradeColor(lot.qualityGrade),
                                        backgroundColor: `${getGradeColor(lot.qualityGrade)}20`
                                    }}
                                >
                                    Grade {lot.qualityGrade}
                                </div>
                            </div>
                        </div>

                        <div className={styles.quantityInfo}>
                            <div className={styles.quantity}>
                                <span className={styles.quantityValue}>{lot.quantity.toLocaleString()}</span>
                                <span className={styles.quantityUnit}>{lot.unit}</span>
                            </div>
                            <div className={styles.location}>📍 {lot.zone}</div>
                        </div>

                        <div className={styles.lotDetails}>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Plant Date</span>
                                <span className={styles.detailValue}>{formatDate(lot.plantDate)}</span>
                            </div>
                            {lot.harvestDate && (
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Harvest Date</span>
                                    <span className={styles.detailValue}>{formatDate(lot.harvestDate)}</span>
                                </div>
                            )}
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Seed Lot</span>
                                <span className={styles.detailValue}>{lot.seedLot}</span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Orders</span>
                                <span className={styles.detailValue}>
                                    {lot.customerOrders.length} order(s)
                                </span>
                            </div>
                        </div>

                        <div className={styles.cardActions}>
                            <button
                                className={styles.traceButton}
                                onClick={() => openTraceability(lot)}
                            >
                                🔗 View Full Chain
                            </button>
                            <button className={styles.editButton}>
                                ✏️ Edit
                            </button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Traceability Modal */}
            {showTraceability && selectedLot && (
                <div className={styles.modal} onClick={() => setShowTraceability(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Traceability Chain - {selectedLot.lotNumber}</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => setShowTraceability(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={styles.traceabilityChain}>
                            {selectedLot.traceabilityChain.map((step, index) => (
                                <div key={step.id} className={styles.traceStep}>
                                    <div className={styles.stepNumber}>{index + 1}</div>
                                    <div className={styles.stepContent}>
                                        <div className={styles.stepHeader}>
                                            <span className={styles.stepAction}>{step.action}</span>
                                            <span className={styles.stepTime}>{formatDateTime(step.timestamp)}</span>
                                        </div>
                                        <div className={styles.stepDetails}>
                                            <div>📍 {step.location}</div>
                                            <div>👤 {step.performedBy}</div>
                                            {step.notes && <div className={styles.stepNotes}>📝 {step.notes}</div>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 