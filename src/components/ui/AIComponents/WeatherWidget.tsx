'use client';

import React, { useState, useEffect } from 'react';
import styles from './AIComponents.module.css';

interface WeatherData {
    temperature: number;
    humidity: number;
    conditions: string;
    uvIndex: number;
    windSpeed: number;
    precipitation: number;
}

interface WeatherForecast {
    date: Date;
    high: number;
    low: number;
    conditions: string;
    frostRisk: boolean;
    heatStressRisk: boolean;
}

interface WeatherAlert {
    id: string;
    type: string;
    title: string;
    description: string;
    severity: string;
}

interface WeatherWidgetProps {
    farmId: string;
    location: string;
}

const getWeatherIcon = (conditions: string): string => {
    const lower = conditions.toLowerCase();
    if (lower.includes('sun') || lower.includes('clear')) return '☀️';
    if (lower.includes('cloud') && lower.includes('part')) return '⛅';
    if (lower.includes('cloud')) return '☁️';
    if (lower.includes('rain')) return '🌧️';
    if (lower.includes('storm') || lower.includes('thunder')) return '⛈️';
    if (lower.includes('snow')) return '❄️';
    if (lower.includes('fog') || lower.includes('mist')) return '🌫️';
    return '🌤️';
};

export function WeatherWidget({ farmId, location }: WeatherWidgetProps) {
    const [current, setCurrent] = useState<WeatherData | null>(null);
    const [forecast, setForecast] = useState<WeatherForecast[]>([]);
    const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/ai/weather?location=${encodeURIComponent(location)}`, {
                    headers: { 'X-Farm-ID': farmId }
                });

                if (response.ok) {
                    const data = await response.json();
                    setCurrent(data.data.current);
                    setForecast(data.data.forecast.map((f: any) => ({
                        ...f,
                        date: new Date(f.date)
                    })));
                    setAlerts(data.data.alerts || []);
                } else {
                    throw new Error('Failed to fetch weather');
                }
            } catch (err) {
                setError('Unable to load weather data');
                // Use fallback data
                setCurrent({
                    temperature: 72,
                    humidity: 55,
                    conditions: 'Partly Cloudy',
                    uvIndex: 6,
                    windSpeed: 8,
                    precipitation: 0
                });
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [farmId, location]);

    if (loading) {
        return (
            <div className={styles.weatherWidget}>
                <div className={styles.shimmer} style={{ height: '200px', borderRadius: 'var(--border-radius-lg)' }} />
            </div>
        );
    }

    return (
        <div className={styles.weatherWidget}>
            <div className={styles.weatherHeader}>
                <div className={styles.weatherCurrent}>
                    <span className={styles.weatherIcon}>
                        {current ? getWeatherIcon(current.conditions) : '🌤️'}
                    </span>
                    <div>
                        <div className={styles.weatherTemp}>
                            {current?.temperature || '--'}°F
                        </div>
                        <div className={styles.weatherCondition}>
                            {current?.conditions || 'Loading...'}
                        </div>
                    </div>
                </div>
                <div className={styles.weatherLocation}>
                    📍 {location}
                </div>
            </div>

            <div className={styles.weatherDetails}>
                <div className={styles.weatherDetail}>
                    <div className={styles.weatherDetailIcon}>💧</div>
                    <div className={styles.weatherDetailValue}>{current?.humidity || '--'}%</div>
                    <div className={styles.weatherDetailLabel}>Humidity</div>
                </div>
                <div className={styles.weatherDetail}>
                    <div className={styles.weatherDetailIcon}>💨</div>
                    <div className={styles.weatherDetailValue}>{current?.windSpeed || '--'}</div>
                    <div className={styles.weatherDetailLabel}>Wind (mph)</div>
                </div>
                <div className={styles.weatherDetail}>
                    <div className={styles.weatherDetailIcon}>☀️</div>
                    <div className={styles.weatherDetailValue}>{current?.uvIndex || '--'}</div>
                    <div className={styles.weatherDetailLabel}>UV Index</div>
                </div>
                <div className={styles.weatherDetail}>
                    <div className={styles.weatherDetailIcon}>🌧️</div>
                    <div className={styles.weatherDetailValue}>{current?.precipitation || '0'}"</div>
                    <div className={styles.weatherDetailLabel}>Precip</div>
                </div>
            </div>

            <div className={styles.weatherForecast}>
                {forecast.slice(0, 5).map((day, index) => (
                    <div key={index} className={styles.forecastDay}>
                        <div className={styles.forecastDayName}>
                            {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={styles.forecastDayIcon}>
                            {getWeatherIcon(day.conditions)}
                            {day.frostRisk && <span title="Frost Risk">❄️</span>}
                            {day.heatStressRisk && <span title="Heat Risk">🔥</span>}
                        </div>
                        <div className={styles.forecastDayTemp}>{day.high}°</div>
                        <div className={styles.forecastDayLow}>{day.low}°</div>
                    </div>
                ))}
            </div>

            {alerts.length > 0 && (
                <div className={styles.weatherAlerts}>
                    {alerts.slice(0, 2).map(alert => (
                        <div key={alert.id} className={styles.weatherAlert}>
                            <span className={styles.weatherAlertIcon}>⚠️</span>
                            <div className={styles.weatherAlertContent}>
                                <h4>{alert.title}</h4>
                                <p>{alert.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
