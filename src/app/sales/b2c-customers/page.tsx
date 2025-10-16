'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { Card, Button, CrudModal, CrudField } from '@/components/ui';
import { createCrudService } from '@/lib/api/crudService';
import { DataIntegrityService } from '@/lib/services/dataIntegrityService';
import styles from './page.module.css';

interface B2CCustomer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    street?: string;
    city: string;
    state: string;
    zipCode?: string;
    country?: string;
    businessType: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
    preferredVarieties?: string;
    orderFrequency?: string;
    packagingReqs?: string;
    creditLimit?: number;
    paymentTerms?: string;
    totalOrders?: number;
    totalSpent?: number;
    lastOrderDate?: string;
}

// Initialize CRUD service for customers
const customerService = createCrudService('customers', {
    farmScoped: true,
    transformFromApi: (data: any) => ({
        ...data,
        status: data.status || 'ACTIVE',
        businessType: data.businessType || data.type || 'Individual',
        totalOrders: data.totalOrders || 0,
        totalSpent: data.totalSpent || 0,
        creditLimit: data.creditLimit || 5000,
        paymentTerms: data.paymentTerms || 'Net 30',
        orderFrequency: data.orderFrequency || 'Weekly',
        country: data.country || 'USA'
    }),
    transformForApi: (data: any) => ({
        ...data,
        type: 'B2C', // Always set type to B2C for this page
        businessType: data.businessType || 'Individual'
    })
});

// Define form fields for CRUD operations
const customerFields: CrudField[] = [
    {
        name: 'name',
        label: 'Customer Name',
        type: 'text',
        required: true,
        placeholder: 'Enter customer name'
    },
    {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        required: true,
        placeholder: 'customer@example.com'
    },
    {
        name: 'phone',
        label: 'Phone Number',
        type: 'text',
        placeholder: '(555) 123-4567'
    },
    {
        name: 'businessType',
        label: 'Customer Type',
        type: 'select',
        required: true,
        options: [
            { value: 'Individual', label: 'Individual Consumer' },
            { value: 'Family', label: 'Family' },
            { value: 'Small Business', label: 'Small Business' },
            { value: 'Restaurant', label: 'Restaurant' },
            { value: 'Catering', label: 'Catering Service' }
        ]
    },
    {
        name: 'street',
        label: 'Street Address',
        type: 'text',
        placeholder: '123 Main St'
    },
    {
        name: 'city',
        label: 'City',
        type: 'text',
        placeholder: 'City'
    },
    {
        name: 'state',
        label: 'State',
        type: 'text',
        placeholder: 'State'
    },
    {
        name: 'zipCode',
        label: 'ZIP Code',
        type: 'text',
        placeholder: '12345'
    },
    {
        name: 'preferredVarieties',
        label: 'Preferred Products',
        type: 'textarea',
        placeholder: 'List preferred products...',
        rows: 3
    },
    {
        name: 'orderFrequency',
        label: 'Order Frequency',
        type: 'select',
        options: [
            { value: 'Weekly', label: 'Weekly' },
            { value: 'Bi-weekly', label: 'Bi-weekly' },
            { value: 'Monthly', label: 'Monthly' },
            { value: 'Seasonal', label: 'Seasonal' },
            { value: 'On-demand', label: 'On-demand' }
        ]
    },
    {
        name: 'packagingReqs',
        label: 'Special Notes',
        type: 'textarea',
        placeholder: 'Any special packaging requirements or notes...',
        rows: 2
    },
    {
        name: 'creditLimit',
        label: 'Credit Limit',
        type: 'number',
        min: 0,
        step: 100,
        placeholder: '5000'
    },
    {
        name: 'paymentTerms',
        label: 'Payment Terms',
        type: 'select',
        options: [
            { value: 'Cash', label: 'Cash on Delivery' },
            { value: 'Net 15', label: 'Net 15 Days' },
            { value: 'Net 30', label: 'Net 30 Days' },
            { value: 'Net 60', label: 'Net 60 Days' }
        ]
    },
    {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' }
        ]
    }
];

// Define form sections for better organization
const customerFormSections = [
    {
        title: 'Basic Information',
        fields: ['name', 'email', 'phone', 'businessType']
    },
    {
        title: 'Address',
        fields: ['street', 'city', 'state', 'zipCode']
    },
    {
        title: 'Preferences',
        fields: ['preferredVarieties', 'orderFrequency', 'packagingReqs']
    },
    {
        title: 'Business Terms',
        fields: ['creditLimit', 'paymentTerms', 'status']
    }
];

