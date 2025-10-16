// Base interface for all farm data entities
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}

// Batch Management
export interface Batch extends BaseEntity {
    batchNumber: string;
    seedVariety: string;
    plantDate: Date;
    expectedHarvestDate: Date;
    actualHarvestDate?: Date;
    status: 'SEEDED' | 'GERMINATING' | 'GROWING' | 'READY_FOR_HARVEST' | 'HARVESTED' | 'COMPLETED' | 'FAILED';
    quantity: number;
    unit: 'GRAMS' | 'OUNCES' | 'POUNDS' | 'KILOGRAMS';
    growingZone: string;
    qualityGrade?: 'A' | 'B' | 'C' | 'REJECT';
    notes?: string;
    environmentalConditions?: {
        temperature: number;
        humidity: number;
        lightHours: number;
    };
}

// Seeds & Genetics
export interface SeedVariety extends BaseEntity {
    name: string;
    scientificName: string;
    supplier: string;
    stockQuantity: number;
    minStockLevel: number;
    unit: 'GRAMS' | 'OUNCES' | 'POUNDS';
    costPerUnit: number;
    germinationRate: number;
    daysToGermination: number;
    daysToHarvest: number;
    storageConditions: {
        temperature: number;
        humidity: number;
        lightExposure: 'DARK' | 'LOW' | 'MEDIUM' | 'HIGH';
    };
    lastOrderDate?: Date;
    status: 'ADEQUATE' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';
}

// Customer Management
export interface Customer extends BaseEntity {
    name: string;
    type: 'B2B' | 'B2C';
    email: string;
    phone?: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    businessInfo?: {
        businessName: string;
        taxId: string;
        contactPerson: string;
        businessType: 'RESTAURANT' | 'GROCERY' | 'FARMER_MARKET' | 'DISTRIBUTOR' | 'OTHER';
    };
    preferences: {
        preferredVarieties: string[];
        orderFrequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'SEASONAL';
        packagingRequirements?: string;
    };
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    creditLimit?: number;
    paymentTerms: 'NET_15' | 'NET_30' | 'NET_60' | 'COD' | 'PREPAID';
}

// Orders & Sales
export interface Order extends BaseEntity {
    orderNumber: string;
    customerId: string;
    customer?: Customer;
    orderDate: Date;
    requestedDeliveryDate: Date;
    actualDeliveryDate?: Date;
    status: 'PENDING' | 'CONFIRMED' | 'IN_PRODUCTION' | 'READY_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
    items: OrderItem[];
    subtotal: number;
    tax: number;
    shippingCost: number;
    total: number;
    paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
    deliveryMethod: 'PICKUP' | 'DELIVERY' | 'SHIPPING';
    notes?: string;
}

export interface OrderItem {
    id: string;
    productName: string;
    seedVarietyId: string;
    quantity: number;
    unit: 'GRAMS' | 'OUNCES' | 'POUNDS' | 'CONTAINERS';
    unitPrice: number;
    totalPrice: number;
    qualityRequirements?: string;
}

// Inventory Management
export interface InventoryItem extends BaseEntity {
    name: string;
    category: 'SEEDS' | 'PACKAGING' | 'SUPPLIES' | 'EQUIPMENT' | 'CHEMICALS';
    sku?: string;
    currentStock: number;
    minStockLevel: number;
    maxStockLevel: number;
    unit: string;
    costPerUnit: number;
    supplier: string;
    location: string;
    expirationDate?: Date;
    status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED';
}

// Quality Control
export interface QualityCheck extends BaseEntity {
    batchId: string;
    batch?: Batch;
    checkType: 'VISUAL' | 'WEIGHT' | 'CONTAMINATION' | 'PEST' | 'DISEASE' | 'CHEMICAL';
    inspector: string;
    checkDate: Date;
    status: 'PASSED' | 'FAILED' | 'CONDITIONAL';
    findings: {
        visual?: {
            color: string;
            texture: string;
            appearance: string;
        };
        measurements?: {
            weight: number;
            length: number;
            uniformity: number;
        };
        contamination?: {
            type: string;
            severity: 'LOW' | 'MEDIUM' | 'HIGH';
            action: string;
        };
    };
    notes?: string;
    correctiveActions?: string[];
    followUpRequired: boolean;
    followUpDate?: Date;
}

// Equipment & Facilities
export interface Equipment extends BaseEntity {
    name: string;
    type: 'LIGHTING' | 'IRRIGATION' | 'HVAC' | 'MONITORING' | 'HARVESTING' | 'PACKAGING';
    model: string;
    manufacturer: string;
    serialNumber: string;
    location: string;
    installDate: Date;
    warrantyExpiration?: Date;
    status: 'OPERATIONAL' | 'MAINTENANCE' | 'REPAIR' | 'RETIRED';
    maintenanceSchedule: {
        frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
        lastMaintenance?: Date;
        nextMaintenance: Date;
    };
    specifications?: Record<string, any>;
    operatingCosts?: {
        powerConsumption: number;
        maintenanceCost: number;
        replacementCost: number;
    };
}

// User Management
export interface FarmUser extends BaseEntity {
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    phone?: string;
    employeeId?: string;
    department: string;
    position: string;
    hireDate: Date;
    isActive: boolean;
    lastLogin?: Date;
    permissions: string[];
    workSchedule?: {
        daysOfWeek: string[];
        startTime: string;
        endTime: string;
    };
}

// Task Management
export interface Task extends BaseEntity {
    title: string;
    description: string;
    category: 'SEEDING' | 'WATERING' | 'HARVESTING' | 'QUALITY_CHECK' | 'MAINTENANCE' | 'DELIVERY' | 'ADMINISTRATIVE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
    assignedTo: string[];
    assignedBy: string;
    dueDate: Date;
    estimatedDuration: number; // in minutes
    actualDuration?: number;
    relatedBatchId?: string;
    relatedEquipmentId?: string;
    dependencies?: string[];
    completionNotes?: string;
    completedBy?: string;
    completedAt?: Date;
}

// Financial Records
export interface FinancialRecord extends BaseEntity {
    type: 'REVENUE' | 'EXPENSE' | 'ASSET' | 'LIABILITY';
    category: string;
    description: string;
    amount: number;
    date: Date;
    orderId?: string;
    supplierId?: string;
    reference: string;
    taxDeductible: boolean;
    paymentMethod: 'CASH' | 'CHECK' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'OTHER';
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

// Growing Environment
export interface GrowingEnvironment extends BaseEntity {
    name: string;
    type: 'GREENHOUSE' | 'INDOOR_FACILITY' | 'OUTDOOR' | 'HYDROPONIC' | 'SOIL_BASED';
    location: string;
    capacity: {
        maxBatches: number;
        totalArea: number; // square feet
        unit: 'SQ_FT' | 'SQ_M';
    };
    currentConditions: {
        temperature: number;
        humidity: number;
        lightLevel: number;
        co2Level?: number;
        pH?: number;
    };
    targetConditions: {
        temperatureRange: { min: number; max: number };
        humidityRange: { min: number; max: number };
        lightHours: number;
        co2Target?: number;
        pHTarget?: number;
    };
    equipmentIds: string[];
    status: 'OPTIMAL' | 'ALERT' | 'CRITICAL' | 'OFFLINE';
    alerts?: EnvironmentAlert[];
}

export interface EnvironmentAlert {
    id: string;
    type: 'TEMPERATURE' | 'HUMIDITY' | 'LIGHT' | 'CO2' | 'PH' | 'EQUIPMENT_FAILURE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
    resolvedAt?: Date;
} 