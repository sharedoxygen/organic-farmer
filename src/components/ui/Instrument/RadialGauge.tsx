'use client';

import styles from './Instrument.module.css';

export interface RadialGaugeProps {
    label: string;
    value: number;
    max: number;
    unit?: string;
    status?: 'excellent' | 'good' | 'watch' | 'critical';
    icon?: string;
    trend?: number;
    size?: 'sm' | 'md' | 'lg';
}

export function RadialGauge({
    label,
    value,
    max,
    unit = '',
    status = 'good',
    icon,
    trend,
    size = 'md',
}: RadialGaugeProps) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    const radius = size === 'lg' ? 54 : size === 'sm' ? 36 : 46;
    const stroke = size === 'lg' ? 10 : 8;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;
    const dim = (radius + stroke) * 2;

    return (
        <div className={`${styles.gauge} ${styles[status]} ${styles[size]}`}>
            <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
                <circle
                    className={styles.track}
                    cx={radius + stroke}
                    cy={radius + stroke}
                    r={radius}
                    strokeWidth={stroke}
                />
                <circle
                    className={styles.fill}
                    cx={radius + stroke}
                    cy={radius + stroke}
                    r={radius}
                    strokeWidth={stroke}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform={`rotate(-90 ${radius + stroke} ${radius + stroke})`}
                />
            </svg>
            <div className={styles.gaugeCenter}>
                {icon && <span className={styles.gaugeIcon}>{icon}</span>}
                <span className={styles.gaugeValue}>
                    {unit === '%' ? pct : value}
                    {unit && <small>{unit === '%' ? '%' : unit}</small>}
                </span>
                {trend !== undefined && (
                    <span className={styles.gaugeTrend}>
                        {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <div className={styles.gaugeLabel}>{label}</div>
        </div>
    );
}
