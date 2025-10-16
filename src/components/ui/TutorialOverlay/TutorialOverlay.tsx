'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './TutorialOverlay.module.css';
import { useHelp } from '@/components/HelpProvider';

export function TutorialOverlay() {
    const {
        currentTutorial,
        tutorialStep,
        nextTutorialStep,
        previousTutorialStep,
        completeTutorial,
        skipTutorial
    } = useHelp();

    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
    const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);

    const currentStep = currentTutorial?.steps[tutorialStep];

    // Find and highlight target element
    useEffect(() => {
        if (!currentStep?.target) {
            setTargetElement(null);
            return;
        }

        const element = document.querySelector(currentStep.target) as HTMLElement;
        if (element) {
            setTargetElement(element);

            // Scroll element into view
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Add highlight class
            element.classList.add(styles.tutorialHighlight);

            // Calculate tooltip position
            const rect = element.getBoundingClientRect();
            const position = calculateTooltipPosition(rect, currentStep.position || 'bottom');
            setOverlayPosition(position);

            return () => {
                element.classList.remove(styles.tutorialHighlight);
            };
        }
    }, [currentStep]);

    const calculateTooltipPosition = (
        targetRect: DOMRect,
        position: string
    ): { top: number; left: number } => {
        const tooltipWidth = 320;
        const tooltipHeight = 200; // Approximate
        const offset = 10;

        let top = 0;
        let left = 0;

        switch (position) {
            case 'top':
                top = targetRect.top - tooltipHeight - offset;
                left = targetRect.left + (targetRect.width - tooltipWidth) / 2;
                break;
            case 'bottom':
                top = targetRect.bottom + offset;
                left = targetRect.left + (targetRect.width - tooltipWidth) / 2;
                break;
            case 'left':
                top = targetRect.top + (targetRect.height - tooltipHeight) / 2;
                left = targetRect.left - tooltipWidth - offset;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height - tooltipHeight) / 2;
                left = targetRect.right + offset;
                break;
            case 'center':
                top = window.innerHeight / 2 - tooltipHeight / 2;
                left = window.innerWidth / 2 - tooltipWidth / 2;
                break;
        }

        // Keep tooltip within viewport
        top = Math.max(10, Math.min(top, window.innerHeight - tooltipHeight - 10));
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipWidth - 10));

        return { top, left };
    };

    if (!currentTutorial || !currentStep) return null;

    const progress = ((tutorialStep + 1) / currentTutorial.steps.length) * 100;
    const isLastStep = tutorialStep === currentTutorial.steps.length - 1;

    return (
        <>
            {/* Dark overlay */}
            <div className={styles.overlay} onClick={skipTutorial}>
                {/* Spotlight hole for target element */}
                {targetElement && (
                    <div
                        className={styles.spotlight}
                        style={{
                            top: targetElement.getBoundingClientRect().top - 5,
                            left: targetElement.getBoundingClientRect().left - 5,
                            width: targetElement.getBoundingClientRect().width + 10,
                            height: targetElement.getBoundingClientRect().height + 10,
                        }}
                    />
                )}
            </div>

            {/* Tutorial tooltip */}
            <div
                ref={tooltipRef}
                className={styles.tooltip}
                style={{
                    top: overlayPosition.top,
                    left: overlayPosition.left,
                }}
            >
                <div className={styles.header}>
                    <h3>{currentStep.title}</h3>
                    <button
                        className={styles.closeButton}
                        onClick={skipTutorial}
                        aria-label="Close tutorial"
                    >
                        ×
                    </button>
                </div>

                <div className={styles.content}>
                    <p>{currentStep.content}</p>
                    {currentStep.action && (
                        <p className={styles.action}>
                            Action: {currentStep.action === 'click' ? 'Click' :
                                currentStep.action === 'hover' ? 'Hover over' :
                                    currentStep.action === 'input' ? 'Type in' :
                                        'Navigate to'} the highlighted element
                        </p>
                    )}
                </div>

                <div className={styles.progress}>
                    <div
                        className={styles.progressBar}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className={styles.footer}>
                    <div className={styles.stepInfo}>
                        Step {tutorialStep + 1} of {currentTutorial.steps.length}
                    </div>
                    <div className={styles.actions}>
                        {currentStep.skipable && (
                            <button
                                className={styles.skipButton}
                                onClick={skipTutorial}
                            >
                                Skip Tutorial
                            </button>
                        )}
                        <button
                            className={styles.prevButton}
                            onClick={previousTutorialStep}
                            disabled={tutorialStep === 0}
                        >
                            Previous
                        </button>
                        <button
                            className={styles.nextButton}
                            onClick={isLastStep ? completeTutorial : nextTutorialStep}
                        >
                            {isLastStep ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
} 