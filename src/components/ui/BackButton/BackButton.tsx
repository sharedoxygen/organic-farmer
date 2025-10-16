'use client';

import { useRouter } from 'next/navigation';
import styles from './BackButton.module.css';

interface BackButtonProps {
    label?: string;
    fallbackPath?: string;
    className?: string;
}

/**
 * BackButton Component
 * 
 * Provides navigation back to the previous page or a fallback path.
 * 
 * @author Shared Oxygen, LLC
 * @copyright 2025 Shared Oxygen, LLC. All rights reserved.
 */
export default function BackButton({ 
    label = 'Back', 
    fallbackPath = '/dashboard',
    className = ''
}: BackButtonProps) {
    const router = useRouter();

    const handleBack = () => {
        // Check if there's history to go back to
        if (window.history.length > 1) {
            router.back();
        } else {
            // Fallback to dashboard if no history
            router.push(fallbackPath);
        }
    };

    return (
        <button 
            onClick={handleBack}
            className={`${styles.backButton} ${className}`}
            aria-label="Go back"
        >
            <span className={styles.icon}>←</span>
            <span className={styles.label}>{label}</span>
        </button>
    );
}
