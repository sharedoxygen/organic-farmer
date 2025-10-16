'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, CrudModal, CrudField } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { createCrudService } from '@/lib/api/crudService';
import styles from './page.module.css';

interface StockItem {
  id: string;
  name: string;
  category: 'SEEDS' | 'SUPPLIES' | 'PACKAGING' | 'EQUIPMENT';
  quantity: number;
  unit: string;
  reorderPoint: number;
  supplier: string;
  unitCost: number;
  location?: string;
  expirationDate?: string;
  batchNumber?: string;
  notes?: string;
  lastUpdated: string;
}

interface StockFilters {
  category: string;
  status: string;
  search: string;
}

// Create API service for inventory
const inventoryService = createCrudService('inventory', {
  farmScoped: true,
  transformFromApi: (data: any) => ({
    id: data.id,
    name: data.name,
    category: data.category || 'SUPPLIES',
    quantity: data.quantity || 0,
    unit: data.unit || 'units',
    reorderPoint: data.reorderPoint || data.minStockLevel || 10,
    supplier: data.supplier || 'Unknown Supplier',
    unitCost: data.unitCost || data.costPerUnit || 0,
    location: data.location || data.storageLocation,
    expirationDate: data.expirationDate,
    batchNumber: data.batchNumber || data.lotNumber,
    notes: data.notes,
    lastUpdated: data.updatedAt || data.lastUpdated
  }),
  transformForApi: (data: any) => ({
    name: data.name,
    category: data.category,
    quantity: parseFloat(data.quantity) || 0,
    unit: data.unit,
    reorderPoint: parseInt(data.reorderPoint) || 10,
    supplier: data.supplier,
    unitCost: parseFloat(data.unitCost) || 0,
    location: data.location,
    expirationDate: data.expirationDate ? new Date(data.expirationDate).toISOString() : null,
    batchNumber: data.batchNumber,
    notes: data.notes || ''
  })
});

// Define form fields for inventory items
const inventoryFields: CrudField[] = [
  {
    name: 'name',
    label: 'Item Name',
    type: 'text',
    required: true,
    placeholder: 'e.g., Arugula Seeds'
  },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    required: true,
    options: [
      { value: 'SEEDS', label: 'Seeds' },
      { value: 'SUPPLIES', label: 'Supplies' },
      { value: 'PACKAGING', label: 'Packaging' },
      { value: 'EQUIPMENT', label: 'Equipment' }
    ]
  },
  {
    name: 'quantity',
    label: 'Current Quantity',
    type: 'number',
    required: true,
    min: 0,
    step: 0.01
  },
  {
    name: 'unit',
    label: 'Unit',
    type: 'select',
    required: true,
    options: [
      { value: 'kg', label: 'Kilograms' },
      { value: 'g', label: 'Grams' },
      { value: 'lbs', label: 'Pounds' },
      { value: 'oz', label: 'Ounces' },
      { value: 'units', label: 'Units' },
      { value: 'trays', label: 'Trays' },
      { value: 'packages', label: 'Packages' }
    ]
  },
  {
    name: 'reorderPoint',
    label: 'Reorder Point',
    type: 'number',
    required: true,
    min: 0,
    placeholder: 'Minimum quantity before reorder'
  },
  {
    name: 'supplier',
    label: 'Supplier',
    type: 'text',
    required: true,
    placeholder: 'e.g., Organic Seeds Co.'
  },
  {
    name: 'unitCost',
    label: 'Unit Cost ($)',
    type: 'number',
    required: true,
    min: 0,
    step: 0.01,
    placeholder: 'Cost per unit'
  },
  {
    name: 'location',
    label: 'Storage Location',
    type: 'text',
    placeholder: 'e.g., Warehouse A, Shelf 2'
  },
  {
    name: 'expirationDate',
    label: 'Expiration Date',
    type: 'date',
    showWhen: (data) => data.category === 'SEEDS'
  },
  {
    name: 'batchNumber',
    label: 'Batch/Lot Number',
    type: 'text',
    placeholder: 'e.g., LOT-2025-001'
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'textarea',
    rows: 3,
    fullWidth: true,
    placeholder: 'Additional information...'
  }
];

