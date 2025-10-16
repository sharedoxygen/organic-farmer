'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card, Button } from '@/components/ui';
import { useTenant } from '@/components/TenantProvider';
import styles from './page.module.css';

interface PostHarvestTask {
    id: string;
    batchNumber: string;
    variety: string;
    harvestDate: string;
    quantity: number;
    unit: string;
    status: 'pending' | 'processing' | 'packaged' | 'stored';
    qualityGrade: 'A' | 'B' | 'C';
    packagingType?: string;
    storageLocation?: string;
    expiryDate?: string;
}

export default function PostHarvestHandlingPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [tasks, setTasks] = useState<PostHarvestTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'packaged' | 'stored'>('all');

    useEffect(() => {
        if (!isAuthLoading) {
            if (isAuthenticated && currentFarm) {
                loadPostHarvestTasks();
            } else {
                router.push('/auth/signin');
            }
        }
    }, [isAuthLoading, isAuthenticated, currentFarm, router]);

    const loadPostHarvestTasks = async () => {
        if (!currentFarm?.id) return;
        setLoading(true);
        try {
            // Build headers for tenant-aware API
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Farm-ID': currentFarm.id,
            };
            const userData = typeof window !== 'undefined' ? localStorage.getItem('ofms_user') : null;
            if (userData) {
                const user = JSON.parse(userData);
                if (user?.id) headers['Authorization'] = `Bearer ${user.id}`;
            }

            // Fetch harvested batches
            const response = await fetch('/api/batches?status=HARVESTED&limit=100', { headers });
            const data = await response.json();

            if (response.ok && data.success) {
                // Transform harvested batches into post-harvest tasks
                const transformedTasks = data.data.map((batch: any) => ({
                    id: batch.id,
                    batchNumber: batch.batchNumber,
                    variety: batch.seed_varieties?.name || 'Unknown',
                    harvestDate: batch.actualHarvestDate || batch.expectedHarvestDate,
                    quantity: batch.quantity,
                    unit: batch.unit,
                    status: 'pending', // Default status
                    qualityGrade: batch.qualityGrade || 'B',
                    packagingType: batch.packagingType,
                    storageLocation: batch.storageConditions,
                    expiryDate: batch.actualHarvestDate ?
                        new Date(new Date(batch.actualHarvestDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() :
                        undefined
                }));

                setTasks(transformedTasks);
            }
        } catch (error) {
            console.error('Error loading post-harvest tasks:', error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredTasks = filter === 'all' ? tasks : tasks.filter(task => task.status === filter);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#f59e0b';
            case 'processing': return '#3b82f6';
            case 'packaged': return '#10b981';
            case 'stored': return '#22c55e';
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

    if (loading || isAuthLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <h1>Loading Post-Harvest Tasks...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>📦 Post-Harvest Handling</h1>
                    <p className={styles.subtitle}>Manage packaging, storage, and distribution of harvested crops</p>
                </div>
                <Button variant="secondary" onClick={() => router.push('/production')}>
                    ← Back to Production
                </Button>
            </div>

            <div className={styles.filterSection}>
                <div className={styles.filterButtons}>
                    <button
                        className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All ({tasks.length})
                    </button>
                    <button
                        className={`${styles.filterButton} ${filter === 'pending' ? styles.active : ''}`}
                        onClick={() => setFilter('pending')}
                    >
                        Pending ({tasks.filter(t => t.status === 'pending').length})
                    </button>
                    <button
                        className={`${styles.filterButton} ${filter === 'processing' ? styles.active : ''}`}
                        onClick={() => setFilter('processing')}
                    >
                        Processing ({tasks.filter(t => t.status === 'processing').length})
                    </button>
                    <button
                        className={`${styles.filterButton} ${filter === 'packaged' ? styles.active : ''}`}
                        onClick={() => setFilter('packaged')}
                    >
                        Packaged ({tasks.filter(t => t.status === 'packaged').length})
                    </button>
                    <button
                        className={`${styles.filterButton} ${filter === 'stored' ? styles.active : ''}`}
                        onClick={() => setFilter('stored')}
                    >
                        Stored ({tasks.filter(t => t.status === 'stored').length})
                    </button>
                </div>
            </div>

            <div className={styles.statsGrid}>
                <Card className={styles.statCard}>
                    <div className={styles.statIcon}>📦</div>
                    <div className={styles.statValue}>{tasks.filter(t => t.status === 'pending').length}</div>
                    <div className={styles.statLabel}>Awaiting Processing</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statIcon}>⚙️</div>
                    <div className={styles.statValue}>{tasks.filter(t => t.status === 'processing').length}</div>
                    <div className={styles.statLabel}>In Processing</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statValue}>{tasks.filter(t => t.status === 'packaged').length}</div>
                    <div className={styles.statLabel}>Packaged</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statIcon}>🏪</div>
                    <div className={styles.statValue}>{tasks.filter(t => t.status === 'stored').length}</div>
                    <div className={styles.statLabel}>In Storage</div>
                </Card>
            </div>

            <div className={styles.tasksGrid}>
                {filteredTasks.map((task) => (
                    <Card key={task.id} className={styles.taskCard}>
                        <div className={styles.taskHeader}>
                            <h3>{task.batchNumber}</h3>
                            <span
                                className={styles.statusBadge}
                                style={{ backgroundColor: getStatusColor(task.status) }}
                            >
                                {task.status.toUpperCase()}
                            </span>
                        </div>
                        <div className={styles.taskContent}>
                            <div className={styles.detail}>
                                <span className={styles.label}>Variety:</span>
                                <span className={styles.value}>{task.variety}</span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.label}>Harvest Date:</span>
                                <span className={styles.value}>{formatDate(task.harvestDate)}</span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.label}>Quantity:</span>
                                <span className={styles.value}>{task.quantity} {task.unit}</span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.label}>Quality Grade:</span>
                                <span className={styles.value}>Grade {task.qualityGrade}</span>
                            </div>
                            {task.expiryDate && (
                                <div className={styles.detail}>
                                    <span className={styles.label}>Best Before:</span>
                                    <span className={styles.value}>{formatDate(task.expiryDate)}</span>
                                </div>
                            )}
                        </div>
                        <div className={styles.taskActions}>
                            {task.status === 'pending' && (
                                <Button variant="primary" size="sm">Start Processing</Button>
                            )}
                            {task.status === 'processing' && (
                                <Button variant="primary" size="sm">Mark as Packaged</Button>
                            )}
                            {task.status === 'packaged' && (
                                <Button variant="primary" size="sm">Move to Storage</Button>
                            )}
                            <Button variant="secondary" size="sm">View Details</Button>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredTasks.length === 0 && (
                <Card className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📦</div>
                    <h3>No post-harvest tasks found</h3>
                    <p>Harvested batches will appear here for processing and packaging.</p>
                </Card>
            )}
        </div>
    );
} 