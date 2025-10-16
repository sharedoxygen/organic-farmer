'use client';

import React, { useReducer, useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { feedbackSchema } from '@/lib/validation/feedbackSchema';
import { useTenant } from '@/components/TenantProvider';
import { useAuth } from '@/components/AuthProvider';
import { useFeedback } from '@/context/FeedbackContext';
import styles from './FeedbackModal.module.css';
import { FEEDBACK_TYPES, FEEDBACK_PRIORITIES } from '@/constants/feedback';
import { feedbackReducer, initialState } from './feedbackReducer';
import toast from 'react-hot-toast';
import type { FeedbackFormState } from './feedbackReducer';
import { Button } from '@/components/ui';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmitSuccess?: () => void;
    initialCategory?: string;
    initialUrl?: string;
    initialType?: 'BUG' | 'ENHANCEMENT' | 'GENERAL' | 'SUPPORT' | 'BILLING' | 'SECURITY';
}

export default function FeedbackModal({
    isOpen,
    onClose,
    onSubmitSuccess,
    initialCategory = '',
    initialUrl = '',
    initialType = 'GENERAL'
}: FeedbackModalProps) {
    const { currentFarm } = useTenant();
    const { user } = useAuth();
    const { refreshFeedback } = useFeedback();

    // Simple escape key handler
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const [mounted, setMounted] = useState(false);
    const farmId = currentFarm?.id || null;
    const [state, dispatch] = useReducer(feedbackReducer, initialState(initialCategory, initialType));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const { formData, errors } = state;

    const feedbackTypes = FEEDBACK_TYPES;
    const priorities = FEEDBACK_PRIORITIES;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!farmId || !user) {
            toast.error('Unable to submit feedback. Please ensure you are logged in and have selected a farm.');
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus('idle');
        dispatch({ type: 'CLEAR_ERRORS' });

        try {
            // Validate form data
            const formData = {
                type: state.formData.type,
                title: state.formData.title.trim(),
                description: state.formData.description.trim(),
                priority: state.formData.priority,
                url: initialUrl || window.location.href,
                category: state.formData.category
            };

            const validatedData = feedbackSchema.parse(formData);

            // Submit feedback
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Farm-ID': farmId,
                },
                body: JSON.stringify({
                    ...validatedData,
                    farmId,
                    userId: user.id,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Too many feedback submissions. Please wait a moment before trying again.');
                }
                throw new Error(result.error || 'Failed to submit feedback');
            }

            setSubmitStatus('success');
            toast.success('🎉 Thank you! Your feedback helps us improve OFMS.');

            // Refresh feedback list with small delay to ensure server processing
            console.log('🔄 Refreshing feedback after successful submission...');
            setTimeout(async () => {
                await refreshFeedback();
                console.log('✅ Feedback refresh completed');
            }, 500);

            // Call the success callback if provided
            if (onSubmitSuccess) {
                onSubmitSuccess();
            }

            // Reset form and close modal after a brief delay
            setTimeout(() => {
                dispatch({ type: 'RESET', payload: { initialCategory, initialType } });
                onClose();
                setSubmitStatus('idle');
            }, 2000);

        } catch (error: any) {
            console.error('Feedback submission error:', error);
            setSubmitStatus('error');

            if (error.name === 'ZodError') {
                // Handle validation errors
                const fieldErrors: Record<string, string[] | undefined> = {};
                error.errors.forEach((err: any) => {
                    if (err.path.length > 0) {
                        fieldErrors[err.path[0]] = [err.message];
                    }
                });
                dispatch({ type: 'SET_ERRORS', payload: fieldErrors });
                toast.error('Please fix the highlighted fields below.');
            } else {
                toast.error(error.message || 'Something went wrong. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = useCallback((field: keyof FeedbackFormState['formData'], value: string) => {
        dispatch({ type: 'SET_FIELD', payload: { field, value } });
        if (submitStatus !== 'idle') {
            setSubmitStatus('idle');
        }
    }, [submitStatus]);

    const getDescriptionPlaceholder = (type: string): string => {
        switch (type) {
            case 'BUG':
                return 'Please describe:\n• What you were trying to do\n• What actually happened\n• Steps to reproduce the issue...';
            case 'ENHANCEMENT':
                return 'Please describe the feature you\'d like to see and how it would help you.';
            default:
                return 'Please share your feedback in detail.';
        }
    };

    // Hydration-safe mounting
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            dispatch({ type: 'RESET', payload: { initialCategory, initialType } });
            setSubmitStatus('idle');
        }
    }, [isOpen, initialCategory, initialType]);

    // Don't render until mounted to avoid hydration mismatch
    if (!mounted || !isOpen) {
        return null;
    }

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return ReactDOM.createPortal(
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            <div className={styles.modalContainer}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className={styles.modalHeader}>
                        <div className={styles.headerContent}>
                            <div className={styles.headerIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            <div className={styles.headerText}>
                                <h2 className={styles.title}>Share Your Feedback</h2>
                                <p className={styles.subtitle}>
                                    Help us improve OFMS by sharing your thoughts, reporting issues, or requesting new features.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={styles.closeButton}
                            aria-label="Close feedback modal"
                            type="button"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className={styles.modalBody}>
                        {submitStatus === 'success' ? (
                            <div className={styles.successState}>
                                <div className={styles.successIcon}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                </div>
                                <div className={styles.successContent}>
                                    <h3 className={styles.successTitle}>Thank you for your feedback!</h3>
                                    <p className={styles.successMessage}>Your feedback has been received and will help us improve OFMS.</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className={styles.form}>
                                {/* Feedback Type Selection */}
                                <div className={styles.section}>
                                    <label className={styles.sectionLabel}>What kind of feedback is this?</label>
                                    <div className={styles.typeGrid}>
                                        {feedbackTypes.map((type) => (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => handleChange('type', type.value)}
                                                className={`${styles.typeCard} ${formData.type === type.value ? styles.typeCardSelected : ''}`}
                                            >
                                                <div className={styles.typeIcon}>{type.icon}</div>
                                                <div className={styles.typeLabel}>{type.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                    {errors.type && <p className={styles.errorMessage}>{errors.type[0]}</p>}
                                </div>

                                {/* Title Input */}
                                <div className={styles.section}>
                                    <label htmlFor="feedbackTitle" className={styles.sectionLabel}>
                                        Title <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        id="feedbackTitle"
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleChange('title', e.target.value)}
                                        className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                                        placeholder="A brief, descriptive title"
                                    />
                                    {errors.title && <p className={styles.errorMessage}>{errors.title[0]}</p>}
                                </div>

                                {/* Description Textarea */}
                                <div className={styles.section}>
                                    <label htmlFor="feedbackDescription" className={styles.sectionLabel}>
                                        Description <span className={styles.required}>*</span>
                                    </label>
                                    <textarea
                                        id="feedbackDescription"
                                        value={formData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
                                        placeholder={getDescriptionPlaceholder(formData.type)}
                                        rows={4}
                                    />
                                    {errors.description && <p className={styles.errorMessage}>{errors.description[0]}</p>}
                                </div>

                                {/* Priority Selection */}
                                <div className={styles.section}>
                                    <label className={styles.sectionLabel}>Priority</label>
                                    <div className={styles.priorityGrid}>
                                        {priorities.map((priority) => (
                                            <button
                                                key={priority.value}
                                                type="button"
                                                onClick={() => handleChange('priority', priority.value)}
                                                className={`${styles.priorityButton} ${styles[`priority${priority.value}`]} ${formData.priority === priority.value ? styles.prioritySelected : ''}`}
                                            >
                                                {priority.label}
                                            </button>
                                        ))}
                                    </div>
                                    {errors.priority && <p className={styles.errorMessage}>{errors.priority[0]}</p>}
                                </div>

                                {/* Error State */}
                                {submitStatus === 'error' && (
                                    <div className={styles.errorState}>
                                        <div className={styles.errorIcon}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                                <line x1="9" y1="9" x2="15" y2="15"></line>
                                            </svg>
                                        </div>
                                        <p className={styles.errorText}>Submission failed. Please try again.</p>
                                    </div>
                                )}
                            </form>
                        )}
                    </div>

                    {/* Footer */}
                    {submitStatus !== 'success' && (
                        <div className={styles.modalFooter}>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className={styles.cancelButton}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={isSubmitting}
                                onClick={handleSubmit}
                                className={styles.submitButton}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className={styles.spinner}></span>
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Feedback'
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}