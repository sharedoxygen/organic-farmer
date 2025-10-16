import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import Logo from '@/components/Logo/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle/ThemeToggle';
import { HelpButton } from '@/components/ui/HelpButton/HelpButton';
import { useHelp } from '@/components/HelpProvider';
import { useTenant } from '@/components/TenantProvider';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';
import styles from './Header.module.css';

interface HeaderProps {
    user: User;
    onLogout: () => void;
    showMenuButton?: boolean;
    onMenuClick?: () => void;
}

export default function Header({
    user,
    onLogout,
    showMenuButton = false,
    onMenuClick
}: HeaderProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showFarmSelector, setShowFarmSelector] = useState(false);
    const router = useRouter();
    const { openHelp } = useHelp();
    const { currentFarm, availableFarms, switchFarm, isLoading: tenantLoading } = useTenant();

    const toggleUserMenu = () => {
        setShowUserMenu(prev => !prev);
    };

    const handleLogout = () => {
        setShowUserMenu(false);
        onLogout();
    };

    const handleSettingsClick = () => {
        router.push('/settings');
    };

    const goToAIModels = () => {
        router.push('/admin/utilities/ai-models');
        setShowUserMenu(false);
    };

    const toggleFarmSelector = () => {
        setShowFarmSelector(prev => !prev);
    };

    const handleFarmSwitch = async (farmId: string) => {
        try {
            await switchFarm(farmId);
            setShowFarmSelector(false);
        } catch (error) {
            console.error('Failed to switch farm:', error);
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                {showMenuButton && (
                    <button
                        className={styles.menuButton}
                        onClick={onMenuClick}
                        aria-label="Toggle navigation menu"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                )}

                <div className={styles.brand}>
                    <Logo size="md" variant="full" />
                </div>
            </div>

            <div className={styles.right}>
                {/* Notifications Section */}
                <div className={styles.section}>
                    <button className={styles.notificationButton} aria-label="Notifications">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                        {/* Notification badge removed until real notifications are implemented */}
                    </button>
                </div>

                {/* Help Section */}
                <div className={styles.section}>
                    <HelpButton variant="compact" />
                </div>

                {/* Farm Selector - Show when multiple farms available */}
                {!tenantLoading && currentFarm && availableFarms.length > 1 && (
                    <div className={styles.farmSelector}>
                        <button
                            className={styles.farmButton}
                            onClick={toggleFarmSelector}
                            aria-expanded={showFarmSelector}
                            aria-haspopup="true"
                            aria-label="Select farm"
                        >
                            <div className={styles.farmIcon}>
                                {currentFarm.settings?.farm_type === 'CANNABIS_CULTIVATION' ? '🌿' : '🏢'}
                            </div>
                            <div className={styles.farmInfo}>
                                <span className={styles.farmLabel}>Farm:</span>
                                <span className={styles.farmName}>{currentFarm.farm_name}</span>
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        {showFarmSelector && (
                            <>
                                <div className={styles.overlay} onClick={() => setShowFarmSelector(false)} />
                                <div className={styles.farmDropdown}>
                                    <div className={styles.farmMenuHeader}>
                                        <strong>Switch Farm</strong>
                                        <span className={styles.farmCount}>{availableFarms.length} available</span>
                                    </div>
                                    <div className={styles.dropdownDivider}></div>
                                    {availableFarms.map((farm) => (
                                        <button
                                            key={farm.id}
                                            className={`${styles.farmMenuItem} ${currentFarm.id === farm.id ? styles.activeFarm : ''}`}
                                            onClick={() => handleFarmSwitch(farm.id)}
                                        >
                                            <div className={styles.farmItemIcon}>
                                                {farm.settings?.farm_type === 'CANNABIS_CULTIVATION' ? '🌿' : '🌱'}
                                            </div>
                                            <div className={styles.farmItemInfo}>
                                                <span className={styles.farmItemName}>{farm.farm_name}</span>
                                                <span className={styles.farmItemType}>
                                                    {farm.settings?.farm_type === 'CANNABIS_CULTIVATION' ? 'Cannabis Cultivation' : 'Organic Farming'}
                                                </span>
                                            </div>
                                            {currentFarm.id === farm.id && (
                                                <div className={styles.activeIndicator}>✓</div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Theme Toggle Section */}
                <div className={styles.section}>
                    <ThemeToggle />
                    <button
                        className={styles.settingsButton}
                        onClick={handleSettingsClick}
                        aria-label="Administration"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                        <span className={styles.sectionLabel}>Utilities</span>
                    </button>
                    <button
                        className={styles.settingsButton}
                        onClick={goToAIModels}
                        aria-label="AI Models"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2l2.09 6.26L20 9l-5 3.64L16.18 20 12 16.9 7.82 20 9 12.64 4 9l5.91-.74L12 2z" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                        <span className={styles.sectionLabel}>AI Models</span>
                    </button>
                </div>

                {/* User Profile Section */}
                <div className={styles.userSection}>
                    <button
                        className={styles.userButton}
                        onClick={toggleUserMenu}
                        aria-expanded={showUserMenu}
                        aria-haspopup="true"
                    >
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{user.name}</span>
                            <span className={styles.userRole}>
                                {user.roles?.map(r => r.role).join(', ') || 'USER'}
                            </span>
                        </div>
                        <div className={styles.userAvatar}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    </button>

                    {showUserMenu && (
                        <>
                            <div className={styles.overlay} onClick={() => setShowUserMenu(false)} />
                            <div className={styles.userDropdown}>
                                <div className={styles.userDetails}>
                                    <div className={styles.userDetailAvatar}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={styles.userDetailInfo}>
                                        <strong className={styles.userDetailName}>{user.name}</strong>
                                        <small className={styles.userDetailEmail}>{user.email}</small>
                                        <span className={styles.userDetailRole}>
                                            {user.roles?.map(r => r.role).join(', ') || 'USER'}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.dropdownDivider} />
                                <button className={styles.dropdownItem}>
                                    <span className={styles.dropdownIcon}>👤</span>
                                    My Profile
                                </button>
                                <button className={styles.dropdownItem}>
                                    <span className={styles.dropdownIcon}>⚙️</span>
                                    Account Settings
                                </button>
                                <button className={styles.dropdownItem}>
                                    <span className={styles.dropdownIcon}>🔔</span>
                                    Notification Preferences
                                </button>
                                <button className={styles.dropdownItem}>
                                    <span className={styles.dropdownIcon}>📊</span>
                                    Activity Dashboard
                                </button>
                                <div className={styles.dropdownDivider} />
                                <button
                                    className={styles.dropdownItem}
                                    onClick={() => {
                                        setShowUserMenu(false);
                                        openHelp();
                                    }}
                                >
                                    <span className={styles.dropdownIcon}>❓</span>
                                    Help & Support
                                </button>
                                <button
                                    className={styles.dropdownItem}
                                    onClick={handleLogout}
                                >
                                    <span className={styles.dropdownIcon}>🚪</span>
                                    Sign Out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
} 