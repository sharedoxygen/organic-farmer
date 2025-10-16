import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import Page from './page';

import { AuthProvider } from '@/components/AuthProvider';

// Mock Next.js router
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: mockReplace,
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
    }),
    useSearchParams: () => ({
        get: jest.fn(),
    }),
    usePathname: () => '/',
}));

// Mock localStorage for authentication and farm context
let store: { [key: string]: string } = {};
Object.defineProperty(window, 'localStorage', {
    value: {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn((key: string) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
    },
    writable: true,
});

// Mock fetch to control authentication flow
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({}),
        ok: true,
    } as Response)
);

describe('HomePage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders landing page when no auth token', async () => {
        // Mock localStorage to return null (no token)
        (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

        render(
            <AuthProvider>
                <Page />
            </AuthProvider>
        );

        // Wait for component to finish authentication check
        await waitFor(() => {
            // Should show landing page when no auth token
            expect(screen.getByText('Organic Farm Management System')).toBeTruthy();
            expect(screen.getByText('Get Started')).toBeTruthy();
            expect(screen.getByText('Sign In')).toBeTruthy();
        });
    });

    it('does not redirect when no auth token', async () => {
        // Mock localStorage to return null (no token)
        (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

        render(
            <AuthProvider>
                <Page />
            </AuthProvider>
        );

        // Should not call router methods when showing landing page
        expect(mockReplace).not.toHaveBeenCalled();

        // Wait for component to render landing page
        await waitFor(() => {
            expect(screen.getByText('Organic Farm Management System')).toBeTruthy();
        });
    });
});
