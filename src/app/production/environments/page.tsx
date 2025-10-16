'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card, Button } from '@/components/ui';
import styles from './page.module.css';

interface GrowingEnvironment {
    id: string;
    name: string;
    type: string;
    location: string;
    maxBatches: number;
    totalArea: number;
    areaUnit: string;
    currentTemp: number;
    currentHumidity: number;
    currentLightLevel: number;
    currentCO2?: number;
    currentPH?: number;
    targetTempMin: number;
    targetTempMax: number;
    targetHumidityMin: number;
    targetHumidityMax: number;
    targetLightHours: number;
    targetCO2?: number;
    targetPH?: number;
    equipmentIds: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    farm_id: string;
}

export default function ProductionEnvironmentsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { currentFarm, isLoading: tenantLoading } = useTenant();

    const [environments, setEnvironments] = useState<GrowingEnvironment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEnvironment, setSelectedEnvironment] = useState<GrowingEnvironment | null>(null);

    const loadEnvironments = useCallback(async () => {
        if (!currentFarm) return;

        try {
            setLoading(true);
            setError(null);

            // Get user data for authorization
            const userData = localStorage.getItem('ofms_user');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Farm-ID': currentFarm.id
            };

            if (userData) {
                const user = JSON.parse(userData);
                headers['Authorization'] = `Bearer ${user.id}`;
            }

            console.log('🏢 Loading environments for farm:', currentFarm.farm_name);

            const response = await fetch('/api/environments', {
                method: 'GET',
                headers
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch environments: ${response.status}`);
            }

            const data = await response.json();
            console.log('🏗️ Loaded environments:', data);

            if (data.success) {
                setEnvironments(data.environments || []);
            } else {
                throw new Error(data.error || 'Failed to load environments');
            }
        } catch (err) {
            console.error('❌ Error loading environments:', err);
            setError(err instanceof Error ? err.message : 'Failed to load environments');
        } finally {
            setLoading(false);
        }
    }, [currentFarm]);

    // Load environments when farm changes
    useEffect(() => {
        if (currentFarm && isAuthenticated) {
            console.log('🏢 Loading environments for:', currentFarm.farm_name);
            loadEnvironments();
        }
    }, [currentFarm?.id, isAuthenticated, loadEnvironments]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/signin');
        }
    }, [isAuthenticated, authLoading, router]);

    if (authLoading || tenantLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading environments...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (!currentFarm) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h2>No Farm Selected</h2>
                    <p>Please select a farm to view growing environments.</p>
                </div>
            </div>
        );
    }

    const getEnvironmentTypeIcon = (type: string) => {
        switch (type) {
            case 'indoor': return '🏠';
            case 'greenhouse': return '🏡';
            case 'high_tunnel': return '🏗️';
            case 'grow_room': return '🌿';
            case 'nursery': return '🌱';
            default: return '📍';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'optimal': return 'var(--success-color)';
            case 'warning': return 'var(--warning-color)';
            case 'critical': return 'var(--danger-color)';
            default: return 'var(--text-secondary)';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'optimal': return 'Optimal';
            case 'warning': return 'Needs Attention';
            case 'critical': return 'Critical';
            default: return 'Unknown';
        }
    };

    const isWithinRange = (current: number, min: number, max: number) => {
        return current >= min && current <= max;
    };

    const handleEnvironmentClick = (environment: GrowingEnvironment) => {
        setSelectedEnvironment(environment);
    };

    const closeModal = () => {
        setSelectedEnvironment(null);
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.title}>Growing Environments</h1>
                        <p className={styles.subtitle}>
                            {currentFarm.farm_name} • {environments.length} environments
                        </p>
                    </div>
                    <div className={styles.headerRight}>
                        <Button
                            variant="primary"
                            onClick={() => console.log('Add Environment')}
                        >
                            Add Environment
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className={styles.content}>
                {loading && (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading environments...</p>
                    </div>
                )}

                {error && (
                    <div className={styles.error}>
                        <h3>Error Loading Environments</h3>
                        <p>{error}</p>
                        <Button variant="secondary" onClick={loadEnvironments}>
                            Try Again
                        </Button>
                    </div>
                )}

                {!loading && !error && environments.length === 0 && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🏗️</div>
                        <h3>No Growing Environments</h3>
                        <p>Set up your first growing environment to start tracking environmental conditions.</p>
                        <Button variant="primary" onClick={() => console.log('Add Environment')}>
                            Add Environment
                        </Button>
                    </div>
                )}

                {!loading && !error && environments.length > 0 && (
                    <div className={styles.environmentsGrid}>
                        {environments.map((environment) => (
                            <Card
                                key={environment.id}
                                className={styles.environmentCard}
                                onClick={() => handleEnvironmentClick(environment)}
                            >
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardTitle}>
                                        <span className={styles.environmentIcon}>
                                            {getEnvironmentTypeIcon(environment.type)}
                                        </span>
                                        <div>
                                            <h3>{environment.name}</h3>
                                            <p className={styles.environmentType}>{environment.type.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                    <div
                                        className={styles.statusBadge}
                                        style={{ backgroundColor: getStatusColor(environment.status) }}
                                    >
                                        {getStatusText(environment.status)}
                                    </div>
                                </div>

                                <div className={styles.cardContent}>
                                    <div className={styles.locationInfo}>
                                        <span className={styles.locationIcon}>📍</span>
                                        <span>{environment.location}</span>
                                    </div>

                                    <div className={styles.environmentStats}>
                                        <div className={styles.statRow}>
                                            <div className={styles.stat}>
                                                <span className={styles.statLabel}>Temperature</span>
                                                <span className={styles.statValue}>
                                                    {environment.currentTemp}°C
                                                </span>
                                                <span className={styles.statRange}>
                                                    {isWithinRange(environment.currentTemp, environment.targetTempMin, environment.targetTempMax) ? '✅' : '⚠️'}
                                                </span>
                                            </div>
                                            <div className={styles.stat}>
                                                <span className={styles.statLabel}>Humidity</span>
                                                <span className={styles.statValue}>
                                                    {environment.currentHumidity}%
                                                </span>
                                                <span className={styles.statRange}>
                                                    {isWithinRange(environment.currentHumidity, environment.targetHumidityMin, environment.targetHumidityMax) ? '✅' : '⚠️'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={styles.statRow}>
                                            <div className={styles.stat}>
                                                <span className={styles.statLabel}>Light</span>
                                                <span className={styles.statValue}>
                                                    {environment.currentLightLevel} μmol/m²/s
                                                </span>
                                            </div>
                                            <div className={styles.stat}>
                                                <span className={styles.statLabel}>Capacity</span>
                                                <span className={styles.statValue}>
                                                    {environment.maxBatches} batches
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Environment Details Modal */}
            {selectedEnvironment && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>{selectedEnvironment.name}</h2>
                            <button
                                className={styles.closeButton}
                                onClick={closeModal}
                            >
                                ×
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.environmentDetails}>
                                <div className={styles.detailSection}>
                                    <h3>Environment Info</h3>
                                    <div className={styles.detailGrid}>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Type:</span>
                                            <span className={styles.detailValue}>{selectedEnvironment.type.replace('_', ' ')}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Location:</span>
                                            <span className={styles.detailValue}>{selectedEnvironment.location}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Total Area:</span>
                                            <span className={styles.detailValue}>{selectedEnvironment.totalArea} {selectedEnvironment.areaUnit}</span>
                                        </div>
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Max Batches:</span>
                                            <span className={styles.detailValue}>{selectedEnvironment.maxBatches}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.detailSection}>
                                    <h3>Current Conditions</h3>
                                    <div className={styles.conditionsGrid}>
                                        <div className={styles.conditionItem}>
                                            <span className={styles.conditionLabel}>Temperature</span>
                                            <span className={styles.conditionValue}>{selectedEnvironment.currentTemp}°C</span>
                                            <span className={styles.conditionRange}>
                                                Target: {selectedEnvironment.targetTempMin}°C - {selectedEnvironment.targetTempMax}°C
                                            </span>
                                        </div>
                                        <div className={styles.conditionItem}>
                                            <span className={styles.conditionLabel}>Humidity</span>
                                            <span className={styles.conditionValue}>{selectedEnvironment.currentHumidity}%</span>
                                            <span className={styles.conditionRange}>
                                                Target: {selectedEnvironment.targetHumidityMin}% - {selectedEnvironment.targetHumidityMax}%
                                            </span>
                                        </div>
                                        <div className={styles.conditionItem}>
                                            <span className={styles.conditionLabel}>Light Intensity</span>
                                            <span className={styles.conditionValue}>{selectedEnvironment.currentLightLevel} μmol/m²/s</span>
                                            <span className={styles.conditionRange}>
                                                Target: {selectedEnvironment.targetLightHours} hours/day
                                            </span>
                                        </div>
                                        {selectedEnvironment.currentCO2 && (
                                            <div className={styles.conditionItem}>
                                                <span className={styles.conditionLabel}>CO2</span>
                                                <span className={styles.conditionValue}>{selectedEnvironment.currentCO2} ppm</span>
                                                <span className={styles.conditionRange}>
                                                    Target: {selectedEnvironment.targetCO2} ppm
                                                </span>
                                            </div>
                                        )}
                                        {selectedEnvironment.currentPH && (
                                            <div className={styles.conditionItem}>
                                                <span className={styles.conditionLabel}>pH</span>
                                                <span className={styles.conditionValue}>{selectedEnvironment.currentPH}</span>
                                                <span className={styles.conditionRange}>
                                                    Target: {selectedEnvironment.targetPH}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.detailSection}>
                                    <h3>Equipment</h3>
                                    <div className={styles.equipmentList}>
                                        {selectedEnvironment.equipmentIds.split(',').map((equipment, index) => (
                                            <span key={index} className={styles.equipmentTag}>
                                                {equipment.trim().replace(/-/g, ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <Button variant="secondary" onClick={closeModal}>
                                Close
                            </Button>
                            <Button variant="primary" onClick={() => console.log('Edit Environment')}>
                                Edit Environment
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 