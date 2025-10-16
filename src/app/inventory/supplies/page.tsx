'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';
import styles from './page.module.css';

export default function SuppliesPage() {
    const [filter, setFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');

    const supplies = [
        {
            id: '1',
            name: 'OMRI Listed Coconut Coir',
            category: 'GROWING_MEDIUM',
            sku: 'GM-CC-001',
            currentStock: 250,
            minStockLevel: 50,
            unit: 'POUNDS',
            costPerUnit: 2.50,
            supplier: 'Organic Supplies Co',
            location: 'Storage Room A',
            status: 'IN_STOCK',
            expirationDate: null,
            lastOrdered: '2024-06-15'
        },
        {
            id: '2',
            name: 'Food Grade Plastic Trays',
            category: 'CONTAINERS',
            sku: 'CT-FG-002',
            currentStock: 15,
            minStockLevel: 20,
            unit: 'PIECES',
            costPerUnit: 12.99,
            supplier: 'Farm Equipment Supply',
            location: 'Storage Room B',
            status: 'LOW_STOCK',
            expirationDate: null,
            lastOrdered: '2024-05-20'
        },
        {
            id: '3',
            name: 'OMRI Listed Fish Emulsion',
            category: 'FERTILIZER',
            sku: 'FE-OM-003',
            currentStock: 8,
            minStockLevel: 5,
            unit: 'GALLONS',
            costPerUnit: 24.95,
            supplier: 'Neptune\'s Harvest',
            location: 'Chemical Storage',
            status: 'IN_STOCK',
            expirationDate: '2025-12-31',
            lastOrdered: '2024-06-01'
        },
        {
            id: '4',
            name: 'Organic Seed Starting Mix',
            category: 'GROWING_MEDIUM',
            sku: 'GM-SS-004',
            currentStock: 12,
            minStockLevel: 25,
            unit: 'BAGS',
            costPerUnit: 18.50,
            supplier: 'Pro-Mix Organics',
            location: 'Storage Room A',
            status: 'LOW_STOCK',
            expirationDate: null,
            lastOrdered: '2024-05-10'
        },
        {
            id: '5',
            name: 'Biodegradable Labels',
            category: 'PACKAGING',
            sku: 'PK-BL-005',
            currentStock: 2500,
            minStockLevel: 1000,
            unit: 'PIECES',
            costPerUnit: 0.05,
            supplier: 'Eco-Label Solutions',
            location: 'Packaging Area',
            status: 'IN_STOCK',
            expirationDate: null,
            lastOrdered: '2024-06-10'
        }
    ];

    const filteredSupplies = supplies.filter(supply => {
        const matchesSearch = supply.name.toLowerCase().includes(filter.toLowerCase()) ||
            supply.sku.toLowerCase().includes(filter.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || supply.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'IN_STOCK': return '#28a745';
            case 'LOW_STOCK': return '#ffc107';
            case 'OUT_OF_STOCK': return '#dc3545';
            case 'EXPIRED': return '#6c757d';
            default: return '#6c757d';
        }
    };

    const getStockLevelIndicator = (current: number, min: number) => {
        const percentage = (current / min) * 100;
        if (percentage <= 100) return 'low';
        if (percentage <= 200) return 'moderate';
        return 'good';
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Inventory - Supplies & Materials</h1>
                <p>Track growing media, containers, fertilizers, and packaging materials</p>
                <Button className={styles.addButton}>+ Add New Supply</Button>
            </div>

            <div className={styles.overview}>
                <Card className={styles.statCard}>
                    <h3>📦 Total Items</h3>
                    <span className={styles.statNumber}>{supplies.length}</span>
                </Card>
                <Card className={styles.statCard}>
                    <h3>⚠️ Low Stock Items</h3>
                    <span className={styles.statNumber}>
                        {supplies.filter(s => s.status === 'LOW_STOCK').length}
                    </span>
                </Card>
                <Card className={styles.statCard}>
                    <h3>💰 Total Value</h3>
                    <span className={styles.statNumber}>
                        ${supplies.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0).toFixed(0)}
                    </span>
                </Card>
            </div>

            <div className={styles.filters}>
                <input
                    type="text"
                    placeholder="Search supplies..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className={styles.searchInput}
                />
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={styles.categoryFilter}
                >
                    <option value="ALL">All Categories</option>
                    <option value="GROWING_MEDIUM">Growing Medium</option>
                    <option value="CONTAINERS">Containers</option>
                    <option value="FERTILIZER">Fertilizer</option>
                    <option value="PACKAGING">Packaging</option>
                    <option value="EQUIPMENT">Equipment</option>
                </select>
            </div>

            <div className={styles.suppliesGrid}>
                {filteredSupplies.map((supply) => (
                    <Card key={supply.id} className={styles.supplyCard}>
                        <div className={styles.supplyHeader}>
                            <div>
                                <h3>{supply.name}</h3>
                                <span className={styles.sku}>SKU: {supply.sku}</span>
                            </div>
                            <span
                                className={styles.statusBadge}
                                style={{ backgroundColor: getStatusColor(supply.status) }}
                            >
                                {supply.status.replace('_', ' ')}
                            </span>
                        </div>

                        <div className={styles.supplyDetails}>
                            <div className={styles.stockInfo}>
                                <div className={styles.stockLevel}>
                                    <span className={styles.currentStock}>{supply.currentStock} {supply.unit}</span>
                                    <div className={`${styles.stockIndicator} ${styles[getStockLevelIndicator(supply.currentStock, supply.minStockLevel)]}`}>
                                        <div
                                            className={styles.stockBar}
                                            style={{ width: `${Math.min((supply.currentStock / supply.minStockLevel) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className={styles.minStock}>Min: {supply.minStockLevel}</span>
                                </div>
                            </div>

                            <div className={styles.supplyInfo}>
                                <p><strong>Category:</strong> {supply.category.replace('_', ' ')}</p>
                                <p><strong>Supplier:</strong> {supply.supplier}</p>
                                <p><strong>Location:</strong> {supply.location}</p>
                                <p><strong>Cost/Unit:</strong> ${supply.costPerUnit}</p>
                                <p><strong>Total Value:</strong> ${(supply.currentStock * supply.costPerUnit).toFixed(2)}</p>
                                {supply.expirationDate && (
                                    <p><strong>Expires:</strong> {new Date(supply.expirationDate).toLocaleDateString()}</p>
                                )}
                                <p><strong>Last Ordered:</strong> {new Date(supply.lastOrdered).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className={styles.supplyActions}>
                            <Button className={styles.editButton}>Edit</Button>
                            <Button className={styles.orderButton}>Reorder</Button>
                            <Button className={styles.adjustButton}>Adjust Stock</Button>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredSupplies.length === 0 && (
                <div className={styles.emptyState}>
                    <p>No supplies found matching your criteria.</p>
                </div>
            )}
        </div>
    );
} 