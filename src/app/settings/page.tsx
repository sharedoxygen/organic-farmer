'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useHelp } from '@/components/HelpProvider';
import { Card } from '@/components/ui';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';
import styles from './page.module.css';

export default function SettingsPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { openHelp } = useHelp();

    // Check if user is system admin
    const isGlobalAdmin = isSystemAdmin(user);

    useEffect(() => {
        if (!isAuthLoading) {
            if (!isAuthenticated) {
                router.push('/auth/signin');
            }
        }
    }, [isAuthLoading, isAuthenticated, router]);

    if (isAuthLoading) {
        return <div>Loading...</div>;
    }

    const settingsCategories = [
        // Administration
        {
            id: 'user-management',
            title: 'User Management',
            description: 'Add, edit, and manage all team members and their roles in your organization.',
            icon: '👤',
            action: 'Manage',
            href: '/settings/users',
            category: 'Administration'
        },
        {
            id: 'roles-permissions',
            title: 'Roles & Permissions',
            description: 'Configure user roles, permissions, and access control for system features.',
            icon: '🔐',
            action: 'Configure',
            href: '/settings/permissions',
            category: 'Administration'
        },
        {
            id: 'supplier-management',
            title: 'Supplier Management',
            description: 'Manage supplier information, contracts, and relationships for your farm operations.',
            icon: '🏢',
            action: 'Manage',
            href: '/settings/suppliers',
            category: 'Administration'
        },
        {
            id: 'system-configuration',
            title: 'System Configuration',
            description: 'Configure core system settings, preferences, and operational parameters.',
            icon: '⚙️',
            action: 'Configure',
            href: '/settings/system',
            category: 'Administration'
        },
        {
            id: 'data-backup',
            title: 'Data Backup & Recovery',
            description: 'Manage data backups, recovery procedures, and system data integrity.',
            icon: '💾',
            action: 'Manage',
            href: '/settings/backup',
            category: 'Administration'
        },
        {
            id: 'system-notifications',
            title: 'System Notifications',
            description: 'Configure system alerts, announcements, and notification preferences.',
            icon: '📢',
            action: 'Configure',
            href: '/settings/notifications',
            category: 'Administration'
        },

        // System Utilities
        {
            id: 'connected-users',
            title: 'Connected Users',
            description: 'View and manage currently connected users, monitor session activity, and perform user actions.',
            icon: '👥',
            action: 'Monitor',
            href: '/admin/utilities/connected-users',
            category: 'System Utilities'
        },
        {
            id: 'ai-models',
            title: 'AI Models',
            description: 'Manage local Ollama models and per‑farm AI configuration for insights and analysis.',
            icon: '🤖',
            action: 'Open',
            href: '/admin/utilities/ai-models',
            category: 'System Utilities'
        },
        {
            id: 'system-health',
            title: 'System Health',
            description: 'Monitor system performance, resource usage, and overall health metrics.',
            icon: '🔧',
            action: 'Monitor',
            href: '/admin/utilities/system-health',
            category: 'System Utilities',
            comingSoon: true
        },
        {
            id: 'audit-logs',
            title: 'System Audit Logs',
            description: 'Review system-wide audit logs, security events, and administrative actions.',
            icon: '📋',
            action: 'Review',
            href: '/admin/utilities/audit-logs',
            category: 'System Utilities',
            comingSoon: true
        },
        {
            id: 'database-management',
            title: 'Database Management',
            description: 'Monitor database performance, run maintenance tasks, and manage database connections.',
            icon: '🗄️',
            action: 'Monitor',
            href: '/admin/utilities/database-management',
            category: 'System Utilities',
            comingSoon: true
        },

        // Feedback & Communication
        {
            id: 'feedback-management',
            title: 'Farm Feedback Management',
            description: 'Review and respond to user feedback, bug reports, and feature requests from all farms in the system.',
            icon: '🏡💬',
            action: 'Manage',
            href: '/admin/feedback',
            category: 'Communication'
        },

        // Tools
        {
            id: 'production-calculator',
            title: 'Production Calculator',
            description: 'Calculate growing schedules, yields, and resource requirements for production planning.',
            icon: '🧮',
            action: 'Calculate',
            href: '/settings/calculator',
            category: 'Tools'
        },

        // Support
        {
            id: 'help-center',
            title: 'Help & Support',
            description: 'Access help documentation, tutorials, FAQs, and keyboard shortcuts for using OFMS.',
            icon: '❓',
            action: 'Open',
            href: '#help',
            category: 'Support',
            isHelp: true
        }
    ];

    const handleSettingClick = (setting: { isHelp?: boolean; href: string; comingSoon?: boolean }) => {
        if (setting.comingSoon) {
            // Show coming soon message for coming soon items
            alert('This feature is coming soon! Stay tuned for updates.');
            return;
        }

        if (setting.isHelp) {
            openHelp();
        } else {
            router.push(setting.href);
        }
    };

    // Filter settings based on user privileges
    const filteredSettings = settingsCategories.filter(setting => {
        // System utilities are only available to system admins
        if (setting.category === 'System Utilities' && !isGlobalAdmin) {
            return false;
        }
        // Feedback management is available to system admins and regular admins
        if (setting.id === 'feedback-management' && !isGlobalAdmin) {
            // For now, let's make it visible to all users to test
            // TODO: Add proper admin role check here
            return true;
        }
        return true;
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>⚙️ Administration & Utilities</h1>
                <p className={styles.subtitle}>
                    Manage users, configure system settings, access administrative tools, and system utilities
                </p>
            </div>

            <div className={styles.utilitiesGrid}>
                {filteredSettings.map((setting) => (
                    <Card
                        key={setting.id}
                        className={`${styles.utilityCard} ${setting.comingSoon ? styles.comingSoonCard : ''}`}
                        onClick={() => handleSettingClick(setting)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className={styles.utilityContent}>
                            <div className={styles.utilityIcon}>
                                {setting.icon}
                            </div>
                            <div className={styles.utilityInfo}>
                                <h3 className={styles.utilityTitle}>
                                    {setting.title}
                                    {setting.comingSoon && <span className={styles.comingSoonBadge}>Coming Soon</span>}
                                </h3>
                                <p className={styles.utilityDescription}>
                                    {setting.description}
                                </p>
                                <span className={styles.categoryBadge}>
                                    {setting.category}
                                </span>
                            </div>
                            <div className={styles.utilityAction}>
                                <button
                                    className={`${styles.actionButton} ${setting.comingSoon ? styles.comingSoonButton : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSettingClick(setting);
                                    }}
                                >
                                    {setting.comingSoon ? 'Coming Soon' : `${setting.action} →`}
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
} 