'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';
import styles from './page.module.css';

interface ConnectedUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    isActive: boolean;
    roles: string[];
    system_role?: string;
    is_system_admin?: boolean;
    last_activity?: string;
    session_count: number;
    current_farm_id?: string;
    current_farm_name?: string;
    farms: Array<{
        id: string;
        name: string;
        role: string;
        is_active: boolean;
    }>;
    created_at: string;
    updated_at: string;
}

interface UserActivity {
    total_connected: number;
    active_sessions: number;
    system_admins: number;
    farm_owners: number;
    last_updated: string;
}

export default function ConnectedUsersPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
    const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<ConnectedUser | null>(null);
    const [showUserDetails, setShowUserDetails] = useState(false);

    const isGlobalAdmin = isSystemAdmin(user);

    useEffect(() => {
        if (isGlobalAdmin) {
            loadConnectedUsers();
        }
    }, [isGlobalAdmin]);

    const loadConnectedUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/admin/connected-users');
            const data = await response.json();

            if (data.success) {
                setConnectedUsers(data.users);
                setUserActivity(data.activity);
            } else {
                setError(data.error || 'Failed to load connected users');
            }
        } catch (error) {
            console.error('Error loading connected users:', error);
            setError('Failed to load connected users');
        } finally {
            setLoading(false);
        }
    };

    const handleUserAction = async (userId: string, action: string) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}/actions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action })
            });

            const data = await response.json();

            if (data.success) {
                await loadConnectedUsers(); // Refresh the data
            } else {
                setError(data.error || `Failed to ${action} user`);
            }
        } catch (error) {
            console.error(`Error ${action} user:`, error);
            setError(`Failed to ${action} user`);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (dateString: string) => {
        const now = new Date();
        const lastActivity = new Date(dateString);
        const diffMs = now.getTime() - lastActivity.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays} days ago`;
        if (diffHours > 0) return `${diffHours} hours ago`;
        if (diffMins > 0) return `${diffMins} minutes ago`;
        return 'Just now';
    };

    const getRoleColor = (role: string) => {
        switch (role.toLowerCase()) {
            case 'system_admin': return '#8b5cf6';
            case 'owner': return '#f59e0b';
            case 'farm_manager': return '#10b981';
            case 'team_lead': return '#3b82f6';
            case 'team_member': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getActivityStatus = (lastActivity?: string) => {
        if (!lastActivity) return 'inactive';

        const now = new Date();
        const activity = new Date(lastActivity);
        const diffMins = Math.floor((now.getTime() - activity.getTime()) / 60000);

        if (diffMins <= 5) return 'active';
        if (diffMins <= 30) return 'idle';
        return 'inactive';
    };

    const handleViewUserDetails = (user: ConnectedUser) => {
        setSelectedUser(user);
        setShowUserDetails(true);
    };

    if (!isGlobalAdmin) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Access Denied</h1>
                    <p>You don't have permission to view connected users information.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Connected Users</h1>
                    <p>System administrator view of currently connected users</p>
                </div>
                <div className={styles.headerRight}>
                    <Button onClick={loadConnectedUsers} disabled={loading}>
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            {/* Activity Summary */}
            {userActivity && (
                <div className={styles.activitySummary}>
                    <Card className={styles.summaryCard}>
                        <h3>Total Connected</h3>
                        <div className={styles.summaryValue}>{userActivity.total_connected}</div>
                    </Card>
                    <Card className={styles.summaryCard}>
                        <h3>Active Sessions</h3>
                        <div className={styles.summaryValue}>{userActivity.active_sessions}</div>
                    </Card>
                    <Card className={styles.summaryCard}>
                        <h3>System Admins</h3>
                        <div className={styles.summaryValue}>{userActivity.system_admins}</div>
                    </Card>
                    <Card className={styles.summaryCard}>
                        <h3>Farm Owners</h3>
                        <div className={styles.summaryValue}>{userActivity.farm_owners}</div>
                    </Card>
                </div>
            )}

            {loading ? (
                <div className={styles.loading}>
                    <p>Loading connected users...</p>
                </div>
            ) : (
                <div className={styles.usersGrid}>
                    {connectedUsers.map(user => (
                        <Card key={user.id} className={styles.userCard}>
                            <div className={styles.userHeader}>
                                <div className={styles.userInfo}>
                                    <h3>{user.firstName} {user.lastName}</h3>
                                    <p className={styles.email}>{user.email}</p>
                                    <div className={styles.userMeta}>
                                        <span
                                            className={`${styles.activityBadge} ${styles[getActivityStatus(user.last_activity)]}`}
                                        >
                                            {getActivityStatus(user.last_activity)}
                                        </span>
                                        {user.is_system_admin && (
                                            <span
                                                className={styles.roleBadge}
                                                style={{ backgroundColor: getRoleColor('system_admin') }}
                                            >
                                                SYSTEM ADMIN
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.sessionInfo}>
                                    <p className={styles.sessionCount}>
                                        {user.session_count} {user.session_count === 1 ? 'session' : 'sessions'}
                                    </p>
                                    {user.last_activity && (
                                        <p className={styles.lastActivity}>
                                            Last activity: {formatDuration(user.last_activity)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className={styles.userDetails}>
                                {user.current_farm_name && (
                                    <div className={styles.detailRow}>
                                        <span>Current Farm:</span>
                                        <span>{user.current_farm_name}</span>
                                    </div>
                                )}
                                <div className={styles.detailRow}>
                                    <span>Total Farms:</span>
                                    <span>{user.farms.length}</span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Account Status:</span>
                                    <span className={user.isActive ? styles.active : styles.inactive}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Member Since:</span>
                                    <span>{formatDate(user.created_at)}</span>
                                </div>
                            </div>

                            <div className={styles.userActions}>
                                <Button
                                    size="sm"
                                    onClick={() => handleViewUserDetails(user)}
                                >
                                    View Details
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/admin/users/${user.id}`)}
                                >
                                    Edit User
                                </Button>
                                {!user.is_system_admin && (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleUserAction(user.id, user.isActive ? 'deactivate' : 'activate')}
                                    >
                                        {user.isActive ? 'Deactivate' : 'Activate'}
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {connectedUsers.length === 0 && !loading && (
                <div className={styles.emptyState}>
                    <Card>
                        <h3>No Connected Users</h3>
                        <p>There are no users currently connected to the system.</p>
                    </Card>
                </div>
            )}

            {/* User Details Modal */}
            {showUserDetails && selectedUser && (
                <div className={styles.modalOverlay} onClick={() => setShowUserDetails(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{selectedUser.firstName} {selectedUser.lastName}</h2>
                            <Button variant="secondary" onClick={() => setShowUserDetails(false)}>
                                ×
                            </Button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.detailSection}>
                                <h3>User Information</h3>
                                <div className={styles.detailGrid}>
                                    <div className={styles.detailItem}>
                                        <span>Email:</span>
                                        <span>{selectedUser.email}</span>
                                    </div>
                                    {selectedUser.phone && (
                                        <div className={styles.detailItem}>
                                            <span>Phone:</span>
                                            <span>{selectedUser.phone}</span>
                                        </div>
                                    )}
                                    <div className={styles.detailItem}>
                                        <span>System Role:</span>
                                        <span>{selectedUser.system_role || 'Standard User'}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span>Session Count:</span>
                                        <span>{selectedUser.session_count}</span>
                                    </div>
                                    {selectedUser.last_activity && (
                                        <div className={styles.detailItem}>
                                            <span>Last Activity:</span>
                                            <span>{formatDate(selectedUser.last_activity)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.detailSection}>
                                <h3>Farm Access ({selectedUser.farms.length})</h3>
                                <div className={styles.farmsList}>
                                    {selectedUser.farms.map(farm => (
                                        <div key={farm.id} className={styles.farmItem}>
                                            <span className={styles.farmName}>{farm.name}</span>
                                            <span
                                                className={styles.farmRole}
                                                style={{ backgroundColor: getRoleColor(farm.role) }}
                                            >
                                                {farm.role}
                                            </span>
                                            <span className={`${styles.farmStatus} ${farm.is_active ? styles.active : styles.inactive}`}>
                                                {farm.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 