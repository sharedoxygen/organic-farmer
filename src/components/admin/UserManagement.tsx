'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { Role } from '@/types/roles';
import { useTenant } from '@/components/TenantProvider';
import {
    canManageUser,
    FARM_ROLE_DISPLAY_NAMES,
    DEPARTMENT_STRUCTURE
} from '@/lib/utils/roleHelpers';
import { UserListView } from './UserListView';
import { UserHierarchyView } from './UserHierarchyView';
import { UserCreateModal } from './UserCreateModal';
import { UserEditModal } from './UserEditModal';
import styles from './UserManagement.module.css';

// Extended user interface for management-specific fields
interface ManagementUser extends User {
    firstName?: string;
    lastName?: string;
    department?: string;
    position?: string;
    phone?: string;
    employeeId?: string;
    lastLogin?: string;
    managerId?: string;
    manager?: {
        id: string;
        name: string;
        role: string;
    };
    directReports?: ManagementUser[];
}

interface UserManagementProps {
    currentUserRole?: Role;
    currentUserId?: string;
}

export default function UserManagement({
    currentUserRole = Role.ADMIN,
    currentUserId = '1'
}: UserManagementProps) {
    const { currentFarm } = useTenant();
    const [users, setUsers] = useState<ManagementUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('list');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<ManagementUser | null>(null);
    const [filters, setFilters] = useState({
        department: '',
        role: '',
        status: 'active',
        search: ''
    });

    useEffect(() => {
        if (currentFarm?.id) {
            fetchUsers();
        }
    }, [filters, currentFarm?.id]);

    const fetchUsers = async () => {
        if (!currentFarm?.id) {
            setError('No farm context available');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (filters.department) params.append('department', filters.department);
            if (filters.role) params.append('role', filters.role);
            if (filters.status === 'all') params.append('includeInactive', 'true');

            console.log('🔒 SECURE: Fetching users for farm:', currentFarm.id);

            const response = await fetch(`/api/users?${params.toString()}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Farm-ID': currentFarm.id
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Users API response:', data);

            // Handle the API response structure
            const usersData = data.success ? data.data : (Array.isArray(data) ? data : []);
            let filteredUsers = usersData;

            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                filteredUsers = usersData.filter((user: ManagementUser) =>
                    user.name?.toLowerCase().includes(searchLower) ||
                    user.email?.toLowerCase().includes(searchLower) ||
                    user.employeeId?.toLowerCase().includes(searchLower) ||
                    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower)
                );
            }

            setUsers(filteredUsers);
            console.log(`✅ SECURE: Loaded ${filteredUsers.length} users for farm ${currentFarm.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch users');
            console.error('❌ Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (userData: Partial<ManagementUser>) => {
        if (!currentFarm?.id) {
            throw new Error('No farm context available');
        }

        try {
            console.log('🔒 SECURE: Creating user for farm:', currentFarm.id);

            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Farm-ID': currentFarm.id
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create user');
            }

            const result = await response.json();
            console.log('✅ SECURE: User created for farm:', currentFarm.id);

            await fetchUsers(); // Refresh the list
            setShowCreateModal(false);
        } catch (err) {
            console.error('❌ Error creating user:', err);
            throw err; // Re-throw to handle in modal
        }
    };

    const handleUpdateUser = async (userId: string, userData: Partial<ManagementUser>) => {
        if (!currentFarm?.id) {
            throw new Error('No farm context available');
        }

        try {
            console.log('🔒 SECURE: Updating user for farm:', currentFarm.id);

            const response = await fetch(`/api/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Farm-ID': currentFarm.id
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update user');
            }

            console.log('✅ SECURE: User updated for farm:', currentFarm.id);

            await fetchUsers(); // Refresh the list
            setEditingUser(null);
        } catch (err) {
            console.error('❌ Error updating user:', err);
            throw err; // Re-throw to handle in modal
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!currentFarm?.id) {
            alert('No farm context available');
            return;
        }

        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            console.log('🔒 SECURE: Deleting user for farm:', currentFarm.id);

            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Farm-ID': currentFarm.id
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete user');
            }

            console.log('✅ SECURE: User deleted for farm:', currentFarm.id);

            await fetchUsers(); // Refresh the list
        } catch (err) {
            console.error('❌ Error deleting user:', err);
            alert(`Failed to delete user: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            await handleUpdateUser(userId, { isActive: !currentStatus });
        } catch (err) {
            alert(`Failed to ${currentStatus ? 'deactivate' : 'activate'} user`);
        }
    };

    const canCreateUser = (): boolean => {
        const privilegedRoles: Role[] = [Role.ADMIN, Role.MANAGER, Role.TEAM_LEAD, Role.SPECIALIST_LEAD];
        return privilegedRoles.includes(currentUserRole);
    };

    const canEditUser = (user: ManagementUser): boolean => {
        if (currentUserId === user.id) return true; // Can edit own profile

        // Extract role from UserRole array or use direct role string
        const userRole = Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles[0].role as Role
            : Role.TEAM_MEMBER;

        return canManageUser(currentUserRole, userRole);
    };

    const canDeleteUser = (user: ManagementUser): boolean => {
        if (currentUserId === user.id) return false; // Can't delete self

        // Extract role from UserRole array or use direct role string
        const userRole = Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles[0].role as Role
            : Role.TEAM_MEMBER;

        return canManageUser(currentUserRole, userRole);
    };

    const getStats = () => {
        // Ensure users is an array before using filter
        const usersArray = Array.isArray(users) ? users : [];
        const activeUsers = usersArray.filter(u => u.isActive);

        return {
            total: usersArray.length,
            active: activeUsers.length,
            inactive: usersArray.length - activeUsers.length,
            admins: activeUsers.filter(u =>
                Array.isArray(u.roles) && u.roles.some(r => r.role === 'ADMIN')
            ).length,
            managers: activeUsers.filter(u =>
                Array.isArray(u.roles) && u.roles.some(r => r.role === 'MANAGER')
            ).length,
            departments: new Set(activeUsers.map(u => u.department).filter(Boolean)).size
        };
    };

    // Show error if no farm context
    if (!currentFarm) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h3>No Farm Context</h3>
                    <p>Please select a farm to manage users.</p>
                </div>
            </div>
        );
    }

    const stats = getStats();

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading users for {currentFarm.farm_name}...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h3>Error Loading Users</h3>
                    <p>{error}</p>
                    <button onClick={fetchUsers} className={styles.retryButton}>
                        Retry
                    </button>
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
                        <h1 className={styles.title}>User Management - {currentFarm.farm_name}</h1>
                        <p className={styles.subtitle}>Manage farm team members and organizational structure</p>
                    </div>
                    <div className={styles.headerActions}>
                        <div className={styles.viewToggle}>
                            <button
                                className={`${styles.toggleButton} ${viewMode === 'list' ? styles.active : ''}`}
                                onClick={() => setViewMode('list')}
                            >
                                <span className={styles.icon}>📋</span>
                                List View
                            </button>
                            <button
                                className={`${styles.toggleButton} ${viewMode === 'hierarchy' ? styles.active : ''}`}
                                onClick={() => setViewMode('hierarchy')}
                            >
                                <span className={styles.icon}>🏗️</span>
                                Org Chart
                            </button>
                        </div>
                        {canCreateUser() && (
                            <button
                                className={styles.primaryButton}
                                onClick={() => setShowCreateModal(true)}
                            >
                                <span className={styles.icon}>➕</span>
                                Add Team Member
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className={styles.stats}>
                    <div className={styles.statCard}>
                        <span className={styles.statNumber}>{stats.total}</span>
                        <span className={styles.statLabel}>Total Users</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statNumber}>{stats.active}</span>
                        <span className={styles.statLabel}>Active</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statNumber}>{stats.admins}</span>
                        <span className={styles.statLabel}>Administrators</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statNumber}>{stats.departments}</span>
                        <span className={styles.statLabel}>Departments</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <input
                        type="text"
                        placeholder="Search users by name, email, or employee ID..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.filterControls}>
                    <select
                        value={filters.department}
                        onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                        className={styles.filterSelect}
                    >
                        <option value="">All Departments</option>
                        {Object.entries(DEPARTMENT_STRUCTURE).map(([key, value]) => (
                            <option key={key} value={value}>{value}</option>
                        ))}
                    </select>

                    <select
                        value={filters.role}
                        onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                        className={styles.filterSelect}
                    >
                        <option value="">All Roles</option>
                        {Object.entries(FARM_ROLE_DISPLAY_NAMES).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                        ))}
                    </select>

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className={styles.filterSelect}
                    >
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                        <option value="all">All Users</option>
                    </select>
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.content}>
                {viewMode === 'list' ? (
                    <UserListView
                        users={users}
                        onEditUser={setEditingUser}
                        onDeleteUser={handleDeleteUser}
                    />
                ) : (
                    <UserHierarchyView
                        users={users}
                        currentUserRole={currentUserRole}
                        onEditUser={setEditingUser}
                    />
                )}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <UserCreateModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateUser}
                    currentUserRole={currentUserRole}
                    existingUsers={users}
                />
            )}

            {editingUser && (
                <UserEditModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSuccess={handleUpdateUser}
                    currentUserRole={currentUserRole}
                    existingUsers={users}
                />
            )}
        </div>
    );
} 