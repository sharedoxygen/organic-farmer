'use client';

import { useState } from 'react';
import { User } from '@/types';
import { Card, Button } from '@/components/ui';
import styles from './UserListView.module.css';

interface UserListViewProps {
    users: User[];
    onEditUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
}

export default function UserListView({ users, onEditUser, onDeleteUser }: UserListViewProps) {
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [deletingUser, setDeletingUser] = useState<string | null>(null);

    const handleSelectUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(user => user.id));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) return;

        try {
            for (const userId of selectedUsers) {
                await onDeleteUser(userId);
            }
            setSelectedUsers([]);
        } catch (error) {
            console.error('Failed to delete users:', error);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        setDeletingUser(userId);
        try {
            await onDeleteUser(userId);
        } catch (error) {
            console.error('Failed to delete user:', error);
        } finally {
            setDeletingUser(null);
        }
    };

    return (
        <div className={styles.container}>
            {/* Bulk Actions Header */}
            <div className={styles.bulkActions}>
                <div className={styles.selectAll}>
                    <label className={styles.selectAllLabel}>
                        <input
                            type="checkbox"
                            checked={selectedUsers.length === users.length && users.length > 0}
                            onChange={handleSelectAll}
                        />
                        <span>Select All ({users.length})</span>
                    </label>
                </div>

                {selectedUsers.length > 0 && (
                    <div className={styles.selectedActions}>
                        <span className={styles.selectedCount}>
                            {selectedUsers.length} selected
                        </span>
                        <Button
                            onClick={handleBulkDelete}
                            variant="danger"
                            size="sm"
                        >
                            Delete Selected
                        </Button>
                    </div>
                )}
            </div>

            {/* User Cards Grid */}
            <div className={styles.userGrid}>
                {users.map((user) => (
                    <Card key={user.id} className={styles.userCard}>
                        {/* Card Header with Selection */}
                        <div className={styles.cardHeader}>
                            <div className={styles.userSelect}>
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={() => handleSelectUser(user.id)}
                                />
                            </div>
                            <div className={styles.userActions}>
                                <Button
                                    onClick={() => onEditUser(user)}
                                    variant="secondary"
                                    size="sm"
                                >
                                    Edit
                                </Button>
                                <Button
                                    onClick={() => handleDeleteUser(user.id)}
                                    variant="danger"
                                    size="sm"
                                    disabled={deletingUser === user.id}
                                >
                                    {deletingUser === user.id ? 'Deleting...' : 'Delete'}
                                </Button>
                            </div>
                        </div>

                        {/* User Information */}
                        <div className={styles.userInfo}>
                            <div className={styles.userPrimary}>
                                <h3 className={styles.userName}>{user.name}</h3>
                                <p className={styles.userEmail}>{user.email}</p>
                            </div>

                            <div className={styles.userMeta}>
                                <div className={styles.roleBadge}>
                                    <span className={`${styles.roleLabel} ${styles[(user.roles[0]?.role || 'team_member').toLowerCase()]}`}>
                                        {user.roles[0]?.role || 'NO ROLE'}
                                    </span>
                                </div>

                                <div className={styles.userDetails}>
                                    <span className={styles.userDepartment}>
                                        {user.roles.length > 1 ? `+${user.roles.length - 1} more roles` : 'Single Role'}
                                    </span>
                                    {(user as any).lastLogin && (
                                        <span className={styles.lastLogin}>
                                            Last login: {new Date((user as any).lastLogin).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {users.length === 0 && (
                <div className={styles.emptyState}>
                    <div className={styles.emptyStateContent}>
                        <h3>No Users Found</h3>
                        <p>No users match your current criteria.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export { UserListView }; 