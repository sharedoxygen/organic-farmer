import React, { useState, ReactNode } from 'react';
import Card from '../Card/Card';
import { Modal } from '../Modal/Modal';
import Button from '../Button/Button';
import styles from './ExpandableCard.module.css';

export interface CardAction {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
    icon?: string;
    disabled?: boolean;
}

export interface CardMetric {
    label: string;
    value: string | number;
    color?: string;
    icon?: string;
    trend?: 'up' | 'down' | 'neutral';
}

export interface CardStatus {
    label: string;
    color: string;
    variant?: 'solid' | 'outlined' | 'subtle';
}

export interface ExpandableCardProps {
    // Basic card properties
    title: string;
    subtitle?: string;
    description?: string;
    icon?: string;

    // Content areas
    children?: ReactNode;
    detailsContent?: ReactNode;

    // Status and metrics
    status?: CardStatus;
    metrics?: CardMetric[];

    // Actions
    actions?: CardAction[];
    primaryAction?: CardAction;

    // Expansion behavior
    expandable?: boolean;
    expandMode?: 'inline' | 'modal' | 'both';
    defaultExpanded?: boolean;

    // Visual variants
    variant?: 'default' | 'elevated' | 'outlined' | 'compact';
    size?: 'sm' | 'md' | 'lg' | 'xl';

    // States
    loading?: boolean;
    disabled?: boolean;
    selected?: boolean;

    // Callbacks
    onExpand?: (expanded: boolean) => void;
    onSelect?: () => void;
    onClick?: () => void;

    // Styling
    className?: string;
    priority?: 'high' | 'medium' | 'low';
}

