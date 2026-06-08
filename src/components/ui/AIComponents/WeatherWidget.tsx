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
    coordinates?: { lat: number; lng: number };
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

// Default coordinates for common farm locations
const LOCATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
    'Naples, FL': { lat: 26.1420, lng: -81.7948 },
    'Kinkead, VA': { lat: 37.5407, lng: -77.4360 },
    'New York, NY': { lat: 40.7128, lng: -74.0060 },
    'United States': { lat: 39.8283, lng: -98.5795 },
};

export function WeatherWidget({ farmId, location, coordinates }: WeatherWidgetProps) {
    const [current, setCurrent] = useState<WeatherData | null>(null);
    const [forecast, setForecast] = useState<WeatherForecast[]>([]);
    const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);

    // Geocode location to get coordinates for the map
    useEffect(() => {
        const geocodeLocation = async () => {
            // Use provided coordinates if available
            if (coordinates) {
                setMapCoords(coordinates);
                return;
            }

            // Check predefined locations first
            if (LOCATION_COORDINATES[location]) {
                setMapCoords(LOCATION_COORDINATES[location]);
                return;
            }

            // Try to geocode using Nominatim (OpenStreetMap's free geocoding service)
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
                    { headers: { 'User-Agent': 'OFMS-FarmApp/1.0' } }
                );
                const data = await response.json();
                if (data && data.length > 0) {
                    setMapCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
                } else {
                    // Fallback to default
                    setMapCoords(LOCATION_COORDINATES['United States']);
                }
            } catch (err) {
                console.warn('Geocoding failed, using default coordinates');
                setMapCoords(LOCATION_COORDINATES['United States']);
            }
        };

        geocodeLocation();
    }, [location, coordinates]);

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

    // Generate OpenStreetMap tile URL for the map
    const getMapUrl = () => {
        if (!mapCoords) return null;
        // Wider bounding box for better context
        return `https://www.openstreetmap.org/export/embed.html?bbox=${mapCoords.lng - 0.02}%2C${mapCoords.lat - 0.012}%2C${mapCoords.lng + 0.02}%2C${mapCoords.lat + 0.012}&layer=mapnik&marker=${mapCoords.lat}%2C${mapCoords.lng}`;
    };

    return (
        <div className={styles.weatherWidget}>
            {/* Dynamic Map Section with Location Label */}
            {mapCoords && (
                <div className={styles.weatherMap}>
                    <iframe
                        width="100%"
                        height="200"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight={0}
                        marginWidth={0}
                        src={getMapUrl() || ''}
                        style={{ borderRadius: 'var(--border-radius-lg) var(--border-radius-lg) 0 0' }}
                        title={`Map of ${location}`}
                    />
                    <div className={styles.mapLocationLabel}>
                        <span className={styles.mapLocationIcon}>📍</span>
                        <span className={styles.mapLocationText}>{location}</span>
                    </div>
                </div>
            )}
            <div className={styles.weatherHeader}>
                <div className={styles.weatherCurrent}>
                    <span className={styles.weatherIcon}>
                        {current ? getWeatherIcon(current.conditions) : '🌤️'}
                    </span>
                    <div>
                        <div className={styles.weatherTemp}>
                            {current?.temperature ? Math.round(current.temperature) : '--'}°F
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
                    <div className={styles.weatherDetailValue}>{current?.humidity ? Math.round(current.humidity) : '--'}%</div>
                    <div className={styles.weatherDetailLabel}>Humidity</div>
                </div>
                <div className={styles.weatherDetail}>
                    <div className={styles.weatherDetailIcon}>💨</div>
                    <div className={styles.weatherDetailValue}>{current?.windSpeed ? Math.round(current.windSpeed) : '--'}</div>
                    <div className={styles.weatherDetailLabel}>Wind (mph)</div>
                </div>
                <div className={styles.weatherDetail}>
                    <div className={styles.weatherDetailIcon}>☀️</div>
                    <div className={styles.weatherDetailValue}>{current?.uvIndex ? Math.round(current.uvIndex) : '--'}</div>
                    <div className={styles.weatherDetailLabel}>UV Index</div>
                </div>
                <div className={styles.weatherDetail}>
                    <div className={styles.weatherDetailIcon}>🌧️</div>
                    <div className={styles.weatherDetailValue}>{current?.precipitation ? current.precipitation.toFixed(1) : '0'}"</div>
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
                        <div className={styles.forecastDayTemp}>{Math.round(day.high)}°</div>
                        <div className={styles.forecastDayLow}>{Math.round(day.low)}°</div>
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
