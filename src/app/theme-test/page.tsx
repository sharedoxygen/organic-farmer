'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

import { useTheme } from '@/components/ThemeProvider';
import styles from './page.module.css';

export default function ThemeTestPage() {
    const { theme, setTheme, resolvedTheme } = useTheme();

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Theme Test Page</h1>

            <div className={styles.infoSection}>
                <h2>Current Theme Information</h2>
                <p>Selected Theme: <strong>{theme}</strong></p>
                <p>Resolved Theme: <strong>{resolvedTheme}</strong></p>
                <p>HTML Classes: <strong>{typeof document !== 'undefined' ? document.documentElement.className : 'SSR'}</strong></p>
            </div>

            <div className={styles.buttonSection}>
                <h2>Theme Controls</h2>
                <button
                    onClick={() => setTheme('light')}
                    className={`${styles.button} ${theme === 'light' ? styles.active : ''}`}
                >
                    Light Theme
                </button>
                <button
                    onClick={() => setTheme('dark')}
                    className={`${styles.button} ${theme === 'dark' ? styles.active : ''}`}
                >
                    Dark Theme
                </button>
                <button
                    onClick={() => setTheme('system')}
                    className={`${styles.button} ${theme === 'system' ? styles.active : ''}`}
                >
                    System Theme
                </button>
            </div>

            <div className={styles.colorSection}>
                <h2>Color Palette Test</h2>
                <div className={styles.colorGrid}>
                    <div className={styles.colorBox} style={{ backgroundColor: 'var(--primary-color)' }}>
                        <span>Primary</span>
                        <code>--primary-color</code>
                    </div>
                    <div className={styles.colorBox} style={{ backgroundColor: 'var(--primary-dark)' }}>
                        <span>Primary Dark</span>
                        <code>--primary-dark</code>
                    </div>
                    <div className={styles.colorBox} style={{ backgroundColor: 'var(--primary-light)' }}>
                        <span>Primary Light</span>
                        <code>--primary-light</code>
                    </div>
                    <div className={styles.colorBox} style={{ backgroundColor: 'var(--accent-coral)' }}>
                        <span>Accent Coral</span>
                        <code>--accent-coral</code>
                    </div>
                    <div className={styles.colorBox} style={{ backgroundColor: 'var(--accent-brown)' }}>
                        <span>Accent Brown</span>
                        <code>--accent-brown</code>
                    </div>
                    <div className={styles.colorBox} style={{ backgroundColor: 'var(--accent-beige)' }}>
                        <span>Accent Beige</span>
                        <code>--accent-beige</code>
                    </div>
                    <div className={styles.colorBox} style={{ backgroundColor: 'var(--accent-gray)' }}>
                        <span>Accent Gray</span>
                        <code>--accent-gray</code>
                    </div>
                    <div className={styles.colorBox} style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <span>BG Secondary</span>
                        <code>--bg-secondary</code>
                    </div>
                </div>
            </div>

            <div className={styles.testSection}>
                <h2>Component Tests</h2>
                <div className={styles.buttonGroup}>
                    <button className="btn-primary">Primary Button</button>
                    <button className="btn-secondary">Secondary Button</button>
                    <button className="btn-tertiary">Tertiary Button</button>
                </div>
                <div className={styles.card}>
                    <h3>Card Example</h3>
                    <p>This is a test card using the new palette colors.</p>
                    <div className={styles.statusBadge} style={{ background: 'var(--accent-coral)', color: 'white' }}>
                        Coral Badge
                    </div>
                    <div className={styles.statusBadge} style={{ background: 'var(--accent-brown)', color: 'white' }}>
                        Brown Badge
                    </div>
                    <div className={styles.statusBadge} style={{ background: 'var(--accent-gray)', color: 'var(--primary-color)' }}>
                        Gray Badge
                    </div>
                </div>
            </div>
        </div>
    );
} 