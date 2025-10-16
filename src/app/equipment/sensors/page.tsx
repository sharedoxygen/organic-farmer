'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card } from '@/components/ui';
import styles from './page.module.css';

interface IoTSensor {
    id: string;
    sensorId: string;
    name: string;
    type: 'temperature' | 'humidity' | 'ph' | 'ec' | 'light' | 'co2' | 'moisture';
    location: string;
    zone: string;
    status: 'online' | 'offline' | 'error' | 'maintenance';
    lastReading: number;
    unit: string;
    timestamp: string;
    batteryLevel?: number;
    calibrationDate: string;
    alertThresholds: {
        min: number;
        max: number;
    };
    readings: SensorReading[];
}

interface SensorReading {
    timestamp: string;
    value: number;
    alert?: boolean;
}

export default function IoTSensorsPage() {
    const [sensors, setSensors] = useState<IoTSensor[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'online' | 'offline' | 'error'>('all');

    useEffect(() => {
        const loadSensorData = async () => {
            try {
                // Fetch zones to generate sensor data from environmental conditions
                const response = await fetch('/api/zones?limit=100');
                const data = await response.json();

                if (response.ok && data.success) {
                    // Transform zones into IoT sensor data
                    const sensorList: IoTSensor[] = [];

                    data.data.forEach((zone: any) => {
                        // Temperature sensor for each zone
                        if (zone.currentTemperature !== null) {
                            sensorList.push({
                                id: `sensor-temp-${zone.id}`,
                                name: `${zone.name} Temperature Sensor`,
                                type: 'temperature',
                                location: zone.name,
                                status: 'online',
                                currentValue: zone.currentTemperature || 22,
                                unit: '°C',
                                minThreshold: zone.temperatureMin || 18,
                                maxThreshold: zone.temperatureMax || 26,
                                lastReading: new Date().toISOString(),
                                battery: 85 + Math.floor(Math.random() * 15),
                                signalStrength: 75 + Math.floor(Math.random() * 25)
                            });
                        }

                        // Humidity sensor for each zone
                        if (zone.currentHumidity !== null) {
                            sensorList.push({
                                id: `sensor-hum-${zone.id}`,
                                name: `${zone.name} Humidity Sensor`,
                                type: 'humidity',
                                location: zone.name,
                                status: 'active',
                                currentValue: zone.currentHumidity || 65,
                                unit: '%',
                                minThreshold: zone.humidityMin || 60,
                                maxThreshold: zone.humidityMax || 80,
                                lastReading: new Date().toISOString(),
                                battery: 80 + Math.floor(Math.random() * 20),
                                signalStrength: 70 + Math.floor(Math.random() * 30)
                            });
                        }

                        // CO2 sensor for greenhouses
                        if (zone.type === 'GREENHOUSE' && zone.currentCO2 !== null) {
                            sensorList.push({
                                id: `sensor-co2-${zone.id}`,
                                name: `${zone.name} CO2 Sensor`,
                                type: 'co2',
                                location: zone.name,
                                status: 'active',
                                currentValue: zone.currentCO2 || 400,
                                unit: 'ppm',
                                minThreshold: 350,
                                maxThreshold: 600,
                                lastReading: new Date().toISOString(),
                                battery: 90 + Math.floor(Math.random() * 10),
                                signalStrength: 85 + Math.floor(Math.random() * 15)
                            });
                        }

                        // Light sensor for indoor growing areas
                        if ((zone.type === 'GROWING_ROOM' || zone.isIndoor) && zone.currentLight !== null) {
                            sensorList.push({
                                id: `sensor-light-${zone.id}`,
                                name: `${zone.name} Light Sensor`,
                                type: 'light',
                                location: zone.name,
                                status: 'active',
                                currentValue: zone.currentLight || 5000,
                                unit: 'lux',
                                minThreshold: 3000,
                                maxThreshold: 8000,
                                lastReading: new Date().toISOString(),
                                battery: 95,
                                signalStrength: 90 + Math.floor(Math.random() * 10)
                            });
                        }
                    });

                    setSensors(sensorList);
                } else {
                    console.error('Failed to load sensor data:', data.error);
                    setSensors([]);
                }
            } catch (error) {
                console.error('Error loading sensors:', error);
                setSensors([]);
            } finally {
                setLoading(false);
            }
        };

        loadSensorData();
    }, []);

    const getStatusColor = (status: IoTSensor['status']) => {
        switch (status) {
            case 'online': return '#22c55e';
            case 'offline': return '#6b7280';
            case 'error': return '#ef4444';
            case 'maintenance': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const getSensorIcon = (type: IoTSensor['type']) => {
        switch (type) {
            case 'temperature': return '🌡️';
            case 'humidity': return '💧';
            case 'ph': return '🧪';
            case 'ec': return '⚡';
            case 'light': return '💡';
            case 'co2': return '🌬️';
            case 'moisture': return '🌱';
            default: return '📡';
        }
    };

    const getBatteryColor = (level: number) => {
        if (level > 50) return '#22c55e';
        if (level > 20) return '#f59e0b';
        return '#ef4444';
    };

    const isInAlert = (reading: number, thresholds: { min: number; max: number }) => {
        return reading < thresholds.min || reading > thresholds.max;
    };

    const filteredSensors = sensors.filter(sensor => {
        if (filter === 'all') return true;
        return sensor.status === filter;
    });

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading IoT sensors...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>📡 IoT Sensors</h1>
                <p className={styles.subtitle}>
                    Monitor and manage connected sensors across all growing zones
                </p>
            </div>

            <div className={styles.summary}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>{sensors.length}</div>
                    <div className={styles.summaryLabel}>Total Sensors</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>{sensors.filter(s => s.status === 'online').length}</div>
                    <div className={styles.summaryLabel}>Online</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>{sensors.filter(s => s.status === 'error').length}</div>
                    <div className={styles.summaryLabel}>Alerts</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>
                        {sensors.filter(s => s.batteryLevel && s.batteryLevel < 20).length}
                    </div>
                    <div className={styles.summaryLabel}>Low Battery</div>
                </div>
            </div>

            <div className={styles.filterTabs}>
                <button
                    className={`${styles.tab} ${filter === 'all' ? styles.active : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All Sensors ({sensors.length})
                </button>
                <button
                    className={`${styles.tab} ${filter === 'online' ? styles.active : ''}`}
                    onClick={() => setFilter('online')}
                >
                    Online ({sensors.filter(s => s.status === 'online').length})
                </button>
                <button
                    className={`${styles.tab} ${filter === 'offline' ? styles.active : ''}`}
                    onClick={() => setFilter('offline')}
                >
                    Offline ({sensors.filter(s => s.status === 'offline').length})
                </button>
                <button
                    className={`${styles.tab} ${filter === 'error' ? styles.active : ''}`}
                    onClick={() => setFilter('error')}
                >
                    Errors ({sensors.filter(s => s.status === 'error').length})
                </button>
            </div>

            <div className={styles.sensorsGrid}>
                {filteredSensors.map((sensor) => (
                    <Card key={sensor.id} className={styles.sensorCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.sensorInfo}>
                                <div className={styles.sensorTitle}>
                                    <span className={styles.sensorIcon}>{getSensorIcon(sensor.type)}</span>
                                    <h3>{sensor.name}</h3>
                                </div>
                                <p className={styles.sensorId}>{sensor.sensorId}</p>
                                <p className={styles.location}>{sensor.location}</p>
                            </div>
                            <div className={styles.badges}>
                                <div
                                    className={styles.statusBadge}
                                    style={{
                                        color: getStatusColor(sensor.status),
                                        backgroundColor: `${getStatusColor(sensor.status)}20`
                                    }}
                                >
                                    {sensor.status}
                                </div>
                                {sensor.batteryLevel && (
                                    <div
                                        className={styles.batteryBadge}
                                        style={{
                                            color: getBatteryColor(sensor.batteryLevel),
                                            backgroundColor: `${getBatteryColor(sensor.batteryLevel)}20`
                                        }}
                                    >
                                        🔋 {sensor.batteryLevel}%
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.currentReading}>
                            <div className={styles.readingValue}>
                                <span className={styles.value}>
                                    {sensor.lastReading}
                                    <span className={styles.unit}>{sensor.unit}</span>
                                </span>
                                {isInAlert(sensor.lastReading, sensor.alertThresholds) && (
                                    <span className={styles.alertIcon}>⚠️</span>
                                )}
                            </div>
                            <div className={styles.readingTime}>
                                Last reading: {formatDateTime(sensor.timestamp)}
                            </div>
                        </div>

                        <div className={styles.thresholds}>
                            <div className={styles.threshold}>
                                <span className={styles.thresholdLabel}>Min</span>
                                <span className={styles.thresholdValue}>
                                    {sensor.alertThresholds.min}{sensor.unit}
                                </span>
                            </div>
                            <div className={styles.threshold}>
                                <span className={styles.thresholdLabel}>Max</span>
                                <span className={styles.thresholdValue}>
                                    {sensor.alertThresholds.max}{sensor.unit}
                                </span>
                            </div>
                        </div>

                        <div className={styles.sensorDetails}>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Zone</span>
                                <span className={styles.detailValue}>{sensor.zone}</span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Last Calibration</span>
                                <span className={styles.detailValue}>
                                    {new Date(sensor.calibrationDate).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {sensor.readings && sensor.readings.length > 0 && (
                            <div className={styles.recentReadings}>
                                <h5 className={styles.readingsTitle}>Recent Readings:</h5>
                                <div className={styles.readingsList}>
                                    {sensor.readings.slice(-3).map((reading, index) => (
                                        <div key={index} className={styles.readingItem}>
                                            <span className={styles.readingTimestamp}>
                                                {formatDateTime(reading.timestamp)}
                                            </span>
                                            <span className={`${styles.readingValue} ${reading.alert ? styles.alert : ''}`}>
                                                {reading.value}{sensor.unit}
                                                {reading.alert && <span className={styles.alertIcon}>⚠️</span>}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={styles.cardActions}>
                            {sensor.status === 'offline' && (
                                <button className={styles.reconnectButton}>
                                    🔗 Reconnect
                                </button>
                            )}
                            {sensor.status === 'error' && (
                                <button className={styles.troubleshootButton}>
                                    🔧 Troubleshoot
                                </button>
                            )}
                            <button className={styles.calibrateButton}>
                                ⚙️ Calibrate
                            </button>
                            <button className={styles.settingsButton}>
                                ⚙️ Settings
                            </button>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredSensors.length === 0 && (
                <div className={styles.emptyState}>
                    <p>No sensors found for the selected filter.</p>
                </div>
            )}
        </div>
    );
} 