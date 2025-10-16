'use client';

import { useState, ReactNode } from 'react';
import Sidebar from './Sidebar/Sidebar';
import Header from './Header/Header';
import FeedbackButton from '@/components/ui/FeedbackButton/FeedbackButton';
import { useTenant } from '@/components/TenantProvider';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';
import { Role, User } from '@/types';
import styles from './Layout.module.css';

interface AuthUser {
    id: string;
    name: string;
    email: string;
    roles: string[];
    effectiveRole: string;
}

interface LayoutProps {
    children: ReactNode;
    user: AuthUser | null;
    onLogout: () => void;
}

export default function Layout({ children, user, onLogout }: LayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const { currentFarm, isLoading: isTenantLoading } = useTenant();

    if (!user) {
        return <>{children}</>;
    }

    // Convert string roles to Role enum values
    const userRoles: Role[] = user.roles.map(role => role as Role);

    const toggleSidebar = () => {
        setSidebarCollapsed(prev => !prev);
    };

    const toggleMobileSidebar = () => {
        setMobileSidebarOpen(prev => !prev);
    };

    const closeMobileSidebar = () => {
        setMobileSidebarOpen(false);
    };

    // Create a User object that matches the expected interface
    const userForHeader: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: userRoles.map(role => ({
            id: `${user.id}-${role}`,
            userId: user.id,
            role: role
        })),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    return (
        <div className={styles.layout}>
            {/* Header - Always provide mobile menu handler but CSS controls visibility */}
            <Header
                user={userForHeader}
                onLogout={onLogout}
                showMenuButton={true}
                onMenuClick={toggleMobileSidebar}
            />

            {/* Body with sidebar and content */}
            <div className={styles.body}>
                <Sidebar
                    userRoles={userRoles}
                    isCollapsed={sidebarCollapsed}
                    onToggle={toggleSidebar}
                />

                <main className={`${styles.content} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
                    {children}
                </main>
            </div>

            {/* Mobile sidebar overlay */}
            {mobileSidebarOpen && (
                <>
                    <div
                        className={`${styles.mobileSidebar} ${mobileSidebarOpen ? styles.open : ''}`}
                    >
                        <Sidebar
                            userRoles={userRoles}
                            isCollapsed={false}
                            onToggle={closeMobileSidebar}
                        />
                    </div>
                    <div
                        className={styles.overlay}
                        onClick={closeMobileSidebar}
                        aria-hidden="true"
                    />
                </>
            )}

            {/* Floating Feedback Button - Only show when tenant context is loaded or for system admins */}
            {!isTenantLoading && (currentFarm || isSystemAdmin({ ...user, roles: userRoles })) && (
                    <FeedbackButton
                        floating={true}
                        variant="primary"
                        size="md"
                    />
                )}
        </div>
    );
} 