// Data Integrity Service - CRITICAL: Comprehensive business rule validation and integrity enforcement
// MANDATORY per AI_DEVELOPMENT_GUIDE.md for application-level data safety

import { PrismaClient } from '@prisma/client';
import { prisma } from '../db';
import AuditService from './auditService';

export interface ValidationResult {
    valid: boolean;
    violations: ValidationViolation[];
    warnings: string[];
}

export interface ValidationViolation {
    field: string;
    value: unknown;
    constraint: string;
    message: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface DeletionSafetyCheck {
    safe: boolean;
    dependentRecords: Array<{
        table: string;
        count: number;
        action: 'CASCADE' | 'PREVENT' | 'SET_NULL';
    }>;
    warnings: string[];
}

export class DataIntegrityService {

    /**
     * CRITICAL: Validate user data before creation/update
     */
    static validateUserData(data: Record<string, unknown>): ValidationResult {
        const violations: ValidationViolation[] = [];
        const warnings: string[] = [];

        // Required fields validation
        if (!data.firstName || typeof data.firstName !== 'string' || !data.firstName.trim()) {
            violations.push({
                field: 'firstName',
                value: data.firstName,
                constraint: 'REQUIRED',
                message: 'First name is required',
                severity: 'CRITICAL'
            });
        }

        if (!data.lastName || typeof data.lastName !== 'string' || !data.lastName.trim()) {
            violations.push({
                field: 'lastName',
                value: data.lastName,
                constraint: 'REQUIRED',
                message: 'Last name is required',
                severity: 'CRITICAL'
            });
        }

        if (!data.email || typeof data.email !== 'string' || !data.email.trim()) {
            violations.push({
                field: 'email',
                value: data.email,
                constraint: 'REQUIRED',
                message: 'Email is required',
                severity: 'CRITICAL'
            });
        }

        // Email format validation
        if (data.email && typeof data.email === 'string') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                violations.push({
                    field: 'email',
                    value: data.email,
                    constraint: 'EMAIL_FORMAT',
                    message: 'Please enter a valid email address',
                    severity: 'HIGH'
                });
            }
        }

        // Department validation
        if (!data.department || typeof data.department !== 'string' || !data.department.trim()) {
            violations.push({
                field: 'department',
                value: data.department,
                constraint: 'REQUIRED',
                message: 'Department is required',
                severity: 'CRITICAL'
            });
        }

        // Position validation  
        if (!data.position || typeof data.position !== 'string' || !data.position.trim()) {
            violations.push({
                field: 'position',
                value: data.position,
                constraint: 'REQUIRED',
                message: 'Position is required',
                severity: 'CRITICAL'
            });
        }

        // Phone number format validation (if provided)
        if (data.phone && typeof data.phone === 'string' && data.phone.trim()) {
            const phoneRegex = /^[\+]?[\d\s\(\)\-\.]{10,}$/;
            if (!phoneRegex.test(data.phone.trim())) {
                violations.push({
                    field: 'phone',
                    value: data.phone,
                    constraint: 'PHONE_FORMAT',
                    message: 'Please enter a valid phone number',
                    severity: 'MEDIUM'
                });
            }
        }

        // Employee ID format validation (if provided)
        if (data.employeeId && typeof data.employeeId === 'string' && data.employeeId.trim()) {
            const empIdRegex = /^[A-Z]{2,4}[0-9]{3,6}$/;
            if (!empIdRegex.test(data.employeeId.trim())) {
                warnings.push('Employee ID format should be letters followed by numbers (e.g., EMP001)');
            }
        }

        // Role validation
        if (data.role && typeof data.role === 'string') {
            const validRoles = ['ADMIN', 'MANAGER', 'TEAM_LEAD', 'SPECIALIST_LEAD', 'TEAM_MEMBER', 'SPECIALIST', 'INTERN', 'VIEWER'];
            if (!validRoles.includes(data.role)) {
                violations.push({
                    field: 'role',
                    value: data.role,
                    constraint: 'VALID_ROLE',
                    message: 'Invalid role specified',
                    severity: 'HIGH'
                });
            }
        }

