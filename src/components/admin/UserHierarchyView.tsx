import React from 'react';
import { Role } from '@/types/roles';
import { getRoleColor, FARM_ROLE_DISPLAY_NAMES } from '@/lib/utils/roleHelpers';
import type { User } from '@/types';
import styles from './UserHierarchyView.module.css';

// Extend base User with optional management fields present in API
type ManagementLike = User & {
    managerId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    position?: string;
    roles: any; // can be UserRole[] or Role
};

interface UserHierarchyViewProps {
    users: ManagementLike[];
    currentUserRole: Role;
    onEditUser: (user: ManagementLike) => void;
}

interface HierarchyNode {
    user: ManagementLike;
    children: HierarchyNode[];
    level: number;
}

interface OrgNodeProps {
    node: HierarchyNode;
    onEditUser: (user: ManagementLike) => void;
    canEdit: boolean;
}

function buildHierarchyTree(users: ManagementLike[]): HierarchyNode[] {
    const userMap = new Map<string, User>();
    const childrenMap = new Map<string, User[]>();

    // Create maps for efficient lookup
    users.forEach(user => {
        userMap.set(user.id, user);
        childrenMap.set(user.id, []);
    });

    // Group users by their manager
    users.forEach(user => {
        if (user.managerId && childrenMap.has(user.managerId)) {
            childrenMap.get(user.managerId)!.push(user);
        }
    });

    // Find root users (no manager or manager not in current list)
    const rootUsers = users.filter(user =>
        !user.managerId || !userMap.has(user.managerId)
    );

    // Build tree recursively
    function buildNode(user: ManagementLike, level = 0): HierarchyNode {
        const children = childrenMap.get(user.id) || [];
        return {
            user,
            level,
            children: children.map(child => buildNode(child as ManagementLike, level + 1))
        };
    }

    return rootUsers.map(user => buildNode(user));
}

