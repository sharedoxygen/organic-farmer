'use client';

import styles from './Skeleton.module.css';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    animation?: 'pulse' | 'wave' | 'none';
    className?: string;
}

export function Skeleton({
    width,
    height,
    variant = 'text',
    animation = 'pulse',
    className = '',
}: SkeletonProps) {
    const style: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };

    return (
        <div
            className={`${styles.skeleton} ${styles[variant]} ${styles[animation]} ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
}

// Pre-built skeleton patterns for common use cases
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <div className={styles.tableRow}>
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} variant="text" height={20} />
            ))}
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className={styles.card}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="100%" height={16} />
            <Skeleton variant="text" width="80%" height={16} />
            <div className={styles.cardFooter}>
                <Skeleton variant="rounded" width={80} height={32} />
            </div>
        </div>
    );
}

export function ListItemSkeleton() {
    return (
        <div className={styles.listItem}>
            <Skeleton variant="circular" width={40} height={40} />
            <div className={styles.listContent}>
                <Skeleton variant="text" width="70%" height={18} />
                <Skeleton variant="text" width="50%" height={14} />
            </div>
        </div>
    );
}

export function PageSkeleton() {
    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <Skeleton variant="text" width={200} height={32} />
                <Skeleton variant="rounded" width={120} height={40} />
            </div>
            <div className={styles.pageGrid}>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    );
}

export function FormSkeleton() {
    return (
        <div className={styles.form}>
            <div className={styles.formGroup}>
                <Skeleton variant="text" width={100} height={14} />
                <Skeleton variant="rounded" width="100%" height={40} />
            </div>
            <div className={styles.formGroup}>
                <Skeleton variant="text" width={100} height={14} />
                <Skeleton variant="rounded" width="100%" height={40} />
            </div>
            <div className={styles.formGroup}>
                <Skeleton variant="text" width={100} height={14} />
                <Skeleton variant="rounded" width="100%" height={100} />
            </div>
            <div className={styles.formActions}>
                <Skeleton variant="rounded" width={100} height={40} />
                <Skeleton variant="rounded" width={100} height={40} />
            </div>
        </div>
    );
}
