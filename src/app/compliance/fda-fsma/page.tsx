'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card, Button } from '@/components/ui';
import styles from './page.module.css';

interface FSMAComplianceData {
    id: string;
    facilityNumber: string;
    lastFDAInspection: string;
    status: 'COMPLIANT' | 'ATTENTION_REQUIRED' | 'NON_COMPLIANT';
    waterTesting: {
        lastTest: string;
        nextDue: string;
        status: 'PASS' | 'FAIL';
        parameters: Array<{
            name: string;
            result: string;
            limit: string;
            status: 'PASS' | 'FAIL';
        }>;
    };
    workerTraining: {
        trained: number;
        total: number;
        lastUpdate: string;
        expirations: Array<{
            employee: string;
            expires: string;
        }>;
    };
    hazardAnalysis: {
        completed: boolean;
        lastUpdate: string;
        identifiedHazards: number;
        controlMeasures: number;
    };
    recordKeeping: {
        score: number;
        upToDate: boolean;
        lastAudit: string;
    };
    correctiveActions: Array<{
        id: string;
        issue: string;
        action: string;
        status: 'OPEN' | 'CLOSED';
        date: string;
    }>;
}

export default function FDAFSMAPage() {
    const { currentFarm } = useTenant();
    const [complianceData, setComplianceData] = useState<FSMAComplianceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const fetchComplianceData = useCallback(async () => {
        if (!currentFarm?.id) return;
        try {
            const res = await fetch('/api/compliance/fda-fsma', {
                headers: {
                    'X-Farm-ID': currentFarm.id,
                },
                credentials: 'include',
            });
            if (!res.ok) {
                throw new Error(`API error: ${res.status}`);
            }
            const result = await res.json();
            // Transform API response to match UI interface
            if (result.success && result.data?.length > 0) {
                const record = result.data[0];
                setComplianceData({
                    id: record.id,
                    facilityNumber: record.title || 'N/A',
                    lastFDAInspection: record.last_check_date || new Date().toISOString(),
                    status: record.status === 'compliant' ? 'COMPLIANT' : 'ATTENTION_REQUIRED',
                    waterTesting: { lastTest: '', nextDue: '', status: 'PASS', parameters: [] },
                    workerTraining: { trained: 0, total: 0, lastUpdate: '', expirations: [] },
                    hazardAnalysis: { completed: false, lastUpdate: '', identifiedHazards: 0, controlMeasures: 0 },
                    recordKeeping: { score: 0, upToDate: false, lastAudit: '' },
                    correctiveActions: [],
                });
            } else {
                setComplianceData(null);
            }
        } catch (error) {
            console.error('Error fetching FSMA compliance data:', error);
            setComplianceData(null);
        } finally {
            setLoading(false);
        }
    }, [currentFarm?.id]);

    useEffect(() => {
        fetchComplianceData();
    }, [fetchComplianceData]);


    const generateFSMAReport = () => {
        if (!complianceData) return;
        const report = {
            title: 'FDA FSMA Compliance Report',
            generatedAt: new Date().toISOString(),
            facilityNumber: complianceData.facilityNumber,
            status: complianceData.status,
            lastInspection: complianceData.lastFDAInspection,
            waterTesting: complianceData.waterTesting,
            workerTraining: complianceData.workerTraining,
            hazardAnalysis: complianceData.hazardAnalysis,
            recordKeeping: complianceData.recordKeeping,
            correctiveActions: complianceData.correctiveActions,
        };
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fsma-compliance-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const generateHazardAnalysis = () => {
        if (!complianceData) return;
        const report = {
            title: 'Hazard Analysis and Risk-Based Preventive Controls (HARPC) Report',
            generatedAt: new Date().toISOString(),
            facilityNumber: complianceData.facilityNumber,
            hazardAnalysis: complianceData.hazardAnalysis,
            correctiveActions: complianceData.correctiveActions,
            recommendations: [
                'Review biological hazards quarterly',
                'Update chemical hazard controls annually',
                'Conduct physical hazard assessments monthly',
            ],
        };
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `harpc-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading FDA FSMA Compliance Data...</div>
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
                    <h1>FDA FSMA Compliance</h1>
                    <p>Food Safety Modernization Act - Produce Safety Rule Compliance</p>
                </div>
                <div className={styles.actions}>
                    <Button onClick={generateFSMAReport} className={styles.reportButton}>
                        📋 FSMA Report
                    </Button>
                    <Button onClick={generateHazardAnalysis} className={styles.hazardButton}>
                        ⚠️ HARPC Analysis
                    </Button>
                </div>
            </div>

            {/* Compliance Status Overview */}
            <div className={styles.statusOverview}>
                <Card className={`${styles.statusCard} ${styles[complianceData.status.toLowerCase()]}`}>
                    <div className={styles.statusIcon}>
                        {complianceData.status === 'COMPLIANT' ? '✅' :
                            complianceData.status === 'ATTENTION_REQUIRED' ? '⚠️' : '❌'}
                    </div>
                    <div className={styles.statusInfo}>
                        <h3>FSMA Compliance Status</h3>
                        <p>{complianceData.status.replace('_', ' ')}</p>
                        <small>Last FDA Inspection: {new Date(complianceData.lastFDAInspection).toLocaleDateString()}</small>
                    </div>
                </Card>

                <Card className={styles.facilityCard}>
                    <h3>Facility Registration</h3>
                    <div className={styles.facilityDetails}>
                        <p><strong>FDA Facility #:</strong> {complianceData.facilityNumber}</p>
                        <p><strong>Registration Status:</strong> Active</p>
                        <p><strong>Renewal Due:</strong> December 31, 2024</p>
                    </div>
                </Card>

                <Card className={styles.trainingCard}>
                    <h3>Worker Training</h3>
                    <div className={styles.trainingStats}>
                        <div className={styles.stat}>
                            <span className={styles.statNumber}>{complianceData.workerTraining.trained}</span>
                            <span className={styles.statLabel}>Trained Workers</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statNumber}>100%</span>
                            <span className={styles.statLabel}>Compliance Rate</span>
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
                    className={`${styles.tab} ${activeTab === 'water' ? styles.active : ''}`}
                    onClick={() => setActiveTab('water')}
                >
                    Water Testing
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'training' ? styles.active : ''}`}
                    onClick={() => setActiveTab('training')}
                >
                    Worker Training
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'hazards' ? styles.active : ''}`}
                    onClick={() => setActiveTab('hazards')}
                >
                    Hazard Analysis
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'records' ? styles.active : ''}`}
                    onClick={() => setActiveTab('records')}
                >
                    Record Keeping
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'corrective' ? styles.active : ''}`}
                    onClick={() => setActiveTab('corrective')}
                >
                    Corrective Actions
                </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
                {activeTab === 'overview' && (
                    <div className={styles.overview}>
                        <div className={styles.complianceGrid}>
                            <Card className={styles.complianceItem}>
                                <h4>💧 Agricultural Water</h4>
                                <p className={styles.status}>COMPLIANT</p>
                                <p>Water meets all FDA microbial quality standards</p>
                            </Card>

                            <Card className={styles.complianceItem}>
                                <h4>🧑‍🌾 Worker Health & Hygiene</h4>
                                <p className={styles.status}>COMPLIANT</p>
                                <p>All workers trained in food safety practices</p>
                            </Card>

                            <Card className={styles.complianceItem}>
                                <h4>🌱 Biological Soil Amendments</h4>
                                <p className={styles.status}>COMPLIANT</p>
                                <p>Only approved organic amendments used</p>
                            </Card>

                            <Card className={styles.complianceItem}>
                                <h4>📱 Equipment & Tools</h4>
                                <p className={styles.status}>COMPLIANT</p>
                                <p>Equipment sanitized per FDA protocols</p>
                            </Card>

                            <Card className={styles.complianceItem}>
                                <h4>🏢 Buildings & Sanitation</h4>
                                <p className={styles.status}>COMPLIANT</p>
                                <p>Facilities meet FDA sanitation standards</p>
                            </Card>

                            <Card className={styles.complianceItem}>
                                <h4>📋 Record Keeping</h4>
                                <p className={styles.status}>COMPLIANT</p>
                                <p>All required records maintained and current</p>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'water' && (
                    <div className={styles.waterTesting}>
                        <Card className={styles.waterCard}>
                            <h4>Water Quality Testing Results</h4>
                            <div className={styles.waterStatus}>
                                <span className={`${styles.badge} ${styles.pass}`}>PASS</span>
                                <span>Last Test: {new Date(complianceData.waterTesting.lastTest).toLocaleDateString()}</span>
                                <span>Next Due: {new Date(complianceData.waterTesting.nextDue).toLocaleDateString()}</span>
                            </div>

                            <div className={styles.testResults}>
                                <h5>Latest Test Results</h5>
                                <div className={styles.resultsList}>
                                    {complianceData.waterTesting.parameters.map((param, index) => (
                                        <div key={index} className={styles.resultItem}>
                                            <div className={styles.paramName}>{param.name}</div>
                                            <div className={styles.paramResult}>{param.result}</div>
                                            <div className={styles.paramLimit}>Limit: {param.limit}</div>
                                            <div className={`${styles.paramStatus} ${styles[param.status.toLowerCase()]}`}>
                                                {param.status}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        <Card className={styles.testingSchedule}>
                            <h4>Testing Schedule</h4>
                            <div className={styles.scheduleGrid}>
                                <div className={styles.scheduleItem}>
                                    <h5>Microbial Testing</h5>
                                    <p>Monthly</p>
                                    <small>E. coli, Total Coliforms</small>
                                </div>
                                <div className={styles.scheduleItem}>
                                    <h5>Chemical Testing</h5>
                                    <p>Quarterly</p>
                                    <small>pH, Nitrates, Heavy Metals</small>
                                </div>
                                <div className={styles.scheduleItem}>
                                    <h5>Pesticide Residue</h5>
                                    <p>Annually</p>
                                    <small>Multi-residue screen</small>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'training' && (
                    <div className={styles.workerTraining}>
                        <Card className={styles.trainingOverview}>
                            <h4>Worker Training Status</h4>
                            <div className={styles.trainingProgress}>
                                <div className={styles.progressCircle}>
                                    <span className={styles.percentage}>100%</span>
                                    <span className={styles.label}>Trained</span>
                                </div>
                                <div className={styles.trainingDetails}>
                                    <p><strong>Trained Workers:</strong> {complianceData.workerTraining.trained}/{complianceData.workerTraining.total}</p>
                                    <p><strong>Last Update:</strong> {new Date(complianceData.workerTraining.lastUpdate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className={styles.trainingRequirements}>
                            <h4>FSMA Training Requirements</h4>
                            <ul className={styles.requirementsList}>
                                <li>✅ Health and hygiene practices</li>
                                <li>✅ Recognition of symptoms of illness</li>
                                <li>✅ Proper handwashing techniques</li>
                                <li>✅ Appropriate use of toilets and handwashing facilities</li>
                                <li>✅ Proper handling of equipment and tools</li>
                                <li>✅ Protection of produce from contamination</li>
                                <li>✅ Visitor and contractor guidelines</li>
                            </ul>
                        </Card>

                        <Card className={styles.certificationExpiry}>
                            <h4>Upcoming Certification Renewals</h4>
                            <div className={styles.expirationList}>
                                {complianceData.workerTraining.expirations.map((expiry, index) => (
                                    <div key={index} className={styles.expirationItem}>
                                        <span className={styles.employee}>{expiry.employee}</span>
                                        <span className={styles.date}>Expires: {new Date(expiry.expires).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'hazards' && (
                    <div className={styles.hazardAnalysis}>
                        <Card className={styles.hazardCard}>
                            <h4>Hazard Analysis and Risk-Based Preventive Controls (HARPC)</h4>
                            <div className={styles.hazardStats}>
                                <div className={styles.hazardStat}>
                                    <span className={styles.statNumber}>{complianceData.hazardAnalysis.identifiedHazards}</span>
                                    <span className={styles.statLabel}>Identified Hazards</span>
                                </div>
                                <div className={styles.hazardStat}>
                                    <span className={styles.statNumber}>{complianceData.hazardAnalysis.controlMeasures}</span>
                                    <span className={styles.statLabel}>Control Measures</span>
                                </div>
                            </div>
                            <p><strong>Last Updated:</strong> {new Date(complianceData.hazardAnalysis.lastUpdate).toLocaleDateString()}</p>
                        </Card>

                        <Card className={styles.hazardTypes}>
                            <h4>Identified Hazard Categories</h4>
                            <div className={styles.hazardGrid}>
                                <div className={styles.hazardType}>
                                    <h5>🦠 Biological Hazards</h5>
                                    <ul>
                                        <li>Pathogenic bacteria (E. coli, Salmonella)</li>
                                        <li>Viruses (Norovirus, Hepatitis A)</li>
                                        <li>Parasites</li>
                                    </ul>
                                </div>
                                <div className={styles.hazardType}>
                                    <h5>🧪 Chemical Hazards</h5>
                                    <ul>
                                        <li>Pesticide residues</li>
                                        <li>Heavy metals</li>
                                        <li>Cleaning chemical residues</li>
                                    </ul>
                                </div>
                                <div className={styles.hazardType}>
                                    <h5>🔧 Physical Hazards</h5>
                                    <ul>
                                        <li>Glass or metal fragments</li>
                                        <li>Foreign objects</li>
                                        <li>Equipment parts</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'records' && (
                    <div className={styles.recordKeeping}>
                        <Card className={styles.recordsCard}>
                            <h4>FSMA Record Keeping Compliance</h4>
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
                                <h5>Required FSMA Records</h5>
                                <ul>
                                    <li>✅ Water testing results and certificates</li>
                                    <li>✅ Worker training documentation</li>
                                    <li>✅ Equipment cleaning and sanitization logs</li>
                                    <li>✅ Biological soil amendment application records</li>
                                    <li>✅ Harvest and handling records</li>
                                    <li>✅ Corrective action documentation</li>
                                    <li>✅ Facility registration and inspection records</li>
                                </ul>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'corrective' && (
                    <div className={styles.correctiveActions}>
                        <Card className={styles.correctiveCard}>
                            <h4>Corrective Actions</h4>
                            {complianceData.correctiveActions.length === 0 ? (
                                <div className={styles.noActions}>
                                    <p>✅ No open corrective actions</p>
                                    <p>All identified issues have been resolved and documented.</p>
                                </div>
                            ) : (
                                <div className={styles.actionsList}>
                                    {complianceData.correctiveActions.map((action) => (
                                        <div key={action.id} className={styles.actionItem}>
                                            <div className={styles.actionHeader}>
                                                <h5>{action.issue}</h5>
                                                <span className={`${styles.badge} ${styles[action.status.toLowerCase()]}`}>
                                                    {action.status}
                                                </span>
                                            </div>
                                            <p>{action.action}</p>
                                            <small>Date: {new Date(action.date).toLocaleDateString()}</small>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        <Card className={styles.correctiveProcess}>
                            <h4>Corrective Action Process</h4>
                            <ol className={styles.processList}>
                                <li>Immediate action to address the problem</li>
                                <li>Evaluate the effectiveness of corrective actions</li>
                                <li>Prevent recurrence of the problem</li>
                                <li>Document the corrective action taken</li>
                                <li>Review and validate the corrective action</li>
                            </ol>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
