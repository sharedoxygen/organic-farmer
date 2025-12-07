'use client';

import React, { useEffect, useState } from 'react';
import { useTenant } from '@/components/TenantProvider';
import Link from 'next/link';
import styles from './page.module.css';

export default function CompliancePage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Compliance Management</h1>
                <p className={styles.subtitle}>
                    Comprehensive compliance tracking for FDA FSMA and USDA Organic standards
                </p>
            </div>

            <div className={styles.complianceGrid}>
                <Link href="/compliance/fda-fsma" className={styles.complianceCard}>
                    <div className={styles.cardIcon}>🛡️</div>
                    <div className={styles.cardContent}>
                        <h3 className={styles.cardTitle}>FDA FSMA Compliance</h3>
                        <p className={styles.cardDescription}>
                            Food Safety Modernization Act requirements, preventive controls, and traceability documentation
                        </p>
                        <div className={styles.cardStatus}>
                            <span className={styles.statusBadge}>Active</span>
                        </div>
                    </div>
                </Link>

                <Link href="/compliance/usda-organic" className={styles.complianceCard}>
                    <div className={styles.cardIcon}>🌿</div>
                    <div className={styles.cardContent}>
                        <h3 className={styles.cardTitle}>USDA Organic Compliance</h3>
                        <p className={styles.cardDescription}>
                            Organic certification requirements, approved inputs, and audit preparation
                        </p>
                        <div className={styles.cardStatus}>
                            <span className={styles.statusBadge}>Certified</span>
                        </div>
                    </div>
                </Link>
            </div>

            <div className={styles.overviewSection}>
                <h2 className={styles.sectionTitle}>Compliance Overview</h2>
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>98%</div>
                        <div className={styles.statLabel}>Compliance Score</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>2</div>
                        <div className={styles.statLabel}>Active Certifications</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>0</div>
                        <div className={styles.statLabel}>Outstanding Issues</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>45</div>
                        <div className={styles.statLabel}>Days to Next Audit</div>
                    </div>
                </div>
            </div>

            <div className={styles.recentActivity}>
                <h2 className={styles.sectionTitle}>Recent Compliance Activity</h2>
                <div className={styles.activityList}>
                    <div className={styles.activityItem}>
                        <div className={styles.activityIcon}>✅</div>
                        <div className={styles.activityContent}>
                            <div className={styles.activityTitle}>FSMA Preventive Controls Updated</div>
                            <div className={styles.activityTime}>2 days ago</div>
                        </div>
                    </div>
                    <div className={styles.activityItem}>
                        <div className={styles.activityIcon}>📋</div>
                        <div className={styles.activityContent}>
                            <div className={styles.activityTitle}>Organic Input Documentation Reviewed</div>
                            <div className={styles.activityTime}>1 week ago</div>
                        </div>
                    </div>
                    <div className={styles.activityItem}>
                        <div className={styles.activityIcon}>🔍</div>
                        <div className={styles.activityContent}>
                            <div className={styles.activityTitle}>Compliance Audit Scheduled</div>
                            <div className={styles.activityTime}>2 weeks ago</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 