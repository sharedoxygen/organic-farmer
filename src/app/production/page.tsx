'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import styles from './page.module.css';

export default function ProductionPage() {
    // Filters temporarily disabled
    // const [activeFilters, setActiveFilters] = useState({
    //     status: 'all',
    //     stage: 'all'
    // });

    const productionModules = [
        {
            id: 'batches',
            title: 'Batch Management',
            icon: '🌿',
            description: 'Track and manage production batches from seed to harvest',
            href: '/production/batches',
            stats: { active: 8, completed: 23, pending: 3 },
            urgent: false
        },
        {
            id: 'environments',
            title: 'Growing Environments',
            icon: '🏠',
            description: 'Monitor and control growing conditions across facilities',
            href: '/production/environments',
            stats: { zones: 6, optimal: 5, alerts: 1 },
            urgent: true
        },
        {
            id: 'seeds',
            title: 'Seeds & Genetics',
            icon: '🌰',
            description: 'Manage seed inventory, varieties, and genetic records',
            href: '/production/seeds',
            stats: { varieties: 12, stock: '95%', orders: 2 },
            urgent: false
        },
        {
            id: 'harvesting',
            title: 'Harvesting & Processing',
            icon: '✂️',
            description: 'Schedule and track harvesting operations',
            href: '/production/harvesting',
            stats: { ready: 4, scheduled: 6, processed: 15 },
            urgent: false
        },
        {
            id: 'post-harvest',
            title: 'Post-Harvest Handling',
            icon: '📦',
            description: 'Manage washing, packaging, and storage operations',
            href: '/production/post-harvest',
            stats: { processing: 3, packaged: 12, shipped: 8 },
            urgent: false
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>
                        🌱 Production Operations
                    </h1>
                    <p className={styles.subtitle}>
                        Manage all aspects of your microgreens production from seed to harvest
                    </p>
                </div>

                <div className={styles.quickStats}>
                    <div className={styles.stat}>
                        <span className={styles.statNumber}>8</span>
                        <span className={styles.statLabel}>Active Batches</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statNumber}>6</span>
                        <span className={styles.statLabel}>Growing Zones</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statNumber}>94%</span>
                        <span className={styles.statLabel}>Efficiency</span>
                    </div>
                </div>
            </div>

            <div className={styles.moduleGrid}>
                {productionModules.map((module) => (
                    <Link key={module.id} href={module.href} className={styles.moduleLink}>
                        <Card className={`${styles.moduleCard} ${module.urgent ? styles.urgent : ''}`}>
                            <div className={styles.moduleHeader}>
                                <div className={styles.moduleIcon}>{module.icon}</div>
                                <div className={styles.moduleInfo}>
                                    <h3 className={styles.moduleTitle}>{module.title}</h3>
                                    <p className={styles.moduleDescription}>{module.description}</p>
                                </div>
                                {module.urgent && (
                                    <div className={styles.urgentBadge}>
                                        ⚠️ Needs Attention
                                    </div>
                                )}
                            </div>

                            <div className={styles.moduleStats}>
                                {Object.entries(module.stats).map(([key, value]) => (
                                    <div key={key} className={styles.moduleStat}>
                                        <span className={styles.moduleStatValue}>{value}</span>
                                        <span className={styles.moduleStatLabel}>{key}</span>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.moduleActions}>
                                <span className={styles.viewDetails}>View Details →</span>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className={styles.recentActivity}>
                <Card>
                    <div className={styles.activityHeader}>
                        <h2>Recent Production Activity</h2>
                        <Link href="/tasks/daily" className={styles.viewAllLink}>
                            View All Tasks
                        </Link>
                    </div>

                    <div className={styles.activityList}>
                        <div className={styles.activityItem}>
                            <div className={styles.activityIcon}>🌱</div>
                            <div className={styles.activityContent}>
                                <p className={styles.activityDescription}>
                                    Batch B2024-045 (Arugula) moved to harvest stage
                                </p>
                                <span className={styles.activityTime}>2 hours ago</span>
                            </div>
                            <div className={styles.activityStatus}>Ready</div>
                        </div>

                        <div className={styles.activityItem}>
                            <div className={styles.activityIcon}>🏠</div>
                            <div className={styles.activityContent}>
                                <p className={styles.activityDescription}>
                                    Zone 3 temperature alert resolved - conditions normalized
                                </p>
                                <span className={styles.activityTime}>4 hours ago</span>
                            </div>
                            <div className={styles.activityStatus}>Resolved</div>
                        </div>

                        <div className={styles.activityItem}>
                            <div className={styles.activityIcon}>✂️</div>
                            <div className={styles.activityContent}>
                                <p className={styles.activityDescription}>
                                    Harvesting completed for Batch B2024-042 (Pea Shoots)
                                </p>
                                <span className={styles.activityTime}>6 hours ago</span>
                            </div>
                            <div className={styles.activityStatus}>Complete</div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
} 