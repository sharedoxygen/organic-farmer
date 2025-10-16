'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

import Link from 'next/link';
import { Card } from '@/components/ui';
import styles from './page.module.css';

export default function PlanningPage() {
    const planningModules = [
        {
            title: 'Crop Planning',
            description: 'Plan your crop rotations and growing schedules',
            href: '/planning/crops',
            icon: '🌾',
            status: 'Available'
        },
        {
            title: 'Production Calendar',
            description: 'View and manage your production timeline',
            href: '/planning/calendar',
            icon: '📅',
            status: 'Available'
        },
        {
            title: 'Demand Forecasting',
            description: 'Forecast customer demand and plan accordingly',
            href: '/planning/forecasting',
            icon: '📈',
            status: 'Available'
        },
        {
            title: 'Resource Planning',
            description: 'Optimize resource allocation and capacity planning',
            href: '/planning/resources',
            icon: '⚡',
            status: 'Available'
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Planning & Forecasting</h1>
                <p>Strategic planning tools for your microgreens operation</p>
            </div>

            <div className={styles.grid}>
                {planningModules.map((module) => (
                    <Card key={module.href} className={styles.moduleCard}>
                        <Link href={module.href} className={styles.moduleLink}>
                            <div className={styles.moduleIcon}>{module.icon}</div>
                            <h3>{module.title}</h3>
                            <p>{module.description}</p>
                            <div className={styles.moduleStatus}>
                                <span className={styles.statusBadge}>{module.status}</span>
                            </div>
                        </Link>
                    </Card>
                ))}
            </div>
        </div>
    );
} 