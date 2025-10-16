// Help System Types

export interface HelpContent {
    id: string;
    title: string;
    content: string;
    category: HelpCategory;
    tags: string[];
    relatedTopics?: string[];
    videoUrl?: string;
    lastUpdated: Date;
}

export interface HelpTooltip {
    id: string;
    targetElement: string; // CSS selector or component name
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

export interface HelpTutorial {
    id: string;
    title: string;
    description: string;
    steps: TutorialStep[];
    targetRole?: string[];
    completed?: boolean;
    progress?: number;
}

export interface TutorialStep {
    id: string;
    title: string;
    content: string;
    target?: string; // CSS selector for highlighting
    action?: 'click' | 'hover' | 'input' | 'navigate';
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    skipable?: boolean;
}

export interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: HelpCategory;
    helpful?: number;
    notHelpful?: number;
    relatedFAQs?: string[];
}

export interface KeyboardShortcut {
    id: string;
    keys: string[];
    description: string;
    category: string;
    global?: boolean;
    context?: string; // Page or component context
}

export type HelpCategory =
    | 'getting-started'
    | 'production'
    | 'inventory'
    | 'sales'
    | 'quality'
    | 'analytics'
    | 'settings'
    | 'troubleshooting'
    | 'admin';

export interface HelpSearchResult {
    type: 'content' | 'faq' | 'tutorial' | 'shortcut';
    item: HelpContent | FAQ | HelpTutorial | KeyboardShortcut;
    score: number;
    highlights?: string[];
}

export interface HelpContextType {
    // State
    isHelpOpen: boolean;
    activeCategory: HelpCategory | null;
    searchQuery: string;
    currentTutorial: HelpTutorial | null;
    tutorialStep: number;
    helpHistory: string[];

    // Actions
    openHelp: (category?: HelpCategory) => void;
    closeHelp: () => void;
    searchHelp: (query: string) => Promise<HelpSearchResult[]>;
    startTutorial: (tutorialId: string) => void;
    nextTutorialStep: () => void;
    previousTutorialStep: () => void;
    completeTutorial: () => void;
    skipTutorial: () => void;

    // Content access
    getContextualHelp: (pageRoute: string) => HelpContent[];
    getTooltip: (elementId: string) => HelpTooltip | null;
    getFAQs: (category?: HelpCategory) => FAQ[];
    getShortcuts: (context?: string) => KeyboardShortcut[];

    // Feedback
    markHelpful: (contentId: string, helpful: boolean) => void;
    submitFeedback: (contentId: string, feedback: string) => void;
}

export interface HelpAnalytics {
    contentId: string;
    views: number;
    helpfulCount: number;
    notHelpfulCount: number;
    averageTimeSpent: number;
    lastViewed: Date;
} 