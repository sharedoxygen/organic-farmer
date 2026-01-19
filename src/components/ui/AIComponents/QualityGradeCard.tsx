'use client';

import React from 'react';
import styles from './AIComponents.module.css';

interface QualityScores {
    appearance: number;
    color: number;
    size: number;
    uniformity: number;
    freshness: number;
    texture: number;
}

interface Defect {
    type: string;
    severity: 'MINOR' | 'MODERATE' | 'SEVERE';
    description: string;
}

interface MarketChannel {
    channel: string;
    suitability: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
}

interface QualityGradeCardProps {
    batchNumber: string;
    cropType: string;
    overallGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'REJECT';
    confidence: number;
    scores: QualityScores;
    defects: Defect[];
    shelfLifeDays: number;
    marketChannels: MarketChannel[];
    onClick?: () => void;
}

const getGradeClass = (grade: string): string => {
    if (grade === 'A+') return styles.gradeAPlus;
    if (grade === 'A') return styles.gradeA;
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

export function QualityGradeCard({
    batchNumber,
    cropType,
    overallGrade,
    confidence,
    scores,
    defects,
    shelfLifeDays,
    marketChannels,
    onClick
}: QualityGradeCardProps) {
    const scoreItems = [
        { label: 'Appearance', value: scores.appearance },
        { label: 'Color', value: scores.color },
        { label: 'Size', value: scores.size },
        { label: 'Uniformity', value: scores.uniformity },
        { label: 'Freshness', value: scores.freshness },
        { label: 'Texture', value: scores.texture }
    ];

    const topChannels = marketChannels
        .filter(c => c.suitability === 'EXCELLENT' || c.suitability === 'GOOD')
        .slice(0, 3);

    return (
        <div className={styles.qualityCard} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            <div className={styles.qualityHeader}>
                <div className={styles.qualityGrade}>
                    <div className={`${styles.qualityGradeBadge} ${getGradeClass(overallGrade)}`}>
                        {overallGrade}
                    </div>
                    <div className={styles.qualityGradeInfo}>
                        <h4>{batchNumber}</h4>
                        <p>{cropType}</p>
                    </div>
                </div>
                <div className={styles.qualityConfidence}>
                    <div className={styles.qualityConfidenceValue}>{Math.round(confidence * 100)}%</div>
                    <div className={styles.qualityConfidenceLabel}>Confidence</div>
                </div>
            </div>

            <div className={styles.qualityScores}>
                {scoreItems.map((item, index) => {
                    const circumference = 2 * Math.PI * 22;
                    const offset = circumference - (item.value / 100) * circumference;

                    return (
                        <div key={index} className={styles.qualityScoreItem}>
                            <div className={styles.qualityScoreCircle}>
                                <svg width="60" height="60" viewBox="0 0 60 60">
                                    <circle
                                        cx="30"
                                        cy="30"
                                        r="22"
                                        fill="none"
                                        stroke="var(--bg-tertiary)"
                                        strokeWidth="4"
                                    />
                                    <circle
                                        cx="30"
                                        cy="30"
                                        r="22"
                                        fill="none"
                                        stroke={getScoreColor(item.value)}
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={offset}
                                        transform="rotate(-90 30 30)"
                                    />
                                    <text
                                        x="30"
                                        y="34"
                                        textAnchor="middle"
                                        fontSize="12"
                                        fontWeight="600"
                                        fill="var(--text-dark)"
                                    >
                                        {item.value}
                                    </text>
                                </svg>
                            </div>
                            <div className={styles.qualityScoreLabel}>{item.label}</div>
                        </div>
                    );
                })}
            </div>

            {defects.length > 0 && (
                <div className={styles.qualityDefects}>
                    <h5>Defects Detected</h5>
                    <div className={styles.defectList}>
                        {defects.map((defect, index) => (
                            <span
                                key={index}
                                className={`${styles.defectTag} ${styles[defect.severity.toLowerCase()]}`}
                                title={defect.description}
                            >
                                {defect.severity === 'SEVERE' ? '⚠️' : defect.severity === 'MODERATE' ? '⚡' : '•'}
                                {defect.type.replace(/_/g, ' ')}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.qualityFooter}>
                <div className={styles.shelfLife}>
                    <span className={styles.shelfLifeIcon}>📅</span>
                    <div>
                        <div className={styles.shelfLifeValue}>{shelfLifeDays} days</div>
                        <div className={styles.shelfLifeLabel}>Shelf Life</div>
                    </div>
                </div>
                <div className={styles.marketChannels}>
                    {topChannels.map((channel, index) => (
                        <span key={index} className={styles.marketChannel}>
                            {channel.channel}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
