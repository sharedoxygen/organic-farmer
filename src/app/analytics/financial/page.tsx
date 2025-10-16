'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card } from '@/components/ui';
import styles from './page.module.css';

interface FinancialData {
    revenue: {
        monthly: number;
        quarterly: number;
        annual: number;
        growth: number;
    };
    expenses: {
        materials: number;
        labor: number;
        utilities: number;
        equipment: number;
        other: number;
    };
    profitability: {
        grossMargin: number;
        netMargin: number;
        roi: number;
    };
}

export default function FinancialReportsPage() {
    const { currentFarm } = useTenant();
    const [financialData, setFinancialData] = useState<FinancialData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');

    useEffect(() => {
        // Don't load data until we have a current farm
        if (!currentFarm) return;

        const loadFinancialData = async () => {
            try {
                // Fetch real orders data from API with proper farm context
                const userData = localStorage.getItem('ofms_user');
                const headers: Record<string, string> = {
                    'X-Farm-ID': currentFarm.id
                };

                if (userData) {
                    const user = JSON.parse(userData);
                    headers['Authorization'] = `Bearer ${user.id}`;
                }

                console.log('💰 Loading financial data for farm:', currentFarm.farm_name);

                const response = await fetch('/api/orders?limit=1000', {
                    headers
                });
                const data = await response.json();

                if (response.ok) {
                    // Calculate financial metrics from real order data
                    const orders = Array.isArray(data) ? data : [];
                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();

                    // Calculate revenue by period
                    let monthlyRevenue = 0;
                    let quarterlyRevenue = 0;
                    let annualRevenue = 0;

                    orders.forEach((order: any) => {
                        const orderDate = new Date(order.orderDate);
                        const orderAmount = parseFloat(order.total) || 0;

                        // Annual revenue (current year)
                        if (orderDate.getFullYear() === currentYear) {
                            annualRevenue += orderAmount;
                        }

                        // Monthly revenue (current month)
                        if (orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth) {
                            monthlyRevenue += orderAmount;
                        }

                        // Quarterly revenue (last 3 months)
                        const threeMonthsAgo = new Date(now);
                        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                        if (orderDate >= threeMonthsAgo) {
                            quarterlyRevenue += orderAmount;
                        }
                    });

                    // Calculate growth (comparing to previous month)
                    const lastMonth = new Date(now);
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    let lastMonthRevenue = 0;

                    orders.forEach((order: any) => {
                        const orderDate = new Date(order.orderDate);
                        if (orderDate.getMonth() === lastMonth.getMonth() &&
                            orderDate.getFullYear() === lastMonth.getFullYear()) {
                            lastMonthRevenue += parseFloat(order.total) || 0;
                        }
                    });

                    // Fix growth calculation with proper division protection
                    const growth = lastMonthRevenue > 0 ?
                        Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 * 100) / 100 : 0;

                    // Calculate expenses (estimated based on revenue)
                    const expenseRatio = 0.75; // 75% of revenue
                    const monthlyExpenses = Math.round(monthlyRevenue * expenseRatio * 100) / 100;

                    const calculatedData: FinancialData = {
                        revenue: {
                            monthly: Math.round(monthlyRevenue * 100) / 100,
                            quarterly: Math.round(quarterlyRevenue * 100) / 100,
                            annual: Math.round(annualRevenue * 100) / 100,
                            growth: growth
                        },
                        expenses: {
                            materials: Math.round(monthlyExpenses * 0.35 * 100) / 100,
                            labor: Math.round(monthlyExpenses * 0.40 * 100) / 100,
                            utilities: Math.round(monthlyExpenses * 0.10 * 100) / 100,
                            equipment: Math.round(monthlyExpenses * 0.10 * 100) / 100,
                            other: Math.round(monthlyExpenses * 0.05 * 100) / 100
                        },
                        profitability: {
                            grossMargin: monthlyRevenue > 0 ?
                                Math.round(((monthlyRevenue - (monthlyExpenses * 0.35)) / monthlyRevenue) * 100 * 100) / 100 : 0,
                            netMargin: monthlyRevenue > 0 ?
                                Math.round(((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100 * 100) / 100 : 0,
                            roi: (annualRevenue * expenseRatio) > 0 ?
                                Math.round(((annualRevenue - (annualRevenue * expenseRatio)) / (annualRevenue * expenseRatio)) * 100 * 100) / 100 : 0
                        }
                    };

                    setFinancialData(calculatedData);
                } else {
                    console.error('Failed to load financial data:', response.status, response.statusText);
                    setFinancialData(null);
                }
            } catch (error) {
                console.error('Error loading financial data:', error);
                setFinancialData(null);
            } finally {
                setLoading(false);
            }
        };

        loadFinancialData();
    }, [currentFarm]);

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatPercentage = (value: number): string => {
        return `${value.toFixed(1)}%`;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading financial reports...</p>
                </div>
            </div>
        );
    }

    if (!financialData) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h2>Unable to load financial data</h2>
                    <p>Please check your connection and try again.</p>
                </div>
            </div>
        );
    }

    const totalExpenses = Object.values(financialData.expenses).reduce((sum, expense) => sum + expense, 0);
    const netProfit = financialData.revenue[selectedPeriod] - totalExpenses;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>💰 Financial Reports</h1>
                <p className={styles.subtitle}>
                    Track revenue, expenses, and profitability across your operations
                </p>
            </div>

            <div className={styles.periodSelector}>
                <button
                    className={`${styles.periodButton} ${selectedPeriod === 'monthly' ? styles.active : ''}`}
                    onClick={() => setSelectedPeriod('monthly')}
                >
                    Monthly
                </button>
                <button
                    className={`${styles.periodButton} ${selectedPeriod === 'quarterly' ? styles.active : ''}`}
                    onClick={() => setSelectedPeriod('quarterly')}
                >
                    Quarterly
                </button>
                <button
                    className={`${styles.periodButton} ${selectedPeriod === 'annual' ? styles.active : ''}`}
                    onClick={() => setSelectedPeriod('annual')}
                >
                    Annual
                </button>
            </div>

            <div className={styles.metricsGrid}>
                <Card className={styles.metricCard}>
                    <div className={styles.metricHeader}>
                        <h3>Revenue</h3>
                        <span className={styles.metricPeriod}>{selectedPeriod}</span>
                    </div>
                    <div className={styles.metricValue}>
                        {formatCurrency(financialData.revenue[selectedPeriod])}
                    </div>
                    <div className={styles.metricChange}>
                        📈 +{formatPercentage(financialData.revenue.growth)} vs last period
                    </div>
                </Card>

                <Card className={styles.metricCard}>
                    <div className={styles.metricHeader}>
                        <h3>Expenses</h3>
                        <span className={styles.metricPeriod}>{selectedPeriod}</span>
                    </div>
                    <div className={styles.metricValue}>
                        {formatCurrency(totalExpenses)}
                    </div>
                    <div className={styles.metricChange}>
                        📊 {formatPercentage((totalExpenses / financialData.revenue[selectedPeriod]) * 100)} of revenue
                    </div>
                </Card>

                <Card className={styles.metricCard}>
                    <div className={styles.metricHeader}>
                        <h3>Net Profit</h3>
                        <span className={styles.metricPeriod}>{selectedPeriod}</span>
                    </div>
                    <div className={styles.metricValue}>
                        {formatCurrency(netProfit)}
                    </div>
                    <div className={styles.metricChange}>
                        💰 {formatPercentage(financialData.profitability.netMargin)} margin
                    </div>
                </Card>

                <Card className={styles.metricCard}>
                    <div className={styles.metricHeader}>
                        <h3>ROI</h3>
                        <span className={styles.metricPeriod}>Annual</span>
                    </div>
                    <div className={styles.metricValue}>
                        {formatPercentage(financialData.profitability.roi)}
                    </div>
                    <div className={styles.metricChange}>
                        📈 Return on Investment
                    </div>
                </Card>
            </div>

            <div className={styles.detailsGrid}>
                <Card className={styles.expenseCard}>
                    <h3>Expense Breakdown</h3>
                    <div className={styles.expenseList}>
                        {Object.entries(financialData.expenses).map(([category, amount]) => (
                            <div key={category} className={styles.expenseItem}>
                                <span className={styles.expenseCategory}>
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </span>
                                <span className={styles.expenseAmount}>
                                    {formatCurrency(amount)}
                                </span>
                                <div className={styles.expenseBar}>
                                    <div
                                        className={styles.expenseFill}
                                        style={{ width: `${(amount / totalExpenses) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className={styles.profitabilityCard}>
                    <h3>Profitability Metrics</h3>
                    <div className={styles.profitabilityList}>
                        <div className={styles.profitabilityItem}>
                            <span className={styles.profitabilityLabel}>Gross Margin</span>
                            <span className={styles.profitabilityValue}>
                                {formatPercentage(financialData.profitability.grossMargin)}
                            </span>
                        </div>
                        <div className={styles.profitabilityItem}>
                            <span className={styles.profitabilityLabel}>Net Margin</span>
                            <span className={styles.profitabilityValue}>
                                {formatPercentage(financialData.profitability.netMargin)}
                            </span>
                        </div>
                        <div className={styles.profitabilityItem}>
                            <span className={styles.profitabilityLabel}>Return on Investment</span>
                            <span className={styles.profitabilityValue}>
                                {formatPercentage(financialData.profitability.roi)}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
} 