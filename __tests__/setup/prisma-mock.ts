import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

import { prisma } from '@/lib/db';

jest.mock('@/lib/db', () => ({
    __esModule: true,
    prisma: mockDeep<PrismaClient>(),
    db: mockDeep<PrismaClient>(),
    checkDatabaseConnection: jest.fn(),
    closeDatabaseConnection: jest.fn(),
}));

beforeEach(() => {
    mockReset(prismaMock);
});

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;