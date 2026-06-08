'use client';

import Link from 'next/link';
import styles from './Instrument.module.css';

export interface FlowStep {
    id: string;
    label: string;
    status: 'complete' | 'active' | 'pending';
    count: number;
    href: string;
}

export function FlowPipeline({ steps }: { steps: FlowStep[] }) {
    return (
        <div className={styles.pipeline}>
            {steps.map((step, i) => (
                <div key={step.id} className={styles.pipelineItem}>
                    <Link href={step.href} className={`${styles.pipelineStep} ${styles[step.status]}`}>
                        <span className={styles.pipelineCount}>{step.count}</span>
                        <span className={styles.pipelineLabel}>{step.label}</span>
                        <span className={styles.pipelineStatus}>{step.status}</span>
                    </Link>
                    {i < steps.length - 1 && <div className={styles.pipelineConnector} />}
                </div>
            ))}
        </div>
    );
}
