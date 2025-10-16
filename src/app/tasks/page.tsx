'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { useState, useEffect, useCallback } from 'react';

import styles from './page.module.css';

interface TaskStats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    urgent: number;
    overdue: number;
}

export default function TasksPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [stats, setStats] = useState<TaskStats>({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        urgent: 0,
        overdue: 0
    });
    const [loading, setLoading] = useState(true);

    const loadTaskStats = useCallback(async () => {
        if (!currentFarm?.id) return;

        setLoading(true);
        try {
            const response = await fetch('/api/tasks?limit=1000', {
                headers: {
                    'X-Farm-ID': currentFarm.id,
                },
            });
            const data = await response.json();

            if (response.ok && data.success) {
                const tasks = data.data;
                const now = new Date();

                const taskStats: TaskStats = {
                    total: tasks.length,
                    pending: tasks.filter((t: any) => t.status === 'PENDING').length,
                    inProgress: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
                    completed: tasks.filter((t: any) => t.status === 'COMPLETED').length,
                    urgent: tasks.filter((t: any) => t.priority === 'URGENT').length,
                    overdue: tasks.filter((t: any) =>
                        t.status !== 'COMPLETED' && new Date(t.dueDate) < now
                    ).length
                };

                setStats(taskStats);
            } else {
                console.error('Failed to load task stats:', data.error);
            }
        } catch (error) {
            console.error('Error loading task stats:', error);
        } finally {
            setLoading(false);
        }
    }, [currentFarm?.id]);

    useEffect(() => {
        if (!isAuthLoading) {
            if (isAuthenticated && currentFarm?.id) {
                loadTaskStats();
            } else if (!isAuthenticated) {
                router.push('/auth/signin');
            }
        }
    }, [isAuthLoading, isAuthenticated, currentFarm?.id, router, loadTaskStats]);

    const navigateToPage = (path: string) => {
        router.push(path);
    };

    if (loading) return <div className={styles.container}>Loading task data...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Task Management</h1>
                <p className={styles.subtitle}>Organize and track cannabis cultivation operations</p>
            </div>

            <div className={styles.grid}>
                <div className={styles.card} onClick={() => navigateToPage('/tasks/daily')}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>📅</span>
                        <h3>Daily Tasks</h3>
                    </div>
                    <p>Today&apos;s scheduled tasks and activities</p>
                    <div className={styles.stats}>
                        <span className={styles.statBadge}>{stats.pending} Pending</span>
                        <span className={styles.statValue}>{stats.inProgress} In Progress</span>
                    </div>
                </div>

                <div className={styles.card} onClick={() => navigateToPage('/tasks/work-orders')}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>📋</span>
                        <h3>Work Orders</h3>
                    </div>
                    <p>Maintenance and special project orders</p>
                    <div className={styles.stats}>
                        <span className={styles.statValue}>{stats.urgent} Urgent</span>
                        <span className={styles.statBadge}>{stats.overdue} Overdue</span>
                    </div>
                </div>

                <div className={styles.card} onClick={() => navigateToPage('/tasks/assignments')}>
                    <div className={styles.cardHeader}>
                        <span className={styles.icon}>👥</span>
                        <h3>Team Assignments</h3>
                    </div>
                    <p>Task assignments across team members</p>
                    <div className={styles.stats}>
                        <span className={styles.statGreen}>{stats.completed} Completed</span>
                        <span className={styles.statValue}>{stats.total} Total</span>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2>Task Overview</h2>
                <div className={styles.overviewGrid}>
                    <div className={styles.overviewCard}>
                        <h3>Task Status Distribution</h3>
                        <div className={styles.statusList}>
                            <div className={styles.statusItem}>
                                <span className={styles.statusIndicator} style={{ backgroundColor: '#f59e0b' }}></span>
                                <span>Pending: {stats.pending}</span>
                            </div>
                            <div className={styles.statusItem}>
                                <span className={styles.statusIndicator} style={{ backgroundColor: '#3b82f6' }}></span>
                                <span>In Progress: {stats.inProgress}</span>
                            </div>
                            <div className={styles.statusItem}>
                                <span className={styles.statusIndicator} style={{ backgroundColor: '#10b981' }}></span>
                                <span>Completed: {stats.completed}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.overviewCard}>
                        <h3>Priority Distribution</h3>
                        <div className={styles.priorityStats}>
                            <div className={styles.priorityItem}>
                                <span className={styles.urgentBadge}>URGENT</span>
                                <span>{stats.urgent} tasks</span>
                            </div>
                            <div className={styles.priorityItem}>
                                <span className={styles.overdueBadge}>OVERDUE</span>
                                <span>{stats.overdue} tasks</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 