"use client";

import { useEffect } from "react";
import { Card, Button } from "@/components/ui";
import FeedbackButton from "@/components/ui/FeedbackButton/FeedbackButton";
import { useFeedback } from "@/context/FeedbackContext";
import styles from "./page.module.css";
import { useAuth } from "@/components/AuthProvider";
import { useTenant } from "@/components/TenantProvider";

interface FeedbackSubmission {
    id: string;
    title: string;
    type: string;
    status: string;
    priority: string;
    description: string;
    created_at: string;
    farm?: { farm_name: string };
    responses: FeedbackResponse[];
    _count: { responses: number };
}

interface FeedbackResponse {
    id: string;
    message: string;
    is_internal: boolean;
    created_at: string;
    admin: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export default function MyFeedbackPage() {
    const { user } = useAuth();
    const { currentFarm } = useTenant();
    const { feedback, loading, error, refreshFeedback } = useFeedback();

    useEffect(() => {
        // Load feedback when page mounts or context changes
        console.log('📱 Feedback page: Loading feedback for user/farm change');
        refreshFeedback();
    }, [user, currentFarm, refreshFeedback]);

    // Debug: Log when feedback changes
    useEffect(() => {
        console.log('📋 Feedback page: Feedback list updated, count:', feedback.length);
        if (feedback.length > 0) {
            console.log('📋 Current feedback titles:', feedback.map(f => f.title));
        }
    }, [feedback]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div>
                        <h1 className={styles.title}>💬 My Feedback</h1>
                        <p className={styles.subtitle}>
                            View and track your feedback submissions and responses from the OFMS team.
                        </p>
                    </div>
                    <div className={styles.headerActions}>
                        <Button
                            variant="outline"
                            size="md"
                            onClick={() => {
                                console.log('🔄 Manual refresh triggered');
                                refreshFeedback();
                            }}
                        >
                            🔄 Refresh
                        </Button>
                        <FeedbackButton variant="primary">+ Submit Feedback</FeedbackButton>
                    </div>
                </div>
            </div>
            {loading ? (
                <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Loading your feedback...</p>
                </div>
            ) : error ? (
                <div className={styles.errorState}>
                    <h2>⚠️ Error</h2>
                    <p>{error}</p>
                </div>
            ) : feedback.length === 0 ? (
                <Card className={styles.emptyState}>
                    <div className={styles.emptyContent}>
                        <h3>📝 No Feedback Submitted</h3>
                        <p>You haven’t submitted any feedback yet.</p>
                    </div>
                </Card>
            ) : (
                <div className={styles.feedbackGrid}>
                    {feedback.map((item) => (
                        <Card key={item.id} className={styles.feedbackCard}>
                            <div className={styles.feedbackHeader}>
                                <div className={styles.feedbackMeta}>
                                    <div className={styles.feedbackType}>{item.type}</div>
                                    <div className={styles.feedbackStatus}>{item.status}</div>
                                    <div className={styles.feedbackPriority}>{item.priority}</div>
                                    {item.farm && (
                                        <div className={styles.feedbackFarm}>
                                            <span className={styles.farmLabel}>Farm:</span>
                                            <span className={styles.farmName}>{item.farm.farm_name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={styles.feedbackContent}>
                                <h3 className={styles.feedbackTitle}>{item.title}</h3>
                                <p className={styles.feedbackDescription}>{item.description}</p>
                                <div className={styles.feedbackDetails}>
                                    <div className={styles.feedbackDate}>
                                        <span className={styles.dateLabel}>Submitted:</span>
                                        <span className={styles.dateValue}>{new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className={styles.feedbackResponses}>
                                        <span className={styles.responsesLabel}>Responses:</span>
                                        <span className={styles.responsesCount}>{item._count.responses}</span>
                                    </div>
                                </div>
                                {item.responses.length > 0 && (
                                    <div className={styles.responsesSection}>
                                        <h4>Admin Responses</h4>
                                        {item.responses.map((resp) => (
                                            <div key={resp.id} className={styles.responseCard}>
                                                <div className={styles.responseHeader}>
                                                    <span className={styles.responseAdmin}>{resp.admin.firstName} {resp.admin.lastName}</span>
                                                    <span className={styles.responseDate}>{new Date(resp.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className={styles.responseMessage}>{resp.message}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
} 