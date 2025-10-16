'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

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
        const stored = localStorage.getItem('ofms-theme') as Theme;
        const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

        // Use stored preference, otherwise fall back to system preference
        const initialTheme = stored || systemPreference;

        setTheme(initialTheme);
        setResolvedTheme(initialTheme);
        setMounted(true);

        // Apply theme to document
        document.documentElement.className = `theme-${initialTheme}`;
    }, []);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            // Only update if user hasn't explicitly set a preference
            if (!localStorage.getItem('ofms-theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                setTheme(newTheme);
                setResolvedTheme(newTheme);
                document.documentElement.className = `theme-${newTheme}`;
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const updateTheme = (newTheme: Theme) => {
        setTheme(newTheme);
        setResolvedTheme(newTheme);
        localStorage.setItem('ofms-theme', newTheme);
        document.documentElement.className = `theme-${newTheme}`;
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