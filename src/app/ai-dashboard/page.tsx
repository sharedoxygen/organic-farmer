'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import {
    Card,
    Button,
    WeatherWidget,
    AlertCenter,
    BatchScoreCard,
    YieldForecastChart,
    QualityGradeCard,
    ResourceOptimizationPanel,
    AIInsightCard,
    FarmAssistantChat
} from '@/components/ui';
import styles from './page.module.css';

export default function AIDashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const { currentFarm } = useTenant();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'batches' | 'quality' | 'resources'>('overview');

    // Sample data - in production, fetch from API
    const [dashboardData, setDashboardData] = useState({
        batchScores: [
            {
                batchId: '1',
                batchNumber: 'B-2024-45',
                cropType: 'Arugula',
                overallScore: 92,
                healthScore: 95,
                growthScore: 90,
                environmentScore: 88,
                riskScore: 15,
                qualityPrediction: 'A' as const,
                trend: 'improving' as const
            },
            {
                batchId: '2',
                batchNumber: 'B-2024-46',
                cropType: 'Basil',
                overallScore: 78,
                healthScore: 80,
                growthScore: 75,
                environmentScore: 82,
                riskScore: 25,
                qualityPrediction: 'B' as const,
                trend: 'stable' as const
            },
            {
                batchId: '3',
                batchNumber: 'B-2024-47',
                cropType: 'Kale',
                overallScore: 85,
                healthScore: 88,
                growthScore: 82,
                environmentScore: 86,
                riskScore: 18,
                qualityPrediction: 'A' as const,
                trend: 'improving' as const
            }
        ],
        yieldForecast: {
            totalYield: 245,
            yieldUnit: 'lbs',
            confidence: 0.87,
            byCrop: [
                { cropType: 'Arugula', predictedYield: 85, unit: 'lbs', trend: 'up' as const, icon: '🥬' },
                { cropType: 'Basil', predictedYield: 62, unit: 'lbs', trend: 'stable' as const, icon: '🌿' },
                { cropType: 'Kale', predictedYield: 58, unit: 'lbs', trend: 'up' as const, icon: '🥗' },
                { cropType: 'Pea Shoots', predictedYield: 40, unit: 'lbs', trend: 'down' as const, icon: '🌱' }
            ],
            byWeek: [
                { week: 'W1', yield: 55 },
                { week: 'W2', yield: 68 },
                { week: 'W3', yield: 62 },
                { week: 'W4', yield: 60 }
            ]
        },
        qualityAssessment: {
            batchNumber: 'B-2024-45',
            cropType: 'Arugula',
            overallGrade: 'A' as const,
            confidence: 0.92,
            scores: {
                appearance: 94,
                color: 92,
                size: 88,
                uniformity: 85,
                freshness: 96,
                texture: 90
            },
            defects: [
                { type: 'SIZE_VARIATION', severity: 'MINOR' as const, description: 'Minor size variation' }
            ],
            shelfLifeDays: 7,
            marketChannels: [
                { channel: 'Fine Dining', suitability: 'EXCELLENT' as const },
                { channel: 'Farmers Market', suitability: 'EXCELLENT' as const },
                { channel: 'Retail', suitability: 'GOOD' as const }
            ]
        },
        resourceOptimization: {
            totalMonthlySavings: 1250,
            totalAnnualSavings: 15000,
            categories: [
                { name: 'Water', icon: '💧', type: 'water' as const, currentUsage: 500, optimizedUsage: 425, unit: 'gal/day', savingsPercent: 15, costSavings: 180 },
                { name: 'Labor', icon: '👷', type: 'labor' as const, currentUsage: 40, optimizedUsage: 34, unit: 'hrs/week', savingsPercent: 15, costSavings: 540 },
                { name: 'Inputs', icon: '📦', type: 'inputs' as const, currentUsage: 100, optimizedUsage: 88, unit: 'units', savingsPercent: 12, costSavings: 320 },
                { name: 'Equipment', icon: '⚙️', type: 'equipment' as const, currentUsage: 85, optimizedUsage: 92, unit: '% util', savingsPercent: 8, costSavings: 210 }
            ],
            recommendations: [
                { id: '1', title: 'Smart Irrigation', description: 'Implement soil moisture sensors for precise watering', impact: 'HIGH' as const, estimatedSavings: 2160, category: 'water' },
                { id: '2', title: 'Task Batching', description: 'Group similar tasks to reduce transition time', impact: 'MEDIUM' as const, estimatedSavings: 1800, category: 'labor' },
                { id: '3', title: 'Precision Seeding', description: 'Optimize seed rates based on germination data', impact: 'MEDIUM' as const, estimatedSavings: 960, category: 'inputs' }
            ]
        },
        insights: [
            {
                icon: '🎯',
                title: 'Harvest Optimization',
                subtitle: 'AI Analysis',
                badge: 'New',
                content: 'Based on current growth patterns and market demand, harvesting Arugula batch B-2024-45 tomorrow morning will maximize both quality and revenue.',
                metrics: [
                    { label: 'Quality Score', value: '94%' },
                    { label: 'Market Price', value: '$18/lb' },
                    { label: 'Revenue Est.', value: '$1,530' }
                ]
            },
            {
                icon: '📈',
                title: 'Demand Surge Alert',
                subtitle: 'Market Intelligence',
                badge: 'Trending',
                content: 'Restaurant demand for microgreens is up 25% this week. Consider accelerating production of high-margin varieties.',
                metrics: [
                    { label: 'Demand Change', value: '+25%' },
                    { label: 'Top Crop', value: 'Arugula' },
                    { label: 'Opportunity', value: '$2,400' }
                ]
            }
        ]
    });

    useEffect(() => {
        if (!isAuthLoading && isAuthenticated && currentFarm) {
            // Simulate loading
            setTimeout(() => setLoading(false), 500);
        }
    }, [isAuthLoading, isAuthenticated, currentFarm]);

    if (isAuthLoading || loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.spinner} />
                    <h2>Loading AI Dashboard...</h2>
                    <p>Analyzing farm data with AI...</p>
                </div>
            </div>
        );
    }

    if (!currentFarm) {
        return (
            <div className={styles.container}>
                <div className={styles.errorState}>
                    <h2>🏢 Farm Selection Required</h2>
                    <p>Please select a farm to view AI insights.</p>
                    <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Hero Header */}
            <div className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.heroText}>
                        <h1>🧠 AI Command Center</h1>
                        <p>Intelligent insights for {currentFarm.farm_name}</p>
                    </div>
                    <div className={styles.heroActions}>
                        <Button variant="secondary" onClick={() => router.push('/ai-insights')}>
                            Classic View
                        </Button>
                        <Button variant="primary" onClick={() => router.push('/dashboard')}>
                            Dashboard
                        </Button>
                    </div>
                </div>
                <div className={styles.heroStats}>
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatValue}>92%</span>
                        <span className={styles.heroStatLabel}>AI Accuracy</span>
                    </div>
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatValue}>$15K</span>
                        <span className={styles.heroStatLabel}>Annual Savings</span>
                    </div>
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatValue}>3</span>
                        <span className={styles.heroStatLabel}>Active Alerts</span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className={styles.tabNav}>
                {(['overview', 'batches', 'quality', 'resources'] as const).map(tab => (
                    <button
                        key={tab}
                        className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'overview' && '📊 Overview'}
                        {tab === 'batches' && '🌱 Batch Scoring'}
                        {tab === 'quality' && '✅ Quality'}
                        {tab === 'resources' && '⚡ Resources'}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className={styles.content}>
                {activeTab === 'overview' && (
                    <>
                        {/* Top Row - Weather & Alerts */}
                        <div className={styles.topRow}>
                            <div className={styles.weatherSection}>
                                <WeatherWidget
                                    farmId={currentFarm.id}
                                    location={'New York, NY'}
                                />
                            </div>
                            <div className={styles.alertSection}>
                                <AlertCenter
                                    farmId={currentFarm.id}
                                    maxAlerts={5}
                                />
                            </div>
                        </div>

                        {/* AI Insights Row */}
                        <div className={styles.insightsRow}>
                            <h2 className={styles.sectionTitle}>💡 AI Insights</h2>
                            <div className={styles.insightsGrid}>
                                {dashboardData.insights.map((insight, index) => (
                                    <AIInsightCard
                                        key={index}
                                        icon={insight.icon}
                                        title={insight.title}
                                        subtitle={insight.subtitle}
                                        badge={insight.badge}
                                        content={insight.content}
                                        metrics={insight.metrics}
                                        primaryAction={{
                                            label: 'Take Action',
                                            onClick: () => console.log('Action clicked')
                                        }}
                                        secondaryAction={{
                                            label: 'Learn More',
                                            onClick: () => console.log('Learn more clicked')
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Yield Forecast */}
                        <div className={styles.forecastSection}>
                            <YieldForecastChart
                                totalYield={dashboardData.yieldForecast.totalYield}
                                yieldUnit={dashboardData.yieldForecast.yieldUnit}
                                confidence={dashboardData.yieldForecast.confidence}
                                byCrop={dashboardData.yieldForecast.byCrop}
                                byWeek={dashboardData.yieldForecast.byWeek}
                            />
                        </div>
                    </>
                )}

                {activeTab === 'batches' && (
                    <div className={styles.batchesSection}>
                        <h2 className={styles.sectionTitle}>🌱 Batch Health Scores</h2>
                        <p className={styles.sectionSubtitle}>AI-powered health analysis for all active batches</p>
                        <div className={styles.batchGrid}>
                            {dashboardData.batchScores.map(score => (
                                <BatchScoreCard
                                    key={score.batchId}
                                    score={score}
                                    onClick={() => router.push(`/production/batches/${score.batchId}`)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'quality' && (
                    <div className={styles.qualitySection}>
                        <h2 className={styles.sectionTitle}>✅ Quality Assessment</h2>
                        <p className={styles.sectionSubtitle}>AI vision-powered quality grading and market recommendations</p>
                        <div className={styles.qualityGrid}>
                            <QualityGradeCard
                                batchNumber={dashboardData.qualityAssessment.batchNumber}
                                cropType={dashboardData.qualityAssessment.cropType}
                                overallGrade={dashboardData.qualityAssessment.overallGrade}
                                confidence={dashboardData.qualityAssessment.confidence}
                                scores={dashboardData.qualityAssessment.scores}
                                defects={dashboardData.qualityAssessment.defects}
                                shelfLifeDays={dashboardData.qualityAssessment.shelfLifeDays}
                                marketChannels={dashboardData.qualityAssessment.marketChannels}
                            />
                            <Card className={styles.qualityTips}>
                                <h3>🎯 Quality Optimization Tips</h3>
                                <ul>
                                    <li>Harvest during cooler morning hours for best freshness</li>
                                    <li>Maintain humidity between 90-95% for optimal shelf life</li>
                                    <li>Use precision seeding for better uniformity scores</li>
                                    <li>Monitor temperature closely to prevent bolting</li>
                                </ul>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'resources' && (
                    <div className={styles.resourcesSection}>
                        <h2 className={styles.sectionTitle}>⚡ Resource Optimization</h2>
                        <p className={styles.sectionSubtitle}>AI-driven recommendations to reduce costs and improve efficiency</p>
                        <ResourceOptimizationPanel
                            totalMonthlySavings={dashboardData.resourceOptimization.totalMonthlySavings}
                            totalAnnualSavings={dashboardData.resourceOptimization.totalAnnualSavings}
                            categories={dashboardData.resourceOptimization.categories}
                            recommendations={dashboardData.resourceOptimization.recommendations}
                        />
                    </div>
                )}
            </div>

            {/* Farm Assistant Chat */}
            <FarmAssistantChat
                farmId={currentFarm.id}
                farmName={currentFarm.farm_name}
                location={'New York, NY'}
            />
        </div>
    );
}
