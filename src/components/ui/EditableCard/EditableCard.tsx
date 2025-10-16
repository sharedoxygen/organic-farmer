import React, { useState } from 'react';
import { Modal } from '../Modal/Modal';
import styles from './EditableCard.module.css';

interface EditableCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    editContent?: React.ReactNode;
    onSave?: (data: any) => Promise<void> | void;
    onEdit?: () => void;
    className?: string;
    size?: 'small' | 'medium' | 'large';
    status?: {
        color: string;
        label: string;
    };
    metrics?: Array<{
        label: string;
        value: string | number;
        color?: string;
    }>;
    actions?: Array<{
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary' | 'danger';
    }>;
    clickable?: boolean;
    loading?: boolean;
}

export const EditableCard: React.FC<EditableCardProps> = ({
    title,
    subtitle,
    children,
    editContent,
    onSave,
    onEdit,
    className = '',
    size = 'medium',
    status,
    metrics = [],
    actions = [],
    clickable = true,
    loading = false
}) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleCardClick = () => {
        if (clickable && !loading) {
            if (onEdit) {
                onEdit();
            } else if (editContent) {
                setIsEditModalOpen(true);
            }
        }
    };

    const handleSave = async (data?: any) => {
        if (onSave) {
            setIsSaving(true);
            try {
                await onSave(data);
                setIsEditModalOpen(false);
            } catch (error) {
                console.error('Error saving:', error);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const cardClasses = [
        styles.card,
        styles[size],
        clickable ? styles.clickable : '',
        loading ? styles.loading : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <>
            <div className={cardClasses} onClick={handleCardClick}>
                {loading && <div className={styles.loadingOverlay}>
                    <div className={styles.spinner}></div>
                </div>}

                <div className={styles.cardHeader}>
                    <div className={styles.titleSection}>
                        <h3 className={styles.title}>{title}</h3>
                        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    </div>

                    {status && (
                        <div
                            className={styles.statusBadge}
                            style={{ backgroundColor: status.color }}
                        >
                            {status.label}
                        </div>
                    )}
                </div>

                <div className={styles.cardContent}>
                    {children}
                </div>

                {metrics.length > 0 && (
                    <div className={styles.metricsSection}>
                        {metrics.map((metric, index) => (
                            <div key={index} className={styles.metric}>
                                <span className={styles.metricLabel}>{metric.label}:</span>
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

                {(actions.length > 0 || clickable) && (
                    <div className={styles.cardFooter}>
                        {actions.length > 0 ? (
                            <div className={styles.actionButtons}>
                                {actions.map((action, index) => (
                                    <button
                                        key={index}
                                        className={`${styles.actionButton} ${styles[action.variant || 'secondary']}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            action.onClick();
                                        }}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        ) : clickable && (
                            <div className={styles.clickHint}>
                                Click to edit →
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editContent && (
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title={`Edit ${title}`}
                    subtitle={subtitle}
                    size="large"
                    actions={
                        <div className={styles.modalActions}>
                            <button
                                className={styles.cancelButton}
                                onClick={() => setIsEditModalOpen(false)}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.saveButton}
                                onClick={() => handleSave()}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    }
                >
                    {editContent}
                </Modal>
            )}
        </>
    );
}; 