'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export function withAuth<P extends object>(
    WrappedComponent: React.ComponentType<P>
) {
    const WithAuthComponent = (props: P) => {
        const router = useRouter();
        const { isAuthenticated, isLoading } = useAuth();

        useEffect(() => {
            if (!isLoading && !isAuthenticated) {
                router.push('/auth/signin');
            }
        }, [isLoading, isAuthenticated, router]);

        if (isLoading || !isAuthenticated) {
            return (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    backgroundColor: 'var(--bg-primary, #ffffff)',
                    color: 'var(--text-secondary, #6b7280)'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            border: '3px solid var(--primary-color, #22c55e)',
                            borderTop: '3px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 16px'
                        }} />
                        <p>Authenticating...</p>
                    </div>
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };
    WithAuthComponent.displayName = `WithAuth(${getDisplayName(WrappedComponent)})`;
    return WithAuthComponent;
}

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
    return WrappedComponent.displayName || WrappedComponent.name || 'Component';
} 