// Special fields for stock adjustment
const adjustmentFields: CrudField[] = [
  {
    name: 'currentQuantity',
    label: 'Current Quantity',
    type: 'number',
    readOnly: true
  },
  {
    name: 'adjustmentType',
    label: 'Adjustment Type',
    type: 'select',
    required: true,
    options: [
      { value: 'ADD', label: 'Add Stock (Received)' },
      { value: 'REMOVE', label: 'Remove Stock (Used/Damaged)' },
      { value: 'SET', label: 'Set Exact Amount (Count)' }
    ]
  },
  {
    name: 'adjustmentQuantity',
    label: 'Adjustment Quantity',
    type: 'number',
    required: true,
    min: 0,
    step: 0.01,
    showWhen: (data) => data.adjustmentType === 'ADD' || data.adjustmentType === 'REMOVE'
  },
  {
    name: 'newQuantity',
    label: 'New Total Quantity',
    type: 'number',
    required: true,
    min: 0,
    step: 0.01,
    showWhen: (data) => data.adjustmentType === 'SET'
  },
  {
    name: 'reason',
    label: 'Reason for Adjustment',
    type: 'select',
    required: true,
    options: [
      { value: 'RECEIVED', label: 'Stock Received' },
      { value: 'USED', label: 'Used in Production' },
      { value: 'DAMAGED', label: 'Damaged/Spoiled' },
      { value: 'EXPIRED', label: 'Expired' },
      { value: 'COUNT', label: 'Physical Count' },
      { value: 'OTHER', label: 'Other' }
    ]
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'textarea',
    rows: 2,
    fullWidth: true,
    placeholder: 'Additional details...'
  }
];

