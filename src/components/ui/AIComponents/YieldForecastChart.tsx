'use client';

import React, { useState } from 'react';
import styles from './AIComponents.module.css';

interface CropYield {
    cropType: string;
    predictedYield: number;
    unit: string;
    trend: 'up' | 'stable' | 'down';
    icon: string;
}

interface WeeklyYield {
    week: string;
    yield: number;
}

interface YieldForecastChartProps {
    totalYield: number;
    yieldUnit: string;
    confidence: number;
    byCrop: CropYield[];
    byWeek: WeeklyYield[];
    period?: '7d' | '14d' | '30d';
    onPeriodChange?: (period: '7d' | '14d' | '30d') => void;
}

const getCropIcon = (cropType: string): string => {
    const icons: Record<string, string> = {
        'Arugula': '🥬',
        'Basil': '🌿',
        'Kale': '🥗',
        'Pea Shoots': '🌱',
        'Sunflower': '🌻',
        'Radish': '🌶️',
        'Cilantro': '🌾',
        'Mustard': '🍃'
    };
    return icons[cropType] || '🌱';
};

export function YieldForecastChart({
    totalYield,
    yieldUnit,
    confidence,
    byCrop,
    byWeek,
    period = '14d',
    onPeriodChange
}: YieldForecastChartProps) {
    const [selectedPeriod, setSelectedPeriod] = useState(period);
    const maxYield = Math.max(...byWeek.map(w => w.yield), 1);

    const handlePeriodChange = (newPeriod: '7d' | '14d' | '30d') => {
        setSelectedPeriod(newPeriod);
        onPeriodChange?.(newPeriod);
    };

    return (
        <div className={styles.yieldForecast}>
            <div className={styles.yieldHeader}>
                <h3>📊 Yield Forecast</h3>
                <div className={styles.yieldPeriodSelector}>
                    {(['7d', '14d', '30d'] as const).map(p => (
                        <button
                            key={p}
                            className={`${styles.yieldPeriodBtn} ${selectedPeriod === p ? styles.active : ''}`}
                            onClick={() => handlePeriodChange(p)}
                        >
                            {p === '7d' ? '1 Week' : p === '14d' ? '2 Weeks' : '1 Month'}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.yieldSummary}>
                <div className={styles.yieldSummaryItem}>
                    <div className={styles.yieldSummaryValue}>{totalYield.toLocaleString()}</div>
                    <div className={styles.yieldSummaryLabel}>Total {yieldUnit}</div>
                </div>
                <div className={styles.yieldSummaryItem}>
                    <div className={styles.yieldSummaryValue}>{byCrop.length}</div>
                    <div className={styles.yieldSummaryLabel}>Crop Types</div>
                </div>
                <div className={styles.yieldSummaryItem}>
                    <div className={styles.yieldSummaryValue}>{Math.round(confidence * 100)}%</div>
                    <div className={styles.yieldSummaryLabel}>Confidence</div>
                </div>
            </div>

            <div className={styles.yieldChart}>
                <div className={styles.yieldChartBars}>
                    {byWeek.map((week, index) => (
                        <div
                            key={index}
                            className={styles.yieldChartBar}
                            style={{ height: `${(week.yield / maxYield) * 100}%` }}
                            data-value={`${week.yield} ${yieldUnit}`}
                            title={`${week.week}: ${week.yield} ${yieldUnit}`}
                        />
                    ))}
                </div>
                <div className={styles.yieldChartLabels}>
                    {byWeek.map((week, index) => (
                        <div key={index} className={styles.yieldChartLabel}>
                            {week.week}
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.yieldByCrop}>
                {byCrop.map((crop, index) => (
                    <div key={index} className={styles.yieldCropItem}>
                        <span className={styles.yieldCropIcon}>
                            {crop.icon || getCropIcon(crop.cropType)}
                        </span>
                        <div className={styles.yieldCropInfo}>
                            <div className={styles.yieldCropName}>{crop.cropType}</div>
                            <div className={styles.yieldCropValue}>
                                {crop.predictedYield} {crop.unit}
                            </div>
                        </div>
                        <span className={`${styles.yieldCropTrend} ${styles[crop.trend]}`}>
                            {crop.trend === 'up' ? '↑' : crop.trend === 'down' ? '↓' : '→'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
