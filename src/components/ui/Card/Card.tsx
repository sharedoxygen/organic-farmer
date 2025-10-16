import { ReactNode, HTMLAttributes } from 'react';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    actions?: ReactNode;
    variant?: 'default' | 'elevated' | 'outlined' | 'compact';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    children: ReactNode;
}

export default function Card({
    title,
    subtitle,
    actions,
    variant = 'default',
    padding = 'md',
    className = '',
    children,
    ...props
}: CardProps) {
    const cardClasses = [
        styles.card,
        styles[variant],
        styles[`padding-${padding}`],
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={cardClasses} {...props}>
            {(title || subtitle || actions) && (
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        {title && <h3 className={styles.title}>{title}</h3>}
                        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    </div>
                    {actions && <div className={styles.actions}>{actions}</div>}
                </div>
            )}
            <div className={styles.content}>{children}</div>
        </div>
    );
} 