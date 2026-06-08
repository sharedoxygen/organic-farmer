'use client';

import styles from './Instrument.module.css';

export interface LinearMeterProps {
    label: string;
    value: number;
    max: number;
    unit?: string;
    status?: 'excellent' | 'good' | 'watch' | 'critical';
    showValue?: boolean;
}

export function LinearMeter({
    label,
    value,
    max,
    unit = '',
    status = 'good',
    showValue = true,
}: LinearMeterProps) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

    return (
        <div className={`${styles.meter} ${styles[status]}`}>
            <div className={styles.meterHeader}>
                <span className={styles.meterLabel}>{label}</span>
                {showValue && (
                    <span className={styles.meterValue}>
                        {value}{unit} / {max}{unit}
                    </span>
                )}
            </div>
            <div className={styles.meterTrack}>
                <div className={styles.meterFill} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}
