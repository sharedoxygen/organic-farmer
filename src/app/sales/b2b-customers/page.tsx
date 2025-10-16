'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import CustomerModal from './CustomerModal';
import styles from './page.module.css';

interface Customer {
  id: string;
  name: string;
  type: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalRevenue: number;
  lastOrderDate: string;
  status: string;
  paymentTerms: string;
  creditLimit: number;
  businessName?: string;
}

export default function B2BCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const { currentFarm } = useTenant();

  // Fetch customers from API - NO HARDCODED DATA
  useEffect(() => {
    fetchCustomers();
  }, [currentFarm?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#10b981';
      case 'INACTIVE': return '#6b7280';
      case 'SUSPENDED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'RESTAURANT': return '🍽️';
      case 'RETAILER': return '🏪';
      case 'WHOLESALER': return '🏭';
      case 'INSTITUTIONAL': return '🏛️';
      default: return '🏢';
    }
  };

  const formatDate = (dateString: string) => {
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

  const handleSaveCustomer = (savedCustomer: any) => {
    if (modalMode === 'add') {
      // Refresh the customers list
      fetchCustomers();
    } else {
      // Update the existing customer in the list
      setCustomers(prev => prev.map(c =>
        c.id === savedCustomer.id ? {
          ...c,
          ...savedCustomer,
          totalOrders: c.totalOrders, // Keep existing order data
          totalRevenue: c.totalRevenue
        } : c
      ));
    }
  };

  const fetchCustomers = async () => {
    if (!currentFarm?.id) {
      setError('No farm context available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userData = localStorage.getItem('ofms_user');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Farm-ID': currentFarm.id
      };

      if (userData) {
        const user = JSON.parse(userData);
        headers['Authorization'] = `Bearer ${user.id}`;
      }

      console.log('🏢 Loading B2B customers for farm:', currentFarm.farm_name);

      const response = await fetch('/api/customers?type=B2B&limit=50', {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.statusText}`);
      }

      const response_data = await response.json();
      console.log('✅ B2B Customers API response:', response_data);

      // Extract customers array from API response
      const customers_data = response_data.data || [];
      console.log('✅ B2B Customers loaded from API:', customers_data.length);

      // Transform API data to match interface
      const transformedCustomers: Customer[] = customers_data.map((customer: any) => ({
        id: customer.id,
        name: customer.name || customer.businessName || 'Unknown Business',
        type: customer.type || 'BUSINESS',
        contactPerson: customer.contactPerson || 'N/A',
        email: customer.email || '',
        phone: customer.phone || '',
        address: `${customer.street || ''} ${customer.city || ''} ${customer.state || ''} ${customer.zipCode || ''}`.trim() || 'N/A',
        totalOrders: customer.totalOrders || 0,
        totalRevenue: customer.totalSpent || 0, // API returns totalSpent
        lastOrderDate: customer.lastOrderDate || new Date().toISOString(),
        status: customer.status || 'ACTIVE',
        paymentTerms: customer.paymentTerms || 'NET_30',
        creditLimit: customer.creditLimit || 0,
        businessName: customer.businessName
      }));

      setCustomers(transformedCustomers);
    } catch (err) {
      console.error('❌ Error fetching B2B customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customers');
      setCustomers([]); // Empty array on error, no fallback data
    } finally {
      setLoading(false);
    }
  };

  if (!currentFarm) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>No Farm Context</h2>
          <p>Please select a farm to view customers.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <h2>Loading B2B Customers...</h2>
          <p>Fetching customer data for {currentFarm.farm_name}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error Loading Customers</h2>
          <p>{error}</p>
          <button
            className={styles.primaryButton}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>B2B Customers</h1>
          <p className={styles.subtitle}>
            Manage business customer relationships for {currentFarm.farm_name}
          </p>
        </div>
        <button className={styles.primaryButton} onClick={handleAddCustomer}>
          + Add Customer
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{customers.length}</span>
          <span className={styles.statLabel}>Total Customers</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>
            {customers.filter(c => c.status === 'ACTIVE').length}
          </span>
          <span className={styles.statLabel}>Active</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>
            ${customers.reduce((sum, c) => sum + c.totalRevenue, 0).toLocaleString()}
          </span>
          <span className={styles.statLabel}>Total Revenue</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>
            {customers.reduce((sum, c) => sum + c.totalOrders, 0)}
          </span>
          <span className={styles.statLabel}>Total Orders</span>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyContent}>
            <h3>No B2B Customers Found</h3>
            <p>Start building your business relationships by adding your first B2B customer.</p>
            <button className={styles.primaryButton} onClick={handleAddCustomer}>
              + Add First Customer
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.customersGrid}>
          {customers.map((customer) => (
            <div key={customer.id} className={styles.customerCard}>
              <div className={styles.cardHeader}>
                <div className={styles.customerInfo}>
                  <span className={styles.typeIcon}>{getTypeIcon(customer.type)}</span>
                  <div>
                    <h3 className={styles.customerName}>{customer.name}</h3>
                    <p className={styles.customerType}>{customer.type}</p>
                  </div>
                </div>
                <span
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(customer.status) }}
                >
                  {customer.status}
                </span>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.contactInfo}>
                  <div className={styles.detail}>
                    <span className={styles.label}>Contact:</span>
                    <span className={styles.value}>{customer.contactPerson}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>Email:</span>
                    <span className={styles.value}>{customer.email}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>Phone:</span>
                    <span className={styles.value}>{customer.phone}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>Address:</span>
                    <span className={styles.value}>{customer.address}</span>
                  </div>
                </div>

                <div className={styles.businessMetrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricValue}>{customer.totalOrders}</span>
                    <span className={styles.metricLabel}>Total Orders</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricValue}>${customer.totalRevenue.toLocaleString()}</span>
                    <span className={styles.metricLabel}>Total Revenue</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricValue}>
                      ${customer.totalOrders > 0 ? Math.round(customer.totalRevenue / customer.totalOrders) : 0}
                    </span>
                    <span className={styles.metricLabel}>Avg Order</span>
                  </div>
                </div>

                <div className={styles.accountDetails}>
                  <div className={styles.detail}>
                    <span className={styles.label}>Payment Terms:</span>
                    <span className={styles.value}>{customer.paymentTerms.replace('_', ' ')}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>Credit Limit:</span>
                    <span className={styles.value}>${customer.creditLimit.toLocaleString()}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>Last Order:</span>
                    <span className={styles.value}>{formatDate(customer.lastOrderDate)}</span>
                  </div>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  className={styles.actionButton}
                  onClick={() => handleEditCustomer(customer)}
                >
                  Edit Customer
                </button>
                <button className={styles.actionButton}>Order History</button>
                <button className={styles.actionButton}>New Order</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CustomerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCustomer}
        customer={editingCustomer}
        mode={modalMode}
      />
    </div>
  );
}
