import { NextRequest } from 'next/server';
import { GET } from '@/app/api/auth/validate/route';

// Mock the Prisma client
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        users: {
            findUnique: jest.fn(),
        },
        $disconnect: jest.fn(),
    })),
}));

describe('/api/auth/validate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return invalid for invalid token format', async () => {
        const mockRequest = {
            headers: {
                get: jest.fn((name: string) => {
                    if (name.toLowerCase() === 'authorization') {
                        return 'Bearer invalid-token';
                    }
                    return null;
                }),
            },
        } as unknown as NextRequest;

        const response = await GET(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.valid).toBe(false);
        expect(data.error).toBe('Invalid user');
    });

    it('should return invalid for missing token', async () => {
        const mockRequest = {
            headers: {
                get: jest.fn(() => null),
            },
        } as unknown as NextRequest;

        const response = await GET(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.valid).toBe(false);
    });
}); 