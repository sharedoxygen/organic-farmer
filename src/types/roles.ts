/**
 * Farm-level roles - matches Prisma FarmRole enum
 * These are roles assigned to users within a specific farm context
 */
export enum FarmRole {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    FARM_MANAGER = 'FARM_MANAGER',
    OPERATIONS_MANAGER = 'OPERATIONS_MANAGER',
    PRODUCTION_LEAD = 'PRODUCTION_LEAD',
    QUALITY_LEAD = 'QUALITY_LEAD',
    TEAM_MEMBER = 'TEAM_MEMBER',
    QUALITY_SPECIALIST = 'QUALITY_SPECIALIST',
    SENIOR_GROWER = 'SENIOR_GROWER',
    HARVEST_SPECIALIST = 'HARVEST_SPECIALIST',
    WORKER = 'WORKER'
}

/**
 * Legacy Role enum - kept for backward compatibility
 * @deprecated Use FarmRole instead
 */
export enum Role {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    TEAM_LEAD = 'TEAM_LEAD',
    SPECIALIST_LEAD = 'SPECIALIST_LEAD',
    SPECIALIST = 'SPECIALIST',
    TEAM_MEMBER = 'TEAM_MEMBER',
    INTERN = 'INTERN',
    VIEWER = 'VIEWER'
}

/**
 * System-level roles - for platform-wide administration
 */
export enum SystemRole {
    SYSTEM_ADMIN = 'SYSTEM_ADMIN',
    PLATFORM_ADMIN = 'PLATFORM_ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum Permission {
    // Batch Management
    CREATE_BATCH = 'CREATE_BATCH',
    VIEW_BATCH = 'VIEW_BATCH',
    EDIT_BATCH = 'EDIT_BATCH',
    DELETE_BATCH = 'DELETE_BATCH',
    APPROVE_BATCH = 'APPROVE_BATCH',

    // Seeds & Genetics
    CREATE_SEED_VARIETY = 'CREATE_SEED_VARIETY',
    VIEW_SEED_INVENTORY = 'VIEW_SEED_INVENTORY',
    EDIT_SEED_DATA = 'EDIT_SEED_DATA',
    DELETE_SEED_VARIETY = 'DELETE_SEED_VARIETY',
    ORDER_SEEDS = 'ORDER_SEEDS',

    // Orders & Sales
    CREATE_ORDER = 'CREATE_ORDER',
    VIEW_ORDERS = 'VIEW_ORDERS',
    EDIT_ORDER = 'EDIT_ORDER',
    DELETE_ORDER = 'DELETE_ORDER',
    APPROVE_ORDER = 'APPROVE_ORDER',
    PROCESS_PAYMENT = 'PROCESS_PAYMENT',

    // Customer Management
    CREATE_CUSTOMER = 'CREATE_CUSTOMER',
    VIEW_CUSTOMERS = 'VIEW_CUSTOMERS',
    EDIT_CUSTOMER = 'EDIT_CUSTOMER',
    DELETE_CUSTOMER = 'DELETE_CUSTOMER',

    // Inventory Management
    CREATE_INVENTORY_ITEM = 'CREATE_INVENTORY_ITEM',
    VIEW_INVENTORY = 'VIEW_INVENTORY',
    EDIT_INVENTORY = 'EDIT_INVENTORY',
    DELETE_INVENTORY_ITEM = 'DELETE_INVENTORY_ITEM',
    ADJUST_STOCK = 'ADJUST_STOCK',

    // Quality Control
    CREATE_QUALITY_CHECK = 'CREATE_QUALITY_CHECK',
    VIEW_QUALITY_DATA = 'VIEW_QUALITY_DATA',
    EDIT_QUALITY_CHECK = 'EDIT_QUALITY_CHECK',
    DELETE_QUALITY_CHECK = 'DELETE_QUALITY_CHECK',
    APPROVE_QUALITY = 'APPROVE_QUALITY',

