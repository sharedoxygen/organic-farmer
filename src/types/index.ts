// Comprehensive TypeScript types for OFMS
// Based on Prisma schema with additional UI and API types

// User and Authentication Types
// Unified with Prisma FarmRole enum
export type FarmRole =
    | 'OWNER'
    | 'ADMIN'
    | 'MANAGER'
    | 'FARM_MANAGER'
    | 'OPERATIONS_MANAGER'
    | 'PRODUCTION_LEAD'
    | 'QUALITY_LEAD'
    | 'TEAM_MEMBER'
    | 'QUALITY_SPECIALIST'
    | 'SENIOR_GROWER'
    | 'HARVEST_SPECIALIST'
    | 'WORKER';

// Legacy Role type for backward compatibility
export type Role = 'ADMIN' | 'MANAGER' | 'TEAM_LEAD' | 'SPECIALIST_LEAD' | 'TEAM_MEMBER' | 'SPECIALIST';

// System-level roles (not farm-specific)
export type SystemRole = 'SYSTEM_ADMIN' | 'PLATFORM_ADMIN' | 'SUPER_ADMIN';

export interface User {
    id: string;
    email: string;
    name: string;
    roles: UserRole[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserRole {
    id: string;
    userId: string;
    role: Role;
}

// Business Entity Types
export interface Supplier {
    id: string;
    name: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    isOrganic: boolean;
    usdaCertified: boolean;
    certificationNumber?: string;
    qualityRating?: number;
    deliveryRating?: number;
    notes?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Seed {
    id: string;
    name: string;
    variety: string;
    scientificName?: string;
    supplierId: string;
    supplier?: Supplier;
    isOrganic: boolean;
    treatmentUsed?: string;
    lotNumber?: string;
    certificationDocs?: string;
    daysToGermination?: number;
    daysToHarvest?: number;
    yieldPerTray?: number;
    shelfLife?: number;
    storageTemp?: number;
    storageHumidity?: number;
    seedsPerGram?: number;
    germinationRate?: number;
    currentStock: number;
    reorderPoint: number;
    unitCost: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type BatchStatus =
    | 'PLANTED'
    | 'GERMINATING'
    | 'GROWING'
    | 'READY_TO_HARVEST'
    | 'HARVESTED'
    | 'PACKAGED'
    | 'SOLD'
    | 'FAILED';

export interface Batch {
    id: string;
    batchNumber: string;
    seedId: string;
    seed?: Seed;
    createdById: string;
    createdBy?: User;
    seedWeight: number;
    traysUsed: number;
    growingMedium: string;
    plantingDate: Date;
    expectedHarvestDate: Date;
    actualHarvestDate?: Date;
    temperature?: number;
    humidity?: number;
    lightHours?: number;
    expectedYield?: number;
    actualYield?: number;
    yieldEfficiency?: number;
    organicCompliant: boolean;
    qualityGrade?: string;
    notes?: string;
    status: BatchStatus;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type CustomerType = 'INDIVIDUAL' | 'RESTAURANT' | 'RETAILER' | 'WHOLESALER' | 'INSTITUTION';

export interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    customerType: CustomerType;
    taxId?: string;
    preferences?: string;
    dietaryRestrictions?: string;
    marketingConsent: boolean;
    communicationPrefs?: string;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type OrderStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'READY_TO_SHIP'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'FAILED' | 'REFUNDED';

export interface Order {
    id: string;
    orderNumber: string;
    customerId: string;
    customer?: Customer;
    createdById: string;
    createdBy?: User;
    orderDate: Date;
    requestedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    subtotal: number;
    taxAmount: number;
    shippingCost: number;
    totalAmount: number;
    paymentStatus: PaymentStatus;
    paymentMethod?: string;
    paymentReference?: string;
    status: OrderStatus;
    fulfillmentDate?: Date;
    shippingAddress?: string;
    shippingMethod?: string;
    trackingNumber?: string;
    specialInstructions?: string;
    internalNotes?: string;
    createdAt: Date;
    updatedAt: Date;
    orderItems?: OrderItem[];
}

export interface OrderItem {
    id: string;
    orderId: string;
    batchId?: string;
    batch?: Batch;
    productName: string;
    productType: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    packagingType?: string;
    specialRequests?: string;
    createdAt: Date;
}

// Task Management Types
export type TaskType =
    | 'WATERING'
    | 'FEEDING'
    | 'MONITORING'
    | 'HARVESTING'
    | 'PACKAGING'
    | 'CLEANING'
    | 'MAINTENANCE'
    | 'QUALITY_CHECK';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Task {
    id: string;
    title: string;
    description?: string;
    taskType: TaskType;
    priority: Priority;
    status: TaskStatus;
    assignedToId?: string;
    assignedTo?: User;
    scheduledDate: Date;
    completedDate?: Date;
    batchId?: string;
    batch?: Batch;
    createdAt: Date;
    updatedAt: Date;
}

// Quality Control Types
export type QualityCheckType =
    | 'PRE_HARVEST'
    | 'POST_HARVEST'
    | 'PRE_PACKAGING'
    | 'RANDOM_SAMPLING'
    | 'CUSTOMER_COMPLAINT';

export interface QualityCheck {
    id: string;
    batchId: string;
    batch?: Batch;
    inspectorId: string;
    inspector?: User;
    checkDate: Date;
    checkType: QualityCheckType;
    colorRating?: number;
    textureRating?: number;
    aromaMRating?: number;
    weightSample?: number;
    lengthSample?: number;
    contaminationFound: boolean;
    contaminationType?: string;
    overallGrade: string;
    passed: boolean;
    notes?: string;
    actionRequired?: string;
    actionTaken?: string;
    createdAt: Date;
}

// Financial Types
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'ADJUSTMENT';

export interface FinancialTransaction {
    id: string;
    accountId: string;
    transactionDate: Date;
    amount: number;
    transactionType: TransactionType;
    category: string;
    subcategory?: string;
    description: string;
    notes?: string;
    referenceType?: string;
    referenceId?: string;
    reconciled: boolean;
    reconciledDate?: Date;
    createdAt: Date;
}

// Analytics Types
export interface DashboardMetrics {
    totalBatches: number;
    activeBatches: number;
    totalOrders: number;
    pendingOrders: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    inventoryAlerts: number;
    tasksOverdue: number;
}

export interface ProductionMetrics {
    batchesThisMonth: number;
    averageYieldEfficiency: number;
    totalProduction: number;
    qualityPassRate: number;
    topPerformingSeeds: Array<{
        seed: Seed;
        totalYield: number;
        efficiency: number;
    }>;
}

export interface FinancialMetrics {
    monthlyRevenue: number;
    monthlyExpenses: number;
    profitMargin: number;
    averageOrderValue: number;
    topCustomers: Array<{
        customer: Customer;
        totalSpent: number;
        orderCount: number;
    }>;
}

// UI Component Types
export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface TableColumn {
    key: string;
    title: string;
    sortable?: boolean;
    width?: string;
    render?: (value: unknown, record: Record<string, unknown>) => React.ReactNode;
}

export interface FilterOption {
    key: string;
    label: string;
    type: 'select' | 'date' | 'text' | 'number';
    options?: SelectOption[];
}

// Form Types
export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox';
    required?: boolean;
    placeholder?: string;
    options?: SelectOption[];
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        message?: string;
    };
}

// API Response Types
export interface ApiResponse<T> {
    data: T;
    success: boolean;
    error?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    filters?: Record<string, unknown>;
}

// Multi-tenant types
export interface Farm {
    id: string;
    farm_name: string;
    business_name?: string;
    subdomain?: string;
    owner_id: string;
    subscription_plan?: string;
    subscription_status?: string;
    trial_ends_at?: Date;
    settings?: any;
    created_at: Date;
    updated_at: Date;
}

export interface FarmUser {
    farm_id: string;
    user_id: string;
    role: string;
    permissions?: any;
    is_active: boolean;
    joined_at: Date;
    farms?: Farm;
    users?: User;
}

export interface MultiTenantUser extends User {
    activeFarmId?: string;
    availableFarms: Farm[];
    farmRole?: string;
    farmPermissions?: any;
}

export interface FarmContext {
    farmId: string;
    farm: Farm;
    userRole: string;
    permissions: any;
}

export interface TenantContextType {
    currentFarm: Farm | null;
    availableFarms: Farm[];
    switchFarm: (farmId: string) => Promise<void>;
    userFarmRole: string | null;
    farmPermissions: any;
    isLoading: boolean;
}

// Subscription types
export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'inactive' | 'trial' | 'expired' | 'cancelled';

export interface Subscription {
    id: string;
    farm_id: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    trial_ends_at?: Date;
    billing_cycle: 'monthly' | 'annual';
    amount: number;
    currency: string;
    next_billing_date?: Date;
    created_at: Date;
    updated_at: Date;
}

// Export help types
export * from './help'; 