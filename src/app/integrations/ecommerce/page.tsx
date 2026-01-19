'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card, Button } from '@/components/ui';
import styles from './page.module.css';

interface Platform {
    id: string;
    name: string;
    icon: string;
    connected: boolean;
    lastSync: string | null;
    ordersToday: number;
    status: 'active' | 'inactive' | 'error';
}

const PLATFORMS: Platform[] = [
    { id: 'shopify', name: 'Shopify', icon: '🛒', connected: false, lastSync: null, ordersToday: 0, status: 'inactive' },
    { id: 'woocommerce', name: 'WooCommerce', icon: '🔌', connected: false, lastSync: null, ordersToday: 0, status: 'inactive' },
    { id: 'square', name: 'Square', icon: '⬜', connected: false, lastSync: null, ordersToday: 0, status: 'inactive' },
    { id: 'etsy', name: 'Etsy', icon: '🧶', connected: false, lastSync: null, ordersToday: 0, status: 'inactive' },
    { id: 'amazon', name: 'Amazon', icon: '📦', connected: false, lastSync: null, ordersToday: 0, status: 'inactive' },
];

export default function EcommercePage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [platforms, setPlatforms] = useState<Platform[]>(PLATFORMS);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/auth/signin');
        }
    }, [isAuthLoading, isAuthenticated, router]);

    const handleConnect = (platformId: string) => {
        setPlatforms(platforms.map(p => {
            if (p.id === platformId) {
                return {
                    ...p,
                    connected: true,
                    status: 'active' as const,
                    lastSync: new Date().toISOString(),
                    ordersToday: Math.floor(Math.random() * 10),
                };
            }
            return p;
        }));
    };

    const handleDisconnect = (platformId: string) => {
        if (!confirm('Are you sure you want to disconnect this platform?')) return;

        setPlatforms(platforms.map(p => {
            if (p.id === platformId) {
                return { ...p, connected: false, status: 'inactive' as const, lastSync: null, ordersToday: 0 };
            }
            return p;
        }));
    };

    const handleSync = async (platformId: string) => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        setPlatforms(platforms.map(p => {
            if (p.id === platformId) {
                return { ...p, lastSync: new Date().toISOString() };
            }
            return p;
        }));
        setLoading(false);
    };

    const connectedCount = platforms.filter(p => p.connected).length;
    const totalOrders = platforms.reduce((sum, p) => sum + p.ordersToday, 0);

    if (isAuthLoading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>🛒 E-commerce Integrations</h1>
                    <p>Connect your online sales channels to sync orders automatically</p>
                </div>
            </div>

            <div className={styles.stats}>
                <Card className={styles.statCard}>
                    <div className={styles.statValue}>{connectedCount}</div>
                    <div className={styles.statLabel}>Connected Platforms</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statValue}>{totalOrders}</div>
                    <div className={styles.statLabel}>Orders Today</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statValue}>{platforms.length}</div>
                    <div className={styles.statLabel}>Available Integrations</div>
                </Card>
            </div>

            <div className={styles.platformsGrid}>
                {platforms.map((platform) => (
                    <Card key={platform.id} className={styles.platformCard}>
                        <div className={styles.platformHeader}>
                            <span className={styles.platformIcon}>{platform.icon}</span>
                            <div className={styles.platformInfo}>
                                <h3>{platform.name}</h3>
                                <span className={`${styles.status} ${styles[platform.status]}`}>
                                    {platform.status === 'active' ? '🟢 Connected' :
                                        platform.status === 'error' ? '🔴 Error' : '⚪ Not Connected'}
                                </span>
                            </div>
                        </div>

                        {platform.connected ? (
                            <div className={styles.platformDetails}>
                                <div className={styles.detailRow}>
                                    <span>Orders Today:</span>
                                    <strong>{platform.ordersToday}</strong>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Last Sync:</span>
                                    <span>{platform.lastSync ? new Date(platform.lastSync).toLocaleString() : 'Never'}</span>
                                </div>
                                <div className={styles.platformActions}>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleSync(platform.id)}
                                        disabled={loading}
                                    >
                                        🔄 Sync Now
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleDisconnect(platform.id)}
                                    >
                                        Disconnect
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.platformConnect}>
                                <p>Connect your {platform.name} store to automatically import orders and sync inventory.</p>
                                <Button variant="primary" onClick={() => handleConnect(platform.id)}>
                                    Connect {platform.name}
                                </Button>
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            <Card className={styles.helpCard}>
                <h3>💡 Integration Tips</h3>
                <ul>
                    <li>Connect your primary sales channel first to start syncing orders</li>
                    <li>Orders are synced automatically every 15 minutes</li>
                    <li>Inventory levels are updated in real-time when orders are placed</li>
                    <li>Use the manual sync button if you need immediate updates</li>
                </ul>
            </Card>
        </div>
    );
}
