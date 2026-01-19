'use client';

import React from 'react';
import styles from './AIComponents.module.css';

interface InsightMetric {
    label: string;
    value: string | number;
}

interface AIInsightCardProps {
    icon: string;
    title: string;
    subtitle?: string;
    badge?: string;
    content: string;
    metrics?: InsightMetric[];
    primaryAction?: {
        label: string;
        onClick: () => void;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
}

export function AIInsightCard({
    icon,
    title,
    subtitle,
    badge,
    content,
    metrics,
    primaryAction,
    secondaryAction
}: AIInsightCardProps) {
    return (
        <div className={styles.insightCard}>
            <div className={styles.insightHeader}>
                <div className={styles.insightIcon}>{icon}</div>
                <div className={styles.insightTitle}>
                    <h4>{title}</h4>
                    {subtitle && <p>{subtitle}</p>}
                </div>
                {badge && <span className={styles.insightBadge}>{badge}</span>}
            </div>

            <div className={styles.insightContent}>
                {content}
            </div>

            {metrics && metrics.length > 0 && (
                <div className={styles.insightMetrics}>
                    {metrics.map((metric, index) => (
                        <div key={index} className={styles.insightMetric}>
                            <div className={styles.insightMetricValue}>{metric.value}</div>
                            <div className={styles.insightMetricLabel}>{metric.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {(primaryAction || secondaryAction) && (
                <div className={styles.insightActions}>
                    {primaryAction && (
                        <button
                            className={`${styles.insightAction} ${styles.primary}`}
                            onClick={primaryAction.onClick}
                        >
                            {primaryAction.label}
                        </button>
                    )}
                    {secondaryAction && (
                        <button
                            className={`${styles.insightAction} ${styles.secondary}`}
                            onClick={secondaryAction.onClick}
                        >
                            {secondaryAction.label}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
