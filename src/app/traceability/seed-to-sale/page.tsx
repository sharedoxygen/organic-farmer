'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import styles from './page.module.css';

interface TraceabilityRecord {
    id: string;
    batchId: string;
    seedLot: string;
    plantingDate: string;
    harvestDate: string | null;
    status: 'planted' | 'growing' | 'harvested' | 'shipped';
    zone: string;
    variety: string;
    quantity: number;
    qualityChecks: QualityCheck[];
    shipments: Shipment[];
}

interface QualityCheck {
    id: string;
    date: string;
    inspector: string;
    score: number;
    notes: string;
}

interface Shipment {
    id: string;
    date: string;
    customer: string;
    quantity: number;
    lotNumber: string;
}

export default function SeedToSalePage() {
    const [records, setRecords] = useState<TraceabilityRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<TraceabilityRecord | null>(null);
    const [filter, setFilter] = useState('all');
    const { currentFarm } = useTenant();

    useEffect(() => {
        const loadTraceabilityData = async () => {
            try {
                if (!currentFarm?.id) return;

                // Tenant-scoped headers
                const headers: Record<string, string> = { 'X-Farm-ID': currentFarm.id };
                const userData = typeof window !== 'undefined' ? localStorage.getItem('ofms_user') : null;
                if (userData) {
                    const user = JSON.parse(userData);
                    if (user?.id) headers['Authorization'] = `Bearer ${user.id}`;
                }

                // Fetch batches and orders to create traceability records
                const [batchesRes, ordersRes] = await Promise.all([
                    fetch('/api/batches?limit=100', { headers }),
                    fetch('/api/orders?limit=100', { headers })
                ]);

                const [batchesData, ordersData] = await Promise.all([
                    batchesRes.json(),
                    ordersRes.json()
                ]);

                if (batchesRes.ok && ordersRes.ok) {
                    // Create traceability records from batches
                    const records: TraceabilityRecord[] = batchesData.data.map((batch: any) => {
                        // Find orders containing this batch's variety
                        const relatedOrders = ordersData.data.filter((order: any) =>
                            order.order_items?.some((item: any) =>
                                (item.seedVarietyId && item.seedVarietyId === batch.seedVarietyId) ||
                                item.productName === batch.seed_varieties?.name
                            )
                        );

                        const shipments = (relatedOrders || []).flatMap((order: any) => {
                            const matched = order.order_items?.find((i: any) => (i.seedVarietyId === batch.seedVarietyId) || (i.productName === batch.seed_varieties?.name));
                            return matched ? [{
                                id: matched.id,
                                date: order.orderDate,
                                customer: order.customers?.businessName || order.customers?.name || 'Customer',
                                quantity: matched.quantity || 0,
                                lotNumber: batch.batchNumber
                            } as Shipment] : [];
                        });

                        const mapStatus = (s: string): TraceabilityRecord['status'] => {
                            if (shipments.length > 0) return 'shipped';
                            switch (s) {
                                case 'READY_TO_HARVEST': return 'harvested';
                                case 'GROWING': return 'growing';
                                case 'HARVESTED': return 'harvested';
                                default: return 'planted';
                            }
                        };

                        return {
                            id: batch.id,
                            batchId: batch.batchNumber,
                            seedLot: `SEED-${batch.seedVarietyId || batch.id}`,
                            plantingDate: batch.plantDate || new Date().toISOString(),
                            harvestDate: batch.actualHarvestDate || batch.expectedHarvestDate || null,
                            status: mapStatus(batch.status),
                            zone: batch.growingZone || 'Unknown',
                            variety: batch.seed_varieties?.name || 'Unknown',
                            quantity: Number(batch.quantity || batch.expectedYield || 0),
                            qualityChecks: [],
                            shipments
                        } as TraceabilityRecord;
                    });

                    setRecords(records);
                } else {
                    console.error('Failed to load traceability data');
                    setRecords([]);
                }
            } catch (error) {
                console.error('Error loading traceability records:', error);
                setRecords([]);
            } finally {
                setLoading(false);
            }
        };

        loadTraceabilityData();
    }, [currentFarm?.id]);

    const filteredRecords = records.filter(record => {
        if (filter === 'all') return true;
        return record.status === filter;
    });

    const getStatusBadgeColor = (status: TraceabilityRecord['status']): string => {
        switch (status) {
            case 'planted': return '#3b82f6';
            case 'growing': return '#10b981';
            case 'harvested': return '#f59e0b';
            case 'shipped': return '#6b7280';
            default: return '#6b7280';
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <h2>Loading Traceability Data...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h2>⚠️ Error Loading Data</h2>
                    <p>{error}</p>
                    <button onClick={() => { }} className={styles.retryButton}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>🔍 Seed to Sale Traceability</h1>
                <p className={styles.subtitle}>
                    Complete tracking from seed to customer delivery
                </p>
            </div>

            <div className={styles.controls}>
                <div className={styles.filters}>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="all">All Records</option>
                        <option value="planted">Planted</option>
                        <option value="growing">Growing</option>
                        <option value="harvested">Harvested</option>
                        <option value="shipped">Shipped</option>
                    </select>
                </div>
                <button className={styles.exportButton}>
                    📊 Export Report
                </button>
            </div>

            <div className={styles.recordsGrid}>
                {filteredRecords.map((record) => (
                    <div
                        key={record.id}
                        className={styles.recordCard}
                        onClick={() => setSelectedRecord(record)}
                    >
                        <div className={styles.cardHeader}>
                            <h3 className={styles.batchId}>{record.batchId}</h3>
                            <span
                                className={styles.statusBadge}
                                style={{ backgroundColor: getStatusBadgeColor(record.status) }}
                            >
                                {record.status}
                            </span>
                        </div>

                        <div className={styles.cardContent}>
                            <div className={styles.recordInfo}>
                                <p><strong>Variety:</strong> {record.variety}</p>
                                <p><strong>Zone:</strong> {record.zone}</p>
                                <p><strong>Planted:</strong> {new Date(record.plantingDate).toLocaleDateString()}</p>
                                {record.harvestDate && (
                                    <p><strong>Harvested:</strong> {new Date(record.harvestDate).toLocaleDateString()}</p>
                                )}
                                <p><strong>Quantity:</strong> {record.quantity} trays</p>
                            </div>
                        </div>

                        <div className={styles.cardFooter}>
                            <div className={styles.metrics}>
                                <span className={styles.metric}>
                                    🔍 {record.qualityChecks.length} checks
                                </span>
                                <span className={styles.metric}>
                                    📦 {record.shipments.length} shipments
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredRecords.length === 0 && (
                <div className={styles.emptyState}>
                    <h3>No Records Found</h3>
                    <p>No traceability records match your current filter criteria.</p>
                </div>
            )}

            {/* Detail Modal */}
            {selectedRecord && (
                <div className={styles.modal} onClick={() => setSelectedRecord(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Traceability Details: {selectedRecord.batchId}</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => setSelectedRecord(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.detailSection}>
                                <h3>Basic Information</h3>
                                <div className={styles.detailGrid}>
                                    <div className={styles.detailItem}>
                                        <label>Batch ID:</label>
                                        <span>{selectedRecord.batchId}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label>Seed Lot:</label>
                                        <span>{selectedRecord.seedLot}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label>Variety:</label>
                                        <span>{selectedRecord.variety}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label>Zone:</label>
                                        <span>{selectedRecord.zone}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label>Status:</label>
                                        <span
                                            className={styles.statusBadge}
                                            style={{ backgroundColor: getStatusBadgeColor(selectedRecord.status) }}
                                        >
                                            {selectedRecord.status}
                                        </span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label>Quantity:</label>
                                        <span>{selectedRecord.quantity} trays</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.detailSection}>
                                <h3>Quality Checks</h3>
                                {selectedRecord.qualityChecks.length > 0 ? (
                                    <div className={styles.qualityList}>
                                        {selectedRecord.qualityChecks.map((check) => (
                                            <div key={check.id} className={styles.qualityItem}>
                                                <div className={styles.qualityHeader}>
                                                    <span className={styles.qualityDate}>
                                                        {new Date(check.date).toLocaleDateString()}
                                                    </span>
                                                    <span className={styles.qualityScore}>
                                                        Score: {check.score}%
                                                    </span>
                                                </div>
                                                <p className={styles.qualityInspector}>
                                                    Inspector: {check.inspector}
                                                </p>
                                                <p className={styles.qualityNotes}>
                                                    {check.notes}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p>No quality checks recorded yet.</p>
                                )}
                            </div>

                            <div className={styles.detailSection}>
                                <h3>Shipments</h3>
                                {selectedRecord.shipments.length > 0 ? (
                                    <div className={styles.shipmentList}>
                                        {selectedRecord.shipments.map((shipment) => (
                                            <div key={shipment.id} className={styles.shipmentItem}>
                                                <div className={styles.shipmentHeader}>
                                                    <span className={styles.shipmentDate}>
                                                        {new Date(shipment.date).toLocaleDateString()}
                                                    </span>
                                                    <span className={styles.shipmentLot}>
                                                        Lot: {shipment.lotNumber}
                                                    </span>
                                                </div>
                                                <p className={styles.shipmentCustomer}>
                                                    Customer: {shipment.customer}
                                                </p>
                                                <p className={styles.shipmentQuantity}>
                                                    Quantity: {shipment.quantity} trays
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p>No shipments recorded yet.</p>
                                )}
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.primaryButton}>
                                📊 Generate Report
                            </button>
                            <button className={styles.secondaryButton}>
                                📋 Add Quality Check
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 