    // Equipment & Facilities
    CREATE_EQUIPMENT = 'CREATE_EQUIPMENT',
    VIEW_EQUIPMENT = 'VIEW_EQUIPMENT',
    EDIT_EQUIPMENT = 'EDIT_EQUIPMENT',
    DELETE_EQUIPMENT = 'DELETE_EQUIPMENT',
    SCHEDULE_MAINTENANCE = 'SCHEDULE_MAINTENANCE',

    // User Management
    CREATE_USER = 'CREATE_USER',
    VIEW_USERS = 'VIEW_USERS',
    EDIT_USER = 'EDIT_USER',
    DELETE_USER = 'DELETE_USER',
    ASSIGN_ROLES = 'ASSIGN_ROLES',

    // Financial Data
    VIEW_FINANCIAL_REPORTS = 'VIEW_FINANCIAL_REPORTS',
    EDIT_PRICING = 'EDIT_PRICING',
    VIEW_COSTS = 'VIEW_COSTS',
    APPROVE_EXPENSES = 'APPROVE_EXPENSES',

    // Analytics & Reporting
    VIEW_ANALYTICS = 'VIEW_ANALYTICS',
    CREATE_REPORTS = 'CREATE_REPORTS',
    EXPORT_DATA = 'EXPORT_DATA',

    // System Administration
    CONFIGURE_SYSTEM = 'CONFIGURE_SYSTEM',
    MANAGE_INTEGRATIONS = 'MANAGE_INTEGRATIONS',
    BACKUP_DATA = 'BACKUP_DATA',
    VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS'
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [Role.ADMIN]: [
        // Full access to everything
        ...Object.values(Permission)
    ],

    [Role.MANAGER]: [
        // Batch Management
        Permission.CREATE_BATCH,
        Permission.VIEW_BATCH,
        Permission.EDIT_BATCH,
        Permission.DELETE_BATCH,
        Permission.APPROVE_BATCH,

        // Seeds & Genetics
        Permission.CREATE_SEED_VARIETY,
        Permission.VIEW_SEED_INVENTORY,
        Permission.EDIT_SEED_DATA,
        Permission.DELETE_SEED_VARIETY,
        Permission.ORDER_SEEDS,

        // Orders & Sales
        Permission.CREATE_ORDER,
        Permission.VIEW_ORDERS,
        Permission.EDIT_ORDER,
        Permission.DELETE_ORDER,
        Permission.APPROVE_ORDER,
        Permission.PROCESS_PAYMENT,

        // Customer Management
        Permission.CREATE_CUSTOMER,
        Permission.VIEW_CUSTOMERS,
        Permission.EDIT_CUSTOMER,
        Permission.DELETE_CUSTOMER,

        // Inventory Management
        Permission.CREATE_INVENTORY_ITEM,
        Permission.VIEW_INVENTORY,
        Permission.EDIT_INVENTORY,
        Permission.DELETE_INVENTORY_ITEM,
        Permission.ADJUST_STOCK,

        // Quality Control
        Permission.CREATE_QUALITY_CHECK,
        Permission.VIEW_QUALITY_DATA,
        Permission.EDIT_QUALITY_CHECK,
        Permission.DELETE_QUALITY_CHECK,
        Permission.APPROVE_QUALITY,

        // Equipment & Facilities
        Permission.CREATE_EQUIPMENT,
        Permission.VIEW_EQUIPMENT,
        Permission.EDIT_EQUIPMENT,
        Permission.DELETE_EQUIPMENT,
        Permission.SCHEDULE_MAINTENANCE,

        // Financial Data
        Permission.VIEW_FINANCIAL_REPORTS,
        Permission.EDIT_PRICING,
        Permission.VIEW_COSTS,
        Permission.APPROVE_EXPENSES,

        // Analytics & Reporting
        Permission.VIEW_ANALYTICS,
        Permission.CREATE_REPORTS,
        Permission.EXPORT_DATA,

        // Limited User Management
        Permission.VIEW_USERS,
        Permission.EDIT_USER,
        Permission.ASSIGN_ROLES
    ],

