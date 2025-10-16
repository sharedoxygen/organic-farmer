'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import styles from './page.module.css';

interface TeamAssignment {
    id: string;
    title: string;
    description: string;
    assignedTo: string[];
    teamLead: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'planned' | 'active' | 'completed' | 'blocked';
    startDate: string;
    endDate: string;
    progress: number;
    category: 'planting' | 'maintenance' | 'harvest' | 'quality' | 'processing' | 'cleaning';
    location: string;
    estimatedHours: number;
    actualHours?: number;
    notes?: string;
}

export default function TeamAssignmentsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [assignments, setAssignments] = useState<TeamAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'planned' | 'completed'>('all');

    useEffect(() => {
        const loadAssignments = async () => {
            if (!currentFarm?.id) return;

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

                // Fetch users and batches to create assignments
                const [usersRes, batchesRes] = await Promise.all([
                    fetch('/api/users?limit=50', { headers }),
                    fetch('/api/batches?limit=100', { headers })
                ]);

                const [usersData, batchesData] = await Promise.all([
                    usersRes.json(),
                    batchesRes.json()
                ]);

                if (usersRes.ok && batchesRes.ok) {
                    const assignmentsList: TeamAssignment[] = [];
                    const users = usersData.data || [];
                    const batches = batchesData.data || [];

                    // Create assignments for each active user (normalize to TeamAssignment shape)
                    users.forEach((user: any) => {
                        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || 'Team Member';
                        const role = user.role || 'Farm Worker';
                        // Get batches assigned to this user
                        const userBatches = batches.filter((b: any) => b.assignedToId === user.id);

                        // Daily task assignments
                        if (userBatches.length > 0) {
                            userBatches.forEach((batch: any) => {
                                const taskType = batch.status === 'SEEDED' ? 'watering'
                                    : batch.status === 'GROWING' ? 'monitoring'
                                    : batch.status === 'READY_TO_HARVEST' ? 'harvesting'
                                    : 'general';

                                const category: TeamAssignment['category'] = taskType === 'harvesting' ? 'harvest'
                                    : taskType === 'watering' || taskType === 'monitoring' ? 'maintenance'
                                    : 'processing';

                                const title = `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} - ${batch.seed_varieties?.name || 'Unknown'}`;
                                const description = `Batch ${batch.batchNumber} in ${batch.zones?.name || 'Zone A'}`;

                                const startDate = new Date().toISOString();
                                const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                                const progress = 0;
                                const location = batch.zones?.name || 'Zone A';
                                const estimatedHours = taskType === 'harvesting' ? 3 : 1;
                                const status: TeamAssignment['status'] = 'active';
                                const priority: TeamAssignment['priority'] = batch.status === 'READY_TO_HARVEST' ? 'urgent' : 'medium';

                                assignmentsList.push({
                                    id: `assign-${user.id}-${batch.id}`,
                                    title,
                                    description,
                                    assignedTo: [fullName],
                                    teamLead: fullName,
                                    priority,
                                    status,
                                    startDate,
                                    endDate,
                                    progress,
                                    category,
                                    location,
                                    estimatedHours,
                                    notes: undefined,
                                    actualHours: undefined
                                });
                            });
                        } else {
                            // General assignments for users without specific batches
                            const startDate = new Date().toISOString();
                            const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                            assignmentsList.push({
                                id: `assign-general-${user.id}`,
                                title: 'General Farm Duties',
                                description: 'Support team with daily operations',
                                assignedTo: [fullName],
                                teamLead: fullName,
                                priority: 'low',
                                status: 'planned',
                                startDate,
                                endDate,
                                progress: 0,
                                category: 'maintenance',
                                location: 'All Zones',
                                estimatedHours: 4,
                                actualHours: undefined,
                                notes: undefined
                            });
                        }
                    });

                    // Add some completed tasks for today
                    if (assignmentsList.length > 2) {
                        assignmentsList[0].status = 'completed';
                        assignmentsList[1].status = 'active';
                    }

                    setAssignments(assignmentsList);
                } else {
                    console.error('Failed to load assignments data');
                    setAssignments([]);
                }
            } catch (error) {
                console.error('Error loading assignments:', error);
                setAssignments([]);
            } finally {
                setLoading(false);
            }
        };

        loadAssignments();
    }, []);

    const getPriorityColor = (priority: TeamAssignment['priority']) => {
        switch (priority) {
            case 'urgent': return '#ef4444';
            case 'high': return '#f59e0b';
            case 'medium': return '#3b82f6';
            case 'low': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getStatusColor = (status: TeamAssignment['status']) => {
        switch (status) {
            case 'planned': return '#8b5cf6';
            case 'active': return '#3b82f6';
            case 'completed': return '#22c55e';
            case 'blocked': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getCategoryIcon = (category: TeamAssignment['category']) => {
        switch (category) {
            case 'planting': return '🌱';
            case 'maintenance': return '🔧';
            case 'harvest': return '🌾';
            case 'quality': return '🔍';
            case 'processing': return '⚙️';
            case 'cleaning': return '🧽';
            default: return '📋';
        }
    };

    const filteredAssignments = assignments.filter(assignment => {
        if (filter === 'all') return true;
        return assignment.status === filter;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const isOverdue = (endDate: string, status: string) => {
        return status !== 'completed' && new Date(endDate) < new Date();
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading team assignments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>👥 Team Assignments</h1>
                <p className={styles.subtitle}>
                    Coordinate and track team-based tasks and projects
                </p>
            </div>

            <div className={styles.filterTabs}>
                <button
                    className={`${styles.tab} ${filter === 'all' ? styles.active : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All Assignments ({assignments.length})
                </button>
                <button
                    className={`${styles.tab} ${filter === 'active' ? styles.active : ''}`}
                    onClick={() => setFilter('active')}
                >
                    Active ({assignments.filter(a => a.status === 'active').length})
                </button>
                <button
                    className={`${styles.tab} ${filter === 'planned' ? styles.active : ''}`}
                    onClick={() => setFilter('planned')}
                >
                    Planned ({assignments.filter(a => a.status === 'planned').length})
                </button>
                <button
                    className={`${styles.tab} ${filter === 'completed' ? styles.active : ''}`}
                    onClick={() => setFilter('completed')}
                >
                    Completed ({assignments.filter(a => a.status === 'completed').length})
                </button>
            </div>

            <div className={styles.assignmentsGrid}>
                {filteredAssignments.map((assignment) => (
                    <Card key={assignment.id} className={styles.assignmentCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.assignmentInfo}>
                                <div className={styles.assignmentTitle}>
                                    <span className={styles.categoryIcon}>{getCategoryIcon(assignment.category)}</span>
                                    <h3>{assignment.title}</h3>
                                </div>
                                <p className={styles.description}>{assignment.description}</p>
                            </div>
                            <div className={styles.badges}>
                                <div
                                    className={styles.priorityBadge}
                                    style={{
                                        color: getPriorityColor(assignment.priority),
                                        backgroundColor: `${getPriorityColor(assignment.priority)}20`
                                    }}
                                >
                                    {assignment.priority}
                                </div>
                                <div
                                    className={styles.statusBadge}
                                    style={{
                                        color: getStatusColor(assignment.status),
                                        backgroundColor: `${getStatusColor(assignment.status)}20`
                                    }}
                                >
                                    {assignment.status}
                                </div>
                            </div>
                        </div>

                        {assignment.status === 'active' && (
                            <div className={styles.progressSection}>
                                <div className={styles.progressHeader}>
                                    <span className={styles.progressLabel}>Progress</span>
                                    <span className={styles.progressValue}>{assignment.progress}%</span>
                                </div>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{
                                            width: `${assignment.progress}%`,
                                            backgroundColor: assignment.progress >= 75 ? '#22c55e' : assignment.progress >= 50 ? '#3b82f6' : '#f59e0b'
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className={styles.assignmentDetails}>
                            <div className={styles.teamSection}>
                                <div className={styles.teamLead}>
                                    <span className={styles.leadLabel}>Team Lead:</span>
                                    <span className={styles.leadName}>{assignment.teamLead}</span>
                                </div>
                                <div className={styles.teamMembers}>
                                    <span className={styles.membersLabel}>Team:</span>
                                    <div className={styles.membersList}>
                                        {(assignment.assignedTo ?? []).map((member, index) => (
                                            <span key={index} className={styles.memberName}>
                                                {member}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.detailsGrid}>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Location</span>
                                    <span className={styles.detailValue}>{assignment.location}</span>
                                </div>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Start Date</span>
                                    <span className={styles.detailValue}>{formatDate(assignment.startDate)}</span>
                                </div>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>End Date</span>
                                    <span className={`${styles.detailValue} ${isOverdue(assignment.endDate, assignment.status) ? styles.overdue : ''}`}>
                                        {formatDate(assignment.endDate)}
                                        {isOverdue(assignment.endDate, assignment.status) && ' (Overdue)'}
                                    </span>
                                </div>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Hours</span>
                                    <span className={styles.detailValue}>
                                        {assignment.actualHours ? `${assignment.actualHours}/${assignment.estimatedHours}` : assignment.estimatedHours}h
                                    </span>
                                </div>
                            </div>

                            {assignment.notes && (
                                <div className={styles.notes}>
                                    <span className={styles.notesLabel}>Notes:</span>
                                    <p className={styles.notesText}>{assignment.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className={styles.cardActions}>
                            {assignment.status === 'planned' && (
                                <button className={styles.startButton}>
                                    ▶️ Start Assignment
                                </button>
                            )}
                            {assignment.status === 'active' && (
                                <button className={styles.updateButton}>
                                    📝 Update Progress
                                </button>
                            )}
                            <button className={styles.editButton}>
                                ✏️ Edit
                            </button>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredAssignments.length === 0 && (
                <div className={styles.emptyState}>
                    <p>No team assignments found for the selected filter.</p>
                </div>
            )}
        </div>
    );
} 