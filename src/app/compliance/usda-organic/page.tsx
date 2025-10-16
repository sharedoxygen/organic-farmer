'use client';

import { useState, useEffect } from 'react';
import EvidenceUpload from '@/components/EvidenceUpload';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card, Button } from '@/components/ui';
import styles from './page.module.css';

interface OrganicComplianceData {
    id: string;
    certificationNumber: string;
    certifyingAgent: string;
    certificationExpiry: string;
    auditDate: string;
    status: 'COMPLIANT' | 'ATTENTION_REQUIRED' | 'NON_COMPLIANT';
    seedVarieties: {
        total: number;
        organic: number;
        pending: number;
    };
    recentViolations: Array<{
        id: string;
        type: string;
        description: string;
        date: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
        resolved: boolean;
    }>;
    prohibitedSubstances: {
        lastCheck: string;
        status: 'CLEAR' | 'VIOLATION';
        details: string;
    };
    bufferZones: {
        maintained: boolean;
        lastInspection: string;
        notes: string;
    };
    recordKeeping: {
        upToDate: boolean;
        lastAudit: string;
        score: number;
    };
}

export default function USDAOrganicPage() {
    const [complianceData, setComplianceData] = useState<OrganicComplianceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchComplianceData();
    }, []);

    const fetchComplianceData = async () => {
        try {
            // TODO: Replace with actual farmId from context or user session
            const farmId = 'REPLACE_WITH_FARM_ID';
            const res = await fetch(`/api/compliance/usda-organic?farmId=${farmId}`);
            if (!res.ok) {
                throw new Error(`API error: ${res.status}`);
            }
            const data = await res.json();
            setComplianceData(data);
        } catch (error) {
            console.error('Error fetching compliance data:', error);
            setComplianceData(null);
        } finally {
            setLoading(false);
        }
    };


    const generateOrganicCertificateReport = () => {
        alert('Generating USDA Organic Certificate Report...');
    };

    const generateAuditTrail = () => {
        alert('Generating Comprehensive Audit Trail...');
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading USDA Organic Compliance Data...</div>
            </div>
        );
    }

    if (!complianceData) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>Failed to load compliance data</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>USDA Organic Compliance</h1>
                    <p>National Organic Program (NOP) Compliance Management & Reporting</p>
                </div>
                <div className={styles.actions}>
                    <Button onClick={generateOrganicCertificateReport} className={styles.reportButton}>
                        📋 Certificate Report
                    </Button>
                    <Button onClick={generateAuditTrail} className={styles.auditButton}>
                        📑 Audit Trail
                    </Button>
                </div>
            </div>

            {/* Compliance Status Overview */}
            <div className={styles.statusOverview}>
                {/* Evidence Upload UI */}
                <EvidenceUpload complianceId={complianceData.id} />
                <Card className={`${styles.statusCard} ${styles[complianceData.status.toLowerCase()]}`}>
                    <div className={styles.statusIcon}>
                        {complianceData.status === 'COMPLIANT' ? '✅' :
                            complianceData.status === 'ATTENTION_REQUIRED' ? '⚠️' : '❌'}
                    </div>
                    <div className={styles.statusInfo}>
                        <h3>Organic Certification Status</h3>
                        <p>{complianceData.status.replace('_', ' ')}</p>
                        <small>Last Audit: {new Date(complianceData.auditDate).toLocaleDateString()}</small>
                    </div>
                </Card>

                <Card className={styles.certCard}>
                    <h3>Certification Details</h3>
                    <div className={styles.certDetails}>
                        <p><strong>Certificate #:</strong> {complianceData.certificationNumber}</p>
                        <p><strong>Certifying Agent:</strong> {complianceData.certifyingAgent}</p>
                        <p><strong>Expires:</strong> {new Date(complianceData.certificationExpiry).toLocaleDateString()}</p>
                    </div>
                </Card>

                <Card className={styles.varietiesCard}>
                    <h3>Organic Seed Varieties</h3>
                    <div className={styles.varietiesStats}>
                        <div className={styles.stat}>
                            <span className={styles.statNumber}>{complianceData.seedVarieties.organic}</span>
                            <span className={styles.statLabel}>Certified Organic</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statNumber}>{complianceData.seedVarieties.pending}</span>
                            <span className={styles.statLabel}>Pending Approval</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'substances' ? styles.active : ''}`}
                    onClick={() => setActiveTab('substances')}
                >
                    Prohibited Substances
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'buffer' ? styles.active : ''}`}
                    onClick={() => setActiveTab('buffer')}
                >
                    Buffer Zones
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'records' ? styles.active : ''}`}
                    onClick={() => setActiveTab('records')}
                >
                    Record Keeping
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'inputs' ? styles.active : ''}`}
                    onClick={() => setActiveTab('inputs')}
                >
                    Approved Inputs
                </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {activeTab === 'overview' && (
                    <div className={styles.overview}>
                        <div className={styles.complianceGrid}>
                            <Card className={styles.complianceItem}>
                                <h4>🌱 Seed Integrity</h4>
                                <p className={styles.status}>COMPLIANT</p>
                                <p>All seeds certified organic with valid documentation</p>
                            </Card>

                            <Card className={styles.complianceItem}>
                                <h4>🌿 Growing Methods</h4>
                                <p className={styles.status}>COMPLIANT</p>
                                <p>Only OMRI-listed inputs used in production</p>
                            </Card>

                            <Card className={styles.complianceItem}>
                                <h4>💧 Water Quality</h4>
                                <p className={styles.status}>COMPLIANT</p>
                                <p>Water tested monthly, meets all organic standards</p>
                            </Card>

                            <Card className={styles.complianceItem}>
                                <h4>📦 Handling & Storage</h4>
                                <p className={styles.status}>COMPLIANT</p>
                                <p>Organic integrity maintained throughout supply chain</p>
                            </Card>

                            <Card className={styles.complianceItem}>
                                <h4>🔍 Traceability</h4>
                                <p className={styles.status}>COMPLIANT</p>
                                <p>Complete seed-to-sale documentation</p>
                            </Card>

                            <Card className={styles.complianceItem}>
                                <h4>📋 Labeling</h4>
                                <p className={styles.status}>COMPLIANT</p>
                                <p>All products properly labeled per NOP requirements</p>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'substances' && (
                    <div className={styles.substances}>
                        <Card className={styles.substanceCard}>
                            <h4>Prohibited Substances Monitoring</h4>
                            <div className={styles.substanceStatus}>
                                <span className={`${styles.badge} ${styles.clear}`}>CLEAR</span>
                                <span>Last Check: {new Date(complianceData.prohibitedSubstances.lastCheck).toLocaleDateString()}</span>
                            </div>
                            <p>{complianceData.prohibitedSubstances.details}</p>

                            <div className={styles.testingSchedule}>
                                <h5>Testing Schedule</h5>
                                <ul>
                                    <li>Soil Testing: Quarterly</li>
                                    <li>Water Testing: Monthly</li>
                                    <li>Plant Tissue Testing: Bi-annually</li>
                                    <li>Residue Testing: Annual</li>
                                </ul>
                            </div>
                        </Card>

                        <Card className={styles.approvedList}>
                            <h4>OMRI Listed Inputs Currently Used</h4>
                            <ul className={styles.inputsList}>
                                <li>✅ OMRI Listed Coconut Coir Growing Medium</li>
                                <li>✅ Certified Organic Kelp Meal Fertilizer</li>
                                <li>✅ USDA Approved Beneficial Microorganisms</li>
                                <li>✅ Organic Approved Neem Oil Pest Control</li>
                                <li>✅ OMRI Listed Fish Emulsion Fertilizer</li>
                                <li>✅ Certified Organic Compost Tea</li>
                            </ul>
                        </Card>
                    </div>
                )}

                {activeTab === 'buffer' && (
                    <div className={styles.bufferZones}>
                        <Card className={styles.bufferCard}>
                            <h4>Buffer Zone Compliance</h4>
                            <div className={styles.bufferStatus}>
                                <span className={`${styles.badge} ${styles.maintained}`}>MAINTAINED</span>
                                <span>Last Inspection: {new Date(complianceData.bufferZones.lastInspection).toLocaleDateString()}</span>
                            </div>
                            <p>{complianceData.bufferZones.notes}</p>

                            <div className={styles.bufferDetails}>
                                <h5>Buffer Zone Requirements</h5>
                                <ul>
                                    <li>Minimum 3-meter buffer from conventional operations</li>
                                    <li>Physical barriers where necessary</li>
                                    <li>Regular monitoring for contamination</li>
                                    <li>Documentation of adjacent land use</li>
                                </ul>
                            </div>
                        </Card>

                        <Card className={styles.mapCard}>
                            <h4>Facility Layout</h4>
                            <div className={styles.facilityMap}>
                                <p>📍 Main Production Area (Organic Zone)</p>
                                <p>🚧 3m Buffer Zone</p>
                                <p>🏢 Adjacent Conventional Operations</p>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'records' && (
                    <div className={styles.recordKeeping}>
                        <Card className={styles.recordsCard}>
                            <h4>Record Keeping Compliance</h4>
                            <div className={styles.recordsScore}>
                                <div className={styles.scoreCircle}>
                                    <span className={styles.score}>{complianceData.recordKeeping.score}</span>
                                    <span className={styles.scoreLabel}>Score</span>
                                </div>
                                <div className={styles.scoreDetails}>
                                    <p><strong>Status:</strong> {complianceData.recordKeeping.upToDate ? 'Up to Date' : 'Needs Attention'}</p>
                                    <p><strong>Last Audit:</strong> {new Date(complianceData.recordKeeping.lastAudit).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className={styles.recordTypes}>
                                <h5>Required Records</h5>
                                <ul>
                                    <li>✅ Seed purchase records and certificates</li>
                                    <li>✅ Input application logs</li>
                                    <li>✅ Harvest and sales records</li>
                                    <li>✅ Equipment cleaning logs</li>
                                    <li>✅ Water and soil test results</li>
                                    <li>✅ Worker training documentation</li>
                                    <li>✅ Complaint and corrective action logs</li>
                                </ul>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'inputs' && (
                    <div className={styles.inputs}>
                        <Card className={styles.inputsCard}>
                            <h4>Approved Organic Inputs</h4>
                            <div className={styles.inputCategories}>
                                <div className={styles.category}>
                                    <h5>Growing Media</h5>
                                    <ul>
                                        <li>OMRI Listed Coconut Coir</li>
                                        <li>Certified Organic Peat Moss</li>
                                        <li>USDA Approved Vermiculite</li>
                                    </ul>
                                </div>

                                <div className={styles.category}>
                                    <h5>Fertilizers</h5>
                                    <ul>
                                        <li>OMRI Listed Fish Emulsion</li>
                                        <li>Certified Organic Kelp Meal</li>
                                        <li>Organic Compost Tea</li>
                                    </ul>
                                </div>

                                <div className={styles.category}>
                                    <h5>Pest Control</h5>
                                    <ul>
                                        <li>Organic Approved Neem Oil</li>
                                        <li>Beneficial Microorganisms</li>
                                        <li>Diatomaceous Earth</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
} 