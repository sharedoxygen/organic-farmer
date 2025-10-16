"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// A placeholder for a more complete user object, fetched from an auth context
interface User {
    id: string;
    name: string;
    email: string;
}

interface FarmAppContextType {
    farmId: string | null;
    user: User | null;
}

const FarmAppContext = createContext<FarmAppContextType | undefined>(undefined);

export const FarmAppProvider = ({ children }: { children: ReactNode }) => {
    const [farmId, setFarmId] = useState<string | null>(null);
    
    // This is a placeholder for a real user object from an authentication system.
    const [user, setUser] = useState<User | null>({
        id: 'user_placeholder_001', // Replace with actual authenticated user ID
        name: 'John Doe',
        email: 'john.doe@example.com',
    });

    useEffect(() => {
        // In a real app, farmId might come from the URL, user session, or a selection UI.
        // For now, we'll continue to retrieve it from localStorage as a starting point.
        const storedFarmId = localStorage.getItem('farmId');
        if (storedFarmId) {
            setFarmId(storedFarmId);
        }
    }, []);

    const value = { farmId, user };

    return (
        <FarmAppContext.Provider value={value}>
            {children}
        </FarmAppContext.Provider>
    );
};

export const useFarmAppContext = () => {
    const context = useContext(FarmAppContext);
    if (context === undefined) {
        throw new Error('useFarmAppContext must be used within a FarmAppProvider');
    }
    return context;
};
