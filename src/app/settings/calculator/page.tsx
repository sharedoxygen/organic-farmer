'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

import { Card } from '@/components/ui';
import styles from '../page.module.css';

export default function CalculatorPage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>🧮 Production Calculator</h1>
                <p className={styles.subtitle}>
                    Calculate growing schedules, yields, and resource requirements for optimal production planning
                </p>
            </div>

            <Card className={styles.utilityCard}>
                <div className={styles.utilityContent}>
                    <div className={styles.utilityIcon}>
                        🚧
                    </div>
                    <div className={styles.utilityInfo}>
                        <h3 className={styles.utilityTitle}>
                            Coming Soon
                        </h3>
                        <p className={styles.utilityDescription}>
                            Production planning calculator is under development. This will help you calculate optimal growing schedules, expected yields, resource requirements, and production timelines.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
} 