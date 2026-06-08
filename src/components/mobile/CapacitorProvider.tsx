'use client';

import { useEffect } from 'react';
import { initializeCapacitor, registerAppListeners } from '@/lib/mobile';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import styles from './CapacitorProvider.module.css';

interface CapacitorProviderProps {
    children: React.ReactNode;
}

export function CapacitorProvider({ children }: CapacitorProviderProps) {
    const networkStatus = useNetworkStatus();

    useEffect(() => {
        void initializeCapacitor();
        return registerAppListeners();
    }, []);

    const isOffline = networkStatus !== null && !networkStatus.connected;

    return (
        <>
            {isOffline && (
                <div className={styles.offlineBanner} role="status">
                    No network connection. Some features may be unavailable.
                </div>
            )}
            {children}
        </>
    );
}
