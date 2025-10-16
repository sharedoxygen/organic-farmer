'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import styles from './page.module.css';

interface WorkOrder {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
    assignedTo: string;
    createdBy: string;
    createdDate: string;
    dueDate: string;
    completedDate?: string;
    category: 'maintenance' | 'harvest' | 'planting' | 'quality' | 'cleaning' | 'other';
    estimatedHours: number;
    actualHours?: number;
    zone?: string;
    batchNumber?: string;
}

export default function WorkOrdersPage() {
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
    const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');

    useEffect(() => {
        const loadWorkOrders = async () => {
            try {
                // Fetch batches and zones to create work orders
                const [batchesRes, zonesRes] = await Promise.all([
                    fetch('/api/batches?limit=100'),
                    fetch('/api/zones?limit=50')
                ]);

                const [batchesData, zonesData] = await Promise.all([
                    batchesRes.json(),
                    zonesRes.json()
                ]);

                if (batchesRes.ok && zonesRes.ok) {
                    const workOrdersList: WorkOrder[] = [];
                    const batches = batchesData.data || [];
                    const zones = zonesData.data || [];

                    // Create work orders from batches
                    batches.forEach((batch: any, index: number) => {
                        if (batch.status === 'PLANNED' || batch.status === 'SEEDED') {
                            workOrdersList.push({
                                id: `wo-${batch.id}`,
                                orderNumber: `WO-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`,
                                type: batch.status === 'PLANNED' ? 'planting' : 'monitoring',
                                title: `${batch.status === 'PLANNED' ? 'Plant' : 'Monitor'} ${batch.seed_varieties?.name || 'Unknown'} - ${batch.batchNumber}`,
                                description: batch.status === 'PLANNED' ?
                                    `Plant ${batch.seedQuantity || 0}${batch.seedUnit || 'g'} of seeds in designated area` :
                                    `Daily monitoring and care for growing batch`,
                                priority: batch.status === 'PLANNED' ? 'high' : 'medium',
                                status: 'pending',
                                assignedTo: batch.users ? `${batch.users.firstName} ${batch.users.lastName}` : 'Unassigned',
                                location: batch.zones?.name || 'Zone A',
                                dueDate: batch.plantDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                                estimatedHours: batch.status === 'PLANNED' ? 2 : 1,
                                createdAt: batch.createdAt || new Date().toISOString(),
                                createdBy: 'System'
                            });
                        }

                        if (batch.status === 'READY_TO_HARVEST') {
                            workOrdersList.push({
                                id: `wo-harvest-${batch.id}`,
                                orderNumber: `WO-${new Date().getFullYear()}-H${String(index + 1).padStart(3, '0')}`,
                                type: 'harvest',
                                title: `Harvest ${batch.seed_varieties?.name || 'Unknown'} - ${batch.batchNumber}`,
                                description: `Harvest batch with expected yield of ${batch.expectedYield || 0}${batch.yieldUnit || 'lbs'}`,
                                priority: 'urgent',
                                status: 'pending',
                                assignedTo: batch.users ? `${batch.users.firstName} ${batch.users.lastName}` : 'Harvest Team',
                                location: batch.zones?.name || 'Zone A',
                                dueDate: batch.expectedHarvestDate || new Date().toISOString(),
                                estimatedHours: 3,
                                createdAt: batch.createdAt || new Date().toISOString(),
                                createdBy: 'System'
                            });
                        }
                    });

                    // Add maintenance work orders for zones
                    zones.forEach((zone: any, index: number) => {
                        workOrdersList.push({
                            id: `wo-maint-${zone.id}`,
                            orderNumber: `WO-${new Date().getFullYear()}-M${String(index + 1).padStart(3, '0')}`,
                            type: 'maintenance',
                            title: `Weekly Maintenance - ${zone.name}`,
                            description: 'Perform routine maintenance checks on all equipment',
                            priority: 'low',
                            status: 'scheduled',
                            assignedTo: 'Maintenance Team',
                            location: zone.name,
                            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                            estimatedHours: 2,
                            createdAt: new Date().toISOString(),
                            createdBy: 'System'
                        });
                    });

                    // Sort by due date
                    workOrdersList.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

                    setWorkOrders(workOrdersList);
                } else {
                    console.error('Failed to load work orders data');
                    setWorkOrders([]);
                }
            } catch (error) {
                console.error('Error loading work orders:', error);
                setWorkOrders([]);
            } finally {
                setLoading(false);
            }
        };

        loadWorkOrders();
    }, []);

    const getPriorityColor = (priority: WorkOrder['priority']) => {
        switch (priority) {
            case 'urgent': return '#ef4444';
            case 'high': return '#f59e0b';
            case 'medium': return '#3b82f6';
            case 'low': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getStatusColor = (status: WorkOrder['status']) => {
        switch (status) {
            case 'pending': return '#f59e0b';
            case 'in_progress': return '#3b82f6';
            case 'completed': return '#22c55e';
            case 'on_hold': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status: WorkOrder['status']) => {
        switch (status) {
            case 'pending': return '⏳';
            case 'in_progress': return '🔄';
            case 'completed': return '✅';
            case 'on_hold': return '⏸️';
            default: return 'ℹ️';
        }
    };

    const getCategoryIcon = (category: WorkOrder['category']) => {
        switch (category) {
            case 'maintenance': return '🔧';
            case 'harvest': return '🌾';
            case 'planting': return '🌱';
            case 'quality': return '🔍';
            case 'cleaning': return '🧽';
            case 'other': return '📝';
            default: return '📝';
        }
    };

    const filteredWorkOrders = workOrders.filter(order => {
        const statusMatch = statusFilter === 'all' || order.status === statusFilter;
        const priorityMatch = priorityFilter === 'all' || order.priority === priorityFilter;
        return statusMatch && priorityMatch;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const isOverdue = (dueDate: string, status: string) => {
        return status !== 'completed' && new Date(dueDate) < new Date();
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading work orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>📋 Work Orders</h1>
                <p className={styles.subtitle}>
                    Manage and track all work orders and maintenance tasks
                </p>
            </div>

            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Status:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className={styles.filterSelect}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Priority:</label>
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value as any)}
                        className={styles.filterSelect}
                    >
                        <option value="all">All Priorities</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>

            <div className={styles.workOrdersGrid}>
                {filteredWorkOrders.map((order) => (
                    <Card key={order.id} className={styles.workOrderCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.orderInfo}>
                                <div className={styles.orderTitle}>
                                    <span className={styles.categoryIcon}>{getCategoryIcon(order.category)}</span>
                                    <h3>{order.title}</h3>
                                </div>
                                <p className={styles.description}>{order.description}</p>
                            </div>
                            <div className={styles.badges}>
                                <div
                                    className={styles.priorityBadge}
                                    style={{
                                        color: getPriorityColor(order.priority),
                                        backgroundColor: `${getPriorityColor(order.priority)}20`
                                    }}
                                >
                                    {order.priority}
                                </div>
                                <div
                                    className={styles.statusBadge}
                                    style={{
                                        color: getStatusColor(order.status),
                                        backgroundColor: `${getStatusColor(order.status)}20`
                                    }}
                                >
                                    {getStatusIcon(order.status)} {order.status.replace('_', ' ')}
                                </div>
                            </div>
                        </div>

                        <div className={styles.orderDetails}>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Assigned To</span>
                                <span className={styles.detailValue}>{order.assignedTo}</span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Due Date</span>
                                <span className={`${styles.detailValue} ${isOverdue(order.dueDate, order.status) ? styles.overdue : ''}`}>
                                    {formatDate(order.dueDate)}
                                    {isOverdue(order.dueDate, order.status) && ' (Overdue)'}
                                </span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Estimated Hours</span>
                                <span className={styles.detailValue}>
                                    {order.actualHours ? `${order.actualHours}/${order.estimatedHours}` : order.estimatedHours}h
                                </span>
                            </div>
                            {order.zone && (
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Zone</span>
                                    <span className={styles.detailValue}>{order.zone}</span>
                                </div>
                            )}
                            {order.batchNumber && (
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Batch</span>
                                    <span className={styles.detailValue}>{order.batchNumber}</span>
                                </div>
                            )}
                        </div>

                        <div className={styles.cardActions}>
                            {order.status === 'pending' && (
                                <button className={styles.startButton}>
                                    ▶️ Start Work
                                </button>
                            )}
                            {order.status === 'in_progress' && (
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

            {filteredWorkOrders.length === 0 && (
                <div className={styles.emptyState}>
                    <p>No work orders found matching the selected filters.</p>
                </div>
            )}
        </div>
    );
} 