export default function ExpandableCard({
    title,
    subtitle,
    description,
    icon,
    children,
    detailsContent,
    status,
    metrics = [],
    actions = [],
    primaryAction,
    expandable = true,
    expandMode = 'inline',
    defaultExpanded = false,
    variant = 'default',
    size = 'md',
    loading = false,
    disabled = false,
    selected = false,
    onExpand,
    onSelect,
    onClick,
    className = '',
    priority = 'medium'
}: ExpandableCardProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [showModal, setShowModal] = useState(false);

    const handleExpand = () => {
        console.log('🔍 ExpandableCard handleExpand called:', { title, expandable, disabled, expandMode, currentExpanded: isExpanded });

        if (!expandable || disabled) {
            console.log('⚠️ ExpandableCard expansion blocked:', { expandable, disabled });
            return;
        }

        if (expandMode === 'modal') {
            console.log('📄 ExpandableCard opening modal for:', title);
            setShowModal(true);
        } else if (expandMode === 'inline') {
            const newExpanded = !isExpanded;
            console.log('📊 ExpandableCard inline expansion:', { title, from: isExpanded, to: newExpanded });
            setIsExpanded(newExpanded);
            onExpand?.(newExpanded);
        } else if (expandMode === 'both') {
            // Default to inline, but actions can trigger modal
            const newExpanded = !isExpanded;
            console.log('🔄 ExpandableCard both mode expansion:', { title, from: isExpanded, to: newExpanded });
            setIsExpanded(newExpanded);
            onExpand?.(newExpanded);
        }
    };

    const handleCardClick = () => {
        console.log('👆 ExpandableCard card clicked:', { title, hasOnClick: !!onClick, hasOnSelect: !!onSelect, expandable });

        if (onClick) {
            onClick();
        } else if (onSelect) {
            onSelect();
        } else if (expandable) {
            handleExpand();
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
    };

    const handleModalAction = () => {
        setShowModal(true);
    };

    const cardClasses = [
        styles.expandableCard,
        styles[variant],
        styles[size],
        expandable ? styles.expandable : '',
        selected ? styles.selected : '',
        disabled ? styles.disabled : '',
        loading ? styles.loading : '',
        priority ? styles[`priority-${priority}`] : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <>
            <Card className={cardClasses} variant={variant}>
                {loading && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.spinner} />
                    </div>
                )}

                <div
                    className={styles.cardHeader}
                    onClick={expandable ? handleCardClick : onClick}
                    role={expandable ? "button" : undefined}
                    tabIndex={expandable ? 0 : undefined}
                    onKeyDown={expandable ? (e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCardClick();
                        }
                    } : undefined}
                    aria-expanded={expandable ? isExpanded : undefined}
                >
                    <div className={styles.headerContent}>
                        {icon && <div className={styles.cardIcon}>{icon}</div>}
                        <div className={styles.titleSection}>
                            <h3 className={styles.cardTitle}>{title}</h3>
                            {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
                            {description && <p className={styles.cardDescription}>{description}</p>}
                        </div>
                    </div>

                    <div className={styles.headerMeta}>
                        {status && (
                            <div
                                className={`${styles.statusBadge} ${styles[status.variant || 'solid']}`}
                                style={{
                                    '--status-color': status.color,
                                    backgroundColor: status.variant === 'solid' ? status.color : 'transparent',
                                    color: status.variant === 'solid' ? 'white' : status.color,
                                    borderColor: status.color
                                } as React.CSSProperties}
                            >
                                {status.label}
                            </div>
                        )}
                        {expandable && (
                            <div className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
                                {expandMode === 'modal' ? '🔍' : '▼'}
                            </div>
                        )}
                    </div>
                </div>

                {metrics.length > 0 && (
                    <div className={styles.metricsSection}>
                        {metrics.map((metric, index) => (
                            <div key={index} className={styles.metric}>
                                <div className={styles.metricHeader}>
                                    {metric.icon && <span className={styles.metricIcon}>{metric.icon}</span>}
                                    <span className={styles.metricLabel}>{metric.label}</span>
                                    {metric.trend && (
                                        <span className={`${styles.trendIcon} ${styles[`trend-${metric.trend}`]}`}>
                                            {metric.trend === 'up' ? '↗️' : metric.trend === 'down' ? '↘️' : '➡️'}
                                        </span>
                                    )}
                                </div>
                                <span
                                    className={styles.metricValue}
                                    style={metric.color ? { color: metric.color } : {}}
                                >
                                    {metric.value}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {children && (
                    <div className={styles.cardContent}>
                        {children}
                    </div>
                )}

                {isExpanded && detailsContent && expandMode !== 'modal' && (
                    <div className={styles.expandedContent}>
                        {detailsContent}
                    </div>
                )}

                {(actions.length > 0 || primaryAction) && (
                    <div className={styles.cardActions}>
                        {primaryAction && (
                            <Button
                                variant={primaryAction.variant || 'primary'}
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    primaryAction.onClick();
                                }}
                                disabled={primaryAction.disabled || disabled}
                                className={styles.primaryAction}
                            >
                                {primaryAction.icon && <span>{primaryAction.icon}</span>}
                                {primaryAction.label}
                            </Button>
                        )}

                        <div className={styles.secondaryActions}>
                            {actions.map((action, index) => (
                                <Button
                                    key={index}
                                    variant={action.variant || 'secondary'}
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        action.onClick();
                                    }}
                                    disabled={action.disabled || disabled}
                                    className={styles.actionButton}
                                >
                                    {action.icon && <span>{action.icon}</span>}
                                    {action.label}
                                </Button>
                            ))}

                            {expandMode === 'both' && detailsContent && (
                                <Button
                                    variant="secondary"
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        handleModalAction();
                                    }}
                                    className={styles.modalTrigger}
                                >
                                    🔍 Details
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Card>

            {showModal && detailsContent && (
                <Modal
                    isOpen={showModal}
                    onClose={handleModalClose}
                    title={title}
                    size="large"
                >
                    <div className={styles.modalContent}>
                        {detailsContent}
                    </div>
                </Modal>
            )}
        </>
    );
} 