'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import styles from './page.module.css';

interface ProductionEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    type: 'planting' | 'harvest' | 'maintenance' | 'delivery';
    resource: string;
    status: 'scheduled' | 'completed';
}

interface MetricDetail {
    type: 'today' | 'overdue' | 'completion' | 'total';
    title: string;
    description: string;
    data: any;
}

interface EditableEvent {
    id: string;
    title: string;
    start: string; // ISO date string for form input
    end: string;
    type: 'planting' | 'harvest' | 'maintenance' | 'delivery';
    resource: string;
    status: 'scheduled' | 'completed';
}

export default function ProductionCalendarPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm, isLoading: isTenantLoading } = useTenant();
    const [events, setEvents] = useState<ProductionEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<ProductionEvent | null>(null);
    const [selectedMetric, setSelectedMetric] = useState<MetricDetail | null>(null);
    const [viewMode, setViewMode] = useState<'timeline' | 'cards'>('timeline');

    // Edit functionality state
    const [isEditing, setIsEditing] = useState(false);
    const [editingEvent, setEditingEvent] = useState<EditableEvent | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const loadEvents = useCallback(async () => {
        if (!currentFarm) {
            console.log('No current farm, skipping events load');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            console.log('📅 Loading events for farm:', currentFarm.farm_name, currentFarm.id);

            const [batchesRes, ordersRes] = await Promise.all([
                fetch('/api/batches?limit=100', {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Farm-ID': currentFarm.id,
                    },
                }),
                fetch('/api/orders?limit=50', {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Farm-ID': currentFarm.id,
                    },
                })
            ]);

            const batchesData = await batchesRes.json();
            const ordersData = await ordersRes.json();

            console.log('📦 Batches data:', batchesData.success, batchesData.data?.length);
            console.log('📋 Orders data:', ordersData.success, ordersData.data?.length);

            const productionEvents: ProductionEvent[] = [];

            if (batchesData.success) {
                batchesData.data.forEach((batch: Record<string, any>) => {
                    if (batch.plantDate) {
                        productionEvents.push({
                            id: `batch-plant-${batch.id}`,
                            title: `Plant ${batch.seed_varieties?.name || 'Batch'}`,
                            start: new Date(batch.plantDate),
                            end: new Date(batch.plantDate),
                            type: 'planting',
                            resource: batch.growingZone?.name || 'Unknown Zone',
                            status: 'completed'
                        });
                    }
                    if (batch.expectedHarvestDate) {
                        productionEvents.push({
                            id: `batch-harvest-${batch.id}`,
                            title: `Harvest ${batch.seed_varieties?.name || 'Batch'}`,
                            start: new Date(batch.expectedHarvestDate),
                            end: new Date(batch.expectedHarvestDate),
                            type: 'harvest',
                            resource: batch.growingZone?.name || 'Unknown Zone',
                            status: new Date(batch.expectedHarvestDate) > new Date() ? 'scheduled' : 'completed'
                        });
                    }
                });
            }

            if (ordersData.success) {
                ordersData.data.forEach((order: Record<string, any>) => {
                    if (order.requestedDeliveryDate) {
                        productionEvents.push({
                            id: `order-delivery-${order.id}`,
                            title: `Deliver Order #${order.orderNumber}`,
                            start: new Date(order.requestedDeliveryDate),
                            end: new Date(order.requestedDeliveryDate),
                            type: 'delivery',
                            resource: order.customers?.businessName || order.customers?.name || 'Unknown Customer',
                            status: order.status === 'DELIVERED' ? 'completed' : 'scheduled'
                        });
                    }
                });
            }

            setEvents(productionEvents);

        } catch (e) {
            setError('Failed to load calendar events.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [currentFarm]);

    useEffect(() => {
        if (!isAuthLoading && !isTenantLoading) {
            if (isAuthenticated && currentFarm) {
                loadEvents();
            } else if (!isAuthenticated) {
                router.push('/auth/signin');
            }
        }
    }, [isAuthLoading, isTenantLoading, isAuthenticated, currentFarm, router, loadEvents]);

    // Edit handlers
    const handleEditEvent = (event: ProductionEvent) => {
        setEditingEvent({
            id: event.id,
            title: event.title,
            start: event.start.toISOString().split('T')[0], // Convert to date input format
            end: event.end.toISOString().split('T')[0],
            type: event.type,
            resource: event.resource,
            status: event.status
        });
        setIsEditing(true);
        setSaveError(null);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingEvent(null);
        setSaveError(null);
    };

    const handleSaveEvent = async () => {
        if (!editingEvent) return;

        setSaving(true);
        setSaveError(null);

        try {
            // Update the local events array immediately for UI responsiveness
            const updatedEvents = events.map(event => {
                if (event.id === editingEvent.id) {
                    return {
                        ...event,
                        title: editingEvent.title,
                        start: new Date(editingEvent.start),
                        end: new Date(editingEvent.end),
                        type: editingEvent.type,
                        resource: editingEvent.resource,
                        status: editingEvent.status
                    };
                }
                return event;
            });

            setEvents(updatedEvents);

            // Update selectedEvent if it's the one being edited
            if (selectedEvent && selectedEvent.id === editingEvent.id) {
                setSelectedEvent(updatedEvents.find(e => e.id === editingEvent.id) || null);
            }

            // TODO: In a real implementation, you would make an API call here
            // For now, we'll simulate a successful save
            await new Promise(resolve => setTimeout(resolve, 500));

            setIsEditing(false);
            setEditingEvent(null);

            // Show success message
            console.log('Event updated successfully!');

        } catch (error) {
            setSaveError('Failed to save event. Please try again.');
            console.error('Error saving event:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleMarkComplete = async (event: ProductionEvent) => {
        try {
            const updatedEvents = events.map(e =>
                e.id === event.id ? { ...e, status: 'completed' as const } : e
            );
            setEvents(updatedEvents);

            if (selectedEvent && selectedEvent.id === event.id) {
                setSelectedEvent({ ...selectedEvent, status: 'completed' });
            }

            // TODO: API call to update status
            console.log('Event marked as completed!');
        } catch (error) {
            console.error('Error marking event complete:', error);
        }
    };

    // Helper functions for form handling
    const handleEditInputChange = (field: keyof EditableEvent, value: string) => {
        if (!editingEvent) return;

        setEditingEvent({
            ...editingEvent,
            [field]: value
        });
    };

    const getEventTypeIcon = (type: ProductionEvent['type']): string => {
        switch (type) {
            case 'planting': return '🌱';
            case 'harvest': return '🌾';
            case 'delivery': return '🚚';
            case 'maintenance': return '🔧';
            default: return '🗓️';
        }
    };

    const getStatusColor = (status: ProductionEvent['status']): string => {
        switch (status) {
            case 'scheduled': return 'var(--primary-color)';
            case 'completed': return 'var(--success-color)';
            default: return 'var(--text-muted)';
        }
    };

    const getTodayEvents = (): ProductionEvent[] => {
        const today = new Date().toISOString().split('T')[0];
        return events.filter(event => event.start.toISOString().split('T')[0] === today);
    };

    const getOverdueEvents = (): ProductionEvent[] => {
        const today = new Date().toISOString().split('T')[0];
        return events.filter(event =>
            event.start.toISOString().split('T')[0] < today && event.status !== 'completed'
        );
    };

    const getCompletionRate = (): number => {
        if (events.length === 0) return 0;
        const completed = events.filter(event => event.status === 'completed').length;
        return Math.round((completed / events.length) * 100);
    };

    const handleMetricClick = (type: MetricDetail['type']) => {
        let metricData: MetricDetail;

        switch (type) {
            case 'today':
                metricData = {
                    type: 'today',
                    title: "Today's Tasks",
                    description: "All scheduled activities for today",
                    data: getTodayEvents()
                };
                break;
            case 'overdue':
                metricData = {
                    type: 'overdue',
                    title: "Overdue Items",
                    description: "Tasks that are past their scheduled date",
                    data: getOverdueEvents()
                };
                break;
            case 'completion':
                const completed = events.filter(e => e.status === 'completed').length;
                const scheduled = events.filter(e => e.status === 'scheduled').length;
                metricData = {
                    type: 'completion',
                    title: "Completion Rate",
                    description: "Overall task completion statistics",
                    data: {
                        completed,
                        scheduled,
                        total: events.length,
                        percentage: getCompletionRate()
                    }
                };
                break;
            case 'total':
                const eventsByType = events.reduce((acc, event) => {
                    acc[event.type] = (acc[event.type] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);
                metricData = {
                    type: 'total',
                    title: "Total Events",
                    description: "Breakdown of all calendar events",
                    data: {
                        total: events.length,
                        byType: eventsByType,
                        upcoming: events.filter(e => e.start > new Date()).length,
                        thisWeek: events.filter(e => {
                            const weekFromNow = new Date();
                            weekFromNow.setDate(weekFromNow.getDate() + 7);
                            return e.start <= weekFromNow && e.start >= new Date();
                        }).length
                    }
                };
                break;
            default:
                return;
        }

        setSelectedMetric(metricData);
    };

    if (isAuthLoading || isTenantLoading || loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <h1>🗓️ Loading Calendar...</h1>
                    <p>Building your production schedule...</p>
                </div>
            </div>
        );
    }

    if (!currentFarm) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h2>🚜 No Farm Selected</h2>
                    <p>Please select a farm to view the production calendar.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h2>⚠️ Calendar Error</h2>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className={styles.retryButton}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>📅 Production Calendar</h1>
                    <p className={styles.subtitle}>
                        Schedule and track your daily farm operations
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.toggleButton} ${viewMode === 'cards' ? styles.active : ''}`}
                            onClick={() => setViewMode('cards')}
                        >
                            📋 Cards
                        </button>
                        <button
                            className={`${styles.toggleButton} ${viewMode === 'timeline' ? styles.active : ''}`}
                            onClick={() => setViewMode('timeline')}
                        >
                            📊 Timeline
                        </button>
                    </div>
                    <button className={styles.addEventButton}>
                        + Add Event
                    </button>
                </div>
            </div>

            {/* Key Metrics - Clickable */}
            <div className={styles.metricsRow}>
                <div
                    className={styles.metricCard}
                    onClick={() => handleMetricClick('today')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleMetricClick('today');
                        }
                    }}
                    aria-label={`View details for today's ${getTodayEvents().length} tasks`}
                >
                    <div className={styles.metricIcon}>📅</div>
                    <div className={styles.metricContent}>
                        <div className={styles.metricValue}>{getTodayEvents().length}</div>
                        <div className={styles.metricLabel}>Today&apos;s Tasks</div>
                        <div className={styles.metricHint}>Click for details</div>
                    </div>
                </div>
                <div
                    className={styles.metricCard}
                    onClick={() => handleMetricClick('overdue')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleMetricClick('overdue');
                        }
                    }}
                    aria-label={`View details for ${getOverdueEvents().length} overdue items`}
                >
                    <div className={styles.metricIcon}>⚠️</div>
                    <div className={styles.metricContent}>
                        <div className={styles.metricValue}>{getOverdueEvents().length}</div>
                        <div className={styles.metricLabel}>Overdue Items</div>
                        <div className={styles.metricHint}>Click for details</div>
                    </div>
                </div>
                <div
                    className={styles.metricCard}
                    onClick={() => handleMetricClick('completion')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleMetricClick('completion');
                        }
                    }}
                    aria-label={`View completion rate details - ${getCompletionRate()}% complete`}
                >
                    <div className={styles.metricIcon}>✅</div>
                    <div className={styles.metricContent}>
                        <div className={styles.metricValue}>{getCompletionRate()}%</div>
                        <div className={styles.metricLabel}>Completion Rate</div>
                        <div className={styles.metricHint}>Click for breakdown</div>
                    </div>
                </div>
                <div
                    className={styles.metricCard}
                    onClick={() => handleMetricClick('total')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleMetricClick('total');
                        }
                    }}
                    aria-label={`View overview of all ${events.length} events`}
                >
                    <div className={styles.metricIcon}>📊</div>
                    <div className={styles.metricContent}>
                        <div className={styles.metricValue}>{events.length}</div>
                        <div className={styles.metricLabel}>Total Events</div>
                        <div className={styles.metricHint}>Click for overview</div>
                    </div>
                </div>
            </div>

            {/* Events Display */}
            {viewMode === 'cards' ? (
                <div className={styles.cardsGrid}>
                    {events.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📅</div>
                            <h3>No Events Yet</h3>
                            <p>Add your first production event to get started</p>
                        </div>
                    ) : (
                        events.slice(0, 12).map((event) => (
                            <div
                                key={event.id}
                                className={`${styles.eventCard} ${styles[event.type]}`}
                                onClick={() => setSelectedEvent(event)}
                            >
                                <div className={styles.cardHeader}>
                                    <span className={styles.cardType}>
                                        {getEventTypeIcon(event.type)} {event.type}
                                    </span>
                                    <span className={`${styles.eventStatus} ${styles[event.status]}`}>
                                        {event.status}
                                    </span>
                                </div>
                                <h3 className={styles.cardTitle}>{event.title}</h3>
                                <div className={styles.cardMeta}>
                                    <div className={styles.cardMetaItem}>
                                        <span>📅</span>
                                        <span>{event.start.toLocaleDateString()}</span>
                                    </div>
                                    <div className={styles.cardMetaItem}>
                                        <span>🏭</span>
                                        <span>{event.resource}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className={styles.timelineContainer}>
                    <div className={styles.timelineHeader}>
                        <span>Event</span>
                        <span>Date</span>
                        <span>Zone</span>
                        <span>Status</span>
                        <span>Actions</span>
                    </div>
                    <div className={styles.timelineList}>
                        {events.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>📅</div>
                                <h3>No Events Yet</h3>
                                <p>Add your first production event to get started</p>
                            </div>
                        ) : (
                            events
                                .sort((a, b) => a.start.getTime() - b.start.getTime())
                                .map((event) => (
                                    <div
                                        key={event.id}
                                        className={styles.timelineItem}
                                        onClick={() => setSelectedEvent(event)}
                                    >
                                        <div className={styles.eventInfo}>
                                            <div className={`${styles.eventIcon} ${styles[event.type]}`}>
                                                {getEventTypeIcon(event.type)}
                                            </div>
                                            <div className={styles.eventDetails}>
                                                <p className={styles.eventTitle}>{event.title}</p>
                                                <span className={styles.eventType}>{event.type}</span>
                                            </div>
                                        </div>
                                        <div className={styles.eventDate}>
                                            {event.start.toLocaleDateString()}
                                        </div>
                                        <div className={styles.eventZone}>
                                            {event.resource}
                                        </div>
                                        <div className={`${styles.eventStatus} ${styles[event.status]}`}>
                                            {event.status}
                                        </div>
                                        <div className={styles.eventActions}>
                                            <button
                                                className={styles.actionBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedEvent(event);
                                                }}
                                            >
                                                View
                                            </button>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            )}

            {events.length === 0 && (
                <div className={styles.emptyState}>
                    <h3>No Events Scheduled</h3>
                    <p>Your production calendar is empty. Add some events to get started!</p>
                    <button className={styles.addEventButton}>
                        + Add First Event
                    </button>
                </div>
            )}

            {/* Event Detail Modal with Edit Functionality */}
            {selectedEvent && (
                <div className={styles.modal} onClick={() => setSelectedEvent(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>📅 Event Details</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => setSelectedEvent(null)}
                            >
                                ×
                            </button>
                        </div>

                        {!isEditing ? (
                            <>
                                <div className={styles.modalBody}>
                                    <div className={styles.eventDetailGrid}>
                                        <div className={styles.detailItem}>
                                            <label>Title:</label>
                                            <span>{selectedEvent.title}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <label>Type:</label>
                                            <span>
                                                {getEventTypeIcon(selectedEvent.type)} {selectedEvent.type}
                                            </span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <label>Date & Time:</label>
                                            <span>
                                                {selectedEvent.start.toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <label>Resource:</label>
                                            <span>{selectedEvent.resource}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <label>Status:</label>
                                            <span
                                                className={styles.statusBadge}
                                                style={{ backgroundColor: getStatusColor(selectedEvent.status) }}
                                            >
                                                {selectedEvent.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.modalActions}>
                                    <button
                                        className={styles.primaryButton}
                                        onClick={() => handleEditEvent(selectedEvent)}
                                    >
                                        ✏️ Edit Event
                                    </button>
                                    {selectedEvent.status === 'scheduled' && (
                                        <button
                                            className={styles.secondaryButton}
                                            onClick={() => handleMarkComplete(selectedEvent)}
                                        >
                                            ✅ Mark Complete
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={styles.modalBody}>
                                    {saveError && (
                                        <div className={styles.errorMessage}>
                                            ⚠️ {saveError}
                                        </div>
                                    )}

                                    <div className={styles.editForm}>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="edit-title">Title:</label>
                                            <input
                                                id="edit-title"
                                                type="text"
                                                value={editingEvent?.title || ''}
                                                onChange={(e) => handleEditInputChange('title', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="Enter event title"
                                            />
                                        </div>

                                        <div className={styles.formRow}>
                                            <div className={styles.formGroup}>
                                                <label htmlFor="edit-type">Type:</label>
                                                <select
                                                    id="edit-type"
                                                    value={editingEvent?.type || ''}
                                                    onChange={(e) => handleEditInputChange('type', e.target.value)}
                                                    className={styles.formSelect}
                                                >
                                                    <option value="planting">🌱 Planting</option>
                                                    <option value="harvest">🌾 Harvest</option>
                                                    <option value="maintenance">🔧 Maintenance</option>
                                                    <option value="delivery">🚚 Delivery</option>
                                                </select>
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label htmlFor="edit-status">Status:</label>
                                                <select
                                                    id="edit-status"
                                                    value={editingEvent?.status || ''}
                                                    onChange={(e) => handleEditInputChange('status', e.target.value)}
                                                    className={styles.formSelect}
                                                >
                                                    <option value="scheduled">📅 Scheduled</option>
                                                    <option value="completed">✅ Completed</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className={styles.formRow}>
                                            <div className={styles.formGroup}>
                                                <label htmlFor="edit-start">Start Date:</label>
                                                <input
                                                    id="edit-start"
                                                    type="date"
                                                    value={editingEvent?.start || ''}
                                                    onChange={(e) => handleEditInputChange('start', e.target.value)}
                                                    className={styles.formInput}
                                                />
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label htmlFor="edit-end">End Date:</label>
                                                <input
                                                    id="edit-end"
                                                    type="date"
                                                    value={editingEvent?.end || ''}
                                                    onChange={(e) => handleEditInputChange('end', e.target.value)}
                                                    className={styles.formInput}
                                                />
                                            </div>
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label htmlFor="edit-resource">Resource/Location:</label>
                                            <input
                                                id="edit-resource"
                                                type="text"
                                                value={editingEvent?.resource || ''}
                                                onChange={(e) => handleEditInputChange('resource', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="Enter resource or location"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.modalActions}>
                                    <button
                                        className={styles.primaryButton}
                                        onClick={handleSaveEvent}
                                        disabled={saving}
                                    >
                                        {saving ? '💾 Saving...' : '💾 Save Changes'}
                                    </button>
                                    <button
                                        className={styles.secondaryButton}
                                        onClick={handleCancelEdit}
                                        disabled={saving}
                                    >
                                        ❌ Cancel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Metric Detail Modal */}
            {selectedMetric && (
                <div className={styles.modal} onClick={() => setSelectedMetric(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{selectedMetric.title}</h2>
                            <button
                                className={styles.closeButton}
                                onClick={() => setSelectedMetric(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <p className={styles.metricDescription}>{selectedMetric.description}</p>

                            {selectedMetric.type === 'today' || selectedMetric.type === 'overdue' ? (
                                <div className={styles.eventsList}>
                                    {selectedMetric.data.length > 0 ? (
                                        selectedMetric.data.map((event: ProductionEvent) => (
                                            <div key={event.id} className={styles.eventSummary}>
                                                <span className={styles.eventIcon}>
                                                    {getEventTypeIcon(event.type)}
                                                </span>
                                                <div className={styles.eventInfo}>
                                                    <strong>{event.title}</strong>
                                                    <span className={styles.eventResource}>{event.resource}</span>
                                                </div>
                                                <span
                                                    className={styles.eventStatus}
                                                    style={{ backgroundColor: getStatusColor(event.status) }}
                                                >
                                                    {event.status}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className={styles.emptyMessage}>
                                            <p>No {selectedMetric.type} events found.</p>
                                        </div>
                                    )}
                                </div>
                            ) : selectedMetric.type === 'completion' ? (
                                <div className={styles.completionStats}>
                                    <div className={styles.statRow}>
                                        <span>Completed Tasks:</span>
                                        <strong>{selectedMetric.data.completed}</strong>
                                    </div>
                                    <div className={styles.statRow}>
                                        <span>Scheduled Tasks:</span>
                                        <strong>{selectedMetric.data.scheduled}</strong>
                                    </div>
                                    <div className={styles.statRow}>
                                        <span>Total Tasks:</span>
                                        <strong>{selectedMetric.data.total}</strong>
                                    </div>
                                    <div className={styles.statRow}>
                                        <span>Completion Rate:</span>
                                        <strong>{selectedMetric.data.percentage}%</strong>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.totalStats}>
                                    <div className={styles.statRow}>
                                        <span>Upcoming Events:</span>
                                        <strong>{selectedMetric.data.upcoming}</strong>
                                    </div>
                                    <div className={styles.statRow}>
                                        <span>This Week:</span>
                                        <strong>{selectedMetric.data.thisWeek}</strong>
                                    </div>
                                    <div className={styles.typeBreakdown}>
                                        <h4>Events by Type:</h4>
                                        {Object.entries(selectedMetric.data.byType).map(([type, count]) => (
                                            <div key={type} className={styles.typeRow}>
                                                <span>{getEventTypeIcon(type as ProductionEvent['type'])} {type}:</span>
                                                <strong>{count as number}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className={styles.primaryButton}
                                onClick={() => setSelectedMetric(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 