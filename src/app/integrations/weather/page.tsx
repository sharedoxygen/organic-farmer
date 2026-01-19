'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card, Button } from '@/components/ui';
import styles from './page.module.css';

interface WeatherData {
    current: {
        temp: number;
        humidity: number;
        conditions: string;
        windSpeed: number;
        uvIndex: number;
    };
    forecast: Array<{
        date: string;
        high: number;
        low: number;
        conditions: string;
        precipitation: number;
    }>;
    alerts: Array<{
        type: string;
        message: string;
        severity: 'info' | 'warning' | 'critical';
    }>;
}

export default function WeatherIntegrationPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(true);

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/auth/signin');
            return;
        }
        loadWeatherData();
    }, [isAuthLoading, isAuthenticated, router]);

    const loadWeatherData = async () => {
        setLoading(true);
        // Simulated weather data - in production would connect to weather API
        await new Promise(resolve => setTimeout(resolve, 500));

        setWeather({
            current: {
                temp: 72,
                humidity: 65,
                conditions: 'Partly Cloudy',
                windSpeed: 8,
                uvIndex: 6,
            },
            forecast: [
                { date: new Date().toISOString(), high: 75, low: 58, conditions: 'Sunny', precipitation: 0 },
                { date: new Date(Date.now() + 86400000).toISOString(), high: 78, low: 60, conditions: 'Partly Cloudy', precipitation: 10 },
                { date: new Date(Date.now() + 172800000).toISOString(), high: 72, low: 55, conditions: 'Rain', precipitation: 80 },
                { date: new Date(Date.now() + 259200000).toISOString(), high: 68, low: 52, conditions: 'Cloudy', precipitation: 30 },
                { date: new Date(Date.now() + 345600000).toISOString(), high: 70, low: 54, conditions: 'Sunny', precipitation: 5 },
            ],
            alerts: [
                { type: 'Frost Warning', message: 'Potential frost expected in 3 days. Consider protective measures for sensitive crops.', severity: 'warning' },
            ],
        });
        setLoading(false);
    };

    const getConditionIcon = (condition: string) => {
        switch (condition.toLowerCase()) {
            case 'sunny': return '☀️';
            case 'partly cloudy': return '⛅';
            case 'cloudy': return '☁️';
            case 'rain': return '🌧️';
            case 'storm': return '⛈️';
            default: return '🌤️';
        }
    };

    if (isAuthLoading || loading) {
        return <div className={styles.loading}>Loading weather data...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>🌤️ Weather Integration</h1>
                    <p>Real-time weather data and forecasts for {currentFarm?.farm_name || 'your farm'}</p>
                </div>
                <div className={styles.headerActions}>
                    <span className={`${styles.connectionStatus} ${connected ? styles.connected : styles.disconnected}`}>
                        {connected ? '🟢 Connected' : '🔴 Disconnected'}
                    </span>
                    <Button variant="secondary" onClick={loadWeatherData}>
                        🔄 Refresh
                    </Button>
                </div>
            </div>

            {weather?.alerts && weather.alerts.length > 0 && (
                <div className={styles.alerts}>
                    {weather.alerts.map((alert, index) => (
                        <Card key={index} className={`${styles.alertCard} ${styles[alert.severity]}`}>
                            <strong>⚠️ {alert.type}</strong>
                            <p>{alert.message}</p>
                        </Card>
                    ))}
                </div>
            )}

            <div className={styles.currentWeather}>
                <Card className={styles.currentCard}>
                    <h2>Current Conditions</h2>
                    <div className={styles.currentMain}>
                        <span className={styles.currentIcon}>{getConditionIcon(weather?.current.conditions || '')}</span>
                        <span className={styles.currentTemp}>{weather?.current.temp}°F</span>
                        <span className={styles.currentConditions}>{weather?.current.conditions}</span>
                    </div>
                    <div className={styles.currentDetails}>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>💧 Humidity</span>
                            <span className={styles.detailValue}>{weather?.current.humidity}%</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>💨 Wind</span>
                            <span className={styles.detailValue}>{weather?.current.windSpeed} mph</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>☀️ UV Index</span>
                            <span className={styles.detailValue}>{weather?.current.uvIndex}</span>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className={styles.forecastCard}>
                <h2>5-Day Forecast</h2>
                <div className={styles.forecastGrid}>
                    {weather?.forecast.map((day, index) => (
                        <div key={index} className={styles.forecastDay}>
                            <div className={styles.forecastDate}>
                                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div className={styles.forecastIcon}>{getConditionIcon(day.conditions)}</div>
                            <div className={styles.forecastTemps}>
                                <span className={styles.high}>{day.high}°</span>
                                <span className={styles.low}>{day.low}°</span>
                            </div>
                            <div className={styles.forecastPrecip}>
                                💧 {day.precipitation}%
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card className={styles.settingsCard}>
                <h2>⚙️ Integration Settings</h2>
                <div className={styles.settingsList}>
                    <div className={styles.settingItem}>
                        <div>
                            <strong>Weather Provider</strong>
                            <p>OpenWeatherMap API</p>
                        </div>
                        <Button variant="secondary" size="sm">Configure</Button>
                    </div>
                    <div className={styles.settingItem}>
                        <div>
                            <strong>Location</strong>
                            <p>Naples, FL 34102</p>
                        </div>
                        <Button variant="secondary" size="sm">Update</Button>
                    </div>
                    <div className={styles.settingItem}>
                        <div>
                            <strong>Alert Notifications</strong>
                            <p>Email and in-app alerts enabled</p>
                        </div>
                        <Button variant="secondary" size="sm">Manage</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
