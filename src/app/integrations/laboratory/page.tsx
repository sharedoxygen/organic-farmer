'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card, Button } from '@/components/ui';
import styles from './page.module.css';

interface LabTest {
    id: string;
    sampleId: string;
    testType: string;
    status: 'pending' | 'in_progress' | 'completed';
    submittedDate: string;
    completedDate: string | null;
    results: string | null;
}

interface Laboratory {
    id: string;
    name: string;
    connected: boolean;
    testsCompleted: number;
    pendingTests: number;
}

export default function LaboratoryPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [labs, setLabs] = useState<Laboratory[]>([
        { id: '1', name: 'AgriLab Testing Services', connected: true, testsCompleted: 24, pendingTests: 2 },
        { id: '2', name: 'Organic Certification Lab', connected: false, testsCompleted: 0, pendingTests: 0 },
    ]);
    const [recentTests, setRecentTests] = useState<LabTest[]>([
        { id: '1', sampleId: 'KF-2024-001', testType: 'Soil Analysis', status: 'completed', submittedDate: '2024-01-15', completedDate: '2024-01-18', results: 'Pass - pH 6.5, N: 45ppm' },
        { id: '2', sampleId: 'KF-2024-002', testType: 'Water Quality', status: 'completed', submittedDate: '2024-01-16', completedDate: '2024-01-19', results: 'Pass - Safe for irrigation' },
        { id: '3', sampleId: 'KF-2024-003', testType: 'Pesticide Residue', status: 'in_progress', submittedDate: '2024-01-20', completedDate: null, results: null },
        { id: '4', sampleId: 'KF-2024-004', testType: 'Microbial Testing', status: 'pending', submittedDate: '2024-01-22', completedDate: null, results: null },
    ]);

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/auth/signin');
        }
    }, [isAuthLoading, isAuthenticated, router]);

    const handleConnectLab = (labId: string) => {
        setLabs(labs.map(lab => {
            if (lab.id === labId) {
                return { ...lab, connected: true };
            }
            return lab;
        }));
    };

    const handleSubmitSample = () => {
        const newTest: LabTest = {
            id: Date.now().toString(),
            sampleId: `KF-2024-${String(recentTests.length + 1).padStart(3, '0')}`,
            testType: 'Soil Analysis',
            status: 'pending',
            submittedDate: new Date().toISOString().split('T')[0],
            completedDate: null,
            results: null,
        };
        setRecentTests([newTest, ...recentTests]);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return { color: '#22c55e', label: '✅ Completed' };
            case 'in_progress': return { color: '#f59e0b', label: '⏳ In Progress' };
            case 'pending': return { color: '#6b7280', label: '📋 Pending' };
            default: return { color: '#6b7280', label: status };
        }
    };

    if (isAuthLoading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>🧪 Laboratory Integration</h1>
                    <p>Connect with testing laboratories for soil, water, and product analysis</p>
                </div>
                <Button variant="primary" onClick={handleSubmitSample}>
                    + Submit Sample
                </Button>
            </div>

            <div className={styles.stats}>
                <Card className={styles.statCard}>
                    <div className={styles.statValue}>{labs.filter(l => l.connected).length}</div>
                    <div className={styles.statLabel}>Connected Labs</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statValue}>{recentTests.filter(t => t.status === 'pending').length}</div>
                    <div className={styles.statLabel}>Pending Tests</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statValue}>{recentTests.filter(t => t.status === 'completed').length}</div>
                    <div className={styles.statLabel}>Completed Tests</div>
                </Card>
            </div>

            <div className={styles.section}>
                <h2>🏢 Connected Laboratories</h2>
                <div className={styles.labsGrid}>
                    {labs.map((lab) => (
                        <Card key={lab.id} className={styles.labCard}>
                            <div className={styles.labHeader}>
                                <h3>{lab.name}</h3>
                                <span className={`${styles.labStatus} ${lab.connected ? styles.connected : ''}`}>
                                    {lab.connected ? '🟢 Connected' : '⚪ Not Connected'}
                                </span>
                            </div>
                            {lab.connected ? (
                                <div className={styles.labStats}>
                                    <div>
                                        <strong>{lab.testsCompleted}</strong>
                                        <span>Tests Completed</span>
                                    </div>
                                    <div>
                                        <strong>{lab.pendingTests}</strong>
                                        <span>Pending</span>
                                    </div>
                                </div>
                            ) : (
                                <Button variant="secondary" onClick={() => handleConnectLab(lab.id)}>
                                    Connect
                                </Button>
                            )}
                        </Card>
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <h2>📋 Recent Test Results</h2>
                <Card className={styles.testsCard}>
                    <table className={styles.testsTable}>
                        <thead>
                            <tr>
                                <th>Sample ID</th>
                                <th>Test Type</th>
                                <th>Submitted</th>
                                <th>Status</th>
                                <th>Results</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTests.map((test) => {
                                const badge = getStatusBadge(test.status);
                                return (
                                    <tr key={test.id}>
                                        <td className={styles.sampleId}>{test.sampleId}</td>
                                        <td>{test.testType}</td>
                                        <td>{test.submittedDate}</td>
                                        <td>
                                            <span style={{ color: badge.color }}>{badge.label}</span>
                                        </td>
                                        <td className={styles.results}>
                                            {test.results || '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>
            </div>

            <Card className={styles.testTypesCard}>
                <h2>🔬 Available Test Types</h2>
                <div className={styles.testTypesGrid}>
                    <div className={styles.testType}>
                        <span className={styles.testIcon}>🌱</span>
                        <strong>Soil Analysis</strong>
                        <p>pH, nutrients, organic matter</p>
                    </div>
                    <div className={styles.testType}>
                        <span className={styles.testIcon}>💧</span>
                        <strong>Water Quality</strong>
                        <p>Contaminants, pH, minerals</p>
                    </div>
                    <div className={styles.testType}>
                        <span className={styles.testIcon}>🦠</span>
                        <strong>Microbial Testing</strong>
                        <p>Pathogens, beneficial microbes</p>
                    </div>
                    <div className={styles.testType}>
                        <span className={styles.testIcon}>🧫</span>
                        <strong>Pesticide Residue</strong>
                        <p>Organic compliance testing</p>
                    </div>
                    <div className={styles.testType}>
                        <span className={styles.testIcon}>🥬</span>
                        <strong>Nutrient Analysis</strong>
                        <p>Product nutritional content</p>
                    </div>
                    <div className={styles.testType}>
                        <span className={styles.testIcon}>🔍</span>
                        <strong>Heavy Metals</strong>
                        <p>Lead, cadmium, arsenic</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
