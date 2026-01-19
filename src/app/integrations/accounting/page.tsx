'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card, Button } from '@/components/ui';
import styles from './page.module.css';

interface AccountingSystem {
    id: string;
    name: string;
    icon: string;
    connected: boolean;
    lastSync: string | null;
    status: 'active' | 'inactive' | 'error';
}

const SYSTEMS: AccountingSystem[] = [
    { id: 'quickbooks', name: 'QuickBooks Online', icon: '📗', connected: false, lastSync: null, status: 'inactive' },
    { id: 'xero', name: 'Xero', icon: '📘', connected: false, lastSync: null, status: 'inactive' },
    { id: 'freshbooks', name: 'FreshBooks', icon: '📙', connected: false, lastSync: null, status: 'inactive' },
    { id: 'wave', name: 'Wave', icon: '🌊', connected: false, lastSync: null, status: 'inactive' },
];

export default function AccountingPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [systems, setSystems] = useState<AccountingSystem[]>(SYSTEMS);
    const [syncSettings, setSyncSettings] = useState({
        autoSyncInvoices: true,
        autoSyncExpenses: true,
        syncFrequency: 'daily',
    });

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/auth/signin');
        }
    }, [isAuthLoading, isAuthenticated, router]);

    const handleConnect = (systemId: string) => {
        setSystems(systems.map(s => {
            if (s.id === systemId) {
                return {
                    ...s,
                    connected: true,
                    status: 'active' as const,
                    lastSync: new Date().toISOString(),
                };
            }
            return s;
        }));
    };

    const handleDisconnect = (systemId: string) => {
        if (!confirm('Are you sure you want to disconnect this accounting system?')) return;

        setSystems(systems.map(s => {
            if (s.id === systemId) {
                return { ...s, connected: false, status: 'inactive' as const, lastSync: null };
            }
            return s;
        }));
    };

    const connectedSystem = systems.find(s => s.connected);

    if (isAuthLoading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>💼 Accounting Integration</h1>
                    <p>Connect your accounting software to sync financial data</p>
                </div>
            </div>

            {connectedSystem ? (
                <Card className={styles.connectedCard}>
                    <div className={styles.connectedHeader}>
                        <span className={styles.connectedIcon}>{connectedSystem.icon}</span>
                        <div>
                            <h2>{connectedSystem.name}</h2>
                            <span className={styles.connectedStatus}>🟢 Connected</span>
                        </div>
                    </div>
                    <div className={styles.connectedDetails}>
                        <div className={styles.detailItem}>
                            <span>Last Sync:</span>
                            <strong>{connectedSystem.lastSync ? new Date(connectedSystem.lastSync).toLocaleString() : 'Never'}</strong>
                        </div>
                        <div className={styles.detailItem}>
                            <span>Status:</span>
                            <strong>Active</strong>
                        </div>
                    </div>
                    <div className={styles.connectedActions}>
                        <Button variant="primary">🔄 Sync Now</Button>
                        <Button variant="secondary" onClick={() => handleDisconnect(connectedSystem.id)}>
                            Disconnect
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className={styles.systemsGrid}>
                    {systems.map((system) => (
                        <Card key={system.id} className={styles.systemCard}>
                            <div className={styles.systemIcon}>{system.icon}</div>
                            <h3>{system.name}</h3>
                            <p>Sync invoices, expenses, and financial reports</p>
                            <Button variant="primary" onClick={() => handleConnect(system.id)}>
                                Connect
                            </Button>
                        </Card>
                    ))}
                </div>
            )}

            <Card className={styles.settingsCard}>
                <h2>⚙️ Sync Settings</h2>
                <div className={styles.settingsList}>
                    <label className={styles.settingItem}>
                        <div>
                            <strong>Auto-sync Invoices</strong>
                            <p>Automatically create invoices from orders</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={syncSettings.autoSyncInvoices}
                            onChange={(e) => setSyncSettings({ ...syncSettings, autoSyncInvoices: e.target.checked })}
                        />
                    </label>
                    <label className={styles.settingItem}>
                        <div>
                            <strong>Auto-sync Expenses</strong>
                            <p>Automatically record expenses from purchases</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={syncSettings.autoSyncExpenses}
                            onChange={(e) => setSyncSettings({ ...syncSettings, autoSyncExpenses: e.target.checked })}
                        />
                    </label>
                    <div className={styles.settingItem}>
                        <div>
                            <strong>Sync Frequency</strong>
                            <p>How often to sync data</p>
                        </div>
                        <select
                            value={syncSettings.syncFrequency}
                            onChange={(e) => setSyncSettings({ ...syncSettings, syncFrequency: e.target.value })}
                        >
                            <option value="realtime">Real-time</option>
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                        </select>
                    </div>
                </div>
            </Card>

            <Card className={styles.dataCard}>
                <h2>📊 Data Mapping</h2>
                <p>Configure how OFMS data maps to your accounting system</p>
                <div className={styles.mappingList}>
                    <div className={styles.mappingItem}>
                        <span>Orders</span>
                        <span>→</span>
                        <span>Invoices</span>
                    </div>
                    <div className={styles.mappingItem}>
                        <span>Customers</span>
                        <span>→</span>
                        <span>Customers/Contacts</span>
                    </div>
                    <div className={styles.mappingItem}>
                        <span>Seed Purchases</span>
                        <span>→</span>
                        <span>Expenses (Cost of Goods)</span>
                    </div>
                    <div className={styles.mappingItem}>
                        <span>Equipment</span>
                        <span>→</span>
                        <span>Fixed Assets</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
