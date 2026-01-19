'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('light');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
    const [mounted, setMounted] = useState(false);

    // Initialize theme on mount - sync with what was set in layout
    useEffect(() => {
        const stored = (localStorage.getItem('ofms-theme') as Theme | null) ?? 'system';
        const systemPreference: 'light' | 'dark' = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

        const initialTheme: Theme = stored;
        const initialResolved: 'light' | 'dark' = initialTheme === 'system' ? systemPreference : initialTheme;

        setTheme(initialTheme);
        setResolvedTheme(initialResolved);
        setMounted(true);

        // Apply theme to document
        document.documentElement.className = `theme-${initialResolved}`;
    }, []);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            const stored = localStorage.getItem('ofms-theme');
            if (stored === 'system') {
                const newResolved = e.matches ? 'dark' : 'light';
                setResolvedTheme(newResolved);
                document.documentElement.className = `theme-${newResolved}`;
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const updateTheme = (newTheme: Theme) => {
        setTheme(newTheme);
        localStorage.setItem('ofms-theme', newTheme);

        const systemPreference: 'light' | 'dark' = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const newResolved: 'light' | 'dark' = newTheme === 'system' ? systemPreference : newTheme;

        setResolvedTheme(newResolved);
        document.documentElement.className = `theme-${newResolved}`;
    };

    // Don't render anything until mounted to avoid hydration mismatch
    if (!mounted) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme: updateTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
} 