        return {
            valid: violations.length === 0,
            violations,
            warnings
        };
    }

    /**
     * CRITICAL: Validate seed data before creation/update
     */
    static validateSeedData(data: Record<string, unknown>): ValidationResult {
        const violations: ValidationViolation[] = [];
        const warnings: string[] = [];

        // Non-negative stock validation
        if (typeof data.currentStock === 'number' && data.currentStock < 0) {
            violations.push({
                field: 'currentStock',
                value: data.currentStock,
                constraint: 'NON_NEGATIVE',
                message: 'Current stock cannot be negative',
                severity: 'CRITICAL'
            });
        }

        // Non-negative costs validation
        if (typeof data.unitCost === 'number' && data.unitCost < 0) {
            violations.push({
                field: 'unitCost',
                value: data.unitCost,
                constraint: 'NON_NEGATIVE',
                message: 'Unit cost cannot be negative',
                severity: 'CRITICAL'
            });
        }

        // Non-negative reorder point validation
        if (typeof data.reorderPoint === 'number' && data.reorderPoint < 0) {
            violations.push({
                field: 'reorderPoint',
                value: data.reorderPoint,
                constraint: 'NON_NEGATIVE',
                message: 'Reorder point cannot be negative',
                severity: 'CRITICAL'
            });
        }

        // Germination rate validation (0-100%)
        if (typeof data.germinationRate === 'number') {
            if (data.germinationRate < 0 || data.germinationRate > 100) {
                violations.push({
                    field: 'germinationRate',
                    value: data.germinationRate,
                    constraint: 'RANGE_0_100',
                    message: 'Germination rate must be between 0 and 100 percent',
                    severity: 'HIGH'
                });
            }
        }

        return {
            valid: violations.length === 0,
            violations,
            warnings
        };
    }

    /**
     * CRITICAL: Validate batch data before creation/update
     */
    static validateBatchData(data: Record<string, unknown>): ValidationResult {
        const violations: ValidationViolation[] = [];
        const warnings: string[] = [];

        // Positive seed weight validation
        if (typeof data.seedWeight === 'number' && data.seedWeight <= 0) {
            violations.push({
                field: 'seedWeight',
                value: data.seedWeight,
                constraint: 'POSITIVE',
                message: 'Seed weight must be positive',
                severity: 'CRITICAL'
            });
        }

        // Positive trays validation
        if (typeof data.traysUsed === 'number' && data.traysUsed <= 0) {
            violations.push({
                field: 'traysUsed',
                value: data.traysUsed,
                constraint: 'POSITIVE',
                message: 'Number of trays used must be positive',
                severity: 'CRITICAL'
            });
        }

        // Date logic validation
        if (data.plantingDate && data.expectedHarvestDate) {
            const plantingDate = new Date(data.plantingDate as string);
            const harvestDate = new Date(data.expectedHarvestDate as string);

            if (harvestDate <= plantingDate) {
                violations.push({
                    field: 'expectedHarvestDate',
                    value: data.expectedHarvestDate,
                    constraint: 'DATE_AFTER_PLANTING',
                    message: 'Expected harvest date must be after planting date',
                    severity: 'CRITICAL'
                });
            }
        }

        // Actual harvest date validation
        if (data.plantingDate && data.actualHarvestDate) {
            const plantingDate = new Date(data.plantingDate as string);
            const actualHarvestDate = new Date(data.actualHarvestDate as string);

            if (actualHarvestDate <= plantingDate) {
                violations.push({
                    field: 'actualHarvestDate',
                    value: data.actualHarvestDate,
                    constraint: 'DATE_AFTER_PLANTING',
                    message: 'Actual harvest date must be after planting date',
                    severity: 'CRITICAL'
                });
            }
        }

        // Non-negative yields validation
        if (typeof data.expectedYield === 'number' && data.expectedYield < 0) {
            violations.push({
                field: 'expectedYield',
                value: data.expectedYield,
                constraint: 'NON_NEGATIVE',
                message: 'Expected yield cannot be negative',
                severity: 'HIGH'
            });
        }

        if (typeof data.actualYield === 'number' && data.actualYield < 0) {
            violations.push({
                field: 'actualYield',
                value: data.actualYield,
                constraint: 'NON_NEGATIVE',
                message: 'Actual yield cannot be negative',
                severity: 'HIGH'
            });
        }

        // Efficiency validation (0-200%)
        if (typeof data.yieldEfficiency === 'number') {
            if (data.yieldEfficiency < 0 || data.yieldEfficiency > 200) {
                violations.push({
                    field: 'yieldEfficiency',
                    value: data.yieldEfficiency,
                    constraint: 'RANGE_0_200',
                    message: 'Yield efficiency must be between 0 and 200 percent',
                    severity: 'HIGH'
                });
            }
        }

        // Humidity validation (0-100%)
        if (typeof data.humidity === 'number') {
            if (data.humidity < 0 || data.humidity > 100) {
                violations.push({
                    field: 'humidity',
                    value: data.humidity,
                    constraint: 'RANGE_0_100',
                    message: 'Humidity must be between 0 and 100 percent',
                    severity: 'MEDIUM'
                });
            }
        }

        // Light hours validation (0-24)
        if (typeof data.lightHours === 'number') {
            if (data.lightHours < 0 || data.lightHours > 24) {
                violations.push({
                    field: 'lightHours',
                    value: data.lightHours,
                    constraint: 'RANGE_0_24',
                    message: 'Light hours must be between 0 and 24 hours per day',
                    severity: 'MEDIUM'
                });
            }
        }

        return {
            valid: violations.length === 0,
            violations,
            warnings
        };
    }

    /**
     * CRITICAL: Validate order data before creation/update
     */
    static validateOrderData(data: Record<string, unknown>): ValidationResult {
        const violations: ValidationViolation[] = [];
        const warnings: string[] = [];

        // Non-negative amounts validation
        const amountFields = ['subtotal', 'taxAmount', 'shippingCost', 'totalAmount'];
        amountFields.forEach(field => {
            if (typeof data[field] === 'number' && (data[field] as number) < 0) {
                violations.push({
                    field,
                    value: data[field],
                    constraint: 'NON_NEGATIVE',
                    message: `${field} cannot be negative`,
                    severity: 'CRITICAL'
                });
            }
        });

        // Delivery date validation
        if (data.requestedDeliveryDate && data.actualDeliveryDate) {
            const requestedDate = new Date(data.requestedDeliveryDate as string);
            const actualDate = new Date(data.actualDeliveryDate as string);

            if (actualDate < requestedDate) {
                warnings.push('Actual delivery date is before requested delivery date');
            }
        }

        return {
            valid: violations.length === 0,
            violations,
            warnings
        };
    }

    /**
     * CRITICAL: Validate order item data before creation/update
     */
    static validateOrderItemData(data: Record<string, unknown>): ValidationResult {
        const violations: ValidationViolation[] = [];
        const warnings: string[] = [];

        // Positive quantity validation
        if (typeof data.quantity === 'number' && data.quantity <= 0) {
            violations.push({
                field: 'quantity',
                value: data.quantity,
                constraint: 'POSITIVE',
                message: 'Quantity must be positive',
                severity: 'CRITICAL'
            });
        }

        // Non-negative prices validation
        if (typeof data.unitPrice === 'number' && data.unitPrice < 0) {
            violations.push({
                field: 'unitPrice',
                value: data.unitPrice,
                constraint: 'NON_NEGATIVE',
                message: 'Unit price cannot be negative',
                severity: 'CRITICAL'
            });
        }

        if (typeof data.totalPrice === 'number' && data.totalPrice < 0) {
            violations.push({
                field: 'totalPrice',
                value: data.totalPrice,
                constraint: 'NON_NEGATIVE',
                message: 'Total price cannot be negative',
                severity: 'CRITICAL'
            });
        }

        // Total calculation validation
        if (typeof data.quantity === 'number' && typeof data.unitPrice === 'number' && typeof data.totalPrice === 'number') {
            const expectedTotal = Math.round((data.quantity as number) * (data.unitPrice as number) * 100) / 100;
            const actualTotal = Math.round((data.totalPrice as number) * 100) / 100;

            // Use epsilon comparison for floating point accuracy (0.005 for 2 decimal places)
            if (Math.abs(expectedTotal - actualTotal) > 0.005) {
                violations.push({
                    field: 'totalPrice',
                    value: data.totalPrice,
                    constraint: 'CALCULATION_CORRECT',
                    message: `Total price should equal quantity × unit price (expected: ${expectedTotal.toFixed(2)}, actual: ${actualTotal.toFixed(2)})`,
                    severity: 'HIGH'
                });
            }
        }

        return {
            valid: violations.length === 0,
            violations,
            warnings
        };
    }

    /**
     * CRITICAL: Validate supplier data before creation/update
     */
    static validateSupplierData(data: Record<string, unknown>): ValidationResult {
        const violations: ValidationViolation[] = [];
        const warnings: string[] = [];

        // Quality rating validation (0-5)
        if (typeof data.qualityRating === 'number') {
            if (data.qualityRating < 0 || data.qualityRating > 5) {
                violations.push({
                    field: 'qualityRating',
                    value: data.qualityRating,
                    constraint: 'RANGE_0_5',
                    message: 'Quality rating must be between 0 and 5',
                    severity: 'HIGH'
                });
            }
        }

        // Delivery rating validation (0-5)
        if (typeof data.deliveryRating === 'number') {
            if (data.deliveryRating < 0 || data.deliveryRating > 5) {
                violations.push({
                    field: 'deliveryRating',
                    value: data.deliveryRating,
                    constraint: 'RANGE_0_5',
                    message: 'Delivery rating must be between 0 and 5',
                    severity: 'HIGH'
                });
            }
        }

        return {
            valid: violations.length === 0,
            violations,
            warnings
        };
    }











    /**
     * CRITICAL: Check deletion safety for any entity
     */
    static async checkDeletionSafety(
        entityType: string,
        entityId: string
    ): Promise<DeletionSafetyCheck> {
        const dependentRecords: Array<{ table: string; count: number; action: 'CASCADE' | 'PREVENT' | 'SET_NULL' }> = [];
        const warnings: string[] = [];

        try {
            switch (entityType.toLowerCase()) {
                case 'user':
                    // Check user dependencies
                    const userBatches = await prisma.batches.count({ where: { createdBy: entityId } });
                    if (userBatches > 0) {
                        dependentRecords.push({ table: 'batches', count: userBatches, action: 'PREVENT' });
                        warnings.push(`User has ${userBatches} batches - deletion would be restricted`);
                    }

                    const userOrders = await prisma.orders.count({ where: { createdBy: entityId } });
                    if (userOrders > 0) {
                        dependentRecords.push({ table: 'orders', count: userOrders, action: 'PREVENT' });
                        warnings.push(`User has ${userOrders} orders - deletion would be restricted`);
                    }

                    const userTasks = await prisma.tasks.count({ where: { assignedTo: entityId } });
                    if (userTasks > 0) {
                        dependentRecords.push({ table: 'tasks', count: userTasks, action: 'SET_NULL' });
                        warnings.push(`User has ${userTasks} assigned tasks - assignment would be cleared`);
                    }
                    break;

                case 'supplier':
                    // Check supplier dependencies - using supplier field as string for now
                    const supplierSeeds = await prisma.seed_varieties.count({ where: { supplier: entityId } });
                    if (supplierSeeds > 0) {
                        dependentRecords.push({ table: 'seed_varieties', count: supplierSeeds, action: 'PREVENT' });
                        warnings.push(`Supplier has ${supplierSeeds} seed varieties - deletion would be restricted`);
                    }
                    break;

                case 'customer':
                    // Check customer dependencies
                    const customerOrders = await prisma.orders.count({ where: { customerId: entityId } });
                    if (customerOrders > 0) {
                        dependentRecords.push({ table: 'orders', count: customerOrders, action: 'PREVENT' });
                        warnings.push(`Customer has ${customerOrders} orders - deletion would be restricted`);
                    }
                    break;

                case 'batch':
                    // Check batch dependencies
                    const batchTasks = await prisma.tasks.count({ where: { relatedBatchId: entityId } });
                    if (batchTasks > 0) {
                        dependentRecords.push({ table: 'tasks', count: batchTasks, action: 'CASCADE' });
                        warnings.push(`Batch has ${batchTasks} tasks - would be deleted`);
                    }

                    const batchQualityChecks = await prisma.quality_checks.count({ where: { batchId: entityId } });
                    if (batchQualityChecks > 0) {
                        dependentRecords.push({ table: 'quality_checks', count: batchQualityChecks, action: 'CASCADE' });
                        warnings.push(`Batch has ${batchQualityChecks} quality checks - would be deleted`);
                    }
                    break;

                case 'order':
                    // Check order dependencies
                    const orderItems = await prisma.order_items.count({ where: { orderId: entityId } });
                    if (orderItems > 0) {
                        dependentRecords.push({ table: 'order_items', count: orderItems, action: 'CASCADE' });
                        warnings.push(`Order has ${orderItems} items - would be deleted`);
                    }
                    break;
            }

            // Determine if deletion is safe
            const preventingDependencies = dependentRecords.filter(dep => dep.action === 'PREVENT');
            const safe = preventingDependencies.length === 0;

            return {
                safe,
                dependentRecords,
                warnings: safe ? warnings : [`Deletion blocked by ${preventingDependencies.length} dependencies`, ...warnings]
            };

        } catch (error) {
            console.error('Error checking deletion safety:', error);
            return {
                safe: false,
                dependentRecords: [],
                warnings: ['Error checking dependencies - deletion not safe']
            };
        }
    }

    /**
     * CRITICAL: Safe delete operation with integrity checks
     */
    static async safeDelete(
        entityType: string,
        entityId: string,
        auditUserId: string,
        options: {
            checkReferences?: boolean;
            requireConfirmation?: boolean;
            auditAction?: boolean;
        } = {}
    ): Promise<{ success: boolean; message: string; violations?: ValidationViolation[] }> {
        const { checkReferences = true, auditAction = true } = options;

        try {
            // Check deletion safety if requested
            if (checkReferences) {
                const safetyCheck = await this.checkDeletionSafety(entityType, entityId);

                if (!safetyCheck.safe) {
                    return {
                        success: false,
                        message: `Deletion blocked: ${safetyCheck.warnings.join(', ')}`,
                        violations: [{
                            field: 'id',
                            value: entityId,
                            constraint: 'REFERENTIAL_INTEGRITY',
                            message: 'Cannot delete entity with dependent records',
                            severity: 'CRITICAL'
                        }]
                    };
                }
            }

            // Get entity data for audit before deletion
            let entityData: Record<string, unknown> | null = null;
            switch (entityType.toLowerCase()) {
                case 'user':
                    entityData = await prisma.users.findUnique({ where: { id: entityId } });
                    if (entityData) {
                        await prisma.users.delete({ where: { id: entityId } });
                    }
                    break;
                case 'customer':
                    entityData = await prisma.customers.findUnique({ where: { id: entityId } });
                    if (entityData) {
                        await prisma.customers.delete({ where: { id: entityId } });
                    }
                    break;
                case 'batch':
                    entityData = await prisma.batches.findUnique({ where: { id: entityId } });
                    if (entityData) {
                        await prisma.batches.delete({ where: { id: entityId } });
                    }
                    break;
                case 'order':
                    entityData = await prisma.orders.findUnique({ where: { id: entityId } });
                    if (entityData) {
                        await prisma.orders.delete({ where: { id: entityId } });
                    }
                    break;
                default:
                    return {
                        success: false,
                        message: `Unsupported entity type: ${entityType}`
                    };
            }

            if (!entityData) {
                return {
                    success: false,
                    message: `${entityType} not found: ${entityId}`
                };
            }

            // Log deletion if audit is enabled
            if (auditAction) {
                await AuditService.logGenericOperation(
                    {
                        action: `${entityType.toUpperCase()}_DELETED`,
                        entityType,
                        entityId,
                        previousData: entityData
                    },
                    auditUserId
                );
            }

            return {
                success: true,
                message: `${entityType} deleted successfully`
            };

        } catch (error) {
            console.error(`Error deleting ${entityType}:`, error);
            return {
                success: false,
                message: `Failed to delete ${entityType}: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * CRITICAL: Check inventory balance before usage
     */
    static async validateInventoryUsage(
        itemType: 'SEED' | 'SUPPLY' | 'PACKAGING',
        itemId: string,
        requestedQuantity: number
    ): Promise<ValidationResult> {
        const violations: ValidationViolation[] = [];
        const warnings: string[] = [];

        try {
            let currentStock: number = 0;
            let itemName: string = 'Unknown';

            switch (itemType) {
                case 'SEED':
                    const seed = await prisma.seed_varieties.findUnique({ where: { id: itemId } });
                    if (!seed) {
                        violations.push({
                            field: 'itemId',
                            value: itemId,
                            constraint: 'EXISTS',
                            message: 'Seed not found',
                            severity: 'CRITICAL'
                        });
                        break;
                    }
                    currentStock = seed.stockQuantity || 0;
                    itemName = seed.name || 'Unknown Seed';
                    break;

                case 'SUPPLY':
                    const supply = await prisma.inventory_items.findUnique({ where: { id: itemId } });
                    if (!supply) {
                        violations.push({
                            field: 'itemId',
                            value: itemId,
                            constraint: 'EXISTS',
                            message: 'Supply not found',
                            severity: 'CRITICAL'
                        });
                        break;
                    }
                    currentStock = supply.currentStock || 0;
                    itemName = supply.name || 'Unknown Supply';
                    break;

                case 'PACKAGING':
                    const packaging = await prisma.inventory_items.findUnique({
                        where: {
                            id: itemId,
                            category: 'PACKAGING'
                        }
                    });
                    if (!packaging) {
                        violations.push({
                            field: 'itemId',
                            value: itemId,
                            constraint: 'EXISTS',
                            message: 'Packaging supply not found',
                            severity: 'CRITICAL'
                        });
                        break;
                    }
                    currentStock = packaging.currentStock || 0;
                    itemName = packaging.name || 'Unknown Packaging';
                    break;
            }

            // Check if sufficient stock is available
            if (violations.length === 0 && requestedQuantity > currentStock) {
                violations.push({
                    field: 'quantity',
                    value: requestedQuantity,
                    constraint: 'SUFFICIENT_STOCK',
                    message: `Insufficient stock for ${itemName}: requested ${requestedQuantity}, available ${currentStock}`,
                    severity: 'CRITICAL'
                });
            }

            // Check if stock would go below reorder point
            if (violations.length === 0 && itemType === 'SEED') {
                const seed = await prisma.seed_varieties.findUnique({ where: { id: itemId } });
                if (seed && seed.minStockLevel && (currentStock - requestedQuantity) <= seed.minStockLevel) {
                    warnings.push(`Stock for ${itemName} would fall below reorder point (${seed.minStockLevel})`);
                }
            }

        } catch (error) {
            violations.push({
                field: 'general',
                value: error,
                constraint: 'SYSTEM_ERROR',
                message: `Error validating inventory: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: 'CRITICAL'
            });
        }

        return {
            valid: violations.length === 0,
            violations,
            warnings
        };
    }


}

export default DataIntegrityService; 