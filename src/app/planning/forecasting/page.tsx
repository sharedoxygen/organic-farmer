'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card, Button } from '@/components/ui';
import { DemandForecastModal } from '@/components/ui/DemandForecastModal/DemandForecastModal';
import styles from './page.module.css';

interface DemandForecast {
    id: string;
    product: string;
    productType: string;
    currentDemand: number;
    predictedDemand: number;
    demandTrend: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
    forecastPeriod: string;
    recommendations: string[];
    lastUpdated: string;
}

export default function DemandForecastingPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm, isLoading: isTenantLoading } = useTenant();
    const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForecastModal, setShowForecastModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadForecasts = useCallback(async () => {
        if (!currentFarm) {
            console.log('No current farm, skipping forecasts load');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('📈 Loading demand forecasts for farm:', currentFarm.farm_name, currentFarm.id);

            const response = await fetch('/api/forecasts', {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Farm-ID': currentFarm.id,
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Forecasts loaded:', data.count, 'forecasts');

                // Since the API returns empty data with TODO, let's create some sample data structure
                // for demonstration until the full system is implemented
                const sampleForecasts: DemandForecast[] = [];

                setForecasts(data.success ? data.data : sampleForecasts);
            } else {
                console.error('Failed to fetch forecasts');
                setForecasts([]);
            }
        } catch (error) {
            console.error('Error loading forecasts:', error);
            setError('Failed to load demand forecasts');
            setForecasts([]);
        } finally {
            setLoading(false);
        }
    }, [currentFarm]);

    useEffect(() => {
        if (!isAuthLoading && !isTenantLoading) {
            if (isAuthenticated && currentFarm) {
                loadForecasts();
            } else if (!isAuthenticated) {
                router.push('/auth/signin');
            }
        }
    }, [isAuthLoading, isTenantLoading, isAuthenticated, currentFarm, router, loadForecasts]);

    const handleGenerateForecast = () => {
        console.log('Generate new forecast clicked');
        setShowForecastModal(true);
    };

    const handleViewAnalytics = () => {
        console.log('View analytics clicked');
        router.push('/analytics/market');
    };

    const handleSaveForecast = async (forecast: any) => {
        setSaving(true);
        try {
            console.log('💾 Saving forecast:', forecast);

            // Save forecast to database via API
            const response = await fetch('/api/forecasts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Farm-ID': currentFarm?.id || ''
                },
                body: JSON.stringify(forecast)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                console.log('✅ Forecast saved to database:', data.data);

                // Create local forecast object for immediate UI update
                const newForecast: DemandForecast = {
                    id: data.data.id,
                    product: forecast.crop,
                    productType: 'microgreens',
                    currentDemand: forecast.predictions[0]?.predictedDemand || 0,
                    predictedDemand: forecast.predictions.reduce((sum: number, pred: any) => sum + pred.predictedDemand, 0),
                    demandTrend: forecast.predictions.length > 1 && forecast.predictions[1].predictedDemand > forecast.predictions[0].predictedDemand ? 'increasing' : 'stable',
                    confidence: forecast.accuracy,
                    forecastPeriod: `${forecast.predictions.length} days`,
                    recommendations: [
                        `Optimize production for ${forecast.crop}`,
                        `Expected demand: ${forecast.predictions.reduce((sum: number, pred: any) => sum + pred.predictedDemand, 0)} units`,
                        `Confidence level: ${(forecast.accuracy * 100).toFixed(1)}%`
                    ],
                    lastUpdated: new Date().toISOString()
                };

                setForecasts(prev => [newForecast, ...prev]);
                console.log('✅ Forecast saved successfully');
            } else {
                throw new Error(data.error || 'Failed to save forecast');
            }

        } catch (error) {
            console.error('❌ Failed to save forecast:', error);
            throw error;
        } finally {
            setSaving(false);
        }
    };

    if (isAuthLoading || isTenantLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading demand forecasting...</p>
                </div>
            </div>
        );
    }

    if (!currentFarm) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <h3>🚜 No Farm Selected</h3>
                    <p>Please select a farm to view demand forecasts.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.errorState}>
                    <h2>⚠️ Error Loading Forecasts</h2>
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
                        <h1 className={styles.title}>📈 Demand Forecasting</h1>
                        <p className={styles.subtitle}>
                            AI-powered demand prediction and market analysis for {currentFarm.farm_name}
                        </p>
                    </div>
                    <div className={styles.headerActions}>
                        <Button variant="secondary" onClick={handleViewAnalytics}>
                            📊 View Analytics
                        </Button>
                        <Button variant="primary" onClick={handleGenerateForecast}>
                            🤖 Generate Forecast
                        </Button>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className={styles.metricsGrid}>
                <Card className={styles.metricCard}>
                    <div className={styles.metricContent}>
                        <div className={styles.metricIcon}>📊</div>
                        <div className={styles.metricDetails}>
                            <div className={styles.metricValue}>0</div>
                            <div className={styles.metricLabel}>Active Forecasts</div>
                        </div>
                    </div>
                </Card>
                <Card className={styles.metricCard}>
                    <div className={styles.metricContent}>
                        <div className={styles.metricIcon}>📈</div>
                        <div className={styles.metricDetails}>
                            <div className={styles.metricValue}>--</div>
                            <div className={styles.metricLabel}>Accuracy Rate</div>
                        </div>
                    </div>
                </Card>
                <Card className={styles.metricCard}>
                    <div className={styles.metricContent}>
                        <div className={styles.metricIcon}>🎯</div>
                        <div className={styles.metricDetails}>
                            <div className={styles.metricValue}>--</div>
                            <div className={styles.metricLabel}>Market Trends</div>
                        </div>
                    </div>
                </Card>
                <Card className={styles.metricCard}>
                    <div className={styles.metricContent}>
                        <div className={styles.metricIcon}>🔮</div>
                        <div className={styles.metricDetails}>
                            <div className={styles.metricValue}>--</div>
                            <div className={styles.metricLabel}>Next Update</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>Loading demand forecasts...</p>
                    </div>
                ) : forecasts.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🔮</div>
                        <h3>No Demand Forecasts Available</h3>
                        <p>
                            Start generating AI-powered demand forecasts to optimize your production planning
                            and maximize market opportunities.
                        </p>
                        <div className={styles.emptyActions}>
                            <Button variant="primary" onClick={handleGenerateForecast}>
                                🤖 Generate Your First Forecast
                            </Button>
                            <Button variant="secondary" onClick={handleViewAnalytics}>
                                📊 View Market Analytics
                            </Button>
                        </div>

                        <div className={styles.comingSoon}>
                            <h4>🚀 Coming Soon</h4>
                            <ul>
                                <li>AI-powered demand prediction models</li>
                                <li>Historical sales data analysis</li>
                                <li>Seasonal trend identification</li>
                                <li>Market price correlations</li>
                                <li>Customer behavior insights</li>
                                <li>Production optimization recommendations</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className={styles.forecastsGrid}>
                        {forecasts.map((forecast) => (
                            <Card key={forecast.id} className={styles.forecastCard}>
                                <div className={styles.cardHeader}>
                                    <h3>{forecast.product}</h3>
                                    <span className={`${styles.trendBadge} ${styles[forecast.demandTrend]}`}>
                                        {forecast.demandTrend}
                                    </span>
                                </div>
                                <div className={styles.cardContent}>
                                    <div className={styles.demandComparison}>
                                        <div className={styles.demandItem}>
                                            <span className={styles.label}>Current</span>
                                            <span className={styles.value}>{forecast.currentDemand}</span>
                                        </div>
                                        <div className={styles.demandArrow}>→</div>
                                        <div className={styles.demandItem}>
                                            <span className={styles.label}>Predicted</span>
                                            <span className={styles.value}>{forecast.predictedDemand}</span>
                                        </div>
                                    </div>
                                    <div className={styles.confidence}>
                                        Confidence: {forecast.confidence}%
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Demand Forecasting Modal */}
            <DemandForecastModal
                isOpen={showForecastModal}
                onClose={() => setShowForecastModal(false)}
                onSave={handleSaveForecast}
            />
        </div>
    );
}