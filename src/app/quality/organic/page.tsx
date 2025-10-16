'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

import { Card, Button } from '@/components/ui';
import styles from './page.module.css';

export default function OrganicCompliancePage() {
    const complianceItems = [
        {
            id: 'seed-certification',
            title: 'Organic Seed Certification',
            status: 'Compliant',
            details: '100% of seeds have valid USDA Organic certificates',
            certNumber: 'USDA-12345',
            expiry: '2025-03-15'
        },
        {
            id: 'growing-medium',
            title: 'Growing Medium Approval',
            status: 'Compliant',
            details: 'All growing media are OMRI listed',
            certNumber: 'OMRI-Listed',
            expiry: 'Ongoing'
        },
        {
            id: 'pest-control',
            title: 'Pest Control Methods',
            status: 'Compliant',
            details: 'Only approved organic pest control methods used',
            certNumber: 'IPM-Certified',
            expiry: '2024-12-31'
        },
        {
            id: 'buffer-zones',
            title: 'Buffer Zone Compliance',
            status: 'Action Required',
            details: 'Minimum 25ft buffer from conventional operations',
            certNumber: 'Site-Plan-001',
            expiry: 'Annual Review'
        }
    ];

    const auditHistory = [
        {
            date: '2024-03-15',
            inspector: 'John Smith (CCOF)',
            result: 'Passed',
            violations: 0,
            nextAudit: '2025-03-15'
        },
        {
            date: '2023-03-20',
            inspector: 'Maria Rodriguez (QAI)',
            result: 'Passed with Minor Corrections',
            violations: 2,
            nextAudit: '2024-03-15'
        }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>🌿 USDA Organic Compliance</h1>
                <p>National Organic Program (NOP) compliance tracking and management</p>
                <div className={styles.actions}>
                    <Button className={styles.auditButton}>Schedule Audit</Button>
                    <Button className={styles.reportButton}>Generate NOP Report</Button>
                </div>
            </div>

            <div className={styles.overview}>
                <Card className={styles.certCard}>
                    <h3>🏆 Organic Certification</h3>
                    <div className={styles.certStatus}>
                        <span className={styles.certNumber}>USDA-ORG-2024-001</span>
                        <span className={styles.certExpiry}>Valid until: March 2025</span>
                    </div>
                    <p>Certified by: California Certified Organic Farmers (CCOF)</p>
                </Card>

                <Card className={styles.complianceCard}>
                    <h3>📊 Compliance Rate</h3>
                    <div className={styles.complianceRate}>
                        <span className={styles.rate}>92%</span>
                        <span className={styles.rateLabel}>Overall Compliance</span>
                    </div>
                    <p>3 of 4 areas fully compliant</p>
                </Card>

                <Card className={styles.nextAuditCard}>
                    <h3>📅 Next Audit</h3>
                    <div className={styles.nextAudit}>
                        <span className={styles.auditDate}>March 15, 2025</span>
                        <span className={styles.auditType}>Annual CCOF Inspection</span>
                    </div>
                    <p>263 days remaining</p>
                </Card>
            </div>

            <div className={styles.complianceGrid}>
                <h2>Compliance Areas</h2>
                {complianceItems.map((item) => (
                    <Card key={item.id} className={styles.complianceItemCard}>
                        <div className={styles.itemHeader}>
                            <h3>{item.title}</h3>
                            <span className={`${styles.statusBadge} ${styles[item.status.toLowerCase().replace(' ', '')]}`}>
                                {item.status}
                            </span>
                        </div>

                        <div className={styles.itemDetails}>
                            <p>{item.details}</p>
                            <div className={styles.certDetails}>
                                <span><strong>Cert/ID:</strong> {item.certNumber}</span>
                                <span><strong>Valid Until:</strong> {item.expiry}</span>
                            </div>
                        </div>

                        <div className={styles.itemActions}>
                            <Button className={styles.viewDocsButton}>View Documentation</Button>
                            <Button className={styles.updateButton}>Update Status</Button>
                        </div>
                    </Card>
                ))}
            </div>

            <div className={styles.auditHistory}>
                <Card className={styles.historyCard}>
                    <h3>📋 Audit History</h3>
                    <div className={styles.auditList}>
                        {auditHistory.map((audit, index) => (
                            <div key={index} className={styles.auditItem}>
                                <div className={styles.auditDate}>
                                    {new Date(audit.date).toLocaleDateString()}
                                </div>
                                <div className={styles.auditDetails}>
                                    <span className={styles.inspector}>{audit.inspector}</span>
                                    <span className={`${styles.result} ${styles[audit.result.toLowerCase().replace(/\s+/g, '')]}`}>
                                        {audit.result}
                                    </span>
                                    <span className={styles.violations}>
                                        {audit.violations} violations
                                    </span>
                                </div>
                                <div className={styles.nextAuditDate}>
                                    Next: {new Date(audit.nextAudit).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className={styles.documentation}>
                <Card className={styles.docsCard}>
                    <h3>📁 Required Documentation</h3>
                    <div className={styles.docsList}>
                        <div className={styles.docItem}>
                            <span>✅ Organic System Plan (OSP)</span>
                            <span>Updated: March 2024</span>
                        </div>
                        <div className={styles.docItem}>
                            <span>✅ Seed Purchase Records</span>
                            <span>Current: All varieties</span>
                        </div>
                        <div className={styles.docItem}>
                            <span>✅ Input Usage Logs</span>
                            <span>Last entry: Today</span>
                        </div>
                        <div className={styles.docItem}>
                            <span>⚠️ Harvest & Sales Records</span>
                            <span>Needs update</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
} 