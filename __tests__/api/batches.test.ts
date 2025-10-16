import { NextRequest } from 'next/server';
import { GET } from '@/app/api/batches/route';

// Mock the Prisma client
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        batches: {
            findMany: jest.fn().mockResolvedValue([
                {
                    id: 'test-batch-1',
                    batchNumber: 'BT-2024-001',
                    status: 'growing',
                    plantDate: new Date('2024-01-01'),
                    quantity: 100,
                    unit: 'trays',
                }
            ]),
            count: jest.fn().mockResolvedValue(1),
        },
        $disconnect: jest.fn(),
    })),
}));

describe('/api/batches', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return batches data', async () => {
        const mockRequest = {
            url: 'http://localhost:3000/api/batches',
            method: 'GET',
            nextUrl: {
                searchParams: new URLSearchParams(),
            },
            headers: {
                get: jest.fn((key: string) => {
                    if (key === 'X-Farm-ID') return 'test-farm-id';
                    return null;
                }),
            },
        } as NextRequest;

        const response = await GET(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
        expect(data.data).toHaveLength(1);
        expect(data.data[0]).toHaveProperty('batchNumber', 'BT-2024-001');
    });

    it('should handle pagination parameters', async () => {
        const mockRequest = {
            url: 'http://localhost:3000/api/batches?page=2&limit=10',
            method: 'GET',
            nextUrl: {
                searchParams: new URLSearchParams('page=2&limit=10'),
            },
            headers: {
                get: jest.fn((key: string) => {
                    if (key === 'X-Farm-ID') return 'test-farm-id';
                    return null;
                }),
            },
        } as NextRequest;

        const response = await GET(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data).toHaveProperty('pagination');
    });
}); 