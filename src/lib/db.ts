// Database connection and Prisma client setup
// Handles database connectivity with proper error handling

import { PrismaClient } from '@prisma/client';

declare global {
    var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
export const db = globalThis.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = db;
}

// Export prisma alias for convenience
export const prisma = db;

// Database health check
export async function checkDatabaseConnection(): Promise<boolean> {
    try {
        await db.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
    await db.$disconnect();
} 