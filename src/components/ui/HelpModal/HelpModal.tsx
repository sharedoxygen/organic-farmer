'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import styles from './HelpModal.module.css';
import { Modal } from '@/components/ui/Modal/Modal';
import { useHelp } from '@/components/HelpProvider';
import { HelpCategory, HelpContent, FAQ, HelpSearchResult } from '@/types/help';

export function HelpModal() {
    const pathname = usePathname();
    const {
        isHelpOpen,
        activeCategory,
        searchQuery,
        closeHelp,
        searchHelp,
        getContextualHelp,
        getFAQs,
        getShortcuts,
        markHelpful,
        startTutorial
    } = useHelp();

    const [activeTab, setActiveTab] = useState<'content' | 'faq' | 'tutorials' | 'shortcuts'>('content');
    const [selectedContent, setSelectedContent] = useState<HelpContent | null>(null);
    const [searchResults, setSearchResults] = useState<HelpSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Categories
    const categories: { id: HelpCategory; label: string; icon: string }[] = [
        { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
        { id: 'production', label: 'Production', icon: '🌱' },
        { id: 'inventory', label: 'Inventory', icon: '📦' },
        { id: 'sales', label: 'Sales', icon: '💰' },
        { id: 'quality', label: 'Quality', icon: '✓' },
        { id: 'analytics', label: 'Analytics', icon: '📊' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
        { id: 'admin', label: 'Administration', icon: '👤' }
    ];

    // Get current page help content
    const contextualHelp = getContextualHelp(pathname);

    // Handle search
    useEffect(() => {
        if (searchQuery) {
            setIsSearching(true);
            searchHelp(searchQuery).then(results => {
                setSearchResults(results);
                setIsSearching(false);
            });
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, searchHelp]);

    // Focus search on Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'k' && isHelpOpen) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        if (isHelpOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isHelpOpen]);

    if (!isHelpOpen) return null;

    const renderContent = () => {
        switch (activeTab) {
            case 'content':
                return (
                    <div className={styles.contentSection}>
                        {searchQuery ? (
                            // Search Results
                            <div className={styles.searchResults}>
                                <h3>Search Results for &quot;{searchQuery}&quot;</h3>
                                {isSearching ? (
                                    <p>Searching...</p>
                                ) : searchResults.length > 0 ? (
                                    <div className={styles.resultsList}>
                                        {searchResults.map((result, index) => (
                                            <div key={index} className={styles.resultItem}>
                                                <div className={styles.resultType}>{result.type}</div>
                                                {result.type === 'content' && (
                                                    <div
                                                        className={styles.resultContent}
                                                        onClick={() => setSelectedContent(result.item as HelpContent)}
                                                    >
                                                        <h4>{(result.item as HelpContent).title}</h4>
                                                        <p>{result.highlights?.[0] || (result.item as HelpContent).content.substring(0, 150)}...</p>
                                                    </div>
                                                )}
                                                {result.type === 'faq' && (
                                                    <div className={styles.resultContent}>
                                                        <h4>{(result.item as FAQ).question}</h4>
                                                        <p>{result.highlights?.[0] || (result.item as FAQ).answer.substring(0, 150)}...</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p>No results found. Try different keywords.</p>
                                )}
                            </div>
                        ) : selectedContent ? (
                            // Selected Content Detail
                            <div className={styles.contentDetail}>
                                <button
                                    className={styles.backButton}
                                    onClick={() => setSelectedContent(null)}
                                >
                                    ← Back
                                </button>
                                <article className={styles.article}>
                                    <h2>{selectedContent.title}</h2>
                                    <p className={styles.content}>{selectedContent.content}</p>
                                    {selectedContent.videoUrl && (
                                        <div className={styles.videoContainer}>
                                            <video controls src={selectedContent.videoUrl} />
                                        </div>
                                    )}
                                    <div className={styles.articleFooter}>
                                        <div className={styles.helpfulSection}>
                                            <span>Was this helpful?</span>
                                            <button
                                                className={styles.helpfulButton}
                                                onClick={() => markHelpful(selectedContent.id, true)}
                                            >
                                                👍 Yes
                                            </button>
                                            <button
                                                className={styles.helpfulButton}
                                                onClick={() => markHelpful(selectedContent.id, false)}
                                            >
                                                👎 No
                                            </button>
                                        </div>
                                        {selectedContent.relatedTopics && (
                                            <div className={styles.relatedTopics}>
                                                <h4>Related Topics</h4>
                                                <div className={styles.topicsList}>
                                                    {selectedContent.relatedTopics.map(topicId => (
                                                        <button
                                                            key={topicId}
                                                            className={styles.topicLink}
                                                            onClick={() => {
                                                                // Find and display related topic
                                                                const related = contextualHelp.find(h => h.id === topicId);
                                                                if (related) setSelectedContent(related);
                                                            }}
                                                        >
                                                            {topicId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            </div>
                        ) : (
                            // Category List
                            <div className={styles.categoryContent}>
                                {contextualHelp.length > 0 && (
                                    <div className={styles.contextualSection}>
                                        <h3>Help for This Page</h3>
                                        <div className={styles.helpList}>
                                            {contextualHelp.map(help => (
                                                <div
                                                    key={help.id}
                                                    className={styles.helpItem}
                                                    onClick={() => setSelectedContent(help)}
                                                >
                                                    <h4>{help.title}</h4>
                                                    <p>{help.content.substring(0, 100)}...</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className={styles.allCategories}>
                                    <h3>Browse by Category</h3>
                                    <div className={styles.categoryGrid}>
                                        {categories.map(category => (
                                            <button
                                                key={category.id}
                                                className={`${styles.categoryCard} ${activeCategory === category.id ? styles.active : ''}`}
                                                onClick={() => {
                                                    // Load category content
                                                    const categoryHelp = getContextualHelp(`/${category.id}`);
                                                    if (categoryHelp.length > 0) {
                                                        setSelectedContent(categoryHelp[0]);
                                                    }
                                                }}
                                            >
                                                <span className={styles.categoryIcon}>{category.icon}</span>
                                                <span className={styles.categoryLabel}>{category.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'faq':
                const faqs = getFAQs(activeCategory || undefined);
                return (
                    <div className={styles.faqSection}>
                        <h3>Frequently Asked Questions</h3>
                        <div className={styles.faqList}>
                            {faqs.map(faq => (
                                <details key={faq.id} className={styles.faqItem}>
                                    <summary className={styles.faqQuestion}>{faq.question}</summary>
                                    <div className={styles.faqAnswer}>
                                        <p>{faq.answer}</p>
                                        <div className={styles.faqFooter}>
                                            <span className={styles.helpfulCount}>
                                                {faq.helpful} found this helpful
                                            </span>
                                            <div className={styles.helpfulButtons}>
                                                <button onClick={() => markHelpful(faq.id, true)}>👍</button>
                                                <button onClick={() => markHelpful(faq.id, false)}>👎</button>
                                            </div>
                                        </div>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                );

            case 'tutorials':
                return (
                    <div className={styles.tutorialsSection}>
                        <h3>Interactive Tutorials</h3>
                        <div className={styles.tutorialsList}>
                            <div className={styles.tutorialCard}>
                                <h4>Getting Started with OFMS</h4>
                                <p>Learn the basics of navigating and using the system</p>
                                <button
                                    className={styles.startTutorial}
                                    onClick={() => {
                                        closeHelp();
                                        startTutorial('onboarding-tutorial');
                                    }}
                                >
                                    Start Tutorial
                                </button>
                            </div>
                            <div className={styles.tutorialCard}>
                                <h4>Creating Your First Batch</h4>
                                <p>Step-by-step guide to creating a production batch</p>
                                <button
                                    className={styles.startTutorial}
                                    onClick={() => {
                                        closeHelp();
                                        startTutorial('batch-creation-tutorial');
                                    }}
                                >
                                    Start Tutorial
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'shortcuts':
                const shortcuts = getShortcuts(pathname);
                return (
                    <div className={styles.shortcutsSection}>
                        <h3>Keyboard Shortcuts</h3>
                        <div className={styles.shortcutsList}>
                            <div className={styles.shortcutGroup}>
                                <h4>Global Shortcuts</h4>
                                {shortcuts.filter(s => s.global).map(shortcut => (
                                    <div key={shortcut.id} className={styles.shortcutItem}>
                                        <span className={styles.shortcutKeys}>
                                            {shortcut.keys.join(' + ')}
                                        </span>
                                        <span className={styles.shortcutDescription}>
                                            {shortcut.description}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            {shortcuts.some(s => !s.global) && (
                                <div className={styles.shortcutGroup}>
                                    <h4>Page Shortcuts</h4>
                                    {shortcuts.filter(s => !s.global).map(shortcut => (
                                        <div key={shortcut.id} className={styles.shortcutItem}>
                                            <span className={styles.shortcutKeys}>
                                                {shortcut.keys.join(' + ')}
                                            </span>
                                            <span className={styles.shortcutDescription}>
                                                {shortcut.description}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    return (
        <Modal
            isOpen={isHelpOpen}
            onClose={closeHelp}
            title="Help & Support"
            size="large"
        >
            <div className={styles.helpModal}>
                <div className={styles.header}>
                    <input
                        ref={searchInputRef}
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search help... (Ctrl+K)"
                        value={searchQuery}
                        onChange={(e) => searchHelp(e.target.value)}
                    />
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'content' ? styles.active : ''}`}
                        onClick={() => setActiveTab('content')}
                    >
                        Help Content
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'faq' ? styles.active : ''}`}
                        onClick={() => setActiveTab('faq')}
                    >
                        FAQs
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'tutorials' ? styles.active : ''}`}
                        onClick={() => setActiveTab('tutorials')}
                    >
                        Tutorials
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'shortcuts' ? styles.active : ''}`}
                        onClick={() => setActiveTab('shortcuts')}
                    >
                        Shortcuts
                    </button>
                </div>

                <div className={styles.content}>
                    {renderContent()}
                </div>

                <div className={styles.footer}>
                    <p>Need more help? Contact support at support@ofms.com</p>
                </div>
            </div>
        </Modal>
    );
} 