    [Role.TEAM_LEAD]: [
        // Batch Management
        Permission.CREATE_BATCH,
        Permission.VIEW_BATCH,
        Permission.EDIT_BATCH,
        Permission.APPROVE_BATCH,

        // Seeds & Genetics
        Permission.VIEW_SEED_INVENTORY,
        Permission.EDIT_SEED_DATA,
        Permission.ORDER_SEEDS,

        // Orders & Sales
        Permission.CREATE_ORDER,
        Permission.VIEW_ORDERS,
        Permission.EDIT_ORDER,
        Permission.APPROVE_ORDER,

        // Customer Management
        Permission.VIEW_CUSTOMERS,
        Permission.EDIT_CUSTOMER,

        // Inventory Management
        Permission.VIEW_INVENTORY,
        Permission.EDIT_INVENTORY,
        Permission.ADJUST_STOCK,

        // Quality Control
        Permission.CREATE_QUALITY_CHECK,
        Permission.VIEW_QUALITY_DATA,
        Permission.EDIT_QUALITY_CHECK,
        Permission.APPROVE_QUALITY,

        // Equipment & Facilities
        Permission.VIEW_EQUIPMENT,
        Permission.EDIT_EQUIPMENT,
        Permission.SCHEDULE_MAINTENANCE,

        // Analytics & Reporting
        Permission.VIEW_ANALYTICS,
        Permission.CREATE_REPORTS,

        // Limited User Management
        Permission.VIEW_USERS
    ],

    [Role.SPECIALIST_LEAD]: [
        // Batch Management
        Permission.CREATE_BATCH,
        Permission.VIEW_BATCH,
        Permission.EDIT_BATCH,

        // Seeds & Genetics
        Permission.CREATE_SEED_VARIETY,
        Permission.VIEW_SEED_INVENTORY,
        Permission.EDIT_SEED_DATA,

        // Quality Control
        Permission.CREATE_QUALITY_CHECK,
        Permission.VIEW_QUALITY_DATA,
        Permission.EDIT_QUALITY_CHECK,
        Permission.APPROVE_QUALITY,

        // Equipment & Facilities
        Permission.VIEW_EQUIPMENT,
        Permission.EDIT_EQUIPMENT,
        Permission.SCHEDULE_MAINTENANCE,

        // Inventory Management
        Permission.VIEW_INVENTORY,
        Permission.EDIT_INVENTORY,

        // Analytics & Reporting
        Permission.VIEW_ANALYTICS,
        Permission.CREATE_REPORTS
    ],

    [Role.SPECIALIST]: [
        // Batch Management
        Permission.CREATE_BATCH,
        Permission.VIEW_BATCH,
        Permission.EDIT_BATCH,

        // Seeds & Genetics
        Permission.VIEW_SEED_INVENTORY,
        Permission.EDIT_SEED_DATA,

        // Quality Control
        Permission.CREATE_QUALITY_CHECK,
        Permission.VIEW_QUALITY_DATA,
        Permission.EDIT_QUALITY_CHECK,

        // Equipment & Facilities
        Permission.VIEW_EQUIPMENT,
        Permission.EDIT_EQUIPMENT,

        // Inventory Management
        Permission.VIEW_INVENTORY,

        // Analytics & Reporting
        Permission.VIEW_ANALYTICS
    ],

    [Role.TEAM_MEMBER]: [
        // Batch Management
        Permission.VIEW_BATCH,
        Permission.EDIT_BATCH,

        // Seeds & Genetics
        Permission.VIEW_SEED_INVENTORY,

        // Quality Control
        Permission.CREATE_QUALITY_CHECK,
        Permission.VIEW_QUALITY_DATA,

        // Equipment & Facilities
        Permission.VIEW_EQUIPMENT,

        // Inventory Management
        Permission.VIEW_INVENTORY,

        // Analytics & Reporting
        Permission.VIEW_ANALYTICS
    ],

