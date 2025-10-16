'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, CrudModal, CrudField, Tooltip } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { createCrudService } from '@/lib/api/crudService';
import styles from './page.module.css';

interface SalesOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerId: string;
  customerType: 'B2B' | 'B2C';
  orderDate: string;
  deliveryDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  totalAmount: number;
  items: OrderItem[];
  shippingAddress?: string;
  notes?: string;
  createdBy: string;
}

interface OrderItem {
  id: string;
  productName: string;
  batchNumber?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  qualityGrade?: 'A' | 'B' | 'C';
  seedVarietyId?: string;
}

interface OrderFilters {
  status: string;
  customerType: string;
  priority: string;
  dateRange: string;
  search: string;
}

interface Product {
  id: string;
  name: string;
  type: 'SEED_VARIETY' | 'INVENTORY_ITEM';
  price: number;
  unit: string;
  available: number;
  category?: string;
}

// Create API service for orders
const ordersService = createCrudService('orders', {
  farmScoped: true,
  transformFromApi: (data: any) => ({
    id: data.id,
    orderNumber: data.orderNumber,
    customerName: data.customers?.businessName || data.customers?.name || 'Unknown',
    customerId: data.customerId,
    customerType: data.customers?.type || 'B2C',
    orderDate: data.orderDate,
    deliveryDate: data.requestedDeliveryDate || data.actualDeliveryDate,
    status: data.status,
    priority: data.priority || 'MEDIUM',
    totalAmount: data.total || 0,
    items: data.order_items?.map((item: any) => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      seedVarietyId: item.seedVarietyId
    })) || [],
    shippingAddress: data.shippingAddress,
    notes: data.notes,
    createdBy: data.users_orders_createdByTousers ?
      `${data.users_orders_createdByTousers.firstName} ${data.users_orders_createdByTousers.lastName}` :
      'Unknown'
  }),
  transformForApi: (data: any) => ({
    orderNumber: data.orderNumber || `ORD-${Date.now()}`,
    customerId: data.customerId,
    orderDate: data.orderDate ? new Date(data.orderDate).toISOString() : new Date().toISOString(),
    requestedDeliveryDate: data.deliveryDate ? new Date(data.deliveryDate).toISOString() : null,
    status: data.status || 'PENDING',
    priority: data.priority || 'MEDIUM',
    total: data.totalAmount || 0,
    subtotal: data.totalAmount || 0,
    tax: 0,
    shippingCost: 0,
    paymentStatus: 'PENDING',
    deliveryMethod: data.deliveryMethod || 'PICKUP',
    notes: data.notes || '',
    items: data.items || []
  })
});

