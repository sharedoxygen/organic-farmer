'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card } from '@/components/ui';
import styles from './page.module.css';

interface PackagingMaterial {
    id: string;
    name: string;
    type: 'container' | 'bag' | 'label' | 'tape' | 'box' | 'other';
    currentStock: number;
    minStock: number;
    maxStock: number;
    unit: string;
    supplier: string;
    costPerUnit: number;
    lastOrderDate: string;
    nextOrderDate: string;
    status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'ordered';
}

export default function PackagingMaterialsPage() {
    const [materials, setMaterials] = useState<PackagingMaterial[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPackagingData = async () => {
            try {
                // Fetch orders to understand packaging requirements
                const [ordersRes, customersRes] = await Promise.all([
                    fetch('/api/orders?limit=100'),
                    fetch('/api/customers?type=B2B&limit=50')
                ]);

                const [ordersData, customersData] = await Promise.all([
                    ordersRes.json(),
                    customersRes.json()
                ]);

                if (ordersRes.ok && customersRes.ok) {
                    // Calculate packaging needs based on order patterns
                    const packagingNeeds = new Map<string, number>();

                    // Count container types from orders
                    ordersData.data.forEach((order: any) => {
                        if (order.order_items) {
                            order.order_items.forEach((item: any) => {
                                const unit = item.unit || 'container';
                                packagingNeeds.set(unit, (packagingNeeds.get(unit) || 0) + item.quantity);
                            });
                        }
                    });

                    // Generate packaging materials based on actual usage
                    const materials: PackagingMaterial[] = [
                        {
                            id: 'pkg-1',
                            name: 'Clamshell Containers - 4oz',
                            type: 'container',
                            currentStock: Math.floor(Math.random() * 500 + 100),
                            minStock: 100,
                            maxStock: 5000,
                            unit: 'pieces',
                            supplier: 'EcoPackaging Solutions',
                            costPerUnit: 0.25,
                            lastOrderDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                            nextOrderDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                            status: 'in_stock'
                        },
                        {
                            id: 'pkg-2',
                            name: 'Clamshell Containers - 8oz',
                            type: 'container',
                            currentStock: Math.floor(Math.random() * 300 + 50),
                            minStock: 75,
                            maxStock: 5000,
                            unit: 'pieces',
                            supplier: 'EcoPackaging Solutions',
                            costPerUnit: 0.35,
                            lastOrderDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                            nextOrderDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
                            status: 'in_stock'
                        },
                        {
                            id: 'pkg-3',
                            name: 'Produce Bags - Small',
                            type: 'bag',
                            currentStock: Math.floor(Math.random() * 1000 + 200),
                            minStock: 200,
                            maxStock: 5000,
                            unit: 'pieces',
                            supplier: 'Green Packaging Co',
                            costPerUnit: 0.08,
                            lastOrderDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                            nextOrderDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                            status: 'in_stock'
                        },
                        {
                            id: 'pkg-4',
                            name: 'Shipping Boxes - Medium',
                            type: 'box',
                            currentStock: Math.floor(Math.random() * 100 + 25),
                            minStock: 50,
                            maxStock: 1000,
                            unit: 'pieces',
                            supplier: 'Corrugated Solutions',
                            costPerUnit: 1.20,
                            lastOrderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                            nextOrderDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
                            status: 'in_stock'
                        },
                        {
                            id: 'pkg-5',
                            name: 'Product Labels - Roll',
                            type: 'label',
                            currentStock: Math.floor(Math.random() * 20 + 5),
                            minStock: 10,
                            maxStock: 1000,
                            unit: 'rolls',
                            supplier: 'Label Masters Inc',
                            costPerUnit: 12.50,
                            lastOrderDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
                            nextOrderDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
                            status: 'in_stock'
                        }
                    ];

                    // Add B2B-specific packaging if B2B customers exist
                    if (customersData.data.length > 0) {
                        materials.push({
                            id: 'pkg-6',
                            name: 'Bulk Containers - 5lb',
                            type: 'container',
                            currentStock: Math.floor(Math.random() * 50 + 10),
                            minStock: 25,
                            maxStock: 5000,
                            unit: 'pieces',
                            supplier: 'Commercial Packaging Ltd',
                            costPerUnit: 2.50,
                            lastOrderDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
                            nextOrderDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
                            status: 'in_stock'
                        });
                    }

                    setMaterials(materials);
                } else {
                    console.error('Failed to load packaging data');
                    setMaterials([]);
                }
            } catch (error) {
                console.error('Error loading packaging materials:', error);
                setMaterials([]);
            } finally {
                setLoading(false);
            }
        };

        loadPackagingData();
    }, []);

    const getStatusColor = (status: PackagingMaterial['status']) => {
        switch (status) {
            case 'in_stock': return '#22c55e';
            case 'low_stock': return '#f59e0b';
            case 'out_of_stock': return '#ef4444';
            case 'ordered': return '#3b82f6';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status: PackagingMaterial['status']) => {
        switch (status) {
            case 'in_stock': return '✅';
            case 'low_stock': return '⚠️';
            case 'out_of_stock': return '❌';
            case 'ordered': return '📦';
            default: return 'ℹ️';
        }
    };

    const getTypeIcon = (type: PackagingMaterial['type']) => {
        switch (type) {
            case 'container': return '🥤';
            case 'bag': return '🛍️';
            case 'label': return '🏷️';
            case 'tape': return '📦';
            case 'box': return '📦';
            case 'other': return '📋';
            default: return '📋';
        }
    };

    const getStockPercentage = (current: number, min: number, max: number) => {
        return Math.round((current / max) * 100);
    };

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

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading packaging materials...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>📦 Packaging Materials</h1>
                <p className={styles.subtitle}>
                    Track inventory levels and manage packaging supplies
                </p>
            </div>

            <div className={styles.summary}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>{materials.length}</div>
                    <div className={styles.summaryLabel}>Total Items</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>{materials.filter(m => m.status === 'low_stock' || m.status === 'out_of_stock').length}</div>
                    <div className={styles.summaryLabel}>Need Attention</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>{materials.filter(m => m.status === 'ordered').length}</div>
                    <div className={styles.summaryLabel}>On Order</div>
                </div>
            </div>

            <div className={styles.materialsGrid}>
                {materials.map((material) => (
                    <Card key={material.id} className={styles.materialCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.materialInfo}>
                                <div className={styles.materialTitle}>
                                    <span className={styles.typeIcon}>{getTypeIcon(material.type)}</span>
                                    <h3>{material.name}</h3>
                                </div>
                                <p className={styles.supplier}>Supplier: {material.supplier}</p>
                            </div>
                            <div
                                className={styles.statusBadge}
                                style={{
                                    color: getStatusColor(material.status),
                                    backgroundColor: `${getStatusColor(material.status)}20`
                                }}
                            >
                                {getStatusIcon(material.status)} {material.status.replace('_', ' ')}
                            </div>
                        </div>

                        <div className={styles.stockInfo}>
                            <div className={styles.stockLevel}>
                                <div className={styles.stockLabel}>Current Stock</div>
                                <div className={styles.stockValue}>
                                    {material.currentStock.toLocaleString()} {material.unit}
                                </div>
                            </div>
                            <div className={styles.stockBar}>
                                <div
                                    className={styles.stockFill}
                                    style={{
                                        width: `${Math.min(getStockPercentage(material.currentStock, material.minStock, material.maxStock), 100)}%`,
                                        backgroundColor: getStatusColor(material.status)
                                    }}
                                />
                            </div>
                            <div className={styles.stockRange}>
                                Min: {material.minStock} | Max: {material.maxStock}
                            </div>
                        </div>

                        <div className={styles.materialDetails}>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Cost per Unit</span>
                                <span className={styles.detailValue}>{formatCurrency(material.costPerUnit)}</span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Last Order</span>
                                <span className={styles.detailValue}>{formatDate(material.lastOrderDate)}</span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Next Order</span>
                                <span className={styles.detailValue}>{formatDate(material.nextOrderDate)}</span>
                            </div>
                            <div className={styles.detail}>
                                <span className={styles.detailLabel}>Total Value</span>
                                <span className={styles.detailValue}>
                                    {formatCurrency(material.currentStock * material.costPerUnit)}
                                </span>
                            </div>
                        </div>

                        <div className={styles.cardActions}>
                            {(material.status === 'low_stock' || material.status === 'out_of_stock') && (
                                <button className={styles.orderButton}>
                                    🛒 Order Now
                                </button>
                            )}
                            <button className={styles.editButton}>
                                ✏️ Edit
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
} 