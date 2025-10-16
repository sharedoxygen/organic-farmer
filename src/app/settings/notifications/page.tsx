'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

import { Card } from '@/components/ui';
import styles from '../page.module.css';

export default function NotificationsPage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>📢 System Notifications</h1>
                <p className={styles.subtitle}>
                    Broadcast announcements, alerts, and updates to users across the organization
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
                            System notifications feature is under development. This will allow administrators to send system-wide announcements, alerts, and important updates to all users.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
} 