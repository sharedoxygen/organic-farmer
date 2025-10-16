import {
    HelpContent,
    HelpTooltip,
    HelpTutorial,
    FAQ,
    KeyboardShortcut,
    HelpCategory,
    HelpSearchResult
} from '@/types/help';

// Help Content Database
const helpContents: HelpContent[] = [
    // Getting Started
    {
        id: 'getting-started-overview',
        title: 'Welcome to OFMS',
        content: 'The Organic Farm Management System (OFMS) is a comprehensive platform for managing all aspects of your organic farming operations. From seed to sale, OFMS helps you track production, manage inventory, ensure quality compliance, and analyze your business performance.',
        category: 'getting-started',
        tags: ['overview', 'introduction', 'welcome'],
        relatedTopics: ['getting-started-navigation', 'getting-started-roles'],
        lastUpdated: new Date('2024-01-01')
    },
    {
        id: 'getting-started-navigation',
        title: 'Navigating OFMS',
        content: 'Use the sidebar menu to access different modules. The header shows your current farm context and user information. You can switch between farms using the farm selector in the header if you have access to multiple farms.',
        category: 'getting-started',
        tags: ['navigation', 'sidebar', 'menu'],
        relatedTopics: ['getting-started-overview'],
        lastUpdated: new Date('2024-01-01')
    },
    {
        id: 'getting-started-roles',
        title: 'Understanding User Roles',
        content: 'OFMS uses a role-based access system. Roles include: ADMIN (full system access), MANAGER (operational management), TEAM_LEAD (production supervision), SPECIALIST_LEAD (specialized area management), TEAM_MEMBER (day-to-day operations), and SPECIALIST (focused tasks).',
        category: 'getting-started',
        tags: ['roles', 'permissions', 'access'],
        relatedTopics: ['admin-user-management'],
        lastUpdated: new Date('2024-01-01')
    },

    // Production
    {
        id: 'production-batch-management',
        title: 'Managing Production Batches',
        content: 'Create and track production batches from seeding to harvest. Each batch includes variety information, growing location, environmental conditions, and progress tracking. Use the batch dashboard to monitor all active batches.',
        category: 'production',
        tags: ['batches', 'production', 'growing'],
        relatedTopics: ['production-seed-management', 'production-harvesting'],
        videoUrl: '/tutorials/batch-management.mp4',
        lastUpdated: new Date('2024-01-01')
    },
    {
        id: 'production-seed-management',
        title: 'Seed Inventory Management',
        content: 'Track seed varieties, suppliers, organic certifications, and inventory levels. Set reorder points to ensure you never run out of critical varieties. Monitor seed usage across batches for accurate costing.',
        category: 'production',
        tags: ['seeds', 'inventory', 'varieties'],
        relatedTopics: ['production-batch-management', 'inventory-supplies'],
        lastUpdated: new Date('2024-01-01')
    },
    {
        id: 'production-harvesting',
        title: 'Harvest Planning and Execution',
        content: 'Schedule harvests based on crop maturity and customer orders. Record actual yields, quality grades, and post-harvest handling. Track harvest efficiency metrics to optimize operations.',
        category: 'production',
        tags: ['harvest', 'yield', 'scheduling'],
        relatedTopics: ['production-batch-management', 'quality-control'],
        lastUpdated: new Date('2024-01-01')
    },

    // Inventory
    {
        id: 'inventory-overview',
        title: 'Inventory Management Overview',
        content: 'Manage inventory across four categories: Seeds, Supplies, Packaging, and Equipment. Track stock levels, set reorder points, and monitor usage patterns. Generate inventory reports for financial analysis.',
        category: 'inventory',
        tags: ['inventory', 'stock', 'supplies'],
        relatedTopics: ['inventory-supplies', 'inventory-packaging'],
        lastUpdated: new Date('2024-01-01')
    },
    {
        id: 'inventory-supplies',
        title: 'Managing Growing Supplies',
        content: 'Track growing media, nutrients, pest control products, and other supplies. Ensure all inputs meet organic certification requirements. Monitor usage rates and costs per batch.',
        category: 'inventory',
        tags: ['supplies', 'inputs', 'organic'],
        relatedTopics: ['inventory-overview', 'quality-organic'],
        lastUpdated: new Date('2024-01-01')
    },

    // Sales
    {
        id: 'sales-order-management',
        title: 'Order Processing',
        content: 'Create and manage customer orders from placement to delivery. Track order status, allocate inventory, schedule deliveries, and generate invoices. Support both B2B and B2C sales channels.',
        category: 'sales',
        tags: ['orders', 'sales', 'customers'],
        relatedTopics: ['sales-customer-management', 'sales-pricing'],
        lastUpdated: new Date('2024-01-01')
    },
    {
        id: 'sales-customer-management',
        title: 'Customer Relationship Management',
        content: 'Maintain customer profiles, track preferences, manage contracts, and analyze purchase history. Segment customers for targeted marketing and personalized service.',
        category: 'sales',
        tags: ['customers', 'crm', 'relationships'],
        relatedTopics: ['sales-order-management'],
        lastUpdated: new Date('2024-01-01')
    },

    // Quality
    {
        id: 'quality-control',
        title: 'Quality Control Process',
        content: 'Implement multi-point quality inspections throughout the production cycle. Record visual assessments, measurements, and corrective actions. Track quality trends to identify improvement opportunities.',
        category: 'quality',
        tags: ['quality', 'inspection', 'standards'],
        relatedTopics: ['quality-organic', 'quality-food-safety'],
        lastUpdated: new Date('2024-01-01')
    },
    {
        id: 'quality-organic',
        title: 'Organic Compliance',
        content: 'Ensure all operations meet USDA Organic standards. Track approved inputs, maintain required records, and prepare for certification audits. Generate compliance reports on demand.',
        category: 'quality',
        tags: ['organic', 'certification', 'compliance'],
        relatedTopics: ['quality-control', 'inventory-supplies'],
        lastUpdated: new Date('2024-01-01')
    },
    {
        id: 'quality-food-safety',
        title: 'Food Safety Management',
        content: 'Implement FSMA-compliant food safety practices. Track sanitation schedules, employee training, and corrective actions. Maintain complete documentation for regulatory inspections.',
        category: 'quality',
        tags: ['food safety', 'fsma', 'sanitation'],
        relatedTopics: ['quality-control'],
        lastUpdated: new Date('2024-01-01')
    },

    // Analytics
    {
        id: 'analytics-dashboard',
        title: 'Analytics Dashboard',
        content: 'View key performance indicators across production, sales, quality, and financial metrics. Customize dashboards based on your role and responsibilities. Export data for external analysis.',
        category: 'analytics',
        tags: ['analytics', 'dashboard', 'kpi'],
        relatedTopics: ['analytics-production', 'analytics-financial'],
        lastUpdated: new Date('2024-01-01')
    },
    {
        id: 'analytics-production',
        title: 'Production Analytics',
        content: 'Analyze yield efficiency, cycle times, resource utilization, and quality metrics. Compare performance across varieties, growing zones, and seasons. Identify optimization opportunities.',
        category: 'analytics',
        tags: ['production', 'yield', 'efficiency'],
        relatedTopics: ['analytics-dashboard', 'production-batch-management'],
        lastUpdated: new Date('2024-01-01')
    },

    // Admin
    {
        id: 'admin-user-management',
        title: 'User Management',
        content: 'Create user accounts, assign roles, manage permissions, and track user activity. Support multi-farm access for users who work across multiple operations. Implement least-privilege access control.',
        category: 'admin',
        tags: ['users', 'admin', 'permissions'],
        relatedTopics: ['getting-started-roles', 'admin-farm-management'],
        lastUpdated: new Date('2024-01-01')
    },
    {
        id: 'admin-farm-management',
        title: 'Farm Management',
        content: 'Global administrators can manage multiple farms, view aggregate metrics, and configure farm-specific settings. Each farm maintains complete data isolation while supporting cross-farm reporting for global admins.',
        category: 'admin',
        tags: ['farms', 'multi-tenant', 'admin'],
        relatedTopics: ['admin-user-management'],
        lastUpdated: new Date('2024-01-01')
    }
];

