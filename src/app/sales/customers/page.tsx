'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import CustomerModal from './CustomerModal';
import styles from './page.module.css';
import { BackButton } from '@/components/ui';

interface Party {
  id: string;
  displayName: string;
  legalName: string | null;
  partyType: 'PERSON' | 'ORGANIZATION';
  createdAt: string;
  updatedAt: string;
}

interface PartyRole {
  id: string;
  roleType: 'CUSTOMER_B2B' | 'CUSTOMER_B2C';
  metadata: any;
}

interface PartyContact {
  id: string;
  type: 'EMAIL' | 'PHONE' | 'MOBILE' | 'ADDRESS';
  label: string | null;
  value: string;
  isPrimary: boolean;
}

interface Customer {
  party: Party;
  role: PartyRole;
  contacts: PartyContact[];
  // Computed fields
  primaryEmail?: string;
  primaryPhone?: string;
  primaryAddress?: any;
  totalOrders: number;
  totalRevenue: number;
  lastOrderDate: string | null;
}

type CustomerFilter = 'all' | 'b2b' | 'b2c';
type StatusFilter = 'all' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { currentFarm } = useTenant();
  const router = useRouter();

  useEffect(() => {
    fetchCustomers();
  }, [currentFarm?.id]);

  const fetchCustomers = async () => {
    if (!currentFarm?.id) {
      setError('No farm context available');
      setLoading(false);
      return;
    }

    try {
      const headers: Record<string, string> = { 'X-Farm-ID': currentFarm.id };
      const userData = typeof window !== 'undefined' ? localStorage.getItem('ofms_user') : null;
      if (userData) {
        const user = JSON.parse(userData);
        if (user?.id) headers['Authorization'] = `Bearer ${user.id}`;
      }

      const response = await fetch('/api/parties/customers', { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setCustomers(data.data);
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to load customers');
      }
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#10b981';
      case 'INACTIVE': return '#6b7280';
      case 'SUSPENDED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCustomerTypeIcon = (roleType: string) => {
    return roleType === 'CUSTOMER_B2B' ? '🏢' : '👤';
  };

  const getCustomerTypeBadge = (roleType: string) => {
    return roleType === 'CUSTOMER_B2B' ? 'B2B' : 'B2C';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleSaveCustomer = () => {
    fetchCustomers();
    setModalOpen(false);
  };

  const handleViewOrders = (customerId: string) => {
    router.push(`/sales/orders?customerId=${customerId}`);
  };

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    // Customer type filter
    if (customerFilter === 'b2b' && customer.role.roleType !== 'CUSTOMER_B2B') return false;
    if (customerFilter === 'b2c' && customer.role.roleType !== 'CUSTOMER_B2C') return false;

    // Status filter
    const status = customer.role.metadata?.status || 'ACTIVE';
    if (statusFilter !== 'all' && status !== statusFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = customer.party.displayName.toLowerCase().includes(query);
      const matchesEmail = customer.primaryEmail?.toLowerCase().includes(query);
      const matchesPhone = customer.primaryPhone?.toLowerCase().includes(query);
      
      if (!matchesName && !matchesEmail && !matchesPhone) return false;
    }

    return true;
  });

  // Calculate metrics
  const metrics = {
    total: filteredCustomers.length,
    b2b: filteredCustomers.filter(c => c.role.roleType === 'CUSTOMER_B2B').length,
    b2c: filteredCustomers.filter(c => c.role.roleType === 'CUSTOMER_B2C').length,
    active: filteredCustomers.filter(c => c.role.metadata?.status === 'ACTIVE').length,
    totalRevenue: filteredCustomers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0)
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <BackButton fallbackPath="/sales" />
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <h2>Loading Customers...</h2>
          <p>Fetching customer data from party model...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <BackButton fallbackPath="/sales" />
        <div className={styles.error}>
          <h2>⚠️ Error Loading Customers</h2>
          <p>{error}</p>
          <button onClick={fetchCustomers} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <BackButton fallbackPath="/sales" />

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Customers</h1>
          <p className={styles.subtitle}>
            Manage all customer relationships for {currentFarm?.farm_name}
          </p>
        </div>
        <button className={styles.addButton} onClick={handleAddCustomer}>
          + Add Customer
        </button>
      </div>

      {/* Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>👥</div>
          <div className={styles.metricContent}>
            <h3>Total Customers</h3>
            <p className={styles.metricValue}>{metrics.total}</p>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>🏢</div>
          <div className={styles.metricContent}>
            <h3>B2B Customers</h3>
            <p className={styles.metricValue}>{metrics.b2b}</p>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>👤</div>
          <div className={styles.metricContent}>
            <h3>B2C Customers</h3>
            <p className={styles.metricValue}>{metrics.b2c}</p>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>💰</div>
          <div className={styles.metricContent}>
            <h3>Total Revenue</h3>
            <p className={styles.metricValue}>{formatCurrency(metrics.totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Customer Type:</label>
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value as CustomerFilter)}
            className={styles.filterSelect}
          >
            <option value="all">All Customers</option>
            <option value="b2b">B2B Only</option>
            <option value="b2c">B2C Only</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        <div className={styles.searchGroup}>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No Customers Found</h3>
          <p>
            {searchQuery || customerFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start by adding your first customer'}
          </p>
          {!searchQuery && customerFilter === 'all' && statusFilter === 'all' && (
            <button className={styles.addButton} onClick={handleAddCustomer}>
              + Add First Customer
            </button>
          )}
        </div>
      ) : (
        <div className={styles.customerGrid}>
          {filteredCustomers.map((customer) => {
            const status = customer.role.metadata?.status || 'ACTIVE';
            const paymentTerms = customer.role.metadata?.paymentTerms || 'N/A';
            const creditLimit = customer.role.metadata?.creditLimit || 0;

            return (
              <div key={customer.party.id} className={styles.customerCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.customerInfo}>
                    <div className={styles.customerName}>
                      <span className={styles.typeIcon}>
                        {getCustomerTypeIcon(customer.role.roleType)}
                      </span>
                      <h3>{customer.party.displayName}</h3>
                    </div>
                    {customer.party.legalName && (
                      <p className={styles.legalName}>{customer.party.legalName}</p>
                    )}
                  </div>
                  <div className={styles.badges}>
                    <span className={styles.typeBadge}>
                      {getCustomerTypeBadge(customer.role.roleType)}
                    </span>
                    <span
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(status) }}
                    >
                      {status}
                    </span>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.contactInfo}>
                    {customer.primaryEmail && (
                      <div className={styles.contactItem}>
                        <span className={styles.contactIcon}>📧</span>
                        <span>{customer.primaryEmail}</span>
                      </div>
                    )}
                    {customer.primaryPhone && (
                      <div className={styles.contactItem}>
                        <span className={styles.contactIcon}>📱</span>
                        <span>{customer.primaryPhone}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.statsRow}>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Orders</span>
                      <span className={styles.statValue}>{customer.totalOrders}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Revenue</span>
                      <span className={styles.statValue}>
                        {formatCurrency(customer.totalRevenue)}
                      </span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Last Order</span>
                      <span className={styles.statValue}>
                        {formatDate(customer.lastOrderDate)}
                      </span>
                    </div>
                  </div>

                  {customer.role.roleType === 'CUSTOMER_B2B' && (
                    <div className={styles.b2bInfo}>
                      <div className={styles.infoItem}>
                        <span>Payment Terms:</span>
                        <strong>{paymentTerms}</strong>
                      </div>
                      <div className={styles.infoItem}>
                        <span>Credit Limit:</span>
                        <strong>{formatCurrency(creditLimit)}</strong>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.cardActions}>
                  <button
                    className={styles.actionButton}
                    onClick={() => handleEditCustomer(customer)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={() => handleViewOrders(customer.party.id)}
                  >
                    📋 Orders
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Modal */}
      {modalOpen && (
        <CustomerModal
          mode={modalMode}
          customer={editingCustomer}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveCustomer}
        />
      )}
    </div>
  );
}
