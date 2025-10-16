'use client';

import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card } from '@/components/ui';
import styles from './page.module.css';

interface HarvestBatch {
    id: string;
    batchNumber: string;
    variety: string;
    plantDate: string;
    expectedHarvestDate: string;
    actualHarvestDate?: string;
    status: 'ready' | 'scheduled' | 'completed';
    quantity: number;
    unit: string;
    zone: string;
    qualityScore?: number;
    dbStatus: string; // Original database status
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error: any, info: any) {
        // Log error if needed
        console.error('Harvesting page error:', error, info);
    }
    render() {
        if (this.state.hasError) {
            return <div style={{ color: '#ef4444', padding: 32, textAlign: 'center' }}>An unexpected error occurred. Please contact support.</div>;
        }
        return this.props.children;
    }
}

export default function HarvestingPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [batches, setBatches] = useState<HarvestBatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ready' | 'scheduled' | 'completed'>('ready');

    // Helper function to determine if a batch is ready to harvest
    const isReadyToHarvest = (batch: any) => {
        if (batch.status === 'READY_TO_HARVEST') return true;
        if (batch.actualHarvestDate) return false; // Already harvested

        const expectedDate = new Date(batch.expectedHarvestDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expectedDate.setHours(0, 0, 0, 0);

        return expectedDate <= today;
    };

    // Helper function to determine harvest status
    const getHarvestStatus = (batch: any): 'ready' | 'scheduled' | 'completed' => {
        if (batch.actualHarvestDate || batch.status === 'HARVESTED') return 'completed';
        if (isReadyToHarvest(batch)) return 'ready';
        return 'scheduled';
    };

    const loadBatches = useCallback(async () => {
        try {
            setLoading(true);
            // ✅ CRITICAL FIX: Proper farm context validation
            if (!currentFarm?.id) {
                throw new Error('No farm context available. Please select a farm.');
            }

            // Get user data for authorization
            const userData = localStorage.getItem('ofms_user');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Farm-ID': currentFarm.id,
                'Cache-Control': 'no-cache'
            };

            if (userData) {
                const user = JSON.parse(userData);
                headers['Authorization'] = `Bearer ${user.id}`;
            }

            const response = await fetch('/api/batches', {
                headers
            });

            if (!response.ok) {
                throw new Error('Failed to load batches');
            }

            const data = await response.json();

            if (data.success) {
                // Transform API data to harvest batch format
                const transformedBatches = data.data.map((batch: any) => ({
                    id: batch.id,
                    batchNumber: batch.batchNumber,
                    variety: batch.seed_varieties?.name || 'Unknown',
                    plantDate: batch.plantDate || batch.seedingDate,
                    expectedHarvestDate: batch.expectedHarvestDate,
                    actualHarvestDate: batch.actualHarvestDate,
                    status: getHarvestStatus(batch),
                    quantity: batch.quantity || batch.trayCount || 0,
                    unit: batch.unit || 'trays',
                    zone: batch.growingZone || batch.zones?.name || 'Unknown Zone',
                    qualityScore: batch.qualityScore || batch.qualityGrade === 'A' ? 95 : batch.qualityGrade === 'B' ? 85 : 75,
                    dbStatus: batch.status // Keep original status for reference
                }));

                setBatches(transformedBatches);
            } else {
                console.error('Failed to load batches:', data.error);
                setBatches([]);
            }
        } catch (error) {
            console.error('Error loading batches:', error);
            setBatches([]);
        } finally {
            setLoading(false);
        }
    }, [currentFarm?.id]);

    useEffect(() => {
        if (!isAuthLoading) {
            if (isAuthenticated) {
                loadBatches();
            } else {
                router.push('/auth/signin');
            }
        }
    }, [isAuthLoading, isAuthenticated, router, loadBatches]);

    const getStatusColor = (status: HarvestBatch['status']) => {
        switch (status) {
            case 'ready': return '#22c55e';
            case 'scheduled': return '#3b82f6';
            case 'completed': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status: HarvestBatch['status']) => {
        switch (status) {
            case 'ready': return '✅';
            case 'scheduled': return '📅';
            case 'completed': return '📦';
            default: return 'ℹ️';
        }
    };

    const filteredBatches = batches.filter(batch => {
        switch (activeTab) {
            case 'ready': return batch.status === 'ready';
            case 'scheduled': return batch.status === 'scheduled';
            case 'completed': return batch.status === 'completed';
            default: return true;
        }
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (isAuthLoading || loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading harvest schedule...</p>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>✂️ Harvesting & Processing</h1>
                    <p className={styles.subtitle}>
                        Schedule and track harvesting operations across all production areas
                    </p>
                </div>

                <div className={styles.tabNavigation}>
                    <button
                        className={`${styles.tab} ${activeTab === 'ready' ? styles.active : ''}`}
                        onClick={() => setActiveTab('ready')}
                    >
                        <span className={styles.tabIcon}>✅</span>
                        Ready to Harvest ({batches.filter(b => b.status === 'ready').length})
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'scheduled' ? styles.active : ''}`}
                        onClick={() => setActiveTab('scheduled')}
                    >
                        <span className={styles.tabIcon}>📅</span>
                        Scheduled ({batches.filter(b => b.status === 'scheduled').length})
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'completed' ? styles.active : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        <span className={styles.tabIcon}>📦</span>
                        Completed ({batches.filter(b => b.status === 'completed').length})
                    </button>
                </div>

                <div className={styles.batchesGrid}>
                    {filteredBatches.map((batch) => (
                        <Card key={batch.id} className={styles.batchCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.batchInfo}>
                                    <h3 className={styles.batchNumber}>{batch.batchNumber}</h3>
                                    <p className={styles.variety}>{batch.variety}</p>
                                </div>
                                <div
                                    className={styles.statusBadge}
                                    style={{
                                        color: getStatusColor(batch.status),
                                        backgroundColor: `${getStatusColor(batch.status)}20`
                                    }}
                                >
                                    {getStatusIcon(batch.status)} {batch.status.replace('_', ' ')}
                                </div>
                            </div>

                            <div className={styles.batchDetails}>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Zone</span>
                                    <span className={styles.detailValue}>{batch.zone}</span>
                                </div>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Quantity</span>
                                    <span className={styles.detailValue}>{batch.quantity} {batch.unit}</span>
                                </div>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Planted</span>
                                    <span className={styles.detailValue}>{formatDate(batch.plantDate)}</span>
                                </div>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>
                                        {batch.actualHarvestDate ? 'Harvested' : 'Expected Harvest'}
                                    </span>
                                    <span className={styles.detailValue}>
                                        {formatDate(batch.actualHarvestDate || batch.expectedHarvestDate)}
                                    </span>
                                </div>
                                {batch.qualityScore && (
                                    <div className={styles.detail}>
                                        <span className={styles.detailLabel}>Quality Score</span>
                                        <span className={styles.detailValue}>{batch.qualityScore}/100</span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.cardActions}>
                                {batch.status === 'ready' && (
                                    <button className={styles.harvestButton}>
                                        🌾 Start Harvest
                                    </button>
                                )}
                                {batch.status === 'scheduled' && (
                                    <button className={styles.scheduleButton}>
                                        📅 Reschedule
                                    </button>
                                )}
                                {batch.status === 'completed' && (
                                    <button className={styles.viewButton}>
                                        📊 View Report
                                    </button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>

                {filteredBatches.length === 0 && (
                    <div className={styles.emptyState}>
                        <p>No batches found for {activeTab} harvest.</p>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
} 