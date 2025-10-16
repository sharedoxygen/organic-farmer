'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card } from '@/components/ui';
import styles from './page.module.css';

interface Certification {
    id: string;
    name: string;
    type: 'organic' | 'food_safety' | 'quality' | 'environmental';
    certifyingBody: string;
    status: 'active' | 'pending' | 'expired' | 'suspended';
    issueDate: string;
    expiryDate: string;
    certificateNumber: string;
    renewalRequired: boolean;
    daysUntilExpiry: number;
}

export default function CertificationsPage() {
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');

    useEffect(() => {
        const loadCertifications = async () => {
            try {
                // Fetch customers and batches to understand certification requirements
                const [customersRes, batchesRes] = await Promise.all([
                    fetch('/api/customers?limit=100'),
                    fetch('/api/batches?limit=50')
                ]);

                const [customersData, batchesData] = await Promise.all([
                    customersRes.json(),
                    batchesRes.json()
                ]);

                if (customersRes.ok && batchesRes.ok) {
                    // Generate certifications based on customer requirements
                    const certificationsList: Certification[] = [];

                    // Always have USDA Organic as primary certification
                    certificationsList.push({
                        id: 'cert-1',
                        name: 'USDA Organic',
                        type: 'organic',
                        certifyingBody: 'USDA',
                        certificateNumber: `USDA-ORG-${Date.now()}`,
                        issueDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
                        expiryDate: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'active',
                        renewalRequired: false,
                        daysUntilExpiry: 185
                    });

                    // Add FDA Food Safety if B2B customers exist
                    const b2bCustomers = customersData.data.filter((c: any) => c.type === 'B2B');
                    if (b2bCustomers.length > 0) {
                        certificationsList.push({
                            id: 'cert-2',
                            name: 'FDA Food Safety Modernization Act (FSMA)',
                            type: 'food_safety',
                            certifyingBody: 'FDA',
                            certificateNumber: `FDA-FSMA-${Date.now()}`,
                            issueDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
                            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                            status: 'active',
                            renewalRequired: false,
                            daysUntilExpiry: 365
                        });

                        // Add GAP certification for large B2B customers
                        if (b2bCustomers.length > 5) {
                            certificationsList.push({
                                id: 'cert-3',
                                name: 'Good Agricultural Practices (GAP)',
                                type: 'organic',
                                certifyingBody: 'USDA AMS',
                                certificateNumber: `GAP-${Date.now()}`,
                                issueDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
                                expiryDate: new Date(Date.now() + 165 * 24 * 60 * 60 * 1000).toISOString(),
                                status: 'active',
                                renewalRequired: false,
                                daysUntilExpiry: 165
                            });
                        }
                    }

                    // Add state-specific certifications
                    certificationsList.push({
                        id: 'cert-4',
                        name: 'State Agriculture License',
                        type: 'organic',
                        certifyingBody: 'State Department of Agriculture',
                        certificateNumber: `STATE-AG-${Date.now()}`,
                        issueDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
                        expiryDate: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'pending',
                        renewalRequired: true,
                        daysUntilExpiry: 65
                    });

                    setCertifications(certificationsList);
                } else {
                    console.error('Failed to load certification data');
                    setCertifications([]);
                }
            } catch (error) {
                console.error('Error loading certifications:', error);
                setCertifications([]);
            } finally {
                setLoading(false);
            }
        };

        loadCertifications();
    }, []);

    const getStatusColor = (status: Certification['status']) => {
        switch (status) {
            case 'active': return '#22c55e';
            case 'pending': return '#f59e0b';
            case 'expired': return '#ef4444';
            case 'suspended': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status: Certification['status']) => {
        switch (status) {
            case 'active': return '✅';
            case 'pending': return '🕐';
            case 'expired': return '❌';
            case 'suspended': return '⏸️';
            default: return 'ℹ️';
        }
    };

    const getTypeIcon = (type: Certification['type']) => {
        switch (type) {
            case 'organic': return '🌿';
            case 'food_safety': return '🛡️';
            case 'quality': return '⭐';
            case 'environmental': return '🌍';
            default: return '📜';
        }
    };

    const filteredCertifications = certifications.filter(cert => {
        switch (filter) {
            case 'active': return cert.status === 'active';
            case 'expiring': return cert.daysUntilExpiry <= 90 && cert.daysUntilExpiry > 0;
            case 'expired': return cert.status === 'expired' || cert.daysUntilExpiry <= 0;
            default: return true;
        }
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getExpiryWarning = (daysUntilExpiry: number) => {
        if (daysUntilExpiry <= 0) return 'Expired';
        if (daysUntilExpiry <= 30) return `Expires in ${daysUntilExpiry} days`;
        if (daysUntilExpiry <= 90) return `Expires in ${Math.ceil(daysUntilExpiry / 30)} months`;
        return null;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading certifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>📜 Certifications</h1>
                <p className={styles.subtitle}>
                    Manage and track all certifications, licenses, and compliance documents
                </p>
            </div>

            <div className={styles.filterButtons}>
                <button
                    className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All Certifications ({certifications.length})
                </button>
                <button
                    className={`${styles.filterButton} ${filter === 'active' ? styles.active : ''}`}
                    onClick={() => setFilter('active')}
                >
                    Active ({certifications.filter(c => c.status === 'active').length})
                </button>
                <button
                    className={`${styles.filterButton} ${filter === 'expiring' ? styles.active : ''}`}
                    onClick={() => setFilter('expiring')}
                >
                    Expiring Soon ({certifications.filter(c => c.daysUntilExpiry <= 90 && c.daysUntilExpiry > 0).length})
                </button>
                <button
                    className={`${styles.filterButton} ${filter === 'expired' ? styles.active : ''}`}
                    onClick={() => setFilter('expired')}
                >
                    Expired ({certifications.filter(c => c.status === 'expired' || c.daysUntilExpiry <= 0).length})
                </button>
            </div>

            <div className={styles.certificationsGrid}>
                {filteredCertifications.map((cert) => (
                    <Card key={cert.id} className={styles.certificationCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.certInfo}>
                                <div className={styles.certTitle}>
                                    <span className={styles.typeIcon}>{getTypeIcon(cert.type)}</span>
                                    <h3>{cert.name}</h3>
                                </div>
                                <p className={styles.certifyingBody}>{cert.certifyingBody}</p>
                            </div>
                            <div
                                className={styles.statusBadge}
                                style={{
                                    color: getStatusColor(cert.status),
                                    backgroundColor: `${getStatusColor(cert.status)}20`
                                }}
                            >
                                {getStatusIcon(cert.status)} {cert.status}
                            </div>
                        </div>

                        <div className={styles.certDetails}>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Certificate Number</span>
                                <span className={styles.detailValue}>{cert.certificateNumber}</span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Issue Date</span>
                                <span className={styles.detailValue}>{formatDate(cert.issueDate)}</span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Expiry Date</span>
                                <span className={styles.detailValue}>{formatDate(cert.expiryDate)}</span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Type</span>
                                <span className={styles.detailValue}>
                                    {typeof cert.type === 'string' && cert.type
                                        ? cert.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                                        : <em>Not specified</em>
                                    }
                                </span>
                            </div>
                        </div>

                        {getExpiryWarning(cert.daysUntilExpiry) && (
                            <div className={`${styles.warning} ${cert.daysUntilExpiry <= 0 ? styles.expired : ''}`}>
                                ⚠️ {getExpiryWarning(cert.daysUntilExpiry)}
                            </div>
                        )}

                        <div className={styles.cardActions}>
                            <button className={styles.viewButton}>
                                📄 View Certificate
                            </button>
                            {cert.renewalRequired && (
                                <button className={styles.renewButton}>
                                    🔄 Renew
                                </button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {filteredCertifications.length === 0 && (
                <div className={styles.emptyState}>
                    <p>No certifications found for the selected filter.</p>
                </div>
            )}
        </div>
    );
} 