'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card, Button } from '@/components/ui';
import styles from './page.module.css';

interface BackupRecord {
    id: string;
    date: string;
    size: string;
    type: 'automatic' | 'manual';
    status: 'completed' | 'failed' | 'in_progress';
}

export default function BackupPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [backups, setBackups] = useState<BackupRecord[]>([
        { id: '1', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), size: '2.4 MB', type: 'automatic', status: 'completed' },
        { id: '2', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), size: '2.3 MB', type: 'automatic', status: 'completed' },
        { id: '3', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), size: '2.3 MB', type: 'manual', status: 'completed' },
        { id: '4', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), size: '2.1 MB', type: 'automatic', status: 'completed' },
    ]);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/auth/signin');
        }
    }, [isAuthLoading, isAuthenticated, router]);

    const handleCreateBackup = async () => {
        setCreating(true);

        const newBackup: BackupRecord = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            size: '0 MB',
            type: 'manual',
            status: 'in_progress',
        };

        setBackups([newBackup, ...backups]);

        // Simulate backup creation
        await new Promise(resolve => setTimeout(resolve, 2000));

        setBackups(prev => prev.map(b =>
            b.id === newBackup.id
                ? { ...b, size: '2.5 MB', status: 'completed' as const }
                : b
        ));

        setCreating(false);
    };

    const handleDownload = (backup: BackupRecord) => {
        // In production, this would download the actual backup file
        const data = {
            farm: currentFarm?.farm_name,
            backupDate: backup.date,
            type: backup.type,
            note: 'This is a simulated backup file for demonstration purposes.',
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date(backup.date).toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleRestore = (backup: BackupRecord) => {
        if (confirm(`Are you sure you want to restore from backup dated ${new Date(backup.date).toLocaleDateString()}? This will overwrite current data.`)) {
            alert('Restore initiated. This feature would restore your data from the selected backup.');
        }
    };

    if (isAuthLoading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>💾 Data Backup & Recovery</h1>
                    <p>Manage data backups and restore points for {currentFarm?.farm_name || 'your farm'}</p>
                </div>
                <Button variant="primary" onClick={handleCreateBackup} disabled={creating}>
                    {creating ? 'Creating...' : '+ Create Backup'}
                </Button>
            </div>

            <div className={styles.stats}>
                <Card className={styles.statCard}>
                    <div className={styles.statValue}>{backups.length}</div>
                    <div className={styles.statLabel}>Total Backups</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statValue}>
                        {backups[0] ? new Date(backups[0].date).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className={styles.statLabel}>Last Backup</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statValue}>Daily</div>
                    <div className={styles.statLabel}>Auto-Backup</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statValue}>30 Days</div>
                    <div className={styles.statLabel}>Retention</div>
                </Card>
            </div>

            <Card className={styles.backupList}>
                <h2>Backup History</h2>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Size</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {backups.map((backup) => (
                            <tr key={backup.id}>
                                <td>{new Date(backup.date).toLocaleString()}</td>
                                <td>{backup.size}</td>
                                <td>
                                    <span className={`${styles.typeBadge} ${styles[backup.type]}`}>
                                        {backup.type}
                                    </span>
                                </td>
                                <td>
                                    <span className={`${styles.statusBadge} ${styles[backup.status]}`}>
                                        {backup.status === 'in_progress' ? '⏳ In Progress' :
                                            backup.status === 'completed' ? '✅ Completed' : '❌ Failed'}
                                    </span>
                                </td>
                                <td className={styles.actions}>
                                    {backup.status === 'completed' && (
                                        <>
                                            <button onClick={() => handleDownload(backup)} className={styles.actionBtn}>
                                                📥 Download
                                            </button>
                                            <button onClick={() => handleRestore(backup)} className={styles.actionBtn}>
                                                🔄 Restore
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <Card className={styles.infoCard}>
                <h3>ℹ️ About Backups</h3>
                <ul>
                    <li>Automatic backups are created daily at 2:00 AM in your timezone</li>
                    <li>Backups are retained for 30 days before automatic deletion</li>
                    <li>Manual backups can be created at any time</li>
                    <li>Restoring a backup will replace all current data with the backup data</li>
                </ul>
            </Card>
        </div>
    );
}