    [Role.INTERN]: [
        // Basic View Access
        Permission.VIEW_BATCH,
        Permission.VIEW_SEED_INVENTORY,
        Permission.VIEW_QUALITY_DATA,
        Permission.VIEW_EQUIPMENT,
        Permission.VIEW_INVENTORY,
        Permission.VIEW_ANALYTICS
    ],

    [Role.VIEWER]: [
        // Read-only access
        Permission.VIEW_BATCH,
        Permission.VIEW_SEED_INVENTORY,
        Permission.VIEW_ORDERS,
        Permission.VIEW_CUSTOMERS,
        Permission.VIEW_QUALITY_DATA,
        Permission.VIEW_EQUIPMENT,
        Permission.VIEW_INVENTORY,
        Permission.VIEW_ANALYTICS
    ]
};

export function hasPermission(userRoles: Role[], permission: Permission): boolean {
    return userRoles.some(role => ROLE_PERMISSIONS[role]?.includes(permission));
}

export function hasAnyPermission(userRoles: Role[], permissions: Permission[]): boolean {
    return permissions.some(permission => hasPermission(userRoles, permission));
}

export function getRoleDisplayName(role: Role): string {
    const roleNames: Record<Role, string> = {
        [Role.ADMIN]: 'Administrator',
        [Role.MANAGER]: 'Farm Manager',
        [Role.TEAM_LEAD]: 'Team Lead',
        [Role.SPECIALIST_LEAD]: 'Specialist Lead',
        [Role.SPECIALIST]: 'Specialist',
        [Role.TEAM_MEMBER]: 'Team Member',
        [Role.INTERN]: 'Intern',
        [Role.VIEWER]: 'Viewer'
    };
    return roleNames[role] || role;
}

/**
 * Get display name for FarmRole (matches Prisma enum)
 */
export function getFarmRoleDisplayName(role: FarmRole | string): string {
    const roleNames: Record<string, string> = {
        [FarmRole.OWNER]: 'Owner',
        [FarmRole.ADMIN]: 'Administrator',
        [FarmRole.MANAGER]: 'Manager',
        [FarmRole.FARM_MANAGER]: 'Farm Manager',
        [FarmRole.OPERATIONS_MANAGER]: 'Operations Manager',
        [FarmRole.PRODUCTION_LEAD]: 'Production Lead',
        [FarmRole.QUALITY_LEAD]: 'Quality Lead',
        [FarmRole.TEAM_MEMBER]: 'Team Member',
        [FarmRole.QUALITY_SPECIALIST]: 'Quality Specialist',
        [FarmRole.SENIOR_GROWER]: 'Senior Grower',
        [FarmRole.HARVEST_SPECIALIST]: 'Harvest Specialist',
        [FarmRole.WORKER]: 'Worker'
    };
    return roleNames[role] || role;
}

/**
 * Get display name for SystemRole
 */
export function getSystemRoleDisplayName(role: SystemRole | string): string {
    const roleNames: Record<string, string> = {
        [SystemRole.SYSTEM_ADMIN]: 'System Administrator',
        [SystemRole.PLATFORM_ADMIN]: 'Platform Administrator',
        [SystemRole.SUPER_ADMIN]: 'Super Administrator'
    };
    return roleNames[role] || role;
}

/**
 * Check if a role is a management-level role
 */
export function isManagementRole(role: FarmRole | string): boolean {
    const managementRoles = [
        FarmRole.OWNER,
        FarmRole.ADMIN,
        FarmRole.MANAGER,
        FarmRole.FARM_MANAGER,
        FarmRole.OPERATIONS_MANAGER
    ];
    return managementRoles.includes(role as FarmRole);
}

/**
 * Check if a role is a lead-level role
 */
export function isLeadRole(role: FarmRole | string): boolean {
    const leadRoles = [
        FarmRole.PRODUCTION_LEAD,
        FarmRole.QUALITY_LEAD
    ];
    return leadRoles.includes(role as FarmRole);
} 