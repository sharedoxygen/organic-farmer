'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './Tooltip.module.css';

interface TooltipProps {
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    children: React.ReactNode;
    className?: string;
}

export function Tooltip({
    content,
    position = 'top',
    delay = 300,
    children,
    className
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const showTooltip = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
            calculatePosition();
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsVisible(false);
    };

    const calculatePosition = useCallback(() => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const offset = 8;

        let top = 0;
        let left = 0;

        switch (position) {
            case 'top':
                top = triggerRect.top - tooltipRect.height - offset;
                left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = triggerRect.bottom + offset;
                left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
                left = triggerRect.left - tooltipRect.width - offset;
                break;
            case 'right':
                top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
                left = triggerRect.right + offset;
                break;
        }

        // Keep tooltip within viewport
        const viewportPadding = 10;
        top = Math.max(viewportPadding, Math.min(top, window.innerHeight - tooltipRect.height - viewportPadding));
        left = Math.max(viewportPadding, Math.min(left, window.innerWidth - tooltipRect.width - viewportPadding));

        setTooltipPosition({ top, left });
    }, [position]);

    useEffect(() => {
        if (isVisible) {
            calculatePosition();
            window.addEventListener('scroll', calculatePosition);
            window.addEventListener('resize', calculatePosition);

            return () => {
                window.removeEventListener('scroll', calculatePosition);
                window.removeEventListener('resize', calculatePosition);
            };
        }
    }, [isVisible]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            <div
                ref={triggerRef}
                className={className}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
                onFocus={showTooltip}
                onBlur={hideTooltip}
            >
                {children}
            </div>

            {isVisible && (
                <div
                    ref={tooltipRef}
                    className={`${styles.tooltip} ${styles[position]}`}
                    style={{
                        top: `${tooltipPosition.top}px`,
                        left: `${tooltipPosition.left}px`,
                    }}
                    role="tooltip"
                >
                    <div className={styles.content}>{content}</div>
                    <div className={styles.arrow} />
                </div>
            )}
        </>
    );
} 