// Tooltips
const tooltips: HelpTooltip[] = [
    {
        id: 'batch-status-tooltip',
        targetElement: '.batch-status',
        content: 'Batch status indicates the current growth stage: Planning, Seeded, Growing, or Harvest Ready',
        position: 'top',
        delay: 500
    },
    {
        id: 'quality-score-tooltip',
        targetElement: '.quality-score',
        content: 'Quality score is calculated based on inspection results and customer feedback (0-100)',
        position: 'right',
        delay: 500
    },
    {
        id: 'reorder-point-tooltip',
        targetElement: '.reorder-point',
        content: 'When inventory falls below this level, a reorder notification will be triggered',
        position: 'top',
        delay: 500
    }
];

// Tutorials
const tutorials: HelpTutorial[] = [
    {
        id: 'onboarding-tutorial',
        title: 'Getting Started with OFMS',
        description: 'Learn the basics of navigating and using the Organic Farm Management System',
        steps: [
            {
                id: 'welcome',
                title: 'Welcome to OFMS',
                content: 'Welcome to the Organic Farm Management System! This tutorial will guide you through the basic features.',
                position: 'center',
                skipable: false
            },
            {
                id: 'sidebar-navigation',
                title: 'Navigation Menu',
                content: 'Use the sidebar menu to access different modules. Each module contains related features for managing your farm operations.',
                target: '.sidebar',
                position: 'right',
                skipable: true
            },
            {
                id: 'dashboard-metrics',
                title: 'Dashboard Overview',
                content: 'The dashboard shows key metrics and recent activities. You can quickly see the status of your operations at a glance.',
                target: '.dashboard-content',
                position: 'bottom',
                skipable: true
            },
            {
                id: 'user-menu',
                title: 'User Menu',
                content: 'Access your profile, switch farms (if you have access to multiple), and sign out using the user menu in the header.',
                target: '.user-menu',
                position: 'bottom',
                skipable: true
            }
        ],
        targetRole: ['TEAM_MEMBER', 'SPECIALIST']
    },
    {
        id: 'batch-creation-tutorial',
        title: 'Creating Your First Batch',
        description: 'Step-by-step guide to creating and managing a production batch',
        steps: [
            {
                id: 'navigate-to-batches',
                title: 'Navigate to Batches',
                content: 'Click on Production > Batches in the sidebar menu to access batch management.',
                target: '[href="/production/batches"]',
                action: 'click',
                position: 'right',
                skipable: false
            },
            {
                id: 'create-batch-button',
                title: 'Create New Batch',
                content: 'Click the "Create Batch" button to start creating a new production batch.',
                target: '.create-batch-button',
                action: 'click',
                position: 'bottom',
                skipable: false
            },
            {
                id: 'fill-batch-details',
                title: 'Enter Batch Details',
                content: 'Fill in the batch information including variety, quantity, growing zone, and planned dates.',
                target: '.batch-form',
                position: 'right',
                skipable: false
            },
            {
                id: 'save-batch',
                title: 'Save the Batch',
                content: 'Click Save to create the batch. You can now track its progress through the production cycle.',
                target: '.save-button',
                action: 'click',
                position: 'top',
                skipable: false
            }
        ],
        targetRole: ['TEAM_LEAD', 'MANAGER', 'ADMIN']
    }
];

