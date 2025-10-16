// Audit Service - CRITICAL: Comprehensive audit logging for all data operations
// Uses shared prisma and aligns with prisma schema model `audit_logs`

import { prisma } from '@/lib/db';

export interface AuditLogData {
    action: string;
    entityType: string;
    entityId?: string;
    previousData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

export class AuditService {

    /**
     * CRITICAL: Log user creation audit trail
     */
    static async logUserCreation(
        userId: string,
        actionUserId: string,
        userData?: Record<string, unknown>,
        farmId?: string
    ): Promise<void> {
        if (!farmId) return;
        await prisma.audit_logs.create({
            data: {
                action: 'USER_CREATED',
                entity: 'User',
                entityId: userId,
                userId: actionUserId,
                farm_id: farmId,
                details: userData || {}
            }
        });
    }

    /**
     * CRITICAL: Log user update audit trail
     */
    static async logUserUpdate(
        userId: string,
        actionUserId: string,
        previousData: Record<string, unknown>,
        newData: Record<string, unknown>,
        farmId?: string
    ): Promise<void> {
        if (!farmId) return;
        await prisma.audit_logs.create({
            data: {
                action: 'USER_UPDATED',
                entity: 'User',
                entityId: userId,
                userId: actionUserId,
                farm_id: farmId,
                details: { previousData, newData }
            }
        });
    }

    /**
     * CRITICAL: Log user deletion audit trail
     */
    static async logUserDeletion(
        userId: string,
        actionUserId: string,
        userData: Record<string, unknown>,
        farmId?: string
    ): Promise<void> {
        if (!farmId) return;
        await prisma.audit_logs.create({
            data: {
                action: 'USER_DELETED',
                entity: 'User',
                entityId: userId,
                userId: actionUserId,
                farm_id: farmId,
                details: { previousData: userData }
            }
        });
    }

    /**
     * CRITICAL: Log transaction start
     */
    static async logTransactionStart(
        operationName: string,
        userId: string,
        farmId?: string
    ): Promise<void> {
        if (!farmId) return;
        await prisma.audit_logs.create({
            data: {
                action: 'TRANSACTION_START',
                entity: 'Transaction',
                entityId: operationName,
                userId,
                farm_id: farmId,
                details: { startTime: new Date().toISOString() }
            }
        });
    }

    /**
     * CRITICAL: Log transaction success
     */
    static async logTransactionSuccess(
        operationName: string,
        userId: string,
        result?: Record<string, unknown>,
        farmId?: string
    ): Promise<void> {
        if (!farmId) return;
        await prisma.audit_logs.create({
            data: {
                action: 'TRANSACTION_SUCCESS',
                entity: 'Transaction',
                entityId: operationName,
                userId,
                farm_id: farmId,
                details: { endTime: new Date().toISOString(), result: result || {} }
            }
        });
    }

    /**
     * CRITICAL: Log transaction failure
     */
    static async logTransactionFailure(
        operationName: string,
        userId: string,
        error: string,
        farmId?: string
    ): Promise<void> {
        if (!farmId) return;
        try {
            await prisma.audit_logs.create({
                data: {
                    action: 'TRANSACTION_FAILURE',
                    entity: 'Transaction',
                    entityId: operationName,
                    userId,
                    farm_id: farmId,
                    details: { error, endTime: new Date().toISOString() }
                }
            });
        } catch (auditError) {
            console.error('CRITICAL: Audit logging failed:', auditError);
        }
    }

    /**
     * CRITICAL: Log batch operations
     */
    static async logBatchOperation(
        action: string,
        batchId: string,
        actionUserId: string,
        data?: Record<string, unknown>,
        farmId?: string
    ): Promise<void> {
        if (!farmId) return;
        await prisma.audit_logs.create({
            data: {
                action: `BATCH_${action.toUpperCase()}`,
                entity: 'Batch',
                entityId: batchId,
                userId: actionUserId,
                farm_id: farmId,
                details: data || {}
            }
        });
    }

    /**
     * CRITICAL: Log order operations
     */
    static async logOrderOperation(
        action: string,
        orderId: string,
        actionUserId: string,
        data?: Record<string, unknown>,
        farmId?: string
    ): Promise<void> {
        if (!farmId) return;
        await prisma.audit_logs.create({
            data: {
                action: `ORDER_${action.toUpperCase()}`,
                entity: 'Order',
                entityId: orderId,
                userId: actionUserId,
                farm_id: farmId,
                details: data || {}
            }
        });
    }

    /**
     * CRITICAL: Log inventory operations
     */
    static async logInventoryOperation(
        action: string,
        itemType: string,
        itemId: string,
        actionUserId: string,
        data?: Record<string, unknown>,
        farmId?: string
    ): Promise<void> {
        if (!farmId) return;
        await prisma.audit_logs.create({
            data: {
                action: `INVENTORY_${action.toUpperCase()}`,
                entity: `Inventory_${itemType}`,
                entityId: itemId,
                userId: actionUserId,
                farm_id: farmId,
                details: data || {}
            }
        });
    }

    /**
     * CRITICAL: Generic audit logging for any entity
     */
    static async logGenericOperation(
        auditData: AuditLogData,
        actionUserId: string,
        farmId?: string
    ): Promise<void> {
        if (!farmId) return;
        await prisma.audit_logs.create({
            data: {
                action: auditData.action,
                entity: auditData.entityType,
                entityId: auditData.entityId || auditData.action,
                userId: actionUserId,
                farm_id: farmId,
                details: {
                    previousData: auditData.previousData || null,
                    newData: auditData.newData || null,
                    ipAddress: auditData.ipAddress,
                    userAgent: auditData.userAgent
                }
            }
        });
    }

    /**
     * CRITICAL: Get audit trail for entity
     */
    static async getAuditTrail(
        entityType: string,
        entityId: string,
        farmId?: string,
        limit: number = 50
    ): Promise<Array<Record<string, unknown>>> {
        const where: any = { entity: entityType, entityId };
        if (farmId) where.farm_id = farmId;
        return await prisma.audit_logs.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: limit
        });
    }

    /**
     * CRITICAL: Get recent audit activities
     */
    static async getRecentActivities(
        userId?: string,
        farmId?: string,
        limit: number = 100
    ): Promise<Array<Record<string, unknown>>> {
        const where: any = {};
        if (userId) where.userId = userId;
        if (farmId) where.farm_id = farmId;
        return await prisma.audit_logs.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: limit
        });
    }
}

export default AuditService; 