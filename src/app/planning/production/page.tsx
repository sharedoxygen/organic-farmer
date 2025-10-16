'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card, Button } from '@/components/ui';
import styles from './page.module.css';

interface Customer {
    id: string;
    name: string;
    type: string;
    orderFrequency: string;
    preferredVarieties: string[];
    status: string;
}

interface SeedVariety {
    id: string;
    name: string;
    daysToHarvest: number;
    stockQuantity: number;
    costPerUnit: number;
    unit: string;
}

interface ProductionPlan {
    variety: string;
    totalDemand: number;
    currentStock: number;
    needToProduce: number;
    plantDate: Date;
    harvestDate: Date;
    estimatedTrays: number;
    seedRequired: number;
    totalCost: number;
}

interface Order {
    id: string;
    orderNumber: string;
    customer: { name: string; type: string };
    requestedDeliveryDate: string;
    status: string;
    total: number;
}

export default function ProductionPlanningPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [seedVarieties, setSeedVarieties] = useState<SeedVariety[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [productionPlan, setProductionPlan] = useState<ProductionPlan[]>([]);
    const [planningWeeks, setPlanningWeeks] = useState(4);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch customers
            const customersRes = await fetch('/api/customers');
            const customersData = await customersRes.json();
            setCustomers(customersData.data || []);

            // Fetch seed varieties
            const seedsRes = await fetch('/api/seed-varieties');
            const seedsData = await seedsRes.json();
            setSeedVarieties(seedsData.data || []);

            // Fetch recent orders
            const ordersRes = await fetch('/api/orders');
            const ordersData = await ordersRes.json();
            setOrders(ordersData.data || []);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateProductionPlan = () => {
        const plan: ProductionPlan[] = [];
        const varietyDemand: Record<string, number> = {};

        // Calculate demand based on historical orders and customer preferences
        customers.forEach(customer => {
            if (customer.status === 'ACTIVE' && customer.preferredVarieties) {
                customer.preferredVarieties.forEach(variety => {
                    // Estimate weekly demand based on customer type
                    let weeklyDemand = 0;
                    switch (customer.type) {
                        case 'RESTAURANT':
                            weeklyDemand = 8; // 8 oz per week
                            break;
                        case 'RETAIL':
                            weeklyDemand = 6; // 6 oz per week
                            break;
                        case 'INSTITUTION':
                            weeklyDemand = 12; // 12 oz per week
                            break;
                        case 'INDIVIDUAL':
                            weeklyDemand = 1.5; // 1.5 oz per week
                            break;
                        default:
                            weeklyDemand = 2;
                    }

                    varietyDemand[variety] = (varietyDemand[variety] || 0) + weeklyDemand * planningWeeks;
                });
            }
        });

        // Create production plan for each variety
        Object.entries(varietyDemand).forEach(([varietyName, totalDemand]) => {
            const seedVariety = seedVarieties.find(s => s.name === varietyName);
            if (seedVariety) {
                const currentStock = seedVariety.stockQuantity;
                const needToProduce = Math.max(0, totalDemand - currentStock);

                // Calculate planting schedule
                const harvestDate = new Date();
                harvestDate.setDate(harvestDate.getDate() + (planningWeeks * 7));

                const plantDate = new Date(harvestDate);
                plantDate.setDate(plantDate.getDate() - seedVariety.daysToHarvest);

                // Estimate production requirements (generic for any crop)
                // This is configurable per crop type
                const estimatedTrays = Math.ceil(needToProduce / 4); // 4 oz per tray average
                const seedRequired = estimatedTrays * 0.1; // 0.1 units seed per tray average
                const totalCost = seedRequired * seedVariety.costPerUnit;

                plan.push({
                    variety: varietyName,
                    totalDemand,
                    currentStock,
                    needToProduce,
                    plantDate,
                    harvestDate,
                    estimatedTrays,
                    seedRequired,
                    totalCost
                });
            }
        });

        setProductionPlan(plan.sort((a, b) => a.plantDate.getTime() - b.plantDate.getTime()));
    };

    const createPlantingBatch = async (planItem: ProductionPlan) => {
        try {
            const seedVariety = seedVarieties.find(s => s.name === planItem.variety);
            if (!seedVariety) return;

            const batchData = {
                batchNumber: `BATCH-${Date.now()}`,
                seedVarietyId: seedVariety.id,
                plantDate: planItem.plantDate.toISOString(),
                expectedHarvestDate: planItem.harvestDate.toISOString(),
                quantity: planItem.estimatedTrays,
                unit: 'trays',
                status: 'PLANNED',
                organicCompliant: true,
                growingMedium: 'Organic growing medium',
                notes: `Production planned for ${planItem.totalDemand}oz demand`
            };

            const response = await fetch('/api/batches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batchData)
            });

            if (response.ok) {
                alert(`Planting batch created for ${planItem.variety}!`);
                fetchData(); // Refresh data
            }
        } catch (error) {
            console.error('Error creating batch:', error);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <h1>🌱 Loading Production Planning...</h1>
                    <p>Analyzing customer demand and inventory levels...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>🌱 Production Planning</h1>
                    <p>Plan your crops based on customer demand and delivery schedules</p>
                </div>

                <div className={styles.controls}>
                    <div className={styles.planningControl}>
                        <label>Planning Period:</label>
                        <select
                            value={planningWeeks}
                            onChange={(e) => setPlanningWeeks(Number(e.target.value))}
                        >
                            <option value={2}>2 Weeks</option>
                            <option value={4}>4 Weeks</option>
                            <option value={8}>8 Weeks</option>
                            <option value={12}>12 Weeks</option>
                        </select>
                    </div>
                    <Button onClick={calculateProductionPlan} variant="primary">
                        📊 Calculate Production Plan
                    </Button>
                </div>
            </div>

            {/* Customer Overview */}
            <Card className={styles.summaryCard}>
                <h2>📋 Customer Overview</h2>
                <div className={styles.customerStats}>
                    <div className={styles.stat}>
                        <span className={styles.statNumber}>{customers.filter(c => c.status === 'ACTIVE').length}</span>
                        <span className={styles.statLabel}>Active Customers</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statNumber}>{customers.filter(c => c.type === 'RESTAURANT').length}</span>
                        <span className={styles.statLabel}>Restaurants</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statNumber}>{customers.filter(c => c.type === 'RETAIL').length}</span>
                        <span className={styles.statLabel}>Retail Stores</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statNumber}>{customers.filter(c => c.type === 'INDIVIDUAL').length}</span>
                        <span className={styles.statLabel}>Individual</span>
                    </div>
                </div>
            </Card>

            {/* Production Plan Table */}
            {productionPlan.length > 0 && (
                <Card className={styles.planCard}>
                    <h2>🎯 Production Plan ({planningWeeks} weeks)</h2>
                    <div className={styles.planTable}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Crop/Variety</th>
                                    <th>Total Demand</th>
                                    <th>Current Stock</th>
                                    <th>Need to Produce</th>
                                    <th>Plant Date</th>
                                    <th>Harvest Date</th>
                                    <th>Est. Production Units</th>
                                    <th>Seed Required</th>
                                    <th>Cost</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productionPlan.map((plan, index) => (
                                    <tr key={index} className={plan.needToProduce > 0 ? styles.productionNeeded : styles.stockSufficient}>
                                        <td className={styles.varietyCell}>
                                            <strong>{plan.variety}</strong>
                                        </td>
                                        <td>{plan.totalDemand.toFixed(1)} oz</td>
                                        <td>{plan.currentStock.toFixed(1)} oz</td>
                                        <td className={plan.needToProduce > 0 ? styles.deficit : styles.surplus}>
                                            {plan.needToProduce.toFixed(1)} oz
                                        </td>
                                        <td>{plan.plantDate.toLocaleDateString()}</td>
                                        <td>{plan.harvestDate.toLocaleDateString()}</td>
                                        <td>{plan.estimatedTrays} units</td>
                                        <td>{plan.seedRequired.toFixed(2)} {seedVarieties.find(s => s.name === plan.variety)?.unit}</td>
                                        <td>${plan.totalCost.toFixed(2)}</td>
                                        <td>
                                            {plan.needToProduce > 0 && (
                                                <Button
                                                    onClick={() => createPlantingBatch(plan)}
                                                    variant="primary"
                                                    size="sm"
                                                >
                                                    🌱 Plant
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {productionPlan.length === 0 && (
                <Card className={styles.emptyState}>
                    <div className={styles.emptyContent}>
                        <h3>📊 Ready to Plan Production</h3>
                        <p>Click "Calculate Production Plan" to analyze customer demand and create your planting schedule.</p>
                        <p>The system will:</p>
                        <ul>
                            <li>Analyze customer order patterns</li>
                            <li>Calculate crop demand forecasts</li>
                            <li>Determine optimal planting dates</li>
                            <li>Estimate resource requirements</li>
                            <li>Generate planting batches</li>
                        </ul>
                    </div>
                </Card>
            )}

            {/* Recent Orders */}
            {orders.length > 0 && (
                <Card className={styles.ordersCard}>
                    <h2>📦 Recent Orders</h2>
                    <div className={styles.ordersList}>
                        {orders.slice(0, 5).map(order => (
                            <div key={order.id} className={styles.orderItem}>
                                <div className={styles.orderInfo}>
                                    <strong>{order.orderNumber}</strong>
                                    <span>{order.customer.name} ({order.customer.type})</span>
                                </div>
                                <div className={styles.orderDetails}>
                                    <span className={styles.orderDate}>
                                        Delivery: {new Date(order.requestedDeliveryDate).toLocaleDateString()}
                                    </span>
                                    <span className={styles.orderTotal}>${order.total.toFixed(2)}</span>
                                    <span className={`${styles.orderStatus} ${styles[order.status.toLowerCase()]}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <Card className={styles.zoneEfficiencyCard}>
                <h4>Zone Efficiency Report</h4>
                <p>
                    Detailed analysis of each zone&apos;s productivity,
                    utilization rates, and &quot;sweet spot&quot; identification for optimal yields.
                </p>
            </Card>
        </div>
    );
} 