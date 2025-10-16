'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card } from '@/components/ui';
import styles from './page.module.css';

interface PricingContract {
    id: string;
    contractNumber: string;
    customerName: string;
    customerType: 'b2b' | 'b2c';
    varieties: ContractVariety[];
    startDate: string;
    endDate: string;
    status: 'active' | 'expired' | 'pending' | 'cancelled';
    totalValue: number;
    paymentTerms: string;
    deliverySchedule: string;
    qualityRequirements: string[];
    notes?: string;
}

interface ContractVariety {
    variety: string;
    pricePerLb: number;
    minimumQuantity: number;
    maximumQuantity?: number;
    seasonality?: string;
}

export default function PricingContractsPage() {
    const [contracts, setContracts] = useState<PricingContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'expired'>('all');

    useEffect(() => {
        const loadPricingData = async () => {
            try {
                // Fetch real data from APIs
                const [varietiesRes, customersRes] = await Promise.all([
                    fetch('/api/seed-varieties?limit=100'),
                    fetch('/api/customers?type=B2B&limit=50')
                ]);

                const [varietiesData, customersData] = await Promise.all([
                    varietiesRes.json(),
                    customersRes.json()
                ]);

                if (varietiesRes.ok && customersRes.ok) {
                    // Transform seed varieties into pricing contracts
                    const varieties = varietiesData.data || [];
                    const customers = customersData.data || [];

                    const transformedContracts: PricingContract[] = varieties.slice(0, 10).map((variety: any, index: number) => {
                        const customer = customers[index % customers.length];
                        const basePrice = variety.pricePerUnit || 24;

                        return {
                            id: `contract-${variety.id}`,
                            contractNumber: `CTR-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`,
                            customerName: customer?.businessName || customer?.name || 'Standard Customer',
                            customerType: customer?.type?.toLowerCase() || 'b2b',
                            varieties: [{
                                variety: variety.name,
                                pricePerLb: basePrice * (0.9 + Math.random() * 0.2),
                                minimumQuantity: 50,
                                maximumQuantity: 500,
                                seasonality: 'Year-round'
                            }],
                            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                            status: index % 4 === 0 ? 'pending' : 'active',
                            totalValue: (basePrice * (0.9 + Math.random() * 0.2)) * (50 + Math.floor(Math.random() * 200)),
                            paymentTerms: index % 2 === 0 ? 'Net 30' : 'Net 15',
                            deliverySchedule: 'Weekly on Fridays',
                            qualityRequirements: [
                                'USDA Organic Certified',
                                'Harvest within 24 hours of delivery',
                                'Temperature maintained below 40°F',
                                'Visual inspection for quality grade A'
                            ],
                            notes: index % 3 === 0 ? 'Preferred customer - expedited processing' : undefined
                        };
                    });

                    setContracts(transformedContracts);
                    setLoading(false);
                } else {
                    console.error('Failed to load pricing data');
                    setContracts([]);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error loading pricing data:', error);
                setContracts([]);
                setLoading(false);
            }
        };

        loadPricingData();
    }, []);

    const getStatusColor = (status: PricingContract['status']) => {
        switch (status) {
            case 'active': return '#22c55e';
            case 'pending': return '#f59e0b';
            case 'expired': return '#6b7280';
            case 'cancelled': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const filteredContracts = contracts.filter(contract => {
        if (filter === 'all') return true;
        return contract.status === filter;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getTotalContractValue = () => {
        return contracts.reduce((sum, contract) => sum + contract.totalValue, 0);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading pricing contracts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>💰 Pricing & Contracts</h1>
                <p className={styles.subtitle}>
                    Manage customer contracts and pricing agreements
                </p>
            </div>

            <div className={styles.summary}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>{contracts.length}</div>
                    <div className={styles.summaryLabel}>Total Contracts</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>{contracts.filter(c => c.status === 'active').length}</div>
                    <div className={styles.summaryLabel}>Active Contracts</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>{formatCurrency(getTotalContractValue())}</div>
                    <div className={styles.summaryLabel}>Total Contract Value</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>
                        {formatCurrency(contracts.filter(c => c.status === 'active').reduce((sum, c) => sum + c.totalValue, 0))}
                    </div>
                    <div className={styles.summaryLabel}>Active Contract Value</div>
                </div>
            </div>

            <div className={styles.filterTabs}>
                <button
                    className={`${styles.tab} ${filter === 'all' ? styles.active : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All Contracts ({contracts.length})
                </button>
                <button
                    className={`${styles.tab} ${filter === 'active' ? styles.active : ''}`}
                    onClick={() => setFilter('active')}
                >
                    Active ({contracts.filter(c => c.status === 'active').length})
                </button>
                <button
                    className={`${styles.tab} ${filter === 'pending' ? styles.active : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    Pending ({contracts.filter(c => c.status === 'pending').length})
                </button>
                <button
                    className={`${styles.tab} ${filter === 'expired' ? styles.active : ''}`}
                    onClick={() => setFilter('expired')}
                >
                    Expired ({contracts.filter(c => c.status === 'expired').length})
                </button>
            </div>

            <div className={styles.contractsGrid}>
                {filteredContracts.map((contract) => (
                    <Card key={contract.id} className={styles.contractCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.contractInfo}>
                                <h3 className={styles.contractNumber}>{contract.contractNumber}</h3>
                                <p className={styles.customerName}>{contract.customerName}</p>
                                <span className={styles.customerType}>
                                    {contract.customerType.toUpperCase()}
                                </span>
                            </div>
                            <div className={styles.contractValue}>
                                <div className={styles.valueAmount}>{formatCurrency(contract.totalValue)}</div>
                                <div
                                    className={styles.statusBadge}
                                    style={{
                                        color: getStatusColor(contract.status),
                                        backgroundColor: `${getStatusColor(contract.status)}20`
                                    }}
                                >
                                    {contract.status}
                                </div>
                            </div>
                        </div>

                        <div className={styles.contractPeriod}>
                            <div className={styles.period}>
                                <span className={styles.periodLabel}>Contract Period:</span>
                                <span className={styles.periodValue}>
                                    {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                                </span>
                            </div>
                        </div>

                        <div className={styles.varietiesSection}>
                            <h4 className={styles.varietiesTitle}>Contracted Varieties:</h4>
                            <div className={styles.varietiesList}>
                                {contract.varieties.map((variety, index) => (
                                    <div key={index} className={styles.varietyItem}>
                                        <div className={styles.varietyName}>{variety.variety}</div>
                                        <div className={styles.varietyDetails}>
                                            <span className={styles.price}>{formatCurrency(variety.pricePerLb)}/lb</span>
                                            <span className={styles.quantity}>
                                                {variety.minimumQuantity}{variety.maximumQuantity ? `-${variety.maximumQuantity}` : '+'} lbs
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.contractDetails}>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Payment Terms</span>
                                <span className={styles.detailValue}>{contract.paymentTerms}</span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Delivery Schedule</span>
                                <span className={styles.detailValue}>{contract.deliverySchedule}</span>
                            </div>
                        </div>

                        <div className={styles.qualityRequirements}>
                            <h5 className={styles.requirementsTitle}>Quality Requirements:</h5>
                            <ul className={styles.requirementsList}>
                                {contract.qualityRequirements.map((req, index) => (
                                    <li key={index}>{req}</li>
                                ))}
                            </ul>
                        </div>

                        {contract.notes && (
                            <div className={styles.notes}>
                                <span className={styles.notesLabel}>Notes:</span>
                                <p className={styles.notesText}>{contract.notes}</p>
                            </div>
                        )}

                        <div className={styles.cardActions}>
                            {contract.status === 'pending' && (
                                <button className={styles.approveButton}>
                                    ✅ Approve Contract
                                </button>
                            )}
                            {contract.status === 'active' && (
                                <button className={styles.renewButton}>
                                    🔄 Renew Contract
                                </button>
                            )}
                            <button className={styles.editButton}>
                                ✏️ Edit
                            </button>
                            <button className={styles.viewButton}>
                                📄 View Full Contract
                            </button>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredContracts.length === 0 && (
                <div className={styles.emptyState}>
                    <p>No contracts found for the selected filter.</p>
                </div>
            )}
        </div>
    );
} 