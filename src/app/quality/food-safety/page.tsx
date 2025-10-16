'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

import { Card, Button } from '@/components/ui';
import styles from './page.module.css';

export default function FoodSafetyPage() {
    const safetyChecks = [
        {
            id: 'water-testing',
            title: 'Water Quality Testing',
            status: 'Compliant',
            lastCheck: '2024-06-20',
            frequency: 'Monthly',
            nextDue: '2024-07-20',
            description: 'Microbial and chemical testing of irrigation water'
        },
        {
            id: 'facility-sanitation',
            title: 'Facility Sanitation',
            status: 'Compliant',
            lastCheck: '2024-06-25',
            frequency: 'Daily',
            nextDue: '2024-06-26',
            description: 'Daily cleaning and sanitization protocols'
        },
        {
            id: 'pest-monitoring',
            title: 'Pest Monitoring',
            status: 'Attention Required',
            lastCheck: '2024-06-24',
            frequency: 'Weekly',
            nextDue: '2024-06-31',
            description: 'Integrated pest management inspection'
        },
        {
            id: 'temperature-logs',
            title: 'Temperature Control',
            status: 'Compliant',
            lastCheck: '2024-06-26',
            frequency: 'Continuous',
            nextDue: 'Ongoing',
            description: 'Cold storage temperature monitoring'
        }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Compliant': return '#28a745';
            case 'Attention Required': return '#ffc107';
            case 'Non-Compliant': return '#dc3545';
            default: return '#6c757d';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Food Safety Compliance</h1>
                <p>USDA and FDA food safety requirements for microgreens production</p>
                <div className={styles.actions}>
                    <Button className={styles.addButton}>+ Schedule Inspection</Button>
                    <Button className={styles.reportButton}>Generate Report</Button>
                </div>
            </div>

            <div className={styles.overview}>
                <Card className={styles.overviewCard}>
                    <h3>🛡️ Overall Compliance Status</h3>
                    <div className={styles.complianceRate}>
                        <span className={styles.rate}>95%</span>
                        <span className={styles.rateLabel}>Food Safety Compliant</span>
                    </div>
                    <p>3 of 4 areas fully compliant</p>
                </Card>

                <Card className={styles.overviewCard}>
                    <h3>📋 Next Inspection</h3>
                    <div className={styles.nextInspection}>
                        <span className={styles.date}>July 15, 2024</span>
                        <span className={styles.type}>FDA Third-Party Audit</span>
                    </div>
                    <p>19 days remaining</p>
                </Card>

                <Card className={styles.overviewCard}>
                    <h3>⚠️ Action Items</h3>
                    <div className={styles.actionItems}>
                        <span className={styles.count}>1</span>
                        <span className={styles.label}>Requires Attention</span>
                    </div>
                    <p>Pest monitoring follow-up needed</p>
                </Card>
            </div>

            <div className={styles.checksGrid}>
                <h2>Food Safety Checks</h2>
                {safetyChecks.map((check) => (
                    <Card key={check.id} className={styles.checkCard}>
                        <div className={styles.checkHeader}>
                            <h3>{check.title}</h3>
                            <span
                                className={styles.statusBadge}
                                style={{ backgroundColor: getStatusColor(check.status) }}
                            >
                                {check.status}
                            </span>
                        </div>

                        <div className={styles.checkDetails}>
                            <p><strong>Description:</strong> {check.description}</p>
                            <p><strong>Frequency:</strong> {check.frequency}</p>
                            <p><strong>Last Check:</strong> {new Date(check.lastCheck).toLocaleDateString()}</p>
                            <p><strong>Next Due:</strong> {check.nextDue}</p>
                        </div>

                        <div className={styles.checkActions}>
                            <Button className={styles.viewButton}>View Records</Button>
                            <Button className={styles.updateButton}>Update Status</Button>
                        </div>
                    </Card>
                ))}
            </div>

            <div className={styles.regulations}>
                <Card className={styles.regulationsCard}>
                    <h3>📜 Regulatory Compliance</h3>
                    <div className={styles.regulationsList}>
                        <div className={styles.regulation}>
                            <span className={styles.regTitle}>FDA Food Safety Modernization Act (FSMA)</span>
                            <span className={styles.regStatus}>✅ Compliant</span>
                        </div>
                        <div className={styles.regulation}>
                            <span className={styles.regTitle}>USDA Organic NOP Standards</span>
                            <span className={styles.regStatus}>✅ Compliant</span>
                        </div>
                        <div className={styles.regulation}>
                            <span className={styles.regTitle}>State Department of Agriculture</span>
                            <span className={styles.regStatus}>✅ Compliant</span>
                        </div>
                        <div className={styles.regulation}>
                            <span className={styles.regTitle}>Local Health Department</span>
                            <span className={styles.regStatus}>⚠️ Pending Review</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
} 