// FAQs
const faqs: FAQ[] = [
    {
        id: 'faq-multiple-farms',
        question: 'Can I manage multiple farms with one account?',
        answer: 'Yes, OFMS supports multi-farm access. If you have been granted access to multiple farms, you can switch between them using the farm selector in the header. Each farm maintains separate data.',
        category: 'getting-started',
        helpful: 45,
        notHelpful: 2,
        relatedFAQs: ['faq-user-roles']
    },
    {
        id: 'faq-user-roles',
        question: 'What are the different user roles and their permissions?',
        answer: 'OFMS has six role levels: ADMIN (full access), MANAGER (operational management), TEAM_LEAD (production supervision), SPECIALIST_LEAD (area management), TEAM_MEMBER (daily operations), and SPECIALIST (focused tasks). Each role has specific permissions aligned with their responsibilities.',
        category: 'getting-started',
        helpful: 67,
        notHelpful: 5,
        relatedFAQs: ['faq-multiple-farms']
    },
    {
        id: 'faq-organic-compliance',
        question: 'How does OFMS help with organic certification compliance?',
        answer: 'OFMS tracks all inputs to ensure they meet organic standards, maintains required records for certification audits, generates compliance reports, and provides alerts for any non-compliant materials. The system is designed to meet USDA Organic requirements.',
        category: 'quality',
        helpful: 89,
        notHelpful: 3
    },
    {
        id: 'faq-batch-tracking',
        question: 'How do I track a batch from seed to harvest?',
        answer: 'Create a batch in Production > Batches, then update its status as it progresses through stages (Seeded, Growing, Harvest Ready). Record environmental conditions, inputs used, and quality checks throughout the cycle. The system maintains complete traceability.',
        category: 'production',
        helpful: 72,
        notHelpful: 8
    },
    {
        id: 'faq-inventory-alerts',
        question: 'How do inventory reorder alerts work?',
        answer: 'Set reorder points for each inventory item. When stock levels fall below the reorder point, the system generates an alert on the dashboard and can send email notifications. You can configure alert preferences in Settings.',
        category: 'inventory',
        helpful: 54,
        notHelpful: 4
    },
    {
        id: 'faq-data-export',
        question: 'Can I export data for external analysis?',
        answer: 'Yes, most data tables in OFMS support CSV export. Look for the Export button on list views. You can also generate comprehensive reports in Analytics that can be exported in various formats.',
        category: 'analytics',
        helpful: 61,
        notHelpful: 6
    }
];

