'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import {
    HelpContextType,
    HelpCategory,
    HelpContent,
    HelpTooltip,
    FAQ,
    KeyboardShortcut,
    HelpTutorial,
    HelpSearchResult
} from '@/types/help';
import { helpService } from '@/lib/services/helpContent';

const HelpContext = createContext<HelpContextType | undefined>(undefined);

export const useHelp = () => {
    const context = useContext(HelpContext);
    if (!context) {
        throw new Error('useHelp must be used within a HelpProvider');
    }
    return context;
};

interface HelpProviderProps {
    children: React.ReactNode;
}

export function HelpProvider({ children }: HelpProviderProps) {
    const { user } = useAuth();

    // State
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<HelpCategory | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTutorial, setCurrentTutorial] = useState<HelpTutorial | null>(null);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [helpHistory, setHelpHistory] = useState<string[]>([]);
    const [tutorialProgress, setTutorialProgress] = useState<Record<string, boolean>>({});

    // Load tutorial progress from localStorage
    useEffect(() => {
        const savedProgress = localStorage.getItem('ofms-tutorial-progress');
        if (savedProgress) {
            try {
                setTutorialProgress(JSON.parse(savedProgress));
            } catch (e) {
                console.error('Failed to load tutorial progress:', e);
            }
        }
    }, []);

    // Save tutorial progress to localStorage
    const saveTutorialProgress = useCallback((tutorialId: string, completed: boolean) => {
        const newProgress = { ...tutorialProgress, [tutorialId]: completed };
        setTutorialProgress(newProgress);
        localStorage.setItem('ofms-tutorial-progress', JSON.stringify(newProgress));
    }, [tutorialProgress]);

    // Actions
    const openHelp = useCallback((category?: HelpCategory) => {
        setIsHelpOpen(true);
        if (category) {
            setActiveCategory(category);
        }
    }, []);

    const closeHelp = useCallback(() => {
        setIsHelpOpen(false);
        setSearchQuery('');
    }, []);

    const searchHelp = useCallback(async (query: string): Promise<HelpSearchResult[]> => {
        setSearchQuery(query);
        return helpService.searchHelp(query);
    }, []);

    const startTutorial = useCallback((tutorialId: string) => {
        const tutorial = helpService.getTutorial(tutorialId);
        if (tutorial) {
            setCurrentTutorial(tutorial);
            setTutorialStep(0);
            closeHelp();
        }
    }, [closeHelp]);

    const completeTutorial = useCallback(() => {
        if (currentTutorial) {
            saveTutorialProgress(currentTutorial.id, true);
            setCurrentTutorial(null);
            setTutorialStep(0);
        }
    }, [currentTutorial, saveTutorialProgress]);

    const nextTutorialStep = useCallback(() => {
        if (currentTutorial && tutorialStep < currentTutorial.steps.length - 1) {
            setTutorialStep(tutorialStep + 1);
        } else if (currentTutorial) {
            completeTutorial();
        }
    }, [currentTutorial, tutorialStep, completeTutorial]);

    const previousTutorialStep = useCallback(() => {
        if (tutorialStep > 0) {
            setTutorialStep(tutorialStep - 1);
        }
    }, [tutorialStep]);

    const skipTutorial = useCallback(() => {
        setCurrentTutorial(null);
        setTutorialStep(0);
    }, []);

    // Content access
    const getContextualHelp = useCallback((pageRoute: string): HelpContent[] => {
        return helpService.getContextualHelp(pageRoute);
    }, []);

    const getTooltip = useCallback((elementId: string): HelpTooltip | null => {
        return helpService.getTooltip(elementId);
    }, []);

    const getFAQs = useCallback((category?: HelpCategory): FAQ[] => {
        return helpService.getFAQs(category);
    }, []);

    const getShortcuts = useCallback((context?: string): KeyboardShortcut[] => {
        return helpService.getShortcuts(context);
    }, []);

    // Feedback
    const markHelpful = useCallback((contentId: string, helpful: boolean) => {
        // TODO: Implement API call to track helpfulness
        console.log(`Content ${contentId} marked as ${helpful ? 'helpful' : 'not helpful'}`);
    }, []);

    const submitFeedback = useCallback((contentId: string, feedback: string) => {
        // TODO: Implement API call to submit feedback
        console.log(`Feedback for ${contentId}: ${feedback}`);
    }, []);

    // Track help history
    useEffect(() => {
        if (isHelpOpen && activeCategory) {
            setHelpHistory(prev => [...prev.slice(-9), activeCategory]);
        }
    }, [isHelpOpen, activeCategory]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // F1 - Open help
            if (e.key === 'F1') {
                e.preventDefault();
                openHelp();
            }

            // Ctrl+K - Open search (when help is open)
            if (e.ctrlKey && e.key === 'k' && isHelpOpen) {
                e.preventDefault();
                // Focus search input (handled in HelpModal)
            }

            // Escape - Close help or tutorial
            if (e.key === 'Escape') {
                if (currentTutorial) {
                    skipTutorial();
                } else if (isHelpOpen) {
                    closeHelp();
                }
            }

            // Tutorial navigation
            if (currentTutorial) {
                if (e.key === 'ArrowRight') {
                    nextTutorialStep();
                } else if (e.key === 'ArrowLeft') {
                    previousTutorialStep();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isHelpOpen, currentTutorial, openHelp, closeHelp, skipTutorial, nextTutorialStep, previousTutorialStep]);

    // Auto-show onboarding tutorial for new users
    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined') return;

        if (user && !tutorialProgress['onboarding-tutorial']) {
            // Check if this is a new user based on tutorial completion
            const hasCompletedAnyTutorial = Object.values(tutorialProgress).some(completed => completed);
            if (!hasCompletedAnyTutorial) {
                // Delay to let the page load
                setTimeout(() => {
                    // Only show for users with basic roles
                    const userRole = user.role;
                    if (userRole === 'TEAM_MEMBER' || userRole === 'SPECIALIST') {
                        startTutorial('onboarding-tutorial');
                    }
                }, 2000);
            }
        }
    }, [user, tutorialProgress, startTutorial]);

    const value: HelpContextType = {
        // State
        isHelpOpen,
        activeCategory,
        searchQuery,
        currentTutorial,
        tutorialStep,
        helpHistory,

        // Actions
        openHelp,
        closeHelp,
        searchHelp,
        startTutorial,
        nextTutorialStep,
        previousTutorialStep,
        completeTutorial,
        skipTutorial,

        // Content access
        getContextualHelp,
        getTooltip,
        getFAQs,
        getShortcuts,

        // Feedback
        markHelpful,
        submitFeedback
    };

    return (
        <HelpContext.Provider value={value}>
            {children}
        </HelpContext.Provider>
    );
} 