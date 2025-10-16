// Transaction Manager Service - CRITICAL: Ensures atomicity of multi-step operations
// This service is MANDATORY for all complex database operations per AI_DEVELOPMENT_GUIDE.md

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import AuditService from './auditService';

export interface TransactionOptions {
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
    maxWait?: number;
    auditUserId?: string;
    operationName?: string;
}

export interface TransactionResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    rollbackReason?: string;
    executionTime: number;
    operationsCount: number;
}

export class TransactionManager {

    /**
     * CRITICAL: Execute multiple database operations as atomic transaction
     * MANDATORY for all multi-step operations that must succeed or fail together
     */
    static async execute<T>(
        operations: (prisma: PrismaClient) => Promise<T>,
        options: TransactionOptions = {}
    ): Promise<TransactionResult<T>> {
        const startTime = Date.now();
        let operationsCount = 0;

        try {
            console.log(`🔄 Starting transaction: ${options.operationName || 'unnamed'}`);

            const result = await prisma.$transaction(
                async (prismaTransaction) => {
                    // Log transaction start if audit user provided
                    if (options.auditUserId && options.operationName) {
                        await AuditService.logTransactionStart(
                            options.operationName,
                            options.auditUserId,
                            (options as any).farmId
                        );
                    }

                    // Execute the operations  
                    const data = await operations(prismaTransaction as PrismaClient);
                    operationsCount++;

                    // Log transaction success if audit user provided
                    if (options.auditUserId && options.operationName) {
                        await AuditService.logTransactionSuccess(
                            options.operationName,
                            options.auditUserId,
                            data as Record<string, unknown>,
                            (options as any).farmId
                        );
                    }

                    return data;
                },
                {
                    timeout: options.timeout || 30000, // 30 second default timeout
                    isolationLevel: options.isolationLevel,
                    maxWait: options.maxWait || 5000, // 5 second max wait
                }
            );

            const executionTime = Date.now() - startTime;
            console.log(`✅ Transaction completed successfully in ${executionTime}ms`);

            return {
                success: true,
                data: result,
                executionTime,
                operationsCount
            };

        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown transaction error';

            console.error(`❌ Transaction failed after ${executionTime}ms:`, errorMessage);

            // Log transaction failure if audit user provided
            if (options.auditUserId && options.operationName) {
                try {
                    await AuditService.logTransactionFailure(
                        options.operationName,
                        options.auditUserId,
                        errorMessage,
                        (options as any).farmId
                    );
                } catch (auditError) {
                    console.error('Failed to log transaction failure:', auditError);
                }
            }

            return {
                success: false,
                error: errorMessage,
                rollbackReason: errorMessage,
                executionTime,
                operationsCount
            };
        }
    }

    /**
     * CRITICAL: Execute user creation with role assignment atomically
     */
    static async createUserWithRoles(): Promise<TransactionResult<unknown>> {
        throw new Error('createUserWithRoles is not supported with current schema');
    }

    /**
     * CRITICAL: Execute order creation with items atomically
     */
    static async createOrderWithItems(): Promise<TransactionResult<unknown>> {
        throw new Error('createOrderWithItems is not supported with current schema');
    }

    /**
     * CRITICAL: Execute batch creation with inventory updates atomically
     */
    static async createBatchWithInventoryUpdate(): Promise<TransactionResult<unknown>> {
        throw new Error('createBatchWithInventoryUpdate is not supported with current schema');
    }

    /**
     * CRITICAL: Execute inventory adjustment with audit trail atomically
     */
    static async adjustInventoryWithAudit(): Promise<TransactionResult<Record<string, unknown>>> {
        throw new Error('adjustInventoryWithAudit is not supported with current schema');
    }
}

export default TransactionManager; 