// Keyboard Shortcuts
const shortcuts: KeyboardShortcut[] = [
    // Global shortcuts
    {
        id: 'global-search',
        keys: ['Ctrl', 'K'],
        description: 'Open global search',
        category: 'Global',
        global: true
    },
    {
        id: 'global-help',
        keys: ['F1'],
        description: 'Open help center',
        category: 'Global',
        global: true
    },
    {
        id: 'global-notifications',
        keys: ['Ctrl', 'N'],
        description: 'View notifications',
        category: 'Global',
        global: true
    },
    {
        id: 'global-dashboard',
        keys: ['Ctrl', 'D'],
        description: 'Go to dashboard',
        category: 'Global',
        global: true
    },
    {
        id: 'global-new',
        keys: ['Ctrl', 'Shift', 'N'],
        description: 'Create new (context-aware)',
        category: 'Global',
        global: true
    },

    // Navigation shortcuts
    {
        id: 'nav-next',
        keys: ['Tab'],
        description: 'Navigate to next element',
        category: 'Navigation',
        global: true
    },
    {
        id: 'nav-prev',
        keys: ['Shift', 'Tab'],
        description: 'Navigate to previous element',
        category: 'Navigation',
        global: true
    },
    {
        id: 'nav-menu',
        keys: ['Alt', 'M'],
        description: 'Toggle sidebar menu',
        category: 'Navigation',
        global: true
    },

    // Page-specific shortcuts
    {
        id: 'batch-filter',
        keys: ['Ctrl', 'F'],
        description: 'Focus filter input',
        category: 'Batches',
        context: '/production/batches'
    },
    {
        id: 'batch-create',
        keys: ['Ctrl', 'B'],
        description: 'Create new batch',
        category: 'Batches',
        context: '/production/batches'
    },
    {
        id: 'order-create',
        keys: ['Ctrl', 'O'],
        description: 'Create new order',
        category: 'Orders',
        context: '/sales/orders'
    }
];

