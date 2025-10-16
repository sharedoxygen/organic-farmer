'use client';

import { useMemo } from 'react';
import styles from './ForecastChart.module.css';

interface ForecastPrediction {
    date: string;
    predictedDemand: number;
    confidence: number;
    priceEstimate: number;
}

interface ForecastChartProps {
    predictions: ForecastPrediction[];
    title: string;
}

export function ForecastChart({ predictions, title }: ForecastChartProps) {
    // Calculate chart data
    const chartData = useMemo(() => {
        if (!predictions || predictions.length === 0) return null;

        const maxDemand = Math.max(...predictions.map(p => p.predictedDemand));
        const minDemand = Math.min(...predictions.map(p => p.predictedDemand));
        const demandRange = maxDemand - minDemand;

        const maxPrice = Math.max(...predictions.map(p => p.priceEstimate));
        const minPrice = Math.min(...predictions.map(p => p.priceEstimate));
        const priceRange = maxPrice - minPrice;

        return predictions.map((prediction, index) => ({
            ...prediction,
            index,
            demandHeight: demandRange > 0 ? ((prediction.predictedDemand - minDemand) / demandRange) * 100 : 50,
            priceHeight: priceRange > 0 ? ((prediction.priceEstimate - minPrice) / priceRange) * 100 : 50,
            x: (index / (predictions.length - 1)) * 100
        }));
    }, [predictions]);

    if (!chartData) {
        return (
            <div className={styles.emptyChart}>
                <p>No forecast data available</p>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <div className={styles.chartContainer}>
            <h4 className={styles.chartTitle}>{title}</h4>

            <div className={styles.chartWrapper}>
                <div className={styles.chart}>
                    {/* Y-axis labels */}
                    <div className={styles.yAxisLabels}>
                        <span className={styles.yLabel} style={{ bottom: '90%' }}>
                            High
                        </span>
                        <span className={styles.yLabel} style={{ bottom: '45%' }}>
                            Med
                        </span>
                        <span className={styles.yLabel} style={{ bottom: '0%' }}>
                            Low
                        </span>
                    </div>

                    {/* Chart area */}
                    <div className={styles.chartArea}>
                        {/* Grid lines */}
                        <div className={styles.gridLines}>
                            {[0, 25, 50, 75, 100].map(y => (
                                <div
                                    key={y}
                                    className={styles.gridLine}
                                    style={{ bottom: `${y}%` }}
                                />
                            ))}
                        </div>

                        {/* Demand line */}
                        <svg className={styles.chartSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
                            <polyline
                                className={styles.demandLine}
                                points={chartData.map(d => `${d.x},${100 - d.demandHeight}`).join(' ')}
                                fill="none"
                                stroke="var(--primary-color)"
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                            />
                        </svg>

                        {/* Data points */}
                        {chartData.map((point, index) => (
                            <div
                                key={index}
                                className={styles.dataPoint}
                                style={{
                                    left: `${point.x}%`,
                                    bottom: `${point.demandHeight}%`,
                                    opacity: point.confidence
                                }}
                                title={`${formatDate(point.date)}: ${point.predictedDemand} units, ${formatCurrency(point.priceEstimate)}`}
                            >
                                <div className={styles.pointDot} />
                                <div className={styles.pointTooltip}>
                                    <div className={styles.tooltipDate}>
                                        {formatDate(point.date)}
                                    </div>
                                    <div className={styles.tooltipDemand}>
                                        {point.predictedDemand} units
                                    </div>
                                    <div className={styles.tooltipPrice}>
                                        {formatCurrency(point.priceEstimate)}
                                    </div>
                                    <div className={styles.tooltipConfidence}>
                                        {(point.confidence * 100).toFixed(0)}% confidence
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* X-axis labels */}
                    <div className={styles.xAxisLabels}>
                        {chartData.filter((_, index) => index % Math.ceil(chartData.length / 5) === 0).map((point, index) => (
                            <span
                                key={index}
                                className={styles.xLabel}
                                style={{ left: `${point.x}%` }}
                            >
                                {formatDate(point.date)}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className={styles.chartLegend}>
                <div className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ backgroundColor: 'var(--primary-color)' }} />
                    <span>Predicted Demand</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendColor} style={{ backgroundColor: 'var(--info-color)' }} />
                    <span>Confidence Level</span>
                </div>
            </div>

            {/* Summary Stats */}
            <div className={styles.chartSummary}>
                <div className={styles.summaryItem}>
                    <div className={styles.summaryLabel}>Total Demand</div>
                    <div className={styles.summaryValue}>
                        {chartData.reduce((sum, p) => sum + p.predictedDemand, 0).toLocaleString()} units
                    </div>
                </div>
                <div className={styles.summaryItem}>
                    <div className={styles.summaryLabel}>Avg. Price</div>
                    <div className={styles.summaryValue}>
                        {formatCurrency(chartData.reduce((sum, p) => sum + p.priceEstimate, 0) / chartData.length)}
                    </div>
                </div>
                <div className={styles.summaryItem}>
                    <div className={styles.summaryLabel}>Avg. Confidence</div>
                    <div className={styles.summaryValue}>
                        {(chartData.reduce((sum, p) => sum + p.confidence, 0) / chartData.length * 100).toFixed(1)}%
                    </div>
                </div>
            </div>
        </div>
    );
} 