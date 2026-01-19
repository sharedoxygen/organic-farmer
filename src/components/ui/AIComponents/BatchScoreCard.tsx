'use client';

import React from 'react';
import styles from './AIComponents.module.css';

interface BatchScore {
    batchId: string;
    batchNumber: string;
    cropType: string;
    overallScore: number;
    healthScore: number;
    growthScore: number;
    environmentScore: number;
    riskScore: number;
    qualityPrediction: 'A+' | 'A' | 'B' | 'C' | 'D';
    trend: 'improving' | 'stable' | 'declining';
}

interface BatchScoreCardProps {
    score: BatchScore;
    onClick?: () => void;
}

const getGradeClass = (grade: string): string => {
    if (grade === 'A+' || grade === 'A') return styles.gradeA;
    if (grade === 'B') return styles.gradeB;
    if (grade === 'C') return styles.gradeC;
    return styles.gradeD;
};

const getScoreColor = (score: number): string => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 55) return '#f59e0b';
    return '#ef4444';
};

const getScoreClass = (score: number): string => {
    if (score >= 85) return styles.excellent;
    if (score >= 70) return styles.good;
    if (score >= 55) return styles.fair;
    return styles.poor;
};

const getTrendIcon = (trend: string): string => {
    if (trend === 'improving') return '📈';
    if (trend === 'declining') return '📉';
    return '➡️';
};

export function BatchScoreCard({ score, onClick }: BatchScoreCardProps) {
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (score.overallScore / 100) * circumference;

    const metrics = [
        { label: 'Health', value: score.healthScore, color: getScoreColor(score.healthScore) },
        { label: 'Growth', value: score.growthScore, color: getScoreColor(score.growthScore) },
        { label: 'Environment', value: score.environmentScore, color: getScoreColor(score.environmentScore) },
        { label: 'Risk Level', value: 100 - score.riskScore, color: getScoreColor(100 - score.riskScore) }
    ];

    return (
        <div className={styles.batchScoreCard} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            <div className={styles.batchScoreHeader}>
                <div className={styles.batchInfo}>
                    <h4>{score.batchNumber}</h4>
                    <p>{score.cropType}</p>
                </div>
                <div className={`${styles.batchGrade} ${getGradeClass(score.qualityPrediction)}`}>
                    {score.qualityPrediction}
                </div>
            </div>

            <div className={styles.scoreCircle}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle
                        className={styles.scoreCircleBg}
                        cx="60"
                        cy="60"
                        r="45"
                    />
                    <circle
                        className={`${styles.scoreCircleProgress} ${getScoreClass(score.overallScore)}`}
                        cx="60"
                        cy="60"
                        r="45"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                    />
                </svg>
                <div className={styles.scoreValue}>
                    <div className={styles.scoreNumber}>{score.overallScore}</div>
                    <div className={styles.scoreLabel}>Overall</div>
                </div>
            </div>

            <div className={styles.scoreMetrics}>
                {metrics.map((metric, index) => (
                    <div key={index} className={styles.scoreMetric}>
                        <div className={styles.scoreMetricLabel}>{metric.label}</div>
                        <div className={styles.scoreMetricValue}>{metric.value}%</div>
                        <div className={styles.scoreMetricBar}>
                            <div
                                className={styles.scoreMetricBarFill}
                                style={{
                                    width: `${metric.value}%`,
                                    backgroundColor: metric.color
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className={`${styles.scoreTrend} ${styles[score.trend]}`}>
                <span>{getTrendIcon(score.trend)}</span>
                <span style={{ textTransform: 'capitalize' }}>{score.trend}</span>
            </div>
        </div>
    );
}