function OrgTreeNode({ node, onEditUser, canEdit }: OrgNodeProps) {
    const { user, children, level } = node;

    // Derive a safe display name and initials
    const displayName =
        (user as any).name ||
        [
            (user as any).firstName,
            (user as any).lastName
        ].filter(Boolean).join(' ') ||
        (user as any).email ||
        'User';

    const getInitials = (nameValue: string | undefined | null) => {
        const n = (nameValue || '').trim();
        if (!n) return 'U';
        return n
            .split(' ')
            .filter(Boolean)
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Normalize role from possible UserRole array shape
    const getPrimaryRole = (u: ManagementLike): Role => {
        if (Array.isArray((u as any).roles)) {
            const r = (u as any).roles[0]?.role as Role | undefined;
            return r ?? Role.TEAM_MEMBER;
        }
        const r = (u as any).roles as Role | undefined;
        return r ?? Role.TEAM_MEMBER;
    };
    const primaryRole = getPrimaryRole(user);
    const roleColor = getRoleColor(primaryRole);
    const hasChildren = children.length > 0;

    return (
        <div className={styles.treeNode}>
            {/* User Card */}
            <div className={`${styles.userCard} ${styles[`level${Math.min(level, 4)}`]}`}>
                <div
                    className={styles.avatar}
                    style={{ backgroundColor: roleColor }}
                >
                    {getInitials(displayName)}
                </div>

                <div className={styles.cardContent}>
                    <div className={styles.userName}>{String(displayName).toUpperCase()}</div>
                    <div className={styles.userTitle}>{FARM_ROLE_DISPLAY_NAMES[primaryRole]}</div>
                </div>

                <div
                    className={`${styles.statusDot} ${user.isActive ? styles.active : styles.inactive}`}
                />

                {canEdit && (
                    <button
                        className={styles.editBtn}
                        onClick={() => onEditUser(user)}
                        title="Edit user"
                    >
                        ✏️
                    </button>
                )}
            </div>

            {/* Children Container */}
            {hasChildren && (
                <div className={styles.childrenContainer}>
                    {/* Vertical line down from parent */}
                    <div className={styles.verticalLine} />

                    {/* Horizontal connector line */}
                    {children.length > 1 && (
                        <div className={styles.horizontalLine} />
                    )}

                    {/* Children grid */}
                    <div className={styles.childrenGrid}>
                        {children.map((child, index) => (
                            <div key={child.user.id} className={styles.childWrapper}>
                                {/* Vertical connector to child */}
                                <div className={styles.childConnector} />

                                <OrgTreeNode
                                    node={child}
                                    onEditUser={onEditUser}
                                    canEdit={canEdit}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function UserHierarchyView({ users, currentUserRole, onEditUser }: UserHierarchyViewProps) {
    const activeUsers = users.filter(user => user.isActive);

    if (activeUsers.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🏗️</div>
                <h3>No organizational structure</h3>
                <p>No active team members found to display hierarchy.</p>
            </div>
        );
    }

    const hierarchyTree = buildHierarchyTree(activeUsers);

    const canEdit = (user: ManagementLike) => {
        const userPrimaryRole = Array.isArray((user as any).roles)
            ? (((user as any).roles[0]?.role as Role) || Role.TEAM_MEMBER)
            : (((user as any).roles as Role) || Role.TEAM_MEMBER);
        return currentUserRole === Role.ADMIN ||
            (currentUserRole === Role.MANAGER && userPrimaryRole !== Role.ADMIN);
    };

    // If no proper hierarchy exists, show role-based grouping
    if (hierarchyTree.length === 0 || hierarchyTree.every(node => node.children.length === 0)) {
        return (
            <div className={styles.container}>
                <div className={styles.noHierarchyMessage}>
                    <h3>🔧 Organizational Hierarchy Setup Needed</h3>
                    <p>
                        Manager relationships haven't been configured yet.
                        Edit users to assign managers and build your organizational structure.
                    </p>
                </div>

                {/* Fallback: Show by role */}
                <div className={styles.roleGrouping}>
                    {Object.values(Role).map(role => {
                        const usersInRole = activeUsers.filter(u => {
                            const r = Array.isArray((u as any).roles)
                                ? ((u as any).roles[0]?.role as Role | undefined)
                                : ((u as any).roles as Role | undefined);
                            return r === role;
                        });
                        if (usersInRole.length === 0) return null;

                        return (
                            <div key={role} className={styles.roleGroup}>
                                <h4 style={{ color: getRoleColor(role) }}>
                                    {FARM_ROLE_DISPLAY_NAMES[role]} ({usersInRole.length})
                                </h4>
                                <div className={styles.roleUsers}>
                                    {usersInRole.map(user => {
                                        const displayName =
                                            (user as any).name ||
                                            [
                                                (user as any).firstName,
                                                (user as any).lastName
                                            ].filter(Boolean).join(' ') ||
                                            (user as any).email ||
                                            'User';
                                        const initials = displayName
                                            .trim()
                                            .split(' ')
                                            .filter(Boolean)
                                            .map((n: string) => n[0])
                                            .join('')
                                            .toUpperCase()
                                            .slice(0, 2);
                                        return (
                                            <div key={user.id} className={styles.userCard}>
                                                <div
                                                    className={styles.avatar}
                                                    style={{ backgroundColor: getRoleColor(role) }}
                                                >
                                                    {initials}
                                                </div>
                                                <div className={styles.cardContent}>
                                                    <div className={styles.userName}>{displayName}</div>
                                                    <div className={styles.userTitle}>{(user as any).position || ''}</div>
                                                </div>
                                                {canEdit(user) && (
                                                    <button
                                                        className={styles.editBtn}
                                                        onClick={() => onEditUser(user)}
                                                    >
                                                        ✏️
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.hierarchyHeader}>
                <h3>🏢 Organizational Structure</h3>
                <p>Showing team hierarchy with reporting relationships</p>
            </div>

            <div className={styles.orgChart}>
                {hierarchyTree.map(rootNode => (
                    <OrgTreeNode
                        key={rootNode.user.id}
                        node={rootNode}
                        onEditUser={onEditUser}
                        canEdit={canEdit(rootNode.user)}
                    />
                ))}
            </div>
        </div>
    );
} 