// Custom validation function for customer data
const validateCustomerData = (data: Record<string, unknown>): { valid: boolean; violations: { field: string; message: string }[]; warnings: string[] } => {
    const violations: { field: string; message: string }[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
        violations.push({
            field: 'name',
            message: 'Customer name is required'
        });
    }

    if (!data.email || typeof data.email !== 'string' || !data.email.trim()) {
        violations.push({
            field: 'email',
            message: 'Email address is required'
        });
    }

    // Email format validation
    if (data.email && typeof data.email === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            violations.push({
                field: 'email',
                message: 'Please enter a valid email address'
            });
        }
    }

    // Business type validation
    if (!data.businessType || typeof data.businessType !== 'string' || !data.businessType.trim()) {
        violations.push({
            field: 'businessType',
            message: 'Customer type is required'
        });
    }

    // Credit limit validation
    if (data.creditLimit && typeof data.creditLimit === 'number' && data.creditLimit < 0) {
        violations.push({
            field: 'creditLimit',
            message: 'Credit limit cannot be negative'
        });
    }

    // Status validation
    if (!data.status || (data.status !== 'ACTIVE' && data.status !== 'INACTIVE')) {
        violations.push({
            field: 'status',
            message: 'Status must be either ACTIVE or INACTIVE'
        });
    }

    return {
        valid: violations.length === 0,
        violations,
        warnings
    };
};

export default function B2CCustomersPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [customers, setCustomers] = useState<B2CCustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<B2CCustomer | null>(null);
    const [viewingCustomer, setViewingCustomer] = useState<B2CCustomer | null>(null);
    const [activeMetric, setActiveMetric] = useState<'total' | 'active' | 'types' | null>(null);

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/signin');
        }
    }, [isAuthenticated, isLoading, router]);

    // Load customers data
    useEffect(() => {
        const loadCustomers = async () => {
            if (!currentFarm?.id) {
                setError('No farm context available');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const data = await customerService.list({ type: 'B2C', limit: 500 });
                setCustomers(data || []);
                console.log(`✅ Loaded ${data?.length || 0} B2C customers`);
            } catch (error) {
                console.error('Error loading B2C customers:', error);
                setError(error instanceof Error ? error.message : 'Failed to load customers');
                setCustomers([]);
            } finally {
                setLoading(false);
            }
        };

        loadCustomers();
    }, [currentFarm?.id]);

    // Handle create customer
    const handleCreateCustomer = async (customerData: Partial<B2CCustomer>) => {
        try {
            // Validate data integrity
            const validationResult = validateCustomerData(customerData);
            if (!validationResult.valid) {
                throw new Error(validationResult.violations.map(v => v.message).join(', '));
            }

            const newCustomer = await customerService.create(customerData);
            setCustomers(prev => [...prev, newCustomer]);
            setShowCreateModal(false);

            console.log('✅ Customer created successfully:', newCustomer.id);
        } catch (error) {
            console.error('Error creating customer:', error);
            throw error; // Re-throw to let modal handle the error display
        }
    };

    // Handle edit customer
    const handleEditCustomer = async (customerId: string, customerData: Partial<B2CCustomer>) => {
        try {
            // Validate data integrity
            const validationResult = validateCustomerData(customerData);
            if (!validationResult.valid) {
                throw new Error(validationResult.violations.map(v => v.message).join(', '));
            }

            const updatedCustomer = await customerService.update(customerId, customerData);
            setCustomers(prev => prev.map(c => c.id === customerId ? updatedCustomer : c));
            setEditingCustomer(null);

            console.log('✅ Customer updated successfully:', customerId);
        } catch (error) {
            console.error('Error updating customer:', error);
            throw error; // Re-throw to let modal handle the error display
        }
    };

    // Handle delete customer
    const handleDeleteCustomer = async (customerId: string) => {
        if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            return;
        }

        try {
            // Check deletion safety
            const safetyCheck = await DataIntegrityService.checkDeletionSafety('customer', customerId);
            if (!safetyCheck.safe) {
                throw new Error(`Cannot delete customer: ${safetyCheck.warnings.join(', ')}`);
            }

            await customerService.delete(customerId);
            setCustomers(prev => prev.filter(c => c.id !== customerId));
            setEditingCustomer(null);
            setViewingCustomer(null);

            console.log('✅ Customer deleted successfully:', customerId);
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert(error instanceof Error ? error.message : 'Failed to delete customer');
        }
    };

    // Handle metric card clicks
    const handleMetricClick = (metric: 'total' | 'active' | 'types') => {
        setActiveMetric(activeMetric === metric ? null : metric);
    };

    // Filter customers based on search and filters
    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = !searchTerm ||
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.businessType.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
        const matchesType = typeFilter === 'all' || customer.businessType === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    // Calculate customer metrics
    const calculateCustomerMetrics = () => {
        const totalCustomers = filteredCustomers.length;
        const activeCustomers = filteredCustomers.filter(c => c.status === 'ACTIVE').length;
        const inactiveCustomers = filteredCustomers.filter(c => c.status === 'INACTIVE').length;
        const customerTypes = Array.from(new Set(filteredCustomers.map(c => c.businessType))).length;

        // Additional metrics for detailed views
        const recentCustomers = filteredCustomers
            .filter(c => new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const customerTypeBreakdown = filteredCustomers.reduce((acc, customer) => {
            acc[customer.businessType] = (acc[customer.businessType] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topCustomerTypes = Object.entries(customerTypeBreakdown)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        return {
            totalCustomers,
            activeCustomers,
            inactiveCustomers,
            customerTypes,
            recentCustomers,
            customerTypeBreakdown,
            topCustomerTypes
        };
    };

    // Get unique customer types for filter dropdown
    const uniqueCustomerTypes = Array.from(new Set(customers.map(c => c.businessType))).sort();

    // Handle retry
    const handleRetry = () => {
        setError(null);
        setLoading(true);
        // Reload will be triggered by the useEffect dependency
    };

    // Show loading state during auth check
    if (isLoading || !isAuthenticated) {
        return null; // ConditionalLayout handles loading
    }

    if (!currentFarm) {
        return (
            <div className={styles.container}>
                <div className={styles.errorState}>
                    <h2>No Farm Context</h2>
                    <p>Please select a farm to view customers.</p>
                    <Button variant="primary" onClick={() => router.push('/dashboard')}>
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <h2>Loading B2C Customers</h2>
                    <p>Fetching individual customer data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.errorState}>
                    <h2>Error Loading Customers</h2>
                    <p>{error}</p>
                    <button onClick={handleRetry} className={styles.retryButton}>
                        Retry Loading
                    </button>
                </div>
            </div>
        );
    }

    const metrics = calculateCustomerMetrics();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1 className={styles.title}>B2C Customers</h1>
                    <p className={styles.subtitle}>
                        Manage individual consumer customers and their preferences
                    </p>
                </div>
                <div className={styles.actions}>
                    <Button variant="secondary" onClick={() => router.push('/dashboard')}>
                        ← Dashboard
                    </Button>
                    <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                        + Add New Customer
                    </Button>
                </div>
            </div>

            {/* Search and Filter Controls */}
            <Card className={styles.filtersCard}>
                <div className={styles.filtersContent}>
                    <div className={styles.searchSection}>
                        <input
                            type="text"
                            placeholder="Search customers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <div className={styles.filterSection}>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'ACTIVE' | 'INACTIVE')}
                            className={styles.filterSelect}
                        >
                            <option value="all">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">All Types</option>
                            {uniqueCustomerTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Customer Statistics */}
            <div className={styles.statsGrid}>
                <Card className={styles.statCard}>
                    <div className={styles.statIcon}>👥</div>
                    <div className={styles.statValue}>{metrics.totalCustomers}</div>
                    <div className={styles.statLabel}>Total Customers</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statValue}>{metrics.activeCustomers}</div>
                    <div className={styles.statLabel}>Active Customers</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statIcon}>❌</div>
                    <div className={styles.statValue}>{metrics.inactiveCustomers}</div>
                    <div className={styles.statLabel}>Inactive Customers</div>
                </Card>
                <Card className={styles.statCard}>
                    <div className={styles.statIcon}>🏷️</div>
                    <div className={styles.statValue}>{metrics.customerTypes}</div>
                    <div className={styles.statLabel}>Customer Types</div>
                </Card>
            </div>

            {/* Customers Grid */}
            <div className={styles.customersGrid}>
                {filteredCustomers.map((customer) => (
                    <Card key={customer.id} className={styles.customerCard}>
                        <div className={styles.customerHeader}>
                            <div className={styles.customerInfo}>
                                <div className={styles.customerName}>{customer.name}</div>
                                <div className={styles.customerEmail}>{customer.email}</div>
                                <div className={styles.customerType}>{customer.businessType}</div>
                            </div>
                            <div className={styles.customerBadges}>
                                <span
                                    className={`${styles.statusBadge} ${customer.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive}`}
                                >
                                    {customer.status === 'ACTIVE' ? '✅ Active' : '❌ Inactive'}
                                </span>
                            </div>
                        </div>

                        <div className={styles.customerDetails}>
                            <div className={styles.customerLocation}>
                                📍 {customer.city}, {customer.state}
                            </div>
                            {customer.phone && (
                                <div className={styles.customerPhone}>
                                    📞 {customer.phone}
                                </div>
                            )}
                            <div className={styles.customerFrequency}>
                                🔄 {customer.orderFrequency || 'Not specified'}
                            </div>
                            {customer.paymentTerms && (
                                <div className={styles.customerPayment}>
                                    💳 {customer.paymentTerms}
                                </div>
                            )}
                        </div>

                        <div className={styles.customerActions}>
                            <Button
                                variant="secondary"
                                onClick={() => setViewingCustomer(customer)}
                                className={styles.actionButton}
                            >
                                View Details
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => setEditingCustomer(customer)}
                                className={styles.actionButton}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => handleDeleteCustomer(customer.id)}
                                className={styles.actionButton}
                            >
                                Delete
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {filteredCustomers.length === 0 && !loading && (
                <Card className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🔍</div>
                    <h3>No customers found</h3>
                    <p>
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'Create your first B2C customer to get started'
                        }
                    </p>
                    {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                            + Add First Customer
                        </Button>
                    )}
                </Card>
            )}

            {/* Clickable Metrics Cards */}
            <div className={styles.summary}>
                <div className={styles.summaryGrid}>
                    <Card
                        className={`${styles.metricCard} ${activeMetric === 'total' ? styles.metricCardActive : ''}`}
                        onClick={() => handleMetricClick('total')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleMetricClick('total');
                            }
                        }}
                        aria-label={`View details for ${metrics.totalCustomers} total customers`}
                    >
                        <div className={styles.metricContent}>
                            <div className={styles.metricIcon}>👥</div>
                            <div className={styles.metricDetails}>
                                <h3>Total B2C Customers</h3>
                                <span className={styles.summaryNumber}>{metrics.totalCustomers}</span>
                                <div className={styles.metricHint}>Click for details</div>
                            </div>
                        </div>
                    </Card>

                    <Card
                        className={`${styles.metricCard} ${activeMetric === 'active' ? styles.metricCardActive : ''}`}
                        onClick={() => handleMetricClick('active')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleMetricClick('active');
                            }
                        }}
                        aria-label={`View details for ${metrics.activeCustomers} active customers`}
                    >
                        <div className={styles.metricContent}>
                            <div className={styles.metricIcon}>✅</div>
                            <div className={styles.metricDetails}>
                                <h3>Active Customers</h3>
                                <span className={styles.summaryNumber}>{metrics.activeCustomers}</span>
                                <div className={styles.metricHint}>Click for details</div>
                            </div>
                        </div>
                    </Card>

                    <Card
                        className={`${styles.metricCard} ${activeMetric === 'types' ? styles.metricCardActive : ''}`}
                        onClick={() => handleMetricClick('types')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleMetricClick('types');
                            }
                        }}
                        aria-label={`View details for ${metrics.customerTypes} customer types`}
                    >
                        <div className={styles.metricContent}>
                            <div className={styles.metricIcon}>🏷️</div>
                            <div className={styles.metricDetails}>
                                <h3>Customer Types</h3>
                                <span className={styles.summaryNumber}>{metrics.customerTypes}</span>
                                <div className={styles.metricHint}>Click for details</div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Detailed Views */}
                {activeMetric === 'total' && (
                    <Card className={styles.detailsCard}>
                        <h3>📊 Total Customers Overview</h3>
                        <div className={styles.detailsGrid}>
                            <div className={styles.detailsItem}>
                                <span className={styles.detailsLabel}>Recent Customers (30 days)</span>
                                <span className={styles.detailsValue}>{metrics.recentCustomers.length}</span>
                            </div>
                            <div className={styles.detailsItem}>
                                <span className={styles.detailsLabel}>Active Rate</span>
                                <span className={styles.detailsValue}>
                                    {metrics.totalCustomers > 0 ? Math.round((metrics.activeCustomers / metrics.totalCustomers) * 100) : 0}%
                                </span>
                            </div>
                            <div className={styles.detailsItem}>
                                <span className={styles.detailsLabel}>Growth Trend</span>
                                <span className={styles.detailsValue}>
                                    {metrics.recentCustomers.length > 0 ? '+' : ''}
                                    {metrics.recentCustomers.length} this month
                                </span>
                            </div>
                        </div>
                        <div className={styles.recommendations}>
                            <h4>💡 Recommendations</h4>
                            <ul>
                                <li>Focus on converting inactive customers to active status</li>
                                <li>Implement customer retention strategies</li>
                                <li>Consider loyalty programs for high-value customers</li>
                            </ul>
                        </div>
                    </Card>
                )}

                {activeMetric === 'active' && (
                    <Card className={styles.detailsCard}>
                        <h3>✅ Active Customers Analysis</h3>
                        <div className={styles.detailsGrid}>
                            <div className={styles.detailsItem}>
                                <span className={styles.detailsLabel}>Active Rate</span>
                                <span className={styles.detailsValue}>
                                    {metrics.totalCustomers > 0 ? Math.round((metrics.activeCustomers / metrics.totalCustomers) * 100) : 0}%
                                </span>
                            </div>
                            <div className={styles.detailsItem}>
                                <span className={styles.detailsLabel}>Inactive Count</span>
                                <span className={styles.detailsValue}>{metrics.inactiveCustomers}</span>
                            </div>
                            <div className={styles.detailsItem}>
                                <span className={styles.detailsLabel}>Reactivation Potential</span>
                                <span className={styles.detailsValue}>
                                    {Math.round(metrics.inactiveCustomers * 0.3)} customers
                                </span>
                            </div>
                        </div>
                        <div className={styles.recommendations}>
                            <h4>💡 Action Items</h4>
                            <ul>
                                <li>Reach out to inactive customers with special offers</li>
                                <li>Survey active customers to understand satisfaction</li>
                                <li>Implement regular check-ins with top customers</li>
                            </ul>
                        </div>
                    </Card>
                )}

                {activeMetric === 'types' && (
                    <Card className={styles.detailsCard}>
                        <h3>🏷️ Customer Types Breakdown</h3>
                        <div className={styles.typeBreakdown}>
                            {metrics.topCustomerTypes.map(([type, count]) => (
                                <div key={type} className={styles.typeItem}>
                                    <span className={styles.typeName}>{type}</span>
                                    <span className={styles.typeCount}>{count}</span>
                                    <span className={styles.typePercentage}>
                                        {Math.round((count / metrics.totalCustomers) * 100)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className={styles.recommendations}>
                            <h4>💡 Insights</h4>
                            <ul>
                                <li>Focus marketing efforts on your top customer segments</li>
                                <li>Develop specialized products for underserved types</li>
                                <li>Create targeted communication strategies by type</li>
                            </ul>
                        </div>
                    </Card>
                )}
            </div>

            {/* Create Customer Modal */}
            <CrudModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Add New B2C Customer"
                mode="create"
                fields={customerFields}
                sections={customerFormSections}
                onSave={handleCreateCustomer}
            />

            {/* Edit Customer Modal */}
            <CrudModal
                isOpen={!!editingCustomer}
                onClose={() => setEditingCustomer(null)}
                title="Edit Customer"
                mode="edit"
                data={editingCustomer}
                fields={customerFields}
                sections={customerFormSections}
                onSave={async (data) => {
                    if (editingCustomer) {
                        await handleEditCustomer(editingCustomer.id, data);
                    }
                }}
                onDelete={async () => {
                    if (editingCustomer) {
                        await handleDeleteCustomer(editingCustomer.id);
                    }
                }}
            />

            {/* View Customer Modal */}
            <CrudModal
                isOpen={!!viewingCustomer}
                onClose={() => setViewingCustomer(null)}
                title="Customer Details"
                mode="view"
                data={viewingCustomer}
                fields={customerFields}
                sections={customerFormSections}
            />
        </div>
    );
} 