'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';
import styles from './page.module.css';

interface Farm {
    id: string;
    farm_name: string;
    business_name: string;
    subdomain?: string;
    owner_id: string;
    subscription_plan: string;
    subscription_status: string;
    trial_ends_at?: string;
    settings: any;
    created_at: string;
    updated_at: string;
}

interface FarmUser {
    user_id: string;
    role: string;
    permissions: string;
    is_active: boolean;
    joined_at: string;
    users: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        isActive: boolean;
    };
}

interface FarmStats {
    totalUsers: number;
    activeUsers: number;
    totalBatches: number;
    activeBatches: number;
    totalOrders: number;
    totalRevenue: number;
    lastActivity: string;
}

export default function FarmDetailsPage({ params }: { params: { farmId: string } }) {
    const router = useRouter();
    const { user } = useAuth();
    const [farm, setFarm] = useState<Farm | null>(null);
    const [farmUsers, setFarmUsers] = useState<FarmUser[]>([]);
    const [farmStats, setFarmStats] = useState<FarmStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');

    const isGlobalAdmin = isSystemAdmin(user);

    useEffect(() => {
        if (isGlobalAdmin) {
            loadFarmDetails();
        }
    }, [params.farmId, isGlobalAdmin]);

    const loadFarmDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load farm details
            const farmResponse = await fetch(`/api/farms/${params.farmId}`);
            if (!farmResponse.ok) {
                throw new Error('Failed to load farm details');
            }
            const farmData = await farmResponse.json();
            setFarm(farmData.farm);

            // Load farm users
            const usersResponse = await fetch(`/api/farms/${params.farmId}/users`);
            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                setFarmUsers(usersData.users || []);
            }

            // Load farm statistics
            const statsResponse = await fetch(`/api/farms/${params.farmId}/stats`);
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setFarmStats(statsData.stats);
            }

        } catch (error) {
            console.error('Error loading farm details:', error);
            setError(error instanceof Error ? error.message : 'Failed to load farm details');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#10b981';
            case 'inactive': return '#f59e0b';
            case 'trial': return '#3b82f6';
            case 'suspended': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getRoleColor = (role: string) => {
        switch (role.toLowerCase()) {
            case 'owner': return '#8b5cf6';
            case 'admin': return '#f59e0b';
            case 'manager': return '#10b981';
            case 'team_member': return '#6b7280';
            default: return '#6b7280';
        }
    };

    if (!isGlobalAdmin) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Access Denied</h1>
                    <p>You don't have permission to view farm details.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <p>Loading farm details...</p>
                </div>
            </div>
        );
    }

    if (error || !farm) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    {error || 'Farm not found'}
                </div>
                <Button onClick={() => router.push('/admin/farms')}>
                    ← Back to Farms
                </Button>
            </div>
        );
    }

    const settings = typeof farm.settings === 'string' ? JSON.parse(farm.settings) : farm.settings || {};

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/admin/farms')}
                        className={styles.backButton}
                    >
                        ← Back to Farms
                    </Button>
                    <div className={styles.farmInfo}>
                        <h1>{farm.farm_name}</h1>
                        <p>{farm.business_name}</p>
                        <span
                            className={styles.statusBadge}
                            style={{ backgroundColor: getStatusColor(farm.subscription_status) }}
                        >
                            {farm.subscription_status}
                        </span>
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <Button
                        onClick={() => router.push(`/admin/farms/${farm.id}/edit`)}
                        variant="primary"
                    >
                        Edit Farm
                    </Button>
                </div>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    Users ({farmUsers.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    Settings
                </button>
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'overview' && (
                    <div className={styles.overview}>
                        <div className={styles.statsGrid}>
                            <Card className={styles.statCard}>
                                <h3>Users</h3>
                                <div className={styles.statValue}>{farmStats?.totalUsers || 0}</div>
                                <p>{farmStats?.activeUsers || 0} active</p>
                            </Card>
                            <Card className={styles.statCard}>
                                <h3>Batches</h3>
                                <div className={styles.statValue}>{farmStats?.totalBatches || 0}</div>
                                <p>{farmStats?.activeBatches || 0} active</p>
                            </Card>
                            <Card className={styles.statCard}>
                                <h3>Orders</h3>
                                <div className={styles.statValue}>{farmStats?.totalOrders || 0}</div>
                                <p>Total orders</p>
                            </Card>
                            <Card className={styles.statCard}>
                                <h3>Revenue</h3>
                                <div className={styles.statValue}>{formatCurrency(farmStats?.totalRevenue || 0)}</div>
                                <p>Total revenue</p>
                            </Card>
                        </div>

                        <div className={styles.detailsGrid}>
                            <Card className={styles.detailCard}>
                                <h3>Farm Information</h3>
                                <div className={styles.detailRow}>
                                    <span>Farm Name:</span>
                                    <span>{farm.farm_name}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Business Name:</span>
                                    <span>{farm.business_name}</span>
                                </div>
                                {farm.subdomain && (
                                    <div className={styles.detailRow}>
                                        <span>Subdomain:</span>
                                        <span>{farm.subdomain}</span>
                                    </div>
                                )}
                                <div className={styles.detailRow}>
                                    <span>Owner ID:</span>
                                    <span>{farm.owner_id}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Created:</span>
                                    <span>{formatDate(farm.created_at)}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Last Updated:</span>
                                    <span>{formatDate(farm.updated_at)}</span>
                                </div>
                            </Card>

                            <Card className={styles.detailCard}>
                                <h3>Subscription</h3>
                                <div className={styles.detailRow}>
                                    <span>Plan:</span>
                                    <span className={styles.planBadge}>{farm.subscription_plan}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Status:</span>
                                    <span
                                        className={styles.statusBadge}
                                        style={{ backgroundColor: getStatusColor(farm.subscription_status) }}
                                    >
                                        {farm.subscription_status}
                                    </span>
                                </div>
                                {farm.trial_ends_at && (
                                    <div className={styles.detailRow}>
                                        <span>Trial Ends:</span>
                                        <span>{formatDate(farm.trial_ends_at)}</span>
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className={styles.usersTab}>
                        <div className={styles.usersHeader}>
                            <h3>Farm Users ({farmUsers.length})</h3>
                            <Button
                                onClick={() => router.push(`/admin/farms/${farm.id}/users/add`)}
                                variant="primary"
                            >
                                + Add User
                            </Button>
                        </div>
                        <div className={styles.usersGrid}>
                            {farmUsers.map((farmUser) => (
                                <Card key={farmUser.user_id} className={styles.userCard}>
                                    <div className={styles.userInfo}>
                                        <h4>{farmUser.users.firstName} {farmUser.users.lastName}</h4>
                                        <p>{farmUser.users.email}</p>
                                        {farmUser.users.phone && <p>{farmUser.users.phone}</p>}
                                    </div>
                                    <div className={styles.userMeta}>
                                        <span
                                            className={styles.roleBadge}
                                            style={{ backgroundColor: getRoleColor(farmUser.role) }}
                                        >
                                            {farmUser.role}
                                        </span>
                                        <span className={`${styles.statusBadge} ${farmUser.is_active ? styles.active : styles.inactive}`}>
                                            {farmUser.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className={styles.userActions}>
                                        <Button
                                            size="sm"
                                            onClick={() => router.push(`/admin/farms/${farm.id}/users/${farmUser.user_id}`)}
                                        >
                                            View
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => router.push(`/admin/farms/${farm.id}/users/${farmUser.user_id}/edit`)}
                                        >
                                            Edit
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className={styles.settingsTab}>
                        <Card className={styles.settingsCard}>
                            <h3>General Settings</h3>
                            <div className={styles.settingRow}>
                                <span>Timezone:</span>
                                <span>{settings.timezone || 'Not set'}</span>
                            </div>
                            <div className={styles.settingRow}>
                                <span>Currency:</span>
                                <span>{settings.currency || 'Not set'}</span>
                            </div>
                            <div className={styles.settingRow}>
                                <span>Locale:</span>
                                <span>{settings.locale || 'Not set'}</span>
                            </div>
                        </Card>

                        <Card className={styles.settingsCard}>
                            <h3>Features</h3>
                            <div className={styles.settingRow}>
                                <span>Cannabis Module:</span>
                                <span className={settings.features?.cannabis_module ? styles.enabled : styles.disabled}>
                                    {settings.features?.cannabis_module ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            <div className={styles.settingRow}>
                                <span>IoT Integration:</span>
                                <span className={settings.features?.iot_integration ? styles.enabled : styles.disabled}>
                                    {settings.features?.iot_integration ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            <div className={styles.settingRow}>
                                <span>API Access:</span>
                                <span className={settings.features?.api_access ? styles.enabled : styles.disabled}>
                                    {settings.features?.api_access ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
} 