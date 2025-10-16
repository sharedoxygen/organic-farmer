'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import FeedbackModal from '@/components/ui/FeedbackModal/FeedbackModal';
import styles from './FeedbackButton.module.css';

interface FeedbackButtonProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    category?: string;
    type?: 'BUG' | 'ENHANCEMENT' | 'GENERAL' | 'SUPPORT' | 'BILLING' | 'SECURITY';
    children?: React.ReactNode;
    className?: string;
    icon?: boolean;
    floating?: boolean;
}

export default function FeedbackButton({
    variant = 'primary',
    size = 'md',
    category = '',
    type = 'GENERAL',
    children,
    className = '',
    icon = true,
    floating = false
}: FeedbackButtonProps) {
    const [showModal, setShowModal] = useState(false);

    const handleClick = () => {
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
    };

    const handleSubmitSuccess = () => {
        setShowModal(false);
    };

    const defaultContent = floating ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ) : (
        <>
            {icon && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            )}
            <span>Share Feedback</span>
        </>
    );

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={handleClick}
                className={`${styles.feedbackButton} ${floating ? styles.floating : ''} ${className}`}
                aria-label={floating ? 'Share feedback' : undefined}
            >
                {children || defaultContent}
            </Button>

            <FeedbackModal
                isOpen={showModal}
                onClose={handleClose}
                onSubmitSuccess={handleSubmitSuccess}
                initialCategory={category}
                initialType={type}
                initialUrl={typeof window !== 'undefined' ? window.location.href : ''}
            />
        </>
    );
} 