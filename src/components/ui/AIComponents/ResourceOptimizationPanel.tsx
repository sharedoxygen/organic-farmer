'use client';

import React from 'react';
import styles from './AIComponents.module.css';

interface ResourceCategory {
    name: string;
    icon: string;
    type: 'water' | 'labor' | 'inputs' | 'equipment';
    currentUsage: number;
    optimizedUsage: number;
    unit: string;
    savingsPercent: number;
    costSavings: number;
}

interface Recommendation {
    id: string;
    title: string;
    description: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    estimatedSavings: number;
    category: string;
}

interface ResourceOptimizationPanelProps {
    totalMonthlySavings: number;
    totalAnnualSavings: number;
    categories: ResourceCategory[];
    recommendations: Recommendation[];
    onRecommendationClick?: (recommendation: Recommendation) => void;
}

const getCategoryIcon = (type: string): string => {
    switch (type) {
        case 'water': return '💧';
        case 'labor': return '👷';
        case 'inputs': return '📦';
        case 'equipment': return '⚙️';
        default: return '📊';
    }
};

export function ResourceOptimizationPanel({
    totalMonthlySavings,
    totalAnnualSavings,
    categories,
    recommendations,
    onRecommendationClick
}: ResourceOptimizationPanelProps) {
    return (
        <div className={styles.resourcePanel}>
            <div className={styles.resourceHeader}>
                <h3>🎯 Resource Optimization</h3>
                <div className={styles.resourceSavings}>
                    <span className={styles.resourceSavingsValue}>
                        ${totalMonthlySavings.toLocaleString()}
                    </span>
                    <span className={styles.resourceSavingsLabel}>
                        /month potential savings
                    </span>
                </div>
            </div>

            <div className={styles.resourceCategories}>
                {categories.map((category, index) => (
                    <div key={index} className={styles.resourceCategory}>
                        <div className={styles.resourceCategoryHeader}>
                            <div className={`${styles.resourceCategoryIcon} ${styles[category.type]}`}>
                                {category.icon || getCategoryIcon(category.type)}
                            </div>
                            <span className={styles.resourceCategoryName}>{category.name}</span>
                        </div>
                        <div className={styles.resourceCategoryStats}>
                            <span className={styles.resourceCategorySaving}>
                                ${category.costSavings.toLocaleString()}
                            </span>
                            <span className={styles.resourceCategoryPercent}>
                                -{category.savingsPercent}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.resourceRecommendations}>
                <h4>💡 Top Recommendations</h4>
                <div className={styles.recommendationList}>
                    {recommendations.slice(0, 4).map((rec) => (
                        <div
                            key={rec.id}
                            className={`${styles.recommendationItem} ${styles[rec.impact.toLowerCase()]}`}
                            onClick={() => onRecommendationClick?.(rec)}
                            style={{ cursor: onRecommendationClick ? 'pointer' : 'default' }}
                        >
                            <span className={styles.recommendationIcon}>
                                {rec.impact === 'HIGH' ? '🔥' : rec.impact === 'MEDIUM' ? '⚡' : '💡'}
                            </span>
                            <div className={styles.recommendationContent}>
                                <h5>{rec.title}</h5>
                                <p>{rec.description}</p>
                                <span className={styles.recommendationSavings}>
                                    Save ${rec.estimatedSavings.toLocaleString()}/year
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
