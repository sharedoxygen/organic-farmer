'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

import React from 'react';
import { Card } from '@/components/ui';
import styles from './page.module.css';

interface TraceabilityItem {
    id: string;
    batchNumber: string;
    variety: string;
    status: string;
    plantDate: string;
    harvestDate?: string;
    quantity: number;
    location: string;
}

export default function TraceabilityPage(): JSX.Element {
    // Demo traceability data (in real app, this would come from API)
    const traceabilityItems: TraceabilityItem[] = [
        {
            id: '1',
            batchNumber: 'B2024-001',
            variety: 'Arugula',
            status: 'Harvested',
            plantDate: '2024-01-15',
            harvestDate: '2024-02-05',
            quantity: 45,
            location: 'Zone A'
        },
        {
            id: '2',
            batchNumber: 'B2024-002',
            variety: 'Basil',
            status: 'Growing',
            plantDate: '2024-01-20',
            quantity: 30,
            location: 'Zone B'
        },
        {
            id: '3',
            batchNumber: 'B2024-003',
            variety: 'Kale',
            status: 'Packaged',
            plantDate: '2024-01-10',
            harvestDate: '2024-01-31',
            quantity: 55,
            location: 'Zone C'
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Traceability</h1>
                <p>Track your microgreens from seed to sale</p>
            </div>

            <div className={styles.content}>
                <div className={styles.statsGrid}>
                    <Card className={styles.statCard}>
                        <div className={styles.statIcon}>📊</div>
                        <div className={styles.statContent}>
                            <h3>Total Batches</h3>
                            <p className={styles.statValue}>{traceabilityItems.length}</p>
                        </div>
                    </Card>

                    <Card className={styles.statCard}>
                        <div className={styles.statIcon}>🌱</div>
                        <div className={styles.statContent}>
                            <h3>Currently Growing</h3>
                            <p className={styles.statValue}>
                                {traceabilityItems.filter(item => item.status === 'Growing').length}
                            </p>
                        </div>
                    </Card>

                    <Card className={styles.statCard}>
                        <div className={styles.statIcon}>📦</div>
                        <div className={styles.statContent}>
                            <h3>Ready to Ship</h3>
                            <p className={styles.statValue}>
                                {traceabilityItems.filter(item => item.status === 'Packaged').length}
                            </p>
                        </div>
                    </Card>

                    <Card className={styles.statCard}>
                        <div className={styles.statIcon}>✅</div>
                        <div className={styles.statContent}>
                            <h3>Completed</h3>
                            <p className={styles.statValue}>
                                {traceabilityItems.filter(item => item.status === 'Harvested').length}
                            </p>
                        </div>
                    </Card>
                </div>

                <Card className={styles.traceabilityTable}>
                    <div className={styles.tableHeader}>
                        <h2>Batch Tracking</h2>
                    </div>
                    <div className={styles.tableContent}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Batch #</th>
                                    <th>Variety</th>
                                    <th>Status</th>
                                    <th>Plant Date</th>
                                    <th>Harvest Date</th>
                                    <th>Quantity (lbs)</th>
                                    <th>Location</th>
                                </tr>
                            </thead>
                            <tbody>
                                {traceabilityItems.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.batchNumber}</td>
                                        <td>{item.variety}</td>
                                        <td>
                                            <span className={`${styles.status} ${styles[item.status.toLowerCase()]}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td>{item.plantDate}</td>
                                        <td>{item.harvestDate || 'N/A'}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.location}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
} 