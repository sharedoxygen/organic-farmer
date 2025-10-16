import { NextResponse } from 'next/server';

interface RateLimiterOptions {
    uniqueTokenPerInterval: number;
    interval: number; // in milliseconds
}

// Simple in-memory rate limiter without external dependencies
class SimpleRateLimiter {
    private requests: Map<string, number[]> = new Map();
    private cleanupInterval: NodeJS.Timeout;

    constructor(private options: RateLimiterOptions) {
        // Clean up expired entries every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
    }

    private cleanup() {
        const now = Date.now();
        for (const [token, timestamps] of Array.from(this.requests.entries())) {
            const validTimestamps = timestamps.filter(
                (timestamp: number) => now - timestamp < this.options.interval
            );
            if (validTimestamps.length === 0) {
                this.requests.delete(token);
            } else {
                this.requests.set(token, validTimestamps);
            }
        }
    }

    check(token: string): NextResponse | null {
        const now = Date.now();
        const timestamps = this.requests.get(token) || [];
        
        // Filter out expired timestamps
        const validTimestamps = timestamps.filter(
            (timestamp: number) => now - timestamp < this.options.interval
        );

        // Check if rate limit exceeded
        if (validTimestamps.length >= this.options.uniqueTokenPerInterval) {
            return new NextResponse('Too many requests.', {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': String(this.options.uniqueTokenPerInterval),
                    'X-RateLimit-Remaining': '0',
                },
            });
        }

        // Add current timestamp
        validTimestamps.push(now);
        this.requests.set(token, validTimestamps);

        return null;
    }
}

export const rateLimiter = (options: RateLimiterOptions) => {
    const limiter = new SimpleRateLimiter(options);
    return {
        check: (token: string) => limiter.check(token),
    };
};