// Help Service Class
export class HelpService {
    // Search across all help content
    async searchHelp(query: string): Promise<HelpSearchResult[]> {
        const results: HelpSearchResult[] = [];
        const searchTerms = query.toLowerCase().split(' ');

        // Search help contents
        helpContents.forEach(content => {
            const score = this.calculateSearchScore(content, searchTerms);
            if (score > 0) {
                results.push({
                    type: 'content',
                    item: content,
                    score,
                    highlights: this.getHighlights(content.content, searchTerms)
                });
            }
        });

        // Search FAQs
        faqs.forEach(faq => {
            const score = this.calculateFAQScore(faq, searchTerms);
            if (score > 0) {
                results.push({
                    type: 'faq',
                    item: faq,
                    score,
                    highlights: this.getHighlights(faq.answer, searchTerms)
                });
            }
        });

        // Search tutorials
        tutorials.forEach(tutorial => {
            const score = this.calculateTutorialScore(tutorial, searchTerms);
            if (score > 0) {
                results.push({
                    type: 'tutorial',
                    item: tutorial,
                    score
                });
            }
        });

        // Sort by score
        return results.sort((a, b) => b.score - a.score).slice(0, 20);
    }

    private calculateSearchScore(content: HelpContent, searchTerms: string[]): number {
        let score = 0;
        const text = `${content.title} ${content.content} ${content.tags.join(' ')}`.toLowerCase();

        searchTerms.forEach(term => {
            if (content.title.toLowerCase().includes(term)) score += 10;
            if (content.tags.some(tag => tag.includes(term))) score += 5;
            if (text.includes(term)) score += 2;
        });

        return score;
    }

    private calculateFAQScore(faq: FAQ, searchTerms: string[]): number {
        let score = 0;
        const text = `${faq.question} ${faq.answer}`.toLowerCase();

        searchTerms.forEach(term => {
            if (faq.question.toLowerCase().includes(term)) score += 10;
            if (text.includes(term)) score += 2;
        });

        return score;
    }

    private calculateTutorialScore(tutorial: HelpTutorial, searchTerms: string[]): number {
        let score = 0;
        const text = `${tutorial.title} ${tutorial.description}`.toLowerCase();

        searchTerms.forEach(term => {
            if (tutorial.title.toLowerCase().includes(term)) score += 10;
            if (text.includes(term)) score += 3;
        });

        return score;
    }

    private getHighlights(text: string, searchTerms: string[]): string[] {
        const highlights: string[] = [];
        const sentences = text.split('. ');

        sentences.forEach(sentence => {
            if (searchTerms.some(term => sentence.toLowerCase().includes(term))) {
                highlights.push(sentence);
            }
        });

        return highlights.slice(0, 3);
    }

    // Get contextual help for a specific page
    getContextualHelp(pageRoute: string): HelpContent[] {
        const pageCategory = this.getPageCategory(pageRoute);
        return helpContents.filter(content =>
            content.category === pageCategory ||
            content.tags.some(tag => pageRoute.includes(tag))
        );
    }

    private getPageCategory(route: string): HelpCategory | null {
        if (route.includes('/production')) return 'production';
        if (route.includes('/inventory')) return 'inventory';
        if (route.includes('/sales')) return 'sales';
        if (route.includes('/quality')) return 'quality';
        if (route.includes('/analytics')) return 'analytics';
        if (route.includes('/admin') || route.includes('/settings')) return 'admin';
        return 'getting-started';
    }

    // Get tooltip for element
    getTooltip(elementId: string): HelpTooltip | null {
        return tooltips.find(t => t.targetElement === elementId) || null;
    }

    // Get FAQs by category
    getFAQs(category?: HelpCategory): FAQ[] {
        if (category) {
            return faqs.filter(faq => faq.category === category);
        }
        return faqs;
    }

    // Get keyboard shortcuts
    getShortcuts(context?: string): KeyboardShortcut[] {
        if (context) {
            return shortcuts.filter(s => s.global || s.context === context);
        }
        return shortcuts.filter(s => s.global);
    }

    // Get tutorial by ID
    getTutorial(tutorialId: string): HelpTutorial | null {
        return tutorials.find(t => t.id === tutorialId) || null;
    }

    // Get tutorials for user role
    getTutorialsForRole(role: string): HelpTutorial[] {
        return tutorials.filter(t =>
            !t.targetRole || t.targetRole.includes(role)
        );
    }
}

// Export singleton instance
export const helpService = new HelpService(); 