// Order Creation Modal Component
const OrderCreationModal = ({
  isOpen,
  onClose,
  onSave,
  customers,
  products,
  mode = 'create',
  initialData = null
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  customers: any[];
  products: Product[];
  mode?: 'create' | 'edit';
  initialData?: any;
}) => {
  const [formData, setFormData] = useState({
    orderNumber: '',
    customerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'MEDIUM',
    status: 'PENDING',
    deliveryMethod: 'PICKUP',
    shippingAddress: '',
    notes: '',
    items: [] as any[]
  });

  const [selectedProduct, setSelectedProduct] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        ...initialData,
        orderDate: new Date(initialData.orderDate).toISOString().split('T')[0],
        deliveryDate: new Date(initialData.deliveryDate).toISOString().split('T')[0],
        items: initialData.items || []
      });
    } else {
      setFormData({
        orderNumber: '',
        customerId: '',
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'MEDIUM',
        status: 'PENDING',
        deliveryMethod: 'PICKUP',
        shippingAddress: '',
        notes: '',
        items: []
      });
    }
  }, [initialData, mode, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addItem = () => {
    if (!selectedProduct || !itemQuantity) return;

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const quantity = parseFloat(itemQuantity);
    const unitPrice = product.price;
    const totalPrice = quantity * unitPrice;

    const newItem = {
      id: `item-${Date.now()}`,
      productName: product.name,
      seedVarietyId: product.type === 'SEED_VARIETY' ? product.id : undefined,
      quantity,
      unit: product.unit,
      unitPrice,
      totalPrice,
      qualityGrade: 'A'
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setSelectedProduct('');
    setItemQuantity('');
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId || formData.items.length === 0) {
      alert('Please select a customer and add at least one item');
      return;
    }

    setSaving(true);
    try {
      const orderData = {
        ...formData,
        totalAmount: calculateTotal()
      };
      await onSave(orderData);
      onClose();
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to save order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.orderModal}>
        <div className={styles.modalHeader}>
          <h2>{mode === 'create' ? 'Create New Order' : 'Edit Order'}</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.orderForm}>
          <div className={styles.formSection}>
            <h3>Order Information</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Order Number</label>
                <input
                  type="text"
                  value={formData.orderNumber}
                  onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                  placeholder="Auto-generated if empty"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Customer *</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => handleInputChange('customerId', e.target.value)}
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.businessName || customer.name} ({customer.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Order Date *</label>
                <input
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) => handleInputChange('orderDate', e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Delivery Date *</label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="READY">Ready</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Product Selection</h3>
            <div className={styles.productSelection}>
              <div className={styles.addItemForm}>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className={styles.productSelect}
                >
                  <option value="">Select product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ${product.price.toFixed(2)}/{product.unit}
                      {product.available > 0 ? ` (${product.available} available)` : ' (Out of stock)'}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  placeholder="Quantity"
                  min="0.01"
                  step="0.01"
                  className={styles.quantityInput}
                />
                <button
                  type="button"
                  onClick={addItem}
                  disabled={!selectedProduct || !itemQuantity}
                  className={styles.addButton}
                >
                  Add Item
                </button>
              </div>

              {formData.items.length > 0 && (
                <div className={styles.orderItems}>
                  <h4>Order Items</h4>
                  <div className={styles.itemsTable}>
                    <div className={styles.itemsHeader}>
                      <span>Product</span>
                      <span>Quantity</span>
                      <span>Unit Price</span>
                      <span>Total</span>
                      <span>Action</span>
                    </div>
                    {formData.items.map((item, index) => (
                      <div key={index} className={styles.itemRow}>
                        <span>{item.productName}</span>
                        <span>{item.quantity} {item.unit}</span>
                        <span>${item.unitPrice.toFixed(2)}</span>
                        <span>${item.totalPrice.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className={styles.removeButton}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className={styles.orderTotal}>
                    <strong>Total: ${calculateTotal().toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Delivery & Notes</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Delivery Method</label>
                <select
                  value={formData.deliveryMethod}
                  onChange={(e) => handleInputChange('deliveryMethod', e.target.value)}
                >
                  <option value="PICKUP">Pickup</option>
                  <option value="DELIVERY">Delivery</option>
                  <option value="SHIPPING">Shipping</option>
                </select>
              </div>

              {(formData.deliveryMethod === 'DELIVERY' || formData.deliveryMethod === 'SHIPPING') && (
                <div className={styles.formGroup}>
                  <label>Shipping Address</label>
                  <textarea
                    value={formData.shippingAddress}
                    onChange={(e) => handleInputChange('shippingAddress', e.target.value)}
                    rows={3}
                    placeholder="Enter delivery address"
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  placeholder="Special instructions, notes..."
                />
              </div>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.customerId || formData.items.length === 0}
              className={styles.saveButton}
            >
              {saving ? 'Saving...' : (mode === 'create' ? 'Create Order' : 'Update Order')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function SalesOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { currentFarm } = useTenant();

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<SalesOrder[]>([]);
  const [filters, setFilters] = useState<OrderFilters>({
    status: 'all',
    customerType: 'all',
    priority: 'all',
    dateRange: 'all',
    search: ''
  });
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [modalOpen, setModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const ordersData = await ordersService.list();
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const response = await fetch('/api/customers', {
        headers: {
          'X-Farm-ID': currentFarm?.id || '',
          'Cache-Control': 'no-store'
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Ensure customers is always an array
        const customersArray = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []);
        setCustomers(customersArray);
      } else {
        console.error('Failed to load customers:', response.status);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    }
  }, [currentFarm?.id]);

  const loadProducts = useCallback(async () => {
    try {
      const [seedVarietiesResponse, inventoryResponse] = await Promise.all([
        fetch('/api/seed-varieties', {
          headers: {
            'X-Farm-ID': currentFarm?.id || '',
            'Cache-Control': 'no-store'
          }
        }),
        fetch('/api/inventory', {
          headers: {
            'X-Farm-ID': currentFarm?.id || '',
            'Cache-Control': 'no-store'
          }
        })
      ]);

      const productList: Product[] = [];

      if (seedVarietiesResponse.ok) {
        const seedData = await seedVarietiesResponse.json();
        const seedVarieties = seedData.success ? seedData.data : (Array.isArray(seedData) ? seedData : []);

        if (Array.isArray(seedVarieties)) {
          seedVarieties.forEach((seed: any) => {
            productList.push({
              id: seed.id,
              name: seed.name,
              type: 'SEED_VARIETY',
              price: seed.costPerUnit || 25, // Default price for microgreens
              unit: seed.unit || 'oz',
              available: seed.stockQuantity || 0
            });
          });
        }
      }

      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json();
        const inventoryArray = Array.isArray(inventoryData) ? inventoryData : (inventoryData.data && Array.isArray(inventoryData.data) ? inventoryData.data : []);

        if (Array.isArray(inventoryArray)) {
          inventoryArray.forEach((item: any) => {
            if (item.category === 'SEEDS' && item.currentStock > 0) {
              productList.push({
                id: item.id,
                name: item.name,
                type: 'INVENTORY_ITEM',
                price: item.costPerUnit * 2, // Markup for selling price
                unit: item.unit,
                available: item.currentStock,
                category: item.category
              });
            }
          });
        }
      }

      setProducts(productList);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    }
  }, [currentFarm?.id]);

  const applyFilters = useCallback(() => {
    let filtered = [...orders];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Customer type filter
    if (filters.customerType !== 'all') {
      filtered = filtered.filter(order => order.customerType === filters.customerType);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(order => order.priority === filters.priority);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.customerName.toLowerCase().includes(searchLower) ||
        order.items.some(item => item.productName.toLowerCase().includes(searchLower))
      );
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        switch (filters.dateRange) {
          case '7days':
            return orderDate >= sevenDaysAgo;
          case '30days':
            return orderDate >= thirtyDaysAgo;
          default:
            return true;
        }
      });
    }

    setFilteredOrders(filtered);
  }, [orders, filters]);

  useEffect(() => {
    if (!isAuthLoading) {
      if (isAuthenticated) {
        loadOrders();
        loadCustomers();
        loadProducts();
      } else {
        router.push('/auth/signin');
      }
    }
  }, [isAuthLoading, isAuthenticated, router, loadOrders, loadCustomers, loadProducts]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Reload when farm changes
  useEffect(() => {
    if (currentFarm && isAuthenticated) {
      loadOrders();
      loadCustomers();
      loadProducts();
    }
  }, [currentFarm?.id, isAuthenticated, loadOrders, loadCustomers, loadProducts]);

  const handleFilterChange = (filterType: keyof OrderFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));

    // Set active filter for visual feedback
    if (filterType === 'status' && value !== 'all') {
      setActiveFilter(`status-${value}`);
    } else if (filterType === 'priority' && value !== 'all') {
      setActiveFilter(`priority-${value}`);
    } else if (filterType === 'status' && value === 'all') {
      setActiveFilter('all-orders');
    } else {
      setActiveFilter(null);
    }

    // Scroll to orders section to show the filtered results
    setTimeout(() => {
      const ordersSection = document.getElementById('orders-section');
      if (ordersSection) {
        ordersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const getOrdersSectionTitle = () => {
    if (activeFilter === 'all-orders') {
      return 'All Orders';
    } else if (activeFilter === 'status-PENDING') {
      return 'Pending Orders';
    } else if (activeFilter === 'priority-URGENT') {
      return 'Urgent Priority Orders';
    } else if (filters.status !== 'all') {
      return `${filters.status.charAt(0) + filters.status.slice(1).toLowerCase()} Orders`;
    } else if (filters.priority !== 'all') {
      return `${filters.priority.charAt(0) + filters.priority.slice(1).toLowerCase()} Priority Orders`;
    } else if (filters.search) {
      return `Search Results: "${filters.search}"`;
    } else {
      return 'All Orders';
    }
  };

  const clearActiveFilter = () => {
    setActiveFilter(null);
    setFilters({
      status: 'all',
      customerType: 'all',
      priority: 'all',
      dateRange: 'all',
      search: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#6b7280';
      case 'CONFIRMED': return '#3b82f6';
      case 'PREPARING': return '#f59e0b';
      case 'READY': return '#10b981';
      case 'SHIPPED': return '#8b5cf6';
      case 'DELIVERED': return '#22c55e';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'CONFIRMED': return '✅';
      case 'PREPARING': return '👨‍🍳';
      case 'READY': return '📦';
      case 'SHIPPED': return '🚚';
      case 'DELIVERED': return '🏠';
      case 'CANCELLED': return '❌';
      default: return '📋';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return '#6b7280';
      case 'MEDIUM': return '#f59e0b';
      case 'HIGH': return '#f97316';
      case 'URGENT': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCustomerTypeIcon = (type: string) => {
    return type === 'B2B' ? '🏢' : '👤';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getDaysUntilDelivery = (deliveryDate: string) => {
    const now = new Date();
    const delivery = new Date(deliveryDate);
    const diffTime = delivery.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Modal handlers
  const handleCreateOrder = () => {
    setSelectedOrder(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleViewOrder = (order: SalesOrder) => {
    setSelectedOrder(order);
    setModalMode('view');
    // For now, view orders by editing them
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleEditOrder = (order: SalesOrder) => {
    setSelectedOrder(order);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleUpdateStatus = async (order: SalesOrder, newStatus: string) => {
    try {
      await ordersService.update(order.id, { ...order, status: newStatus });
      await loadOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (modalMode === 'create') {
        await ordersService.create(data);
      } else if (modalMode === 'edit') {
        await ordersService.update(selectedOrder!.id, data);
      }
      await loadOrders();
    } catch (error) {
      console.error('Failed to save order:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;
    try {
      await ordersService.delete(selectedOrder.id);
      await loadOrders();
    } catch (error) {
      console.error('Failed to delete order:', error);
      throw error;
    }
  };

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingCount = filteredOrders.filter(order => order.status === 'PENDING').length;
  const urgentCount = filteredOrders.filter(order => order.priority === 'URGENT').length;
  const readyCount = filteredOrders.filter(order => order.status === 'READY').length;

  if (loading || isAuthLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <h1>💰 Loading Sales Orders...</h1>
          <p>Getting your sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>💰 Sales Orders</h1>
            <p className={styles.subtitle}>
              Track and manage all customer orders with complete order lifecycle
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={() => router.push('/dashboard')}>
              ← Dashboard
            </Button>
            <Button variant="primary" onClick={handleCreateOrder}>
              + New Order
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <div className={styles.filtersContent}>
          <div className={styles.searchSection}>
            <input
              type="text"
              placeholder="Search orders..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterSection}>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={filters.customerType}
              onChange={(e) => handleFilterChange('customerType', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Customers</option>
              <option value="B2B">Business (B2B)</option>
              <option value="B2C">Consumer (B2C)</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className={styles.statsGrid}>
        <Tooltip content="View all orders in the system">
          <Card
            className={`${styles.statCard} ${activeFilter === 'all-orders' ? styles.statCardActive : ''}`}
            onClick={() => handleFilterChange('status', 'all')}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.statIcon}>📋</div>
            <div className={styles.statValue}>{orders.length}</div>
            <div className={styles.statLabel}>Total Orders</div>
            {activeFilter === 'all-orders' && <div className={styles.activeIndicator}>Active Filter</div>}
          </Card>
        </Tooltip>

        <Tooltip content="Filter to show only pending orders">
          <Card
            className={`${styles.statCard} ${activeFilter === 'status-PENDING' ? styles.statCardActive : ''}`}
            onClick={() => handleFilterChange('status', 'PENDING')}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.statIcon}>⏳</div>
            <div className={styles.statValue}>{pendingCount}</div>
            <div className={styles.statLabel}>Pending</div>
            {activeFilter === 'status-PENDING' && <div className={styles.activeIndicator}>Active Filter</div>}
          </Card>
        </Tooltip>

        <Tooltip content="Filter to show only urgent priority orders">
          <Card
            className={`${styles.statCard} ${activeFilter === 'priority-URGENT' ? styles.statCardActive : ''}`}
            onClick={() => handleFilterChange('priority', 'URGENT')}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.statIcon}>🚨</div>
            <div className={styles.statValue}>{urgentCount}</div>
            <div className={styles.statLabel}>Urgent</div>
            {activeFilter === 'priority-URGENT' && <div className={styles.activeIndicator}>Active Filter</div>}
          </Card>
        </Tooltip>

        <Tooltip content="View detailed financial analytics and revenue reports">
          <Card
            className={styles.statCard}
            onClick={() => router.push('/analytics/financial')}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statValue}>{formatCurrency(totalRevenue)}</div>
            <div className={styles.statLabel}>Total Revenue</div>
          </Card>
        </Tooltip>
      </div>

      {/* Orders Section */}
      <div id="orders-section" className={styles.ordersSection}>
        <div className={styles.ordersSectionHeader}>
          <h2 className={styles.ordersSectionTitle}>
            {getOrdersSectionTitle()}
          </h2>
          <div className={styles.ordersSectionMeta}>
            <span className={styles.ordersCount}>
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </span>
            {activeFilter && (
              <button
                onClick={clearActiveFilter}
                className={styles.clearFilterButton}
              >
                Clear Filter ✕
              </button>
            )}
          </div>
        </div>

        <div className={styles.ordersGrid}>
          {filteredOrders.map((order) => {
            const daysUntilDelivery = getDaysUntilDelivery(order.deliveryDate);

            return (
              <Card key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.orderInfo}>
                    <div className={styles.orderNumber}>{order.orderNumber}</div>
                    <div className={styles.customerInfo}>
                      <span className={styles.customerIcon}>
                        {getCustomerTypeIcon(order.customerType)}
                      </span>
                      <span className={styles.customerName}>{order.customerName}</span>
                    </div>
                  </div>
                  <div className={styles.orderBadges}>
                    <span
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {getStatusIcon(order.status)} {order.status}
                    </span>
                    <span
                      className={styles.priorityBadge}
                      style={{ backgroundColor: getPriorityColor(order.priority) }}
                    >
                      {order.priority}
                    </span>
                  </div>
                </div>

                <div className={styles.orderContent}>
                  <div className={styles.orderMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Order Date:</span>
                      <span className={styles.metaValue}>{formatDate(order.orderDate)}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Delivery:</span>
                      <span className={`${styles.metaValue} ${daysUntilDelivery <= 1 ? styles.urgent : ''}`}>
                        {formatDate(order.deliveryDate)}
                        {daysUntilDelivery === 0 && ' (Today)'}
                        {daysUntilDelivery === 1 && ' (Tomorrow)'}
                        {daysUntilDelivery > 1 && ` (${daysUntilDelivery} days)`}
                        {daysUntilDelivery < 0 && ` (${Math.abs(daysUntilDelivery)} days overdue)`}
                      </span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Total:</span>
                      <span className={styles.totalAmount}>{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>

                  <div className={styles.orderItems}>
                    <h4>Order Items ({order.items.length}):</h4>
                    <div className={styles.itemsList}>
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className={styles.orderItem}>
                          <span className={styles.itemName}>{item.productName}</span>
                          <span className={styles.itemQuantity}>
                            {item.quantity} {item.unit}
                          </span>
                          <span className={styles.itemPrice}>
                            {formatCurrency(item.totalPrice || (item.unitPrice * item.quantity))}
                          </span>
                          {item.qualityGrade && (
                            <span className={styles.itemGrade}>Grade {item.qualityGrade}</span>
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className={styles.moreItems}>
                          +{order.items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>

                  {order.shippingAddress && (
                    <div className={styles.shippingInfo}>
                      <strong>Delivery Address:</strong> {order.shippingAddress}
                    </div>
                  )}

                  {order.notes && (
                    <div className={styles.orderNotes}>
                      <strong>Notes:</strong> {order.notes}
                    </div>
                  )}
                </div>

                <div className={styles.orderActions}>
                  <Button variant="secondary" size="sm" onClick={() => handleViewOrder(order)}>
                    View
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleEditOrder(order)}>
                    Edit
                  </Button>
                  {order.status === 'CONFIRMED' && (
                    <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(order, 'PREPARING')}>
                      Start Preparing
                    </Button>
                  )}
                  {order.status === 'PREPARING' && (
                    <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(order, 'READY')}>
                      Mark Ready
                    </Button>
                  )}
                  {order.status === 'READY' && (
                    <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(order, 'SHIPPED')}>
                      Ship Order
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {filteredOrders.length === 0 && (
          <Card className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h3>No orders found</h3>
            <p>Try adjusting your filters or create a new order to get started.</p>
            <Button variant="primary" onClick={handleCreateOrder}>
              Create First Order
            </Button>
          </Card>
        )}
      </div>

      {/* Order Creation Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <OrderCreationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          customers={customers}
          products={products}
          mode={modalMode}
          initialData={selectedOrder}
        />
      )}
    </div>
  );
}
