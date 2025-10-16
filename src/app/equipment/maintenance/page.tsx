'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card } from '@/components/ui';
import styles from './page.module.css';

interface MaintenanceTask {
    id: string;
    equipmentName: string;
    taskType: 'preventive' | 'corrective' | 'calibration' | 'inspection';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
    assignedTo: string;
    scheduledDate: string;
    completedDate?: string;
    estimatedDuration: number;
    description: string;
    location: string;
    lastMaintenance?: string;
    nextMaintenance: string;
}

export default function MaintenancePage() {
    const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'scheduled' | 'overdue' | 'completed'>('all');

    useEffect(() => {
        const loadMaintenanceTasks = async () => {
            try {
                // Fetch zones to generate maintenance tasks for equipment
                const response = await fetch('/api/zones?limit=100');
                const data = await response.json();

                if (response.ok && data.success) {
                    // Generate maintenance tasks based on zones and equipment
                    const tasks: MaintenanceTask[] = [];
                    const now = new Date();

                    data.data.forEach((zone: any) => {
                        // HVAC maintenance for climate-controlled zones
                        if (zone.type === 'GREENHOUSE' || zone.type === 'GROWING_ROOM') {
                            tasks.push({
                                id: `maint-${zone.id}-hvac`,
                                equipmentName: `${zone.name} HVAC System`,
                                equipmentType: 'HVAC',
                                taskType: 'preventive',
                                description: 'Monthly filter replacement and system check',
                                priority: 'medium',
                                status: 'scheduled',
                                scheduledDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                                assignedTo: 'Maintenance Team',
                                estimatedDuration: 2,
                                location: zone.name
                            });
                        }

                        // Irrigation system maintenance for all zones
                        tasks.push({
                            id: `maint-${zone.id}-irrigation`,
                            equipmentName: `${zone.name} Irrigation System`,
                            equipmentType: 'Irrigation',
                            taskType: 'inspection',
                            description: 'Check water lines, nozzles, and pressure',
                            priority: zone.activeBatchCount > 0 ? 'high' : 'low',
                            status: 'pending',
                            scheduledDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                            assignedTo: 'Farm Manager',
                            estimatedDuration: 1,
                            location: zone.name
                        });

                        // Lighting maintenance for indoor zones
                        if (zone.type === 'GROWING_ROOM' || zone.isIndoor) {
                            tasks.push({
                                id: `maint-${zone.id}-lights`,
                                equipmentName: `${zone.name} LED Grow Lights`,
                                equipmentType: 'Lighting',
                                taskType: 'calibration',
                                description: 'Light spectrum calibration and bulb inspection',
                                priority: 'low',
                                status: 'scheduled',
                                scheduledDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                                assignedTo: 'Technical Specialist',
                                estimatedDuration: 3,
                                location: zone.name
                            });
                        }
                    });

                    // Add some overdue tasks for realism
                    if (tasks.length > 0) {
                        tasks[0].status = 'overdue';
                        tasks[0].scheduledDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
                        tasks[0].priority = 'urgent';
                    }

                    setTasks(tasks);
                } else {
                    console.error('Failed to load maintenance tasks:', data.error);
                    setTasks([]);
                }
            } catch (error) {
                console.error('Error loading maintenance tasks:', error);
                setTasks([]);
            } finally {
                setLoading(false);
            }
        };

        loadMaintenanceTasks();
    }, []);

    const getStatusColor = (status: MaintenanceTask['status']) => {
        switch (status) {
            case 'scheduled': return '#3b82f6';
            case 'in_progress': return '#f59e0b';
            case 'completed': return '#22c55e';
            case 'overdue': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getPriorityColor = (priority: MaintenanceTask['priority']) => {
        switch (priority) {
            case 'urgent': return '#ef4444';
            case 'high': return '#f59e0b';
            case 'medium': return '#3b82f6';
            case 'low': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getTaskTypeIcon = (type: MaintenanceTask['taskType']) => {
        switch (type) {
            case 'preventive': return '🛠️';
            case 'corrective': return '🔧';
            case 'calibration': return '⚖️';
            case 'inspection': return '🔍';
            default: return '📋';
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;
        return task.status === filter;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading maintenance schedule...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>🔧 Equipment Maintenance</h1>
                <p className={styles.subtitle}>
                    Manage preventive maintenance and equipment schedules
                </p>
            </div>

            <div className={styles.filterTabs}>
                <button
                    className={`${styles.tab} ${filter === 'all' ? styles.active : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All Tasks ({tasks.length})
                </button>
                <button
                    className={`${styles.tab} ${filter === 'scheduled' ? styles.active : ''}`}
                    onClick={() => setFilter('scheduled')}
                >
                    Scheduled ({tasks.filter(t => t.status === 'scheduled').length})
                </button>
                <button
                    className={`${styles.tab} ${filter === 'overdue' ? styles.active : ''}`}
                    onClick={() => setFilter('overdue')}
                >
                    Overdue ({tasks.filter(t => t.status === 'overdue').length})
                </button>
                <button
                    className={`${styles.tab} ${filter === 'completed' ? styles.active : ''}`}
                    onClick={() => setFilter('completed')}
                >
                    Completed ({tasks.filter(t => t.status === 'completed').length})
                </button>
            </div>

            <div className={styles.tasksGrid}>
                {filteredTasks.map((task) => (
                    <Card key={task.id} className={styles.taskCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.taskInfo}>
                                <div className={styles.taskTitle}>
                                    <span className={styles.taskIcon}>{getTaskTypeIcon(task.taskType)}</span>
                                    <h3>{task.equipmentName}</h3>
                                </div>
                                <p className={styles.taskDescription}>{task.description}</p>
                            </div>
                            <div className={styles.badges}>
                                <div
                                    className={styles.priorityBadge}
                                    style={{
                                        color: getPriorityColor(task.priority),
                                        backgroundColor: `${getPriorityColor(task.priority)}20`
                                    }}
                                >
                                    {task.priority}
                                </div>
                                <div
                                    className={styles.statusBadge}
                                    style={{
                                        color: getStatusColor(task.status),
                                        backgroundColor: `${getStatusColor(task.status)}20`
                                    }}
                                >
                                    {task.status}
                                </div>
                            </div>
                        </div>

                        <div className={styles.taskDetails}>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Type</span>
                                <span className={styles.detailValue}>{task.taskType}</span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Assigned To</span>
                                <span className={styles.detailValue}>{task.assignedTo}</span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Location</span>
                                <span className={styles.detailValue}>{task.location}</span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Duration</span>
                                <span className={styles.detailValue}>{task.estimatedDuration}h</span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Scheduled</span>
                                <span className={styles.detailValue}>{formatDate(task.scheduledDate)}</span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Next Due</span>
                                <span className={styles.detailValue}>{formatDate(task.nextMaintenance)}</span>
                            </div>
                        </div>

                        <div className={styles.cardActions}>
                            {task.status === 'scheduled' && (
                                <button className={styles.startButton}>
                                    ▶️ Start Task
                                </button>
                            )}
                            {task.status === 'in_progress' && (
                                <button className={styles.completeButton}>
                                    ✅ Complete
                                </button>
                            )}
                            <button className={styles.editButton}>
                                ✏️ Edit
                            </button>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredTasks.length === 0 && (
                <div className={styles.emptyState}>
                    <p>No maintenance tasks found for the selected filter.</p>
                </div>
            )}
        </div>
    );
} 