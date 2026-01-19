'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card, Button } from '@/components/ui';
import styles from './page.module.css';

interface Role {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    userCount: number;
}

const DEFAULT_ROLES: Role[] = [
    {
        id: 'owner',
        name: 'Owner',
        description: 'Full access to all features and settings',
        permissions: ['all'],
        userCount: 1,
    },
    {
        id: 'admin',
        name: 'Admin',
        description: 'Manage users, settings, and operations',
        permissions: ['users.manage', 'settings.manage', 'operations.manage', 'reports.view'],
        userCount: 2,
    },
    {
        id: 'manager',
        name: 'Manager',
        description: 'Oversee daily operations and team',
        permissions: ['operations.manage', 'tasks.manage', 'reports.view', 'inventory.manage'],
        userCount: 3,
    },
    {
        id: 'team_member',
        name: 'Team Member',
        description: 'Execute tasks and log activities',
        permissions: ['tasks.execute', 'batches.view', 'inventory.view'],
        userCount: 8,
    },
    {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to reports and data',
        permissions: ['reports.view', 'batches.view'],
        userCount: 2,
    },
];

const PERMISSION_CATEGORIES = [
    {
        name: 'Users',
        permissions: [
            { id: 'users.view', label: 'View Users' },
            { id: 'users.manage', label: 'Manage Users' },
        ],
    },
    {
        name: 'Settings',
        permissions: [
            { id: 'settings.view', label: 'View Settings' },
            { id: 'settings.manage', label: 'Manage Settings' },
        ],
    },
    {
        name: 'Operations',
        permissions: [
            { id: 'operations.view', label: 'View Operations' },
            { id: 'operations.manage', label: 'Manage Operations' },
        ],
    },
    {
        name: 'Tasks',
        permissions: [
            { id: 'tasks.view', label: 'View Tasks' },
            { id: 'tasks.execute', label: 'Execute Tasks' },
            { id: 'tasks.manage', label: 'Manage Tasks' },
        ],
    },
    {
        name: 'Batches',
        permissions: [
            { id: 'batches.view', label: 'View Batches' },
            { id: 'batches.manage', label: 'Manage Batches' },
        ],
    },
    {
        name: 'Inventory',
        permissions: [
            { id: 'inventory.view', label: 'View Inventory' },
            { id: 'inventory.manage', label: 'Manage Inventory' },
        ],
    },
    {
        name: 'Reports',
        permissions: [
            { id: 'reports.view', label: 'View Reports' },
            { id: 'reports.export', label: 'Export Reports' },
        ],
    },
];

export default function PermissionsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/auth/signin');
        }
    }, [isAuthLoading, isAuthenticated, router]);

    const handleRoleSelect = (role: Role) => {
        setSelectedRole(role);
    };

    const handlePermissionToggle = (permissionId: string) => {
        if (!selectedRole || selectedRole.permissions.includes('all')) return;

        const newPermissions = selectedRole.permissions.includes(permissionId)
            ? selectedRole.permissions.filter(p => p !== permissionId)
            : [...selectedRole.permissions, permissionId];

        const updatedRole = { ...selectedRole, permissions: newPermissions };
        setSelectedRole(updatedRole);
        setRoles(roles.map(r => r.id === updatedRole.id ? updatedRole : r));
    };

    const handleSave = async () => {
        setLoading(true);
        // In production, this would save to the API
        await new Promise(resolve => setTimeout(resolve, 500));
        setLoading(false);
        alert('Permissions saved successfully!');
    };

    if (isAuthLoading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>🔐 Roles & Permissions</h1>
                <p>Configure user roles and their access permissions</p>
            </div>

            <div className={styles.content}>
                <div className={styles.rolesPanel}>
                    <h2>Roles</h2>
                    <div className={styles.rolesList}>
                        {roles.map((role) => (
                            <div
                                key={role.id}
                                className={`${styles.roleItem} ${selectedRole?.id === role.id ? styles.selected : ''}`}
                                onClick={() => handleRoleSelect(role)}
                            >
                                <div className={styles.roleInfo}>
                                    <h3>{role.name}</h3>
                                    <p>{role.description}</p>
                                </div>
                                <span className={styles.userCount}>{role.userCount} users</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.permissionsPanel}>
                    {selectedRole ? (
                        <>
                            <div className={styles.permissionsHeader}>
                                <h2>Permissions for {selectedRole.name}</h2>
                                {selectedRole.permissions.includes('all') && (
                                    <span className={styles.fullAccessBadge}>Full Access</span>
                                )}
                            </div>

                            {selectedRole.permissions.includes('all') ? (
                                <Card className={styles.fullAccessCard}>
                                    <p>This role has full access to all features. Individual permissions cannot be modified.</p>
                                </Card>
                            ) : (
                                <div className={styles.permissionsGrid}>
                                    {PERMISSION_CATEGORIES.map((category) => (
                                        <Card key={category.name} className={styles.categoryCard}>
                                            <h3>{category.name}</h3>
                                            <div className={styles.permissionsList}>
                                                {category.permissions.map((permission) => (
                                                    <label key={permission.id} className={styles.permissionItem}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRole.permissions.includes(permission.id)}
                                                            onChange={() => handlePermissionToggle(permission.id)}
                                                        />
                                                        <span>{permission.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            <div className={styles.actions}>
                                <Button variant="primary" onClick={handleSave} disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className={styles.noSelection}>
                            <p>Select a role to view and edit its permissions</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
