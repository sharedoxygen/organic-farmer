import React from 'react';
import styles from './Modal.module.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    size?: 'small' | 'medium' | 'large' | 'fullscreen';
    actions?: React.ReactNode;
    closeOnOverlayClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    size = 'medium',
    actions,
    closeOnOverlayClick = true
}) => {
    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={`${styles.modal} ${styles[size]}`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <h2 className={styles.title}>{title}</h2>
                        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    </div>
                    <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
                        ×
                    </button>
                </div>

                <div className={styles.content}>
                    {children}
                </div>

                {actions && (
                    <div className={styles.actions}>
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}; 