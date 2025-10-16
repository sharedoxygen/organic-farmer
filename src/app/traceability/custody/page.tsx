'use client';

import styles from '../page.module.css';
import { Card } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useEffect } from 'react';

export default function ChainOfCustodyPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/signin');
        }
    }, [isLoading, isAuthenticated, router]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>📋 Chain of Custody</h1>
                    <p>Track every handoff from harvest to consumer with signatures and timestamps.</p>
                </div>
            </div>

            <Card className={styles.chainCard}>
                <h3>Standard Custody Timeline</h3>
                <div className={styles.chainTimeline}>
                    <div className={styles.chainStage}>
                        <div className={styles.stageNumber}>1</div>
                        <div className={styles.stageContent}>
                            <div className={styles.stageHeader}>
                                <h4>Harvest</h4>
                                <span className={styles.stageDate}>Timestamp • Operator Signature</span>
                            </div>
                            <p className={styles.stageAction}>Batch harvested and recorded with weight and humidity.</p>
                            <div className={styles.stageDetails}>
                                <span>Batch ID</span>
                                <span>Lot Number</span>
                                <span>Room/Zone</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.chainStage}>
                        <div className={styles.stageNumber}>2</div>
                        <div className={styles.stageContent}>
                            <div className={styles.stageHeader}>
                                <h4>Post‑Harvest Handling</h4>
                                <span className={styles.stageDate}>Timestamp • Supervisor Signature</span>
                            </div>
                            <p className={styles.stageAction}>Drying/curing/packaging with QC checks and labels applied.</p>
                            <div className={styles.stageDetails}>
                                <span>QC Result</span>
                                <span>Package IDs</span>
                                <span>Weights</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.chainStage}>
                        <div className={styles.stageNumber}>3</div>
                        <div className={styles.stageContent}>
                            <div className={styles.stageHeader}>
                                <h4>Distribution</h4>
                                <span className={styles.stageDate}>Timestamp • Driver Signature</span>
                            </div>
                            <p className={styles.stageAction}>Packages transferred to delivery with manifest and temperature log.</p>
                            <div className={styles.stageDetails}>
                                <span>Manifest ID</span>
                                <span>Vehicle</span>
                                <span>Route</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.chainStage}>
                        <div className={styles.stageNumber}>4</div>
                        <div className={styles.stageContent}>
                            <div className={styles.stageHeader}>
                                <h4>Customer Receipt</h4>
                                <span className={styles.stageDate}>Timestamp • Customer Signature</span>
                            </div>
                            <p className={styles.stageAction}>Order delivered and verified. Chain of custody closed.</p>
                            <div className={styles.stageDocuments}>
                                <strong>Documents:</strong> COA, Manifest, Delivery Receipt
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}


