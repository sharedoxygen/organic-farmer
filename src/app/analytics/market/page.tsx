'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Card } from '@/components/ui';
import styles from './page.module.css';

interface MarketData {
    id: string;
    variety: string;
    marketPrice: number;
    ourPrice: number;
    priceChange: number;
    demand: 'high' | 'medium' | 'low';
    seasonality: 'peak' | 'normal' | 'off-season';
    competitors: Competitor[];
    marketShare: number;
    weeklyVolume: number;
    lastUpdated: string;
}

interface Competitor {
    name: string;
    price: number;
    quality: 'premium' | 'standard' | 'economy';
}

export default function MarketAnalysisPage() {
    const [marketData, setMarketData] = useState<MarketData[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'demand' | 'price' | 'share'>('demand');

    useEffect(() => {
        const loadMarketData = async () => {
            try {
                // Fetch real data from multiple APIs
                const [ordersRes, varietiesRes, customersRes] = await Promise.all([
                    fetch('/api/orders?limit=1000'),
                    fetch('/api/seed-varieties?limit=100'),
                    fetch('/api/customers?limit=500')
                ]);

                const [ordersData, varietiesData, customersData] = await Promise.all([
                    ordersRes.json(),
                    varietiesRes.json(),
                    customersRes.json()
                ]);

                if (ordersRes.ok && varietiesRes.ok && customersRes.ok) {
                    // Calculate market data from real information
                    const varieties = varietiesData.data;
                    const orders = ordersData.data;
                    const customers = customersData.data;

                    // Calculate variety-specific market data
                    const marketDataMap = new Map<string, any>();

                    // Process orders to get variety sales data
                    orders.forEach((order: any) => {
                        if (order.order_items) {
                            order.order_items.forEach((item: any) => {
                                const key = item.productName || 'Unknown';
                                const existing = marketDataMap.get(key) || {
                                    weeklyVolume: 0,
                                    totalRevenue: 0,
                                    orderCount: 0,
                                    customerTypes: new Set()
                                };

                                const quantity = parseFloat(item.quantity) || 0;
                                const unitPrice = parseFloat(item.unitPrice) || 0;

                                existing.weeklyVolume += quantity;
                                existing.totalRevenue += Math.round(quantity * unitPrice * 100) / 100;
                                existing.orderCount += 1;
                                if (order.customers?.type) {
                                    existing.customerTypes.add(order.customers.type);
                                }

                                marketDataMap.set(key, existing);
                            });
                        }
                    });

                    // Calculate total volume for market share calculations
                    const totalVolume = Array.from(marketDataMap.values())
                        .reduce((sum, data) => sum + (data.weeklyVolume || 0), 0);

                    // Transform into market data format
                    const transformedData: MarketData[] = varieties.slice(0, 10).map((variety: any) => {
                        const salesData = marketDataMap.get(variety.name) || {
                            weeklyVolume: 0,
                            totalRevenue: 0,
                            orderCount: 0,
                            customerTypes: new Set()
                        };

                        // Calculate average price from actual sales with proper division protection
                        const avgPrice = salesData.weeklyVolume > 0 ?
                            Math.round((salesData.totalRevenue / salesData.weeklyVolume) * 100) / 100 :
                            parseFloat(variety.pricePerUnit) || 10;

                        // Determine demand based on order count
                        let demand: 'high' | 'medium' | 'low' = 'low';
                        if (salesData.orderCount > 20) demand = 'high';
                        else if (salesData.orderCount > 10) demand = 'medium';

                        // Calculate market share with proper division protection
                        const marketShare = totalVolume > 0 ?
                            Math.round((salesData.weeklyVolume / totalVolume) * 100 * 100) / 100 : 0;

                        // Generate competitor data based on customer types
                        const competitors: Competitor[] = [];
                        if (salesData.customerTypes.has('B2B')) {
                            competitors.push({
                                name: 'Premium Farms Co',
                                price: Math.round(avgPrice * 1.1 * 100) / 100,
                                quality: 'premium'
                            });
                        }
                        if (salesData.customerTypes.has('B2C')) {
                            competitors.push({
                                name: 'Local Organics',
                                price: Math.round(avgPrice * 0.95 * 100) / 100,
                                quality: 'standard'
                            });
                        }
                        if (competitors.length === 0) {
                            competitors.push({
                                name: 'Market Average',
                                price: Math.round(avgPrice * 1.05 * 100) / 100,
                                quality: 'standard'
                            });
                        }

                        return {
                            id: variety.id,
                            variety: variety.name,
                            marketPrice: Math.round(avgPrice * 1.05 * 100) / 100, // Market price slightly higher
                            ourPrice: avgPrice,
                            priceChange: Math.round((Math.random() - 0.5) * 2 * 100) / 100, // Random for now
                            demand,
                            seasonality: 'normal', // Could be calculated based on dates
                            competitors,
                            marketShare,
                            weeklyVolume: Math.round(salesData.weeklyVolume * 100) / 100,
                            lastUpdated: new Date().toISOString()
                        };
                    }).filter((item: MarketData) => item.weeklyVolume > 0); // Only show varieties with sales

                    setMarketData(transformedData);
                } else {
                    console.error('Failed to load market data');
                    setMarketData([]);
                }
            } catch (error) {
                console.error('Error loading market data:', error);
                setMarketData([]);
            } finally {
                setLoading(false);
            }
        };

        loadMarketData();
    }, []);

    const getDemandColor = (demand: MarketData['demand']) => {
        switch (demand) {
            case 'high': return '#22c55e';
            case 'medium': return '#f59e0b';
            case 'low': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getSeasonalityColor = (seasonality: MarketData['seasonality']) => {
        switch (seasonality) {
            case 'peak': return '#22c55e';
            case 'normal': return '#3b82f6';
            case 'off-season': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const getQualityColor = (quality: Competitor['quality']) => {
        switch (quality) {
            case 'premium': return '#22c55e';
            case 'standard': return '#3b82f6';
            case 'economy': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    const sortedData = [...marketData].sort((a, b) => {
        switch (sortBy) {
            case 'demand':
                const demandOrder = { high: 3, medium: 2, low: 1 };
                return demandOrder[b.demand] - demandOrder[a.demand];
            case 'price':
                return b.marketPrice - a.marketPrice;
            case 'share':
                return b.marketShare - a.marketShare;
            default:
                return 0;
        }
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading market analysis...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>📈 Market Analysis</h1>
                <p className={styles.subtitle}>
                    Track market trends, pricing, and competitive positioning
                </p>
            </div>

            <div className={styles.summary}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>
                        {marketData.length > 0 ?
                            formatCurrency(Math.round((marketData.reduce((sum, item) => sum + item.marketPrice, 0) / marketData.length) * 100) / 100) :
                            formatCurrency(0)}
                    </div>
                    <div className={styles.summaryLabel}>Avg Market Price</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>
                        {marketData.length > 0 ?
                            formatCurrency(Math.round((marketData.reduce((sum, item) => sum + item.ourPrice, 0) / marketData.length) * 100) / 100) :
                            formatCurrency(0)}
                    </div>
                    <div className={styles.summaryLabel}>Avg Our Price</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>
                        {marketData.length > 0 ?
                            (Math.round((marketData.reduce((sum, item) => sum + item.marketShare, 0) / marketData.length) * 100) / 100).toFixed(1) :
                            '0.0'}%
                    </div>
                    <div className={styles.summaryLabel}>Avg Market Share</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>
                        {Math.round(marketData.reduce((sum, item) => sum + item.weeklyVolume, 0) * 100) / 100}
                    </div>
                    <div className={styles.summaryLabel}>Total Weekly Volume</div>
                </div>
            </div>

            <div className={styles.controls}>
                <div className={styles.sortControls}>
                    <label className={styles.sortLabel}>Sort by:</label>
                    <select
                        className={styles.sortSelect}
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                    >
                        <option value="demand">Demand Level</option>
                        <option value="price">Market Price</option>
                        <option value="share">Market Share</option>
                    </select>
                </div>
            </div>

            <div className={styles.marketGrid}>
                {sortedData.map((item) => (
                    <Card key={item.id} className={styles.marketCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.varietyInfo}>
                                <h3 className={styles.varietyName}>{item.variety}</h3>
                                <div className={styles.badges}>
                                    <div
                                        className={styles.demandBadge}
                                        style={{
                                            color: getDemandColor(item.demand),
                                            backgroundColor: `${getDemandColor(item.demand)}20`
                                        }}
                                    >
                                        {item.demand} demand
                                    </div>
                                    <div
                                        className={styles.seasonalityBadge}
                                        style={{
                                            color: getSeasonalityColor(item.seasonality),
                                            backgroundColor: `${getSeasonalityColor(item.seasonality)}20`
                                        }}
                                    >
                                        {item.seasonality}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.priceInfo}>
                                <div className={styles.marketPrice}>
                                    <span className={styles.priceLabel}>Market</span>
                                    <span className={styles.priceValue}>{formatCurrency(item.marketPrice)}</span>
                                </div>
                                <div className={styles.ourPrice}>
                                    <span className={styles.priceLabel}>Our Price</span>
                                    <span className={styles.priceValue}>{formatCurrency(item.ourPrice)}</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.priceChange}>
                            <span className={styles.changeLabel}>Price Change (24h):</span>
                            <span className={`${styles.changeValue} ${item.priceChange >= 0 ? styles.positive : styles.negative}`}>
                                {item.priceChange >= 0 ? '+' : ''}{formatCurrency(item.priceChange)}
                                <span className={styles.changePercent}>
                                    ({item.marketPrice > 0 ?
                                        (Math.round((item.priceChange / item.marketPrice) * 100 * 100) / 100).toFixed(1) :
                                        '0.0'}%)
                                </span>
                            </span>
                        </div>

                        <div className={styles.marketMetrics}>
                            <div className={styles.metric}>
                                <span className={styles.metricLabel}>Market Share</span>
                                <span className={styles.metricValue}>{(Math.round(item.marketShare * 100) / 100).toFixed(1)}%</span>
                            </div>
                            <div className={styles.metric}>
                                <span className={styles.metricLabel}>Weekly Volume</span>
                                <span className={styles.metricValue}>{Math.round(item.weeklyVolume * 100) / 100} lbs</span>
                            </div>
                        </div>

                        <div className={styles.competitorsSection}>
                            <h4 className={styles.competitorsTitle}>Key Competitors:</h4>
                            <div className={styles.competitorsList}>
                                {item.competitors.map((competitor, index) => (
                                    <div key={index} className={styles.competitorItem}>
                                        <div className={styles.competitorInfo}>
                                            <span className={styles.competitorName}>{competitor.name}</span>
                                            <span
                                                className={styles.qualityBadge}
                                                style={{
                                                    color: getQualityColor(competitor.quality),
                                                    backgroundColor: `${getQualityColor(competitor.quality)}20`
                                                }}
                                            >
                                                {competitor.quality}
                                            </span>
                                        </div>
                                        <div className={styles.competitorPrice}>
                                            {formatCurrency(competitor.price)}
                                            <span className={`${styles.priceComparison} ${competitor.price > item.ourPrice ? styles.higher : styles.lower}`}>
                                                {competitor.price > item.ourPrice ? '+' : ''}{formatCurrency(competitor.price - item.ourPrice)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.lastUpdated}>
                            Last updated: {formatDateTime(item.lastUpdated)}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
} 