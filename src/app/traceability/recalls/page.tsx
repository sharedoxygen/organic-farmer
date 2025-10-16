'use client';

import { useEffect } from 'react';
import styles from '../page.module.css';
import { Card } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';

export default function RecallManagementPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const { currentFarm } = useTenant();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/signin');
        }
    }, [isLoading, isAuthenticated, router]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>⚠️ Recall Management</h1>
                    <p>Initiate, track, and document recalls with full traceability.</p>
                </div>
            </div>

            <Card className={styles.searchCard}>
                <h3>Start Recall by</h3>
                <div className={styles.searchForm}>
                    <select className={styles.searchType} defaultValue="lot">
                        <option value="lot">Lot Number</option>
                        <option value="batch">Batch ID</option>
                        <option value="order">Order ID</option>
                        <option value="customer">Customer</option>
                    </select>
                    <input className={styles.searchInput} placeholder="Enter identifier..." />
                    <button className={styles.searchButton}>Search</button>
                </div>
            </Card>

            <Card className={styles.instructionsCard}>
                <h3>How Recalls Work</h3>
                <div className={styles.instructions}>
                    <div className={styles.instructionItem}>
                        <h4>Identify Affected Lots</h4>
                        <p>Use seed-to-sale and lot tracking to identify all affected product.</p>
                        <ul>
                            <li>Trace upstream to seeds, inputs, and batches</li>
                            <li>Trace downstream to orders and customers</li>
                        </ul>
                    </div>
                    <div className={styles.instructionItem}>
                        <h4>Notify Stakeholders</h4>
                        <p>Generate notification lists for internal teams and customers.</p>
                        <ul>
                            <li>Export CSV with contacts and orders</li>
                            <li>Attach evidence and CAPA documentation</li>
                        </ul>
                    </div>
                    <div className={styles.instructionItem}>
                        <h4>Remediate and Close</h4>
                        <p>Document remediation steps and close the recall with a supervisor sign‑off.</p>
                        <ul>
                            <li>Track product returns and disposals</li>
                            <li>Maintain permanent audit trail</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
}


