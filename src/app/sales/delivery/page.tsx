'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import styles from './page.module.css';

interface Delivery {
    id: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    customerType: 'B2B' | 'B2C';
    deliveryDate: string;
    estimatedTime: string;
    status: 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
    address: string;
    city: string;
    state: string;
    zipCode: string;
    items: DeliveryItem[];
    driverName: string;
    vehicleId: string;
    totalValue: number;
    deliveryNotes?: string;
    signatureRequired: boolean;
    temperatureControlled: boolean;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    createdAt: string;
    updatedAt: string;
}

interface DeliveryItem {
    id: string;
    productName: string;
    quantity: number;
    unit: string;
    weight: number;
    packagingType: string;
    specialInstructions?: string;
}

interface Vehicle {
    id: string;
    name: string;
    type: string;
    capacity: number;
    currentLocation: string;
    status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
    temperatureControlled: boolean;
}

interface Driver {
    id: string;
    name: string;
    phone: string;
    currentDeliveries: number;
    status: 'AVAILABLE' | 'ON_ROUTE' | 'OFF_DUTY';
}

export default function DeliveryLogisticsPage() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [viewMode, setViewMode] = useState<'list' | 'map' | 'calendar'>('list');
    const { currentFarm } = useTenant();
    const { user } = useAuth();

    // Fetch delivery data from API - NO HARDCODED DATA
    useEffect(() => {
        const fetchDeliveryData = async () => {
            if (!currentFarm?.id) {
                setError('No farm context available');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                console.log('🚚 Loading delivery data for farm:', currentFarm.farm_name);

                // Fetch deliveries from database via API
                const deliveriesResponse = await fetch(`/api/deliveries?date=${selectedDate}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Farm-ID': currentFarm.id
                    }
                });

                if (!deliveriesResponse.ok) {
                    console.warn('Deliveries API not available, showing empty state');
                    setDeliveries([]);
                } else {
                    const deliveriesData = await deliveriesResponse.json();
                    console.log('✅ Deliveries loaded from database:', deliveriesData.data?.length || 0);
                    setDeliveries(deliveriesData.data || []);
                }

                // Fetch vehicles from database via API
                const vehiclesResponse = await fetch('/api/vehicles', {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Farm-ID': currentFarm.id
                    }
                });

                if (!vehiclesResponse.ok) {
                    console.warn('Vehicles API not available, showing empty state');
                    setVehicles([]);
                } else {
                    const vehiclesData = await vehiclesResponse.json();
                    console.log('✅ Vehicles loaded from database:', vehiclesData.data?.length || 0);
                    setVehicles(vehiclesData.data || []);
                }

                // Fetch drivers from database via API
                const driversResponse = await fetch('/api/drivers', {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Farm-ID': currentFarm.id
                    }
                });

                if (!driversResponse.ok) {
                    console.warn('Drivers API not available, showing empty state');
                    setDrivers([]);
                } else {
                    const driversData = await driversResponse.json();
                    console.log('✅ Drivers loaded from database:', driversData.data?.length || 0);
                    setDrivers(driversData.data || []);
                }

            } catch (err) {
                console.error('❌ Error fetching delivery data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load delivery data');
                // Empty states - NO FALLBACK TO HARDCODED DATA
                setDeliveries([]);
                setVehicles([]);
                setDrivers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDeliveryData();
    }, [currentFarm?.id, selectedDate]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return '#3b82f6';
            case 'IN_TRANSIT': return '#f59e0b';
            case 'DELIVERED': return '#10b981';
            case 'FAILED': return '#ef4444';
            case 'CANCELLED': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return '#dc2626';
            case 'HIGH': return '#ea580c';
            case 'MEDIUM': return '#d97706';
            case 'LOW': return '#65a30d';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return '📅';
            case 'IN_TRANSIT': return '🚚';
            case 'DELIVERED': return '✅';
            case 'FAILED': return '❌';
            case 'CANCELLED': return '🚫';
            default: return '📦';
        }
    };

    const filteredDeliveries = deliveries.filter(delivery => {
        if (filterStatus === 'ALL') return true;
        return delivery.status === filterStatus;
    });

    const handleStatusUpdate = (deliveryId: string, newStatus: string) => {
        setDeliveries(prev => prev.map(delivery =>
            delivery.id === deliveryId
                ? { ...delivery, status: newStatus as any, updatedAt: new Date().toISOString() }
                : delivery
        ));
    };

    const handleScheduleDelivery = () => {
        // TODO: Implement schedule delivery modal
        console.log('Schedule new delivery clicked');
    };

    const handleOptimizeRoutes = () => {
        // TODO: Implement route optimization
        console.log('Optimize routes clicked');
    };

    if (!currentFarm) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h2>No Farm Context</h2>
                    <p>Please select a farm to view delivery logistics.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <h2>Loading Delivery Logistics...</h2>
                    <p>Fetching delivery data for {currentFarm.farm_name}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h2>Error Loading Delivery Data</h2>
                    <p>{error}</p>
                    <button
                        className={styles.primaryButton}
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Delivery & Logistics</h1>
                    <p className={styles.subtitle}>
                        Manage deliveries and logistics for {currentFarm.farm_name}
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.secondaryButton} onClick={handleOptimizeRoutes}>
                        🗺️ Optimize Routes
                    </button>
                    <button className={styles.primaryButton} onClick={handleScheduleDelivery}>
                        + Schedule Delivery
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className={styles.controls}>
                <div className={styles.dateFilter}>
                    <label htmlFor="deliveryDate">Delivery Date:</label>
                    <input
                        id="deliveryDate"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className={styles.dateInput}
                    />
                </div>

                <div className={styles.statusFilter}>
                    <label htmlFor="statusFilter">Status:</label>
                    <select
                        id="statusFilter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className={styles.select}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="IN_TRANSIT">In Transit</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="FAILED">Failed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                <div className={styles.viewModeToggle}>
                    <button
                        className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        📋 List
                    </button>
                    <button
                        className={`${styles.viewButton} ${viewMode === 'map' ? styles.active : ''}`}
                        onClick={() => setViewMode('map')}
                    >
                        🗺️ Map
                    </button>
                    <button
                        className={`${styles.viewButton} ${viewMode === 'calendar' ? styles.active : ''}`}
                        onClick={() => setViewMode('calendar')}
                    >
                        📅 Calendar
                    </button>
                </div>
            </div>

            {/* Stats Dashboard - ALL FROM DATABASE */}
            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <span className={styles.statNumber}>{filteredDeliveries.length}</span>
                    <span className={styles.statLabel}>Total Deliveries</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statNumber}>
                        {filteredDeliveries.filter(d => d.status === 'SCHEDULED').length}
                    </span>
                    <span className={styles.statLabel}>Scheduled</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statNumber}>
                        {filteredDeliveries.filter(d => d.status === 'IN_TRANSIT').length}
                    </span>
                    <span className={styles.statLabel}>In Transit</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statNumber}>
                        {filteredDeliveries.filter(d => d.status === 'DELIVERED').length}
                    </span>
                    <span className={styles.statLabel}>Delivered</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statNumber}>
                        ${filteredDeliveries.reduce((sum, d) => sum + d.totalValue, 0).toLocaleString()}
                    </span>
                    <span className={styles.statLabel}>Total Value</span>
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                {viewMode === 'list' && (
                    <div className={styles.listView}>
                        {filteredDeliveries.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyContent}>
                                    <h3>No Deliveries Found</h3>
                                    <p>No deliveries found for {currentFarm.farm_name} on {new Date(selectedDate).toLocaleDateString()}.</p>
                                    <p>Create orders in the sales system to generate deliveries.</p>
                                    <button className={styles.primaryButton} onClick={handleScheduleDelivery}>
                                        + Schedule First Delivery
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.deliveriesGrid}>
                                {filteredDeliveries.map((delivery) => (
                                    <div key={delivery.id} className={styles.deliveryCard}>
                                        <div className={styles.cardHeader}>
                                            <div className={styles.orderInfo}>
                                                <span className={styles.statusIcon}>{getStatusIcon(delivery.status)}</span>
                                                <div>
                                                    <h3 className={styles.orderNumber}>{delivery.orderNumber}</h3>
                                                    <p className={styles.customerName}>{delivery.customerName}</p>
                                                </div>
                                            </div>
                                            <div className={styles.badges}>
                                                <span
                                                    className={styles.statusBadge}
                                                    style={{ backgroundColor: getStatusColor(delivery.status) }}
                                                >
                                                    {delivery.status}
                                                </span>
                                                <span
                                                    className={styles.priorityBadge}
                                                    style={{ backgroundColor: getPriorityColor(delivery.priority) }}
                                                >
                                                    {delivery.priority}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={styles.cardBody}>
                                            <div className={styles.deliveryDetails}>
                                                <div className={styles.detail}>
                                                    <span className={styles.label}>📍 Address:</span>
                                                    <span className={styles.value}>
                                                        {delivery.address}, {delivery.city}, {delivery.state} {delivery.zipCode}
                                                    </span>
                                                </div>
                                                <div className={styles.detail}>
                                                    <span className={styles.label}>⏰ Scheduled:</span>
                                                    <span className={styles.value}>
                                                        {new Date(delivery.deliveryDate).toLocaleDateString()} at {delivery.estimatedTime}
                                                    </span>
                                                </div>
                                                <div className={styles.detail}>
                                                    <span className={styles.label}>🚚 Driver:</span>
                                                    <span className={styles.value}>{delivery.driverName}</span>
                                                </div>
                                                <div className={styles.detail}>
                                                    <span className={styles.label}>💰 Value:</span>
                                                    <span className={styles.value}>${delivery.totalValue.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className={styles.itemsList}>
                                                <h4 className={styles.itemsTitle}>Items ({delivery.items.length})</h4>
                                                {delivery.items.map((item) => (
                                                    <div key={item.id} className={styles.item}>
                                                        <span className={styles.itemName}>{item.productName}</span>
                                                        <span className={styles.itemQuantity}>
                                                            {item.quantity} {item.unit}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {delivery.deliveryNotes && (
                                                <div className={styles.notes}>
                                                    <strong>Notes:</strong> {delivery.deliveryNotes}
                                                </div>
                                            )}

                                            <div className={styles.features}>
                                                {delivery.temperatureControlled && (
                                                    <span className={styles.feature}>🧊 Temperature Controlled</span>
                                                )}
                                                {delivery.signatureRequired && (
                                                    <span className={styles.feature}>✍️ Signature Required</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.cardActions}>
                                            <button className={styles.actionButton}>📍 Track</button>
                                            <button className={styles.actionButton}>📞 Contact</button>
                                            <button className={styles.actionButton}>📝 Update</button>
                                            <button className={styles.actionButton}>📄 Receipt</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'map' && (
                    <div className={styles.mapView}>
                        <div className={styles.mapPlaceholder}>
                            <h3>🗺️ Delivery Map View</h3>
                            <p>Interactive map showing delivery routes and real-time tracking</p>
                            <p><em>Map integration would be implemented here with Google Maps or Mapbox</em></p>
                            <p>Data source: Database deliveries for {currentFarm.farm_name}</p>
                        </div>
                    </div>
                )}

                {viewMode === 'calendar' && (
                    <div className={styles.calendarView}>
                        <div className={styles.calendarPlaceholder}>
                            <h3>📅 Delivery Calendar View</h3>
                            <p>Calendar interface for scheduling and managing deliveries</p>
                            <p><em>Calendar component would be implemented here</em></p>
                            <p>Data source: Database deliveries for {currentFarm.farm_name}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar Resources - ALL FROM DATABASE */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarCard}>
                    <h3>🚗 Available Vehicles</h3>
                    {vehicles.length === 0 ? (
                        <p className={styles.emptyText}>No vehicles found for {currentFarm.farm_name}</p>
                    ) : (
                        <div className={styles.resourceList}>
                            {vehicles.map((vehicle) => (
                                <div key={vehicle.id} className={styles.resourceItem}>
                                    <div className={styles.resourceInfo}>
                                        <strong>{vehicle.name}</strong>
                                        <span className={styles.resourceDetail}>
                                            {vehicle.capacity} lbs capacity
                                        </span>
                                        <span className={styles.resourceDetail}>
                                            📍 {vehicle.currentLocation}
                                        </span>
                                    </div>
                                    <span
                                        className={`${styles.resourceStatus} ${styles[vehicle.status.toLowerCase()]}`}
                                    >
                                        {vehicle.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.sidebarCard}>
                    <h3>👨‍💼 Drivers</h3>
                    {drivers.length === 0 ? (
                        <p className={styles.emptyText}>No drivers found for {currentFarm.farm_name}</p>
                    ) : (
                        <div className={styles.resourceList}>
                            {drivers.map((driver) => (
                                <div key={driver.id} className={styles.resourceItem}>
                                    <div className={styles.resourceInfo}>
                                        <strong>{driver.name}</strong>
                                        <span className={styles.resourceDetail}>
                                            📱 {driver.phone}
                                        </span>
                                        <span className={styles.resourceDetail}>
                                            🚚 {driver.currentDeliveries} active deliveries
                                        </span>
                                    </div>
                                    <span
                                        className={`${styles.resourceStatus} ${styles[driver.status.toLowerCase().replace('_', '')]}`}
                                    >
                                        {driver.status.replace('_', ' ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 