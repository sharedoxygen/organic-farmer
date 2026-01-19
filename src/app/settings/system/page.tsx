'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card, Button } from '@/components/ui';
import styles from './page.module.css';

interface SystemSettings {
    timezone: string;
    dateFormat: string;
    currency: string;
    measurementSystem: 'metric' | 'imperial';
    language: string;
    defaultHarvestUnit: string;
    autoBackup: boolean;
    backupFrequency: string;
    emailNotifications: boolean;
    lowStockAlerts: boolean;
    harvestReminders: boolean;
}

const TIMEZONES = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney',
];

const DATE_FORMATS = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
];

const CURRENCIES = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD ($)' },
    { value: 'AUD', label: 'AUD ($)' },
];

export default function SystemConfigPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [settings, setSettings] = useState<SystemSettings>({
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        measurementSystem: 'imperial',
        language: 'en',
        defaultHarvestUnit: 'oz',
        autoBackup: true,
        backupFrequency: 'daily',
        emailNotifications: true,
        lowStockAlerts: true,
        harvestReminders: true,
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/auth/signin');
        }
    }, [isAuthLoading, isAuthenticated, router]);

    const handleChange = (field: keyof SystemSettings, value: string | boolean) => {
        setSettings({ ...settings, [field]: value });
        setSaved(false);
    };

    const handleSave = async () => {
        setLoading(true);
        // In production, this would save to the API
        await new Promise(resolve => setTimeout(resolve, 500));
        setLoading(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    if (isAuthLoading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>⚙️ System Configuration</h1>
                <p>Configure core system settings and preferences for {currentFarm?.farm_name || 'your farm'}</p>
            </div>

            <div className={styles.sections}>
                <Card className={styles.section}>
                    <h2>🌍 Regional Settings</h2>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Timezone</label>
                            <select
                                value={settings.timezone}
                                onChange={(e) => handleChange('timezone', e.target.value)}
                            >
                                {TIMEZONES.map((tz) => (
                                    <option key={tz} value={tz}>{tz}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Date Format</label>
                            <select
                                value={settings.dateFormat}
                                onChange={(e) => handleChange('dateFormat', e.target.value)}
                            >
                                {DATE_FORMATS.map((fmt) => (
                                    <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Currency</label>
                            <select
                                value={settings.currency}
                                onChange={(e) => handleChange('currency', e.target.value)}
                            >
                                {CURRENCIES.map((curr) => (
                                    <option key={curr.value} value={curr.value}>{curr.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Measurement System</label>
                            <select
                                value={settings.measurementSystem}
                                onChange={(e) => handleChange('measurementSystem', e.target.value as 'metric' | 'imperial')}
                            >
                                <option value="imperial">Imperial (oz, lb, °F)</option>
                                <option value="metric">Metric (g, kg, °C)</option>
                            </select>
                        </div>
                    </div>
                </Card>

                <Card className={styles.section}>
                    <h2>🌱 Farm Defaults</h2>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Default Harvest Unit</label>
                            <select
                                value={settings.defaultHarvestUnit}
                                onChange={(e) => handleChange('defaultHarvestUnit', e.target.value)}
                            >
                                <option value="oz">Ounces (oz)</option>
                                <option value="lb">Pounds (lb)</option>
                                <option value="g">Grams (g)</option>
                                <option value="kg">Kilograms (kg)</option>
                                <option value="trays">Trays</option>
                            </select>
                        </div>
                    </div>
                </Card>

                <Card className={styles.section}>
                    <h2>💾 Backup Settings</h2>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={settings.autoBackup}
                                    onChange={(e) => handleChange('autoBackup', e.target.checked)}
                                />
                                <span>Enable Automatic Backups</span>
                            </label>
                        </div>
                        {settings.autoBackup && (
                            <div className={styles.formGroup}>
                                <label>Backup Frequency</label>
                                <select
                                    value={settings.backupFrequency}
                                    onChange={(e) => handleChange('backupFrequency', e.target.value)}
                                >
                                    <option value="hourly">Hourly</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                </select>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className={styles.section}>
                    <h2>🔔 Notification Preferences</h2>
                    <div className={styles.toggleList}>
                        <label className={styles.toggleItem}>
                            <span>Email Notifications</span>
                            <input
                                type="checkbox"
                                checked={settings.emailNotifications}
                                onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                            />
                        </label>
                        <label className={styles.toggleItem}>
                            <span>Low Stock Alerts</span>
                            <input
                                type="checkbox"
                                checked={settings.lowStockAlerts}
                                onChange={(e) => handleChange('lowStockAlerts', e.target.checked)}
                            />
                        </label>
                        <label className={styles.toggleItem}>
                            <span>Harvest Reminders</span>
                            <input
                                type="checkbox"
                                checked={settings.harvestReminders}
                                onChange={(e) => handleChange('harvestReminders', e.target.checked)}
                            />
                        </label>
                    </div>
                </Card>
            </div>

            <div className={styles.actions}>
                {saved && <span className={styles.savedMessage}>✓ Settings saved</span>}
                <Button variant="primary" onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </div>
    );
}