export default function InventoryStockPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { currentFarm } = useTenant();

  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [filters, setFilters] = useState<StockFilters>({
    category: 'all',
    status: 'all',
    search: ''
  });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create' | 'adjust'>('view');
  const [modalOpen, setModalOpen] = useState(false);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const items = await inventoryService.list();
      setStockItems(items);
    } catch (error) {
      console.error('Error loading inventory:', error);
      setStockItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...stockItems];

    if (filters.category !== 'all') {
      filtered = filtered.filter(item => item.category === filters.category.toUpperCase());
    }

    if (filters.status !== 'all') {
      if (filters.status === 'low') {
        filtered = filtered.filter(item => item.quantity <= item.reorderPoint && item.quantity > 0);
      } else if (filters.status === 'ok') {
        filtered = filtered.filter(item => item.quantity > item.reorderPoint);
      } else if (filters.status === 'out') {
        filtered = filtered.filter(item => item.quantity === 0);
      }
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.supplier.toLowerCase().includes(searchLower)
      );
    }

    setFilteredItems(filtered);
  }, [stockItems, filters]);

  useEffect(() => {
    if (!isAuthLoading) {
      if (isAuthenticated) {
        loadInventory();
      } else {
        router.push('/auth/signin');
      }
    }
  }, [isAuthLoading, isAuthenticated, router, loadInventory]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Reload when farm changes
  useEffect(() => {
    if (currentFarm && isAuthenticated) {
      loadInventory();
    }
  }, [currentFarm?.id, isAuthenticated, loadInventory]);

  const handleFilterChange = (filterType: keyof StockFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getStatusColor = (quantity: number, reorderPoint: number) => {
    if (quantity === 0) return '#ef4444'; // Red for out of stock
    if (quantity <= reorderPoint) return '#f59e0b'; // Yellow for low stock
    return '#22c55e'; // Green for in stock
  };

  const getStatusIcon = (quantity: number, reorderPoint: number) => {
    if (quantity === 0) return '❌';
    if (quantity <= reorderPoint) return '⚠️';
    return '✅';
  };

  const getStatusText = (quantity: number, reorderPoint: number) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= reorderPoint) return 'Low Stock';
    return 'In Stock';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SEEDS': return '🌱';
      case 'SUPPLIES': return '📦';
      case 'PACKAGING': return '📦';
      case 'EQUIPMENT': return '⚙️';
      default: return '📋';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
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

  const getStockPercentage = (current: number, reorderPoint: number) => {
    if (reorderPoint === 0) return 100;
    return Math.min(Math.round((current / (reorderPoint * 2)) * 100), 100);
  };

  // Modal handlers
  const handleCreateItem = () => {
    setSelectedItem(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleViewItem = (item: StockItem) => {
    setSelectedItem(item);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleEditItem = (item: StockItem) => {
    setSelectedItem(item);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleAdjustStock = (item: StockItem) => {
    setSelectedItem({
      ...item,
      currentQuantity: item.quantity,
      adjustmentType: 'ADD',
      adjustmentQuantity: 0,
      newQuantity: item.quantity,
      reason: 'RECEIVED'
    } as any);
    setModalMode('adjust');
    setModalOpen(true);
  };

  const handleReorderItem = async (item: StockItem) => {
    try {
      // Create a reorder entry (could be expanded to actual purchase orders)
      const reorderData = {
        ...item,
        quantity: item.reorderPoint * 2, // Suggest ordering twice the reorder point
        notes: `Reorder requested for ${item.name} - Current stock: ${item.quantity}`
      };

      // For now, just show the create modal with suggested reorder quantity
      setSelectedItem(reorderData as any);
      setModalMode('create');
      setModalOpen(true);
    } catch (error) {
      console.error('Failed to create reorder:', error);
      alert('Failed to create reorder. Please try again.');
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (modalMode === 'adjust') {
        // Handle stock adjustment
        let newQuantity = data.currentQuantity;

        if (data.adjustmentType === 'ADD') {
          newQuantity = data.currentQuantity + parseFloat(data.adjustmentQuantity);
        } else if (data.adjustmentType === 'REMOVE') {
          newQuantity = Math.max(0, data.currentQuantity - parseFloat(data.adjustmentQuantity));
        } else if (data.adjustmentType === 'SET') {
          newQuantity = parseFloat(data.newQuantity);
        }

        // Update the item with new quantity
        const updateData = {
          ...selectedItem,
          quantity: newQuantity,
          notes: data.notes ? `${selectedItem?.notes || ''}\n[${new Date().toLocaleDateString()}] ${data.reason}: ${data.notes}` : selectedItem?.notes
        };

        await inventoryService.update(selectedItem!.id, updateData);
      } else if (modalMode === 'create') {
        await inventoryService.create(data);
      } else if (modalMode === 'edit') {
        await inventoryService.update(selectedItem!.id, data);
      }

      await loadInventory();
    } catch (error) {
      console.error('Failed to save inventory item:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await inventoryService.delete(selectedItem.id);
      await loadInventory();
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      throw error;
    }
  };

  // Calculate summary stats
  const totalValue = filteredItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  const lowStockCount = filteredItems.filter(item => item.quantity <= item.reorderPoint && item.quantity > 0).length;
  const outOfStockCount = filteredItems.filter(item => item.quantity === 0).length;

  if (loading || isAuthLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <h1>📦 Loading Inventory...</h1>
          <p>Getting your stock data...</p>
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
            <h1 className={styles.title}>📦 Inventory Stock</h1>
            <p className={styles.subtitle}>
              Monitor and manage all inventory stock levels with real-time tracking
            </p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={() => router.push('/dashboard')}>
              ← Dashboard
            </Button>
            <Button variant="primary" onClick={handleCreateItem}>
              + Add Item
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
              placeholder="Search items..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterSection}>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Categories</option>
              <option value="SEEDS">Seeds</option>
              <option value="SUPPLIES">Supplies</option>
              <option value="PACKAGING">Packaging</option>
              <option value="EQUIPMENT">Equipment</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Statuses</option>
              <option value="ok">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>📦</div>
          <div className={styles.statValue}>{filteredItems.length}</div>
          <div className={styles.statLabel}>Total Items</div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon}>⚠️</div>
          <div className={styles.statValue}>{lowStockCount}</div>
          <div className={styles.statLabel}>Low Stock</div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon}>❌</div>
          <div className={styles.statValue}>{outOfStockCount}</div>
          <div className={styles.statLabel}>Out of Stock</div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statValue}>{formatCurrency(totalValue)}</div>
          <div className={styles.statLabel}>Total Value</div>
        </Card>
      </div>

      {/* Stock Items Table */}
      <Card className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Stock Items</h2>
          <div className={styles.tableActions}>
            <Button variant="secondary" size="sm" onClick={() => {
              const csv = 'Name,Category,Quantity,Unit,Reorder Point,Supplier,Unit Cost,Total Value,Status\n' +
                filteredItems.map(item =>
                  `"${item.name}","${item.category}","${item.quantity}","${item.unit}","${item.reorderPoint}","${item.supplier}","${item.unitCost}","${item.quantity * item.unitCost}","${getStatusText(item.quantity, item.reorderPoint)}"`
                ).join('\n');

              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}>
              Export CSV
            </Button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.stockTable}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Stock Level</th>
                <th>Unit Cost</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const stockPercentage = getStockPercentage(item.quantity, item.reorderPoint);
                const totalItemValue = item.quantity * item.unitCost;
                const statusColor = getStatusColor(item.quantity, item.reorderPoint);
                const statusIcon = getStatusIcon(item.quantity, item.reorderPoint);
                const statusText = getStatusText(item.quantity, item.reorderPoint);

                return (
                  <tr key={item.id} className={styles.tableRow}>
                    <td className={styles.itemCell}>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemIcon}>
                          {getCategoryIcon(item.category)}
                        </div>
                        <div>
                          <div className={styles.itemName}>{item.name}</div>
                          <div className={styles.itemSupplier}>{item.supplier}</div>
                        </div>
                      </div>
                    </td>

                    <td className={styles.categoryCell}>
                      <span className={styles.categoryBadge}>
                        {item.category.replace('_', ' ')}
                      </span>
                    </td>

                    <td className={styles.stockCell}>
                      <div className={styles.stockInfo}>
                        <div className={styles.stockValue}>
                          {item.quantity} {item.unit}
                        </div>
                        <div className={styles.stockRange}>
                          Min: {item.reorderPoint}
                        </div>
                        <div className={styles.stockBar}>
                          <div
                            className={styles.stockProgress}
                            style={{
                              width: `${stockPercentage}%`,
                              backgroundColor: statusColor
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className={styles.costCell}>
                      {formatCurrency(item.unitCost)}
                      <div className={styles.perUnit}>per {item.unit}</div>
                    </td>

                    <td className={styles.valueCell}>
                      {formatCurrency(totalItemValue)}
                    </td>

                    <td className={styles.statusCell}>
                      <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: statusColor }}
                      >
                        {statusIcon} {statusText}
                      </span>
                    </td>

                    <td className={styles.actionsCell}>
                      <div className={styles.actionButtons}>
                        <Button variant="secondary" size="sm" onClick={() => handleViewItem(item)}>
                          View
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleAdjustStock(item)}>
                          Adjust
                        </Button>
                        {item.quantity === 0 && (
                          <Button variant="primary" size="sm" onClick={() => handleReorderItem(item)}>
                            Reorder
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredItems.length === 0 && (
        <Card className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <h3>No items found</h3>
          <p>Try adjusting your filters or add a new item to get started.</p>
          <Button variant="primary" onClick={handleCreateItem}>
            Add First Item
          </Button>
        </Card>
      )}

      {/* CRUD Modal */}
      <CrudModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalMode === 'create'
            ? 'Add New Inventory Item'
            : modalMode === 'edit'
              ? 'Edit Inventory Item'
              : modalMode === 'adjust'
                ? `Adjust Stock: ${selectedItem?.name || ''}`
                : `Item Details: ${selectedItem?.name || ''}`
        }
        mode={modalMode === 'adjust' ? 'edit' : modalMode}
        data={selectedItem}
        fields={modalMode === 'adjust' ? adjustmentFields : inventoryFields}
        onSave={handleSave}
        onDelete={modalMode === 'edit' ? handleDelete : undefined}
        sections={
          modalMode === 'adjust'
            ? [
              { title: 'Current Stock', fields: ['currentQuantity'] },
              { title: 'Adjustment Details', fields: ['adjustmentType', 'adjustmentQuantity', 'newQuantity', 'reason'] },
              { title: 'Notes', fields: ['notes'] }
            ]
            : [
              { title: 'Basic Information', fields: ['name', 'category', 'supplier'] },
              { title: 'Quantity & Pricing', fields: ['quantity', 'unit', 'reorderPoint', 'unitCost'] },
              { title: 'Additional Details', fields: ['location', 'expirationDate', 'batchNumber', 'notes'] }
            ]
        }
      />
    </div>
  );
}
