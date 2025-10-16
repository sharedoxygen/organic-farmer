'use client';

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Button } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';
import { emitFeedbackResponseCreated } from '@/lib/events/dataEvents';
import toast from 'react-hot-toast';
import styles from './FeedbackResponseModal.module.css';

interface FeedbackSubmission {
    id: string;
    title: string;
    type: string;
    description: string;
    user: {
        firstName: string;
        lastName: string;
        email: string;
    };
}

interface FeedbackResponseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResponseSubmitted: () => void;
    feedback: FeedbackSubmission;
}

export default function FeedbackResponseModal({
    isOpen,
    onClose,
    onResponseSubmitted,
    feedback
}: FeedbackResponseModalProps) {
    const { user } = useAuth();
    const { currentFarm } = useTenant();
    const [message, setMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);

    const isGlobalAdmin = isSystemAdmin(user);

    React.useEffect(() => {
        setMounted(true);
        if (isOpen) {
            setMessage('');
            setIsInternal(false);
        }
    }, [isOpen]);

    React.useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!mounted || !isOpen) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim()) {
            toast.error('Please enter a response message.');
            return;
        }

        if (!user || (!currentFarm && !isGlobalAdmin)) {
            toast.error('Unable to submit response. Please check your authentication.');
            return;
        }

        setIsSubmitting(true);

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            if (isGlobalAdmin) {
                headers['X-Global-Admin'] = 'true';
            } else if (currentFarm) {
                headers['X-Farm-ID'] = currentFarm.id;
            }

            const response = await fetch(`/api/feedback/${feedback.id}/responses`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    message: message.trim(),
                    is_internal: isInternal,
                    adminId: user.id
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit response');
            }

            toast.success('Response submitted successfully!');

            // Emit event for auto-refresh
            emitFeedbackResponseCreated(feedback.id, result);

            onResponseSubmitted();
            onClose();
        } catch (error: any) {
            console.error('Error submitting response:', error);
            toast.error(error.message || 'Failed to submit response. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                </svg>
                            </div>
                            <div className={styles.headerText}>
                                <h2 className={styles.title}>Respond to Feedback</h2>
                                <p className={styles.subtitle}>
                                    Responding to "{feedback.title}" from {feedback.user.firstName} {feedback.user.lastName}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={styles.closeButton}
                            aria-label="Close response modal"
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
                        {/* Original Feedback Context */}
                        <div className={styles.feedbackContext}>
                            <h4 className={styles.contextTitle}>Original Feedback:</h4>
                            <div className={styles.contextContent}>
                                <div className={styles.contextMeta}>
                                    <span className={styles.contextType}>{feedback.type}</span>
                                    <span className={styles.contextUser}>
                                        {feedback.user.firstName} {feedback.user.lastName} ({feedback.user.email})
                                    </span>
                                </div>
                                <p className={styles.contextDescription}>{feedback.description}</p>
                            </div>
                        </div>

                        {/* Response Form */}
                        <form onSubmit={handleSubmit} className={styles.responseForm}>
                            <div className={styles.formSection}>
                                <label htmlFor="responseMessage" className={styles.formLabel}>
                                    Your Response <span className={styles.required}>*</span>
                                </label>
                                <textarea
                                    id="responseMessage"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className={styles.messageTextarea}
                                    placeholder="Type your response to the user..."
                                    rows={6}
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>

                            <div className={styles.formSection}>
                                <div className={styles.checkboxContainer}>
                                    <input
                                        type="checkbox"
                                        id="internalNote"
                                        checked={isInternal}
                                        onChange={(e) => setIsInternal(e.target.checked)}
                                        className={styles.checkbox}
                                        disabled={isSubmitting}
                                    />
                                    <label htmlFor="internalNote" className={styles.checkboxLabel}>
                                        Internal note (not visible to user)
                                    </label>
                                </div>
                                <p className={styles.checkboxHint}>
                                    Check this if the response is for internal documentation only and should not be sent to the user.
                                </p>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
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
                            onClick={handleSubmit}
                            disabled={isSubmitting || !message.trim()}
                            className={styles.submitButton}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className={styles.spinner}></span>
                                    Submitting...
                                </>
                            ) : (
                                `Submit ${isInternal ? 'Internal Note' : 'Response'}`
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}