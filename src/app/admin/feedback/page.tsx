'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card, Button } from '@/components/ui';
import FeedbackModal from '@/components/ui/FeedbackModal/FeedbackModal';
import FeedbackResponseModal from '@/components/ui/FeedbackResponseModal/FeedbackResponseModal';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';
import { dataRefreshEmitter, DATA_EVENTS, emitFeedbackStatusChanged, emitFeedbackDeleted } from '@/lib/events/dataEvents';
import styles from './page.module.css';

interface FeedbackSubmission {
    id: string;
    title: string;
    category?: string;
    type: 'BUG' | 'ENHANCEMENT' | 'GENERAL' | 'SUPPORT' | 'BILLING' | 'SECURITY';
    description: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    status: 'OPEN' | 'REVIEW' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'CLOSED' | 'ON_HOLD';
    created_at: string;
    updated_at: string;
    farm_id: string; // Add farm_id to track which farm the feedback belongs to
    farm?: {
        farm_name: string;
    };
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    responses: FeedbackResponse[];
    _count: {
        responses: number;
    };
}

interface FeedbackResponse {
    id: string;
    message: string;
    is_internal: boolean;
    created_at: string;
    admin: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export default function AdminFeedbackPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
    const { currentFarm, isLoading: isTenantLoading, availableFarms } = useTenant();

    const [feedback, setFeedback] = useState<FeedbackSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState<FeedbackSubmission | null>(null);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [filters, setFilters] = useState({
        type: '',
        status: '',
        priority: '',
        page: 1,
        farmId: '' // For global admins to filter by farm
    });

    // ✅ CLEAN: Check if user is system admin (NO HARDCODED DATA)
    const isGlobalAdmin = isSystemAdmin(user);

    const loadFeedback = useCallback(async () => {
        if (!currentFarm && !isGlobalAdmin) {
            console.log('No current farm and not global admin, skipping feedback load');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('📝 Loading feedback:', isGlobalAdmin ? 'ALL FARMS' : `for farm: ${currentFarm?.farm_name}`);

            const queryParams = new URLSearchParams({
                page: filters.page.toString(),
                limit: '20',
                ...(filters.type && { type: filters.type }),
                ...(filters.status && { status: filters.status }),
                ...(filters.priority && { priority: filters.priority }),
                ...(isGlobalAdmin && filters.farmId && { farmId: filters.farmId })
            });

            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            if (isGlobalAdmin) {
                headers['X-Global-Admin'] = 'true';
                // For global admin, we don't need to send a specific farm ID
            } else if (currentFarm) {
                headers['X-Farm-ID'] = currentFarm.id;
            }

            const response = await fetch(`/api/feedback?${queryParams}`, {
                headers
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Feedback loaded:', data.data?.length || 0, 'items');

                setFeedback(data.success ? data.data : []);
            } else {
                console.error('Failed to fetch feedback');
                setFeedback([]);
            }
        } catch (error) {
            console.error('Error loading feedback:', error);
            setError('Failed to load feedback');
            setFeedback([]);
        } finally {
            setLoading(false);
        }
    }, [currentFarm, filters, isGlobalAdmin]);

    useEffect(() => {
        if (!isAuthLoading && !isTenantLoading) {
            if (isAuthenticated && (currentFarm || isGlobalAdmin)) {
                loadFeedback();
            } else if (!isAuthenticated) {
                router.push('/auth/signin');
            }
        }
    }, [isAuthLoading, isTenantLoading, isAuthenticated, currentFarm, isGlobalAdmin, router, loadFeedback]);

    // Event-driven data refresh
    useEffect(() => {
        const handleDataRefresh = () => {
            console.log('🔄 Data refresh event received, reloading feedback...');
            loadFeedback();
        };

        dataRefreshEmitter.on(DATA_EVENTS.DATA_REFRESH_NEEDED, handleDataRefresh);
        dataRefreshEmitter.on(DATA_EVENTS.FEEDBACK_RESPONSE_CREATED, handleDataRefresh);
        dataRefreshEmitter.on(DATA_EVENTS.FEEDBACK_STATUS_CHANGED, handleDataRefresh);
        dataRefreshEmitter.on(DATA_EVENTS.FEEDBACK_DELETED, handleDataRefresh);

        return () => {
            dataRefreshEmitter.off(DATA_EVENTS.DATA_REFRESH_NEEDED, handleDataRefresh);
            dataRefreshEmitter.off(DATA_EVENTS.FEEDBACK_RESPONSE_CREATED, handleDataRefresh);
            dataRefreshEmitter.off(DATA_EVENTS.FEEDBACK_STATUS_CHANGED, handleDataRefresh);
            dataRefreshEmitter.off(DATA_EVENTS.FEEDBACK_DELETED, handleDataRefresh);
        };
    }, [loadFeedback]);

    const handleStatusUpdate = async (feedbackId: string, newStatus: string) => {
        const oldStatus = feedback.find(f => f.id === feedbackId)?.status;

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            if (isGlobalAdmin) {
                headers['X-Global-Admin'] = 'true';
            } else if (currentFarm) {
                headers['X-Farm-ID'] = currentFarm.id;
            }

            const response = await fetch(`/api/feedback/${feedbackId}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Update local state
                setFeedback(prev => prev.map(f =>
                    f.id === feedbackId ? { ...f, status: newStatus as any } : f
                ));

                // Emit event for other components
                emitFeedbackStatusChanged(feedbackId, newStatus, oldStatus);
                console.log('✅ Feedback status updated');
            } else {
                throw new Error('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating feedback status:', error);
        }
    };

    const handleDeleteFeedback = async (feedbackId: string) => {
        if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
            return;
        }

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            if (isGlobalAdmin) {
                headers['X-Global-Admin'] = 'true';
            } else if (currentFarm) {
                headers['X-Farm-ID'] = currentFarm.id;
            }

            const response = await fetch(`/api/feedback/${feedbackId}`, {
                method: 'DELETE',
                headers
            });

            if (response.ok) {
                setFeedback(prev => prev.filter(f => f.id !== feedbackId));

                // Emit event for other components
                emitFeedbackDeleted(feedbackId);
                console.log('✅ Feedback deleted');
            } else {
                throw new Error('Failed to delete feedback');
            }
        } catch (error) {
            console.error('Error deleting feedback:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return '#3b82f6';
            case 'REVIEW': return '#f59e0b';
            case 'IN_PROGRESS': return '#8b5cf6';
            case 'IMPLEMENTED': return '#10b981';
            case 'CLOSED': return '#6b7280';
            case 'ON_HOLD': return '#f97316';
            default: return '#6b7280';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'LOW': return '#10b981';
            case 'NORMAL': return '#3b82f6';
            case 'HIGH': return '#f59e0b';
            case 'URGENT': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'BUG': return '🐛';
            case 'ENHANCEMENT': return '💡';
            case 'GENERAL': return '📢';
            case 'SUPPORT': return '🔧';
            case 'BILLING': return '💰';
            case 'SECURITY': return '🔒';
            default: return '📝';
        }
    };

    if (isAuthLoading || isTenantLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading feedback management...</p>
                </div>
            </div>
        );
    }

    if (!currentFarm && !isGlobalAdmin) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <h3>🚜 No Farm Selected</h3>
                    <p>Please select a farm to view feedback.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.errorState}>
                    <h2>⚠️ Error Loading Feedback</h2>
                    <p>{error}</p>
                    <Button onClick={() => window.location.reload()}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div>
                        <h1 className={styles.title}>
                            💬 Feedback Management
                            {isGlobalAdmin && <span className={styles.globalAdminBadge}>🌐 Global Admin</span>}
                        </h1>
                        <p className={styles.subtitle}>
                            {isGlobalAdmin
                                ? 'Manage and respond to user feedback from ALL farms in the system'
                                : `Manage and respond to user feedback for ${currentFarm?.farm_name}`
                            }
                        </p>
                    </div>
                    <div className={styles.headerActions}>
                        <Button variant="secondary" onClick={() => router.push('/admin')}>
                            ← Admin Dashboard
                        </Button>
                        <Button variant="primary" onClick={() => setShowFeedbackModal(true)}>
                            + Submit Feedback
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card className={styles.filtersCard}>
                <div className={styles.filters}>
                    {/* Farm Filter for Global Admins */}
                    {isGlobalAdmin && (
                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Farm</label>
                            <select
                                value={filters.farmId}
                                onChange={(e) => setFilters(prev => ({ ...prev, farmId: e.target.value, page: 1 }))}
                                className={styles.filterSelect}
                            >
                                <option value="">All Farms</option>
                                {availableFarms.map(farm => (
                                    <option key={farm.id} value={farm.id}>
                                        {farm.farm_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Type</label>
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
                            className={styles.filterSelect}
                        >
                            <option value="">All Types</option>
                            <option value="BUG">🐛 Bug Report</option>
                            <option value="ENHANCEMENT">💡 Feature Request</option>
                            <option value="GENERAL">📢 General Feedback</option>
                            <option value="SUPPORT">🔧 Support Request</option>
                            <option value="BILLING">💰 Billing Issue</option>
                            <option value="SECURITY">🔒 Security Concern</option>
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                            className={styles.filterSelect}
                        >
                            <option value="">All Statuses</option>
                            <option value="OPEN">Open</option>
                            <option value="REVIEW">Review</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="IMPLEMENTED">Implemented</option>
                            <option value="CLOSED">Closed</option>
                            <option value="ON_HOLD">On Hold</option>
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Priority</label>
                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value, page: 1 }))}
                            className={styles.filterSelect}
                        >
                            <option value="">All Priorities</option>
                            <option value="LOW">Low</option>
                            <option value="NORMAL">Normal</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>

                    <Button
                        variant="secondary"
                        onClick={() => setFilters({ type: '', status: '', priority: '', page: 1, farmId: '' })}
                        className={styles.clearFiltersButton}
                    >
                        Clear Filters
                    </Button>
                </div>
            </Card>

            {/* Feedback List */}
            <div className={styles.feedbackGrid}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>Loading feedback...</p>
                    </div>
                ) : feedback.length === 0 ? (
                    <Card className={styles.emptyState}>
                        <div className={styles.emptyContent}>
                            <h3>📝 No Feedback Found</h3>
                            <p>No feedback matches your current filters.</p>
                            <Button onClick={() => setFilters({ type: '', status: '', priority: '', page: 1, farmId: '' })}>
                                Clear Filters
                            </Button>
                        </div>
                    </Card>
                ) : (
                    feedback.map((item) => (
                        <Card key={item.id} className={styles.feedbackCard}>
                            <div className={styles.feedbackHeader}>
                                <div className={styles.feedbackMeta}>
                                    <div className={styles.feedbackType}>
                                        <span className={styles.typeIcon}>{getTypeIcon(item.type)}</span>
                                        <span className={styles.typeLabel}>{item.type}</span>
                                    </div>
                                    <div className={styles.feedbackStatus}>
                                        <span
                                            className={styles.statusBadge}
                                            style={{ backgroundColor: getStatusColor(item.status) }}
                                        >
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className={styles.feedbackPriority}>
                                        <span
                                            className={styles.priorityBadge}
                                            style={{ backgroundColor: getPriorityColor(item.priority) }}
                                        >
                                            {item.priority}
                                        </span>
                                    </div>
                                    {/* Show farm name for global admins */}
                                    {isGlobalAdmin && item.farm && (
                                        <div className={styles.feedbackFarm}>
                                            <span className={styles.farmLabel}>Farm:</span>
                                            <span className={styles.farmName}>{item.farm.farm_name}</span>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.feedbackActions}>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedFeedback(item);
                                            setShowResponseModal(true);
                                        }}
                                    >
                                        Respond
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedFeedback(item);
                                            // TODO: Implement edit modal
                                        }}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDeleteFeedback(item.id)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>

                            <div className={styles.feedbackContent}>
                                <h3 className={styles.feedbackTitle}>{item.title}</h3>
                                <p className={styles.feedbackDescription}>
                                    {item.description.length > 200
                                        ? `${item.description.substring(0, 200)}...`
                                        : item.description
                                    }
                                </p>

                                {item.category && (
                                    <div className={styles.feedbackCategory}>
                                        <span className={styles.categoryLabel}>Category:</span>
                                        <span className={styles.categoryValue}>{item.category}</span>
                                    </div>
                                )}

                                <div className={styles.feedbackDetails}>
                                    <div className={styles.feedbackUser}>
                                        <span className={styles.userLabel}>Submitted by:</span>
                                        <span className={styles.userName}>
                                            {item.user.firstName} {item.user.lastName}
                                        </span>
                                        <span className={styles.userEmail}>({item.user.email})</span>
                                    </div>

                                    <div className={styles.feedbackDate}>
                                        <span className={styles.dateLabel}>Submitted:</span>
                                        <span className={styles.dateValue}>
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className={styles.feedbackResponses}>
                                        <span className={styles.responsesLabel}>Responses:</span>
                                        <span className={styles.responsesCount}>{item._count.responses}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.feedbackFooter}>
                                <div className={styles.statusActions}>
                                    <select
                                        value={item.status}
                                        onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                                        className={styles.statusSelect}
                                    >
                                        <option value="OPEN">Open</option>
                                        <option value="REVIEW">Review</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="IMPLEMENTED">Implemented</option>
                                        <option value="CLOSED">Closed</option>
                                        <option value="ON_HOLD">On Hold</option>
                                    </select>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Feedback Modal */}
            <FeedbackModal
                isOpen={showFeedbackModal}
                onClose={() => setShowFeedbackModal(false)}
                onSubmitSuccess={() => {
                    setShowFeedbackModal(false);
                    loadFeedback();
                }}
                initialCategory="Admin Submission"
            />

            {/* Response Modal */}
            {showResponseModal && selectedFeedback && (
                <FeedbackResponseModal
                    isOpen={showResponseModal}
                    onClose={() => {
                        setShowResponseModal(false);
                        setSelectedFeedback(null);
                    }}
                    onResponseSubmitted={() => {
                        // Data will auto-refresh via event system
                        console.log('Response submitted successfully');
                    }}
                    feedback={selectedFeedback}
                />
            )}
        </div>
    );
} 