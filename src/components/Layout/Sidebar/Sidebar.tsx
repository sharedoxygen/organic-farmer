'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Role } from '@/types';
import styles from './Sidebar.module.css';

interface SidebarProps {
    userRoles: Role[];
    isCollapsed?: boolean;
    onToggle?: () => void;
}

interface NavItem {
    id: string;
    label: string;
    href: string;
    icon: string;
    requiredRoles?: Role[];
    children?: NavItem[];
    badge?: string;
    urgent?: boolean;
}

// 🌱 WORKFLOW-GUIDED NAVIGATION: Organized to follow natural farm-to-delivery sequence
const navigationItems: NavItem[] = [
    // ===== STEP 1: OVERVIEW =====
    {
        id: 'mission-control',
        label: 'Mission Control',
        href: '/mission-control',
        icon: '🎯',
        badge: 'NEW',
    },
    {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: '📊',
    },

    // ===== STEP 2: PLAN & FORECAST =====
    {
        id: 'planning',
        label: 'Planning & Forecasting',
        href: '/planning',
        icon: '🗓️',
        children: [
            {
                id: 'crop-planning',
                label: 'Crop Planning',
                href: '/planning/crops',
                icon: '🌾',
            },
            {
                id: 'production-calendar',
                label: 'Production Calendar',
                href: '/planning/calendar',
                icon: '📅',
            },
            {
                id: 'demand-forecasting',
                label: 'Demand Forecasting',
                href: '/planning/forecasting',
                icon: '📈',
            },
            {
                id: 'resource-planning',
                label: 'Resource Planning',
                href: '/planning/resources',
                icon: '⚡',
            },
        ],
    },

    // ===== STEP 3: EXECUTE PRODUCTION (ordered by production sequence) =====
    {
        id: 'production',
        label: 'Production Operations',
        href: '/production',
        icon: '🌱',
        children: [
            {
                id: 'seeds-genetics',  // 1st: Select seeds/genetics
                label: 'Seeds & Genetics',
                href: '/production/seeds',
                icon: '🌰',
            },
            {
                id: 'growing-environments',  // 2nd: Prepare growing spaces
                label: 'Growing Environments',
                href: '/production/environments',
                icon: '🏠',
            },
            {
                id: 'batches',  // 3rd: Create production batches
                label: 'Batch Management',
                href: '/production/batches',
                icon: '🌿',
            },
            {
                id: 'harvesting',  // 4th: Harvest crops
                label: 'Harvesting & Processing',
                href: '/production/harvesting',
                icon: '✂️',
            },
            {
                id: 'post-harvest',  // 5th: Process and package
                label: 'Post-Harvest Handling',
                href: '/production/post-harvest',
                icon: '📦',
            },
        ],
    },

    // ===== STEP 4: QUALITY & COMPLIANCE (during/after production) =====
    {
        id: 'quality',
        label: 'Quality & Compliance',
        href: '/quality',
        icon: '✅',
        children: [
            {
                id: 'quality-control',
                label: 'Quality Control',
                href: '/quality/control',
                icon: '🔍',
                badge: '3',
                urgent: true,
            },
            {
                id: 'food-safety',
                label: 'Food Safety',
                href: '/quality/food-safety',
                icon: '🛡️',
            },
            {
                id: 'organic-compliance',
                label: 'USDA Organic Compliance',
                href: '/quality/organic',
                icon: '🌿',
            },
            {
                id: 'certifications',
                label: 'Certifications',
                href: '/quality/certifications',
                icon: '📜',
            },
            {
                id: 'audit-logs',
                label: 'Audit Logs',
                href: '/quality/audits',
                icon: '📋',
            },
        ],
    },

    // ===== STEP 5: INVENTORY MANAGEMENT (track what's ready for sale) =====
    {
        id: 'inventory',
        label: 'Inventory Management',
        href: '/inventory',
        icon: '📚',
        requiredRoles: ['ADMIN', 'MANAGER', 'TEAM_LEAD'],
        children: [
            {
                id: 'stock-levels',
                label: 'Stock Levels',
                href: '/inventory/stock',
                icon: '📊',
            },
            {
                id: 'ingredients-supplies',
                label: 'Ingredients & Supplies',
                href: '/inventory/supplies',
                icon: '🧪',
            },
            {
                id: 'packaging-materials',
                label: 'Packaging Materials',
                href: '/inventory/packaging',
                icon: '📦',
            },
            {
                id: 'equipment-tools',
                label: 'Equipment & Tools',
                href: '/inventory/equipment',
                icon: '🔧',
            },
        ],
    },

    // ===== STEP 6: SALES & DELIVERY =====
    {
        id: 'sales-orders',
        label: 'Sales & Orders',
        href: '/sales',
        icon: '💼',
        children: [
            {
                id: 'order-management',
                label: 'Order Management',
                href: '/sales/orders',
                icon: '📋',
            },
            {
                id: 'customers',
                label: 'Customers',
                href: '/sales/customers',
                icon: '👥',
            },
            {
                id: 'pricing-contracts',
                label: 'Pricing & Contracts',
                href: '/sales/pricing',
                icon: '💰',
            },
            {
                id: 'delivery-logistics',
                label: 'Delivery & Logistics',
                href: '/sales/delivery',
                icon: '🚚',
            },
        ],
    },

    // ===== STEP 7: TRACEABILITY (seed-to-consumer tracking) =====
    {
        id: 'traceability',
        label: 'Traceability & Documentation',
        href: '/traceability',
        icon: '🔗',
        children: [
            {
                id: 'seed-to-sale',
                label: 'Seed-to-Sale Tracking',
                href: '/traceability/seed-to-sale',
                icon: '🌱→📦',
            },
            {
                id: 'lot-tracking',
                label: 'Lot Tracking',
                href: '/traceability/lots',
                icon: '🏷️',
            },
            {
                id: 'recall-management',
                label: 'Recall Management',
                href: '/traceability/recalls',
                icon: '⚠️',
            },
            {
                id: 'chain-of-custody',
                label: 'Chain of Custody',
                href: '/traceability/custody',
                icon: '📋',
            },
        ],
    },

    // ===== SUPPORTING OPERATIONS =====
    {
        id: 'tasks',
        label: 'Task Management',
        href: '/tasks',
        icon: '✓',
        children: [
            {
                id: 'daily-tasks',
                label: 'Daily Tasks',
                href: '/tasks/daily',
                icon: '📅',
                badge: '12',
            },
            {
                id: 'work-orders',
                label: 'Work Orders',
                href: '/tasks/work-orders',
                icon: '📋',
            },
            {
                id: 'team-assignments',
                label: 'Team Assignments',
                href: '/tasks/assignments',
                icon: '👥',
            },
        ],
    },

    {
        id: 'equipment',
        label: 'Equipment & Facilities',
        href: '/equipment',
        icon: '🏭',
        requiredRoles: ['ADMIN', 'MANAGER', 'TEAM_LEAD', 'SPECIALIST_LEAD'],
        children: [
            {
                id: 'equipment-management',
                label: 'Equipment Management',
                href: '/equipment/management',
                icon: '⚙️',
            },
            {
                id: 'maintenance-schedules',
                label: 'Maintenance Schedules',
                href: '/equipment/maintenance',
                icon: '🔧',
            },
            {
                id: 'environmental-controls',
                label: 'Environmental Controls',
                href: '/equipment/environmental',
                icon: '🌡️',
            },
            {
                id: 'iot-sensors',
                label: 'IoT Sensors',
                href: '/equipment/sensors',
                icon: '📡',
            },
        ],
    },

    // ===== ANALYSIS & INSIGHTS =====
    {
        id: 'analytics',
        label: 'Analytics & Reporting',
        href: '/analytics',
        icon: '📈',
        children: [
            {
                id: 'production-analytics',
                label: 'Production Analytics',
                href: '/analytics/production',
                icon: '🌱',
            },
            {
                id: 'financial-reports',
                label: 'Financial Reports',
                href: '/analytics/financial',
                icon: '💰',
                requiredRoles: ['ADMIN', 'MANAGER'],
            },
            {
                id: 'yield-analysis',
                label: 'Yield Analysis',
                href: '/analytics/yield',
                icon: '📊',
            },
            {
                id: 'market-analysis',
                label: 'Market Analysis',
                href: '/analytics/market',
                icon: '📈',
            },
            {
                id: 'sustainability-metrics',
                label: 'Sustainability Metrics',
                href: '/analytics/sustainability',
                icon: '🌍',
            },
        ],
    },

    {
        id: 'ai-insights',
        label: 'AI Intelligence',
        href: '/ai-insights',
        icon: '🧠',
        badge: 'NEW',
        children: [
            {
                id: 'plant-scan',
                label: 'Plant Vision Scan',
                href: '/mobile/plant-scan',
                icon: '📷',
                badge: 'MOBILE',
            },
            {
                id: 'ai-dashboard',
                label: 'AI Command Center',
                href: '/ai-dashboard',
                icon: '🎯',
                badge: 'NEW',
            },
            {
                id: 'ai-classic',
                label: 'Classic Insights',
                href: '/ai-insights',
                icon: '📊',
            },
            {
                id: 'observability',
                label: 'Observability Hub',
                href: '/observability',
                icon: '📡',
            },
            {
                id: 'operations-center',
                label: 'Operations Center',
                href: '/admin/operations',
                icon: '⚙️',
                badge: 'CLI',
            },
        ],
    },

    // ===== SYSTEM MANAGEMENT =====
    {
        id: 'integrations',
        label: 'Integrations',
        href: '/integrations',
        icon: '🔌',
        requiredRoles: ['ADMIN', 'MANAGER'],
        children: [
            {
                id: 'weather-data',
                label: 'Weather Data',
                href: '/integrations/weather',
                icon: '🌤️',
            },
            {
                id: 'ecommerce',
                label: 'E-commerce Platforms',
                href: '/integrations/ecommerce',
                icon: '🛒',
            },
            {
                id: 'accounting-systems',
                label: 'Accounting Systems',
                href: '/integrations/accounting',
                icon: '💼',
            },
            {
                id: 'laboratory-systems',
                label: 'Laboratory Systems',
                href: '/integrations/laboratory',
                icon: '🧪',
            },
        ],
    },
];

// Add feedback navigation items
const feedbackNavItems: NavItem[] = [
    {
        id: 'my-feedback',
        label: 'My Feedback',
        href: '/feedback',
        icon: '💬',
    },
];

// Insert feedbackNavItems after dashboard
const navigationItemsWithFeedback = [
    navigationItems[0],
    ...feedbackNavItems,
    ...navigationItems.slice(1),
];

function hasRequiredRole(userRoles: Role[], requiredRoles?: Role[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return userRoles.some(role => requiredRoles.includes(role));
}

export default function Sidebar({ userRoles, isCollapsed = false, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    // Function to find which parent section should be expanded based on current pathname
    const getParentSectionFromPath = (currentPath: string): string[] => {
        const sectionsToExpand: string[] = [];

        navigationItemsWithFeedback.forEach(item => {
            if (item.children) {
                // Check if current path matches any child route
                const matchesChild = item.children.some(child =>
                    currentPath === child.href || currentPath.startsWith(child.href + '/')
                );

                // Also check if current path matches the parent route
                const matchesParent = currentPath === item.href || currentPath.startsWith(item.href + '/');

                if (matchesChild || matchesParent) {
                    sectionsToExpand.push(item.id);
                }
            }
        });

        return sectionsToExpand;
    };

    // Auto-expand parent sections based on current pathname
    useEffect(() => {
        const requiredExpansions = getParentSectionFromPath(pathname);

        // Only update if there are actually sections that need to be expanded
        if (requiredExpansions.length > 0) {
            setExpandedItems(prev => {
                // Merge existing expanded items with required ones, avoiding duplicates
                const combined = [...prev, ...requiredExpansions];
                const newExpanded = combined.filter((item, index) => combined.indexOf(item) === index);
                return newExpanded;
            });
        }
    }, [pathname]);

    const toggleExpanded = (itemId: string, event?: React.MouseEvent) => {
        // Prevent event bubbling
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        setExpandedItems(prev => {
            const isCurrentlyExpanded = prev.includes(itemId);

            if (isCurrentlyExpanded) {
                // Only collapse if user explicitly clicked to collapse
                // Don't auto-collapse if they're on a child route
                const shouldStayExpanded = getParentSectionFromPath(pathname).includes(itemId);
                if (shouldStayExpanded) {
                    return prev; // Keep it expanded
                }
                return prev.filter(id => id !== itemId);
            } else {
                return [...prev, itemId];
            }
        });
    };

    const isItemActive = (href: string): boolean => {
        return pathname === href || pathname.startsWith(href + '/');
    };

    const renderNavItem = (item: NavItem, depth = 0) => {
        if (!hasRequiredRole(userRoles, item.requiredRoles)) {
            return null;
        }

        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems.includes(item.id);
        const isActive = isItemActive(item.href);

        return (
            <li key={item.id} className={styles.navItem}>
                {hasChildren ? (
                    <div>
                        <button
                            className={`${styles.navLink} ${isActive ? styles.active : ''} ${depth > 0 ? styles.subItem : ''}`}
                            onClick={(e) => toggleExpanded(item.id, e)}
                            aria-expanded={isExpanded}
                            type="button"
                        >
                            <span className={styles.icon}>{item.icon}</span>
                            {!isCollapsed && (
                                <>
                                    <span className={styles.label}>{item.label}</span>
                                    {item.badge && (
                                        <span className={`${styles.badge} ${item.urgent ? styles.urgent : ''}`}>
                                            {item.badge}
                                        </span>
                                    )}
                                    <span className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
                                        ▼
                                    </span>
                                </>
                            )}
                        </button>

                        {/* Also make the parent section clickable as a navigation link */}
                        {!isCollapsed && (
                            <Link
                                href={item.href}
                                className={`${styles.navLinkOverlay} ${isActive && pathname === item.href ? styles.active : ''}`}
                            >
                                <span className={styles.hiddenText}>{item.label}</span>
                            </Link>
                        )}
                    </div>
                ) : (
                    <Link
                        href={item.href}
                        className={`${styles.navLink} ${isActive ? styles.active : ''} ${depth > 0 ? styles.subItem : ''}`}
                    >
                        <span className={styles.icon}>{item.icon}</span>
                        {!isCollapsed && (
                            <>
                                <span className={styles.label}>{item.label}</span>
                                {item.badge && (
                                    <span className={`${styles.badge} ${item.urgent ? styles.urgent : ''}`}>
                                        {item.badge}
                                    </span>
                                )}
                            </>
                        )}
                    </Link>
                )}

                {hasChildren && isExpanded && !isCollapsed && (
                    <ul className={styles.subNav}>
                        {item.children?.map(child => renderNavItem(child, depth + 1))}
                    </ul>
                )}
            </li>
        );
    };

    return (
        <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
            <nav className={styles.nav} role="navigation" aria-label="Main navigation">
                <ul className={styles.navList}>
                    {navigationItemsWithFeedback.map(item => renderNavItem(item))}
                </ul>
            </nav>

            <div className={styles.footer}>
                {!isCollapsed && (
                    <p className={styles.version}>OFMS v1.0.0</p>
                )}
                {onToggle && (
                    <button className={styles.toggleButton} onClick={onToggle} aria-label="Toggle sidebar">
                        {isCollapsed ? '→' : '←'}
                    </button>
                )}
            </div>
        </aside>
    );
} 