'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useTenant } from '@/components/TenantProvider';

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
    created_at: string;
    created_by_user: {
        firstName: string;
        lastName: string;
        email: string;
    };
}

interface FeedbackContextType {
    feedback: FeedbackSubmission[];
    loading: boolean;
    error: string | null;
    refreshFeedback: () => Promise<void>;
    addFeedback: (newFeedback: FeedbackSubmission) => void;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { currentFarm } = useTenant();
    const [feedback, setFeedback] = useState<FeedbackSubmission[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshFeedback = useCallback(async () => {
        if (!user?.id || !currentFarm?.id) {
            setFeedback([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('🔄 Refreshing feedback data...');

            // Fetch only feedback submitted by the current user
            const response = await fetch("/api/feedback?my=true", {
                headers: {
                    Authorization: `Bearer ${user.id}`,
                    'X-Farm-ID': currentFarm.id
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                console.log('✅ Feedback refreshed:', data.data.length, 'items');
                console.log('📄 Latest feedback items:', data.data.map(f => f.title));
                setFeedback(data.data);
            } else {
                throw new Error(data.error || "Failed to load feedback");
            }
        } catch (err) {
            console.error('❌ Error refreshing feedback:', err);
            setError(err instanceof Error ? err.message : "Failed to load feedback");
        } finally {
            setLoading(false);
        }
    }, [user?.id, currentFarm?.id]);

    const addFeedback = useCallback((newFeedback: FeedbackSubmission) => {
        console.log('➕ Adding feedback to context:', newFeedback.title);
        setFeedback(prev => [newFeedback, ...prev]);
    }, []);

    const contextValue: FeedbackContextType = {
        feedback,
        loading,
        error,
        refreshFeedback,
        addFeedback,
    };

    return (
        <FeedbackContext.Provider value={contextValue}>
            {children}
        </FeedbackContext.Provider>
    );
}

export function useFeedback() {
    const context = useContext(FeedbackContext);
    if (!context) {
        console.error('❌ useFeedback called outside of FeedbackProvider');
        throw new Error('useFeedback must be used within a FeedbackProvider');
    }
    return context;
}
