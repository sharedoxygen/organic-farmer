'use client';

import React from 'react';
import styles from './HelpButton.module.css';
import { useHelp } from '@/components/HelpProvider';
import { HelpCategory } from '@/types/help';

interface HelpButtonProps {
    variant?: 'default' | 'compact' | 'icon';
    category?: HelpCategory;
    className?: string;
}

export function HelpButton({ variant = 'default', category, className }: HelpButtonProps) {
    const { openHelp } = useHelp();

    const handleClick = () => {
        openHelp(category);
    };

    if (variant === 'icon') {
        return (
            <button
                className={`${styles.iconButton} ${className || ''}`}
                onClick={handleClick}
                aria-label="Open help"
                title="Help (F1)"
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
                    <path
                        d="M7.5 7.5C7.5 6.11929 8.61929 5 10 5C11.3807 5 12.5 6.11929 12.5 7.5C12.5 8.88071 11.3807 10 10 10V11.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <circle cx="10" cy="14.5" r="0.5" fill="currentColor" />
                </svg>
            </button>
        );
    }

    if (variant === 'compact') {
        return (
            <button
                className={`${styles.compactButton} ${className || ''}`}
                onClick={handleClick}
                title="Help (F1)"
            >
                <span className={styles.icon}>?</span>
                <span>Help</span>
            </button>
        );
    }

    return (
        <button
            className={`${styles.helpButton} ${className || ''}`}
            onClick={handleClick}
        >
            <span className={styles.icon}>
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                    <path
                        d="M6 6C6 4.89543 6.89543 4 8 4C9.10457 4 10 4.89543 10 6C10 7.10457 9.10457 8 8 8V9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                    <circle cx="8" cy="11.5" r="0.5" fill="currentColor" />
                </svg>
            </span>
            <span>Help & Support</span>
            <span className={styles.shortcut}>F1</span>
        </button>
    );
} 