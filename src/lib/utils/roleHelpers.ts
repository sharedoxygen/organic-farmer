import { Role } from '@/types/roles';

export const ROLE_HIERARCHY = {
    ADMIN: 8,
    MANAGER: 7,
    TEAM_LEAD: 6,
    SPECIALIST_LEAD: 5,
    SPECIALIST: 4,
    TEAM_MEMBER: 3,
    INTERN: 2,
    VIEWER: 1
} as const;

export const FARM_ROLE_DISPLAY_NAMES = {
    ADMIN: 'Farm Administrator',
    MANAGER: 'Farm Manager',
    TEAM_LEAD: 'Production Team Lead',
    SPECIALIST_LEAD: 'Specialist Lead',
    SPECIALIST: 'Specialist',
    TEAM_MEMBER: 'Team Member',
    INTERN: 'Intern',
    VIEWER: 'Viewer'
} as const;

export const DEPARTMENT_STRUCTURE = {
    ADMINISTRATION: 'Administration',
    OPERATIONS: 'Operations',
    PRODUCTION: 'Production',
    QUALITY_ASSURANCE: 'Quality Assurance',
    SALES_MARKETING: 'Sales & Marketing',
    MAINTENANCE: 'Maintenance',
    RESEARCH_DEVELOPMENT: 'Research & Development'
} as const;

/**
 * Check if a manager role can manage a target user role
 */
export const canManageUser = (managerRole: Role, targetRole: Role): boolean => {
    return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
};

/**
 * Get potential managers for a given role
 */
export const getPotentialManagers = (users: Array<{ id: string, role: Role, name: string }>, targetRole: Role): Array<{ id: string, role: Role, name: string }> => {
    const validManagerRoles: Record<Role, Role[]> = {
        VIEWER: [Role.TEAM_MEMBER, Role.SPECIALIST, Role.SPECIALIST_LEAD, Role.TEAM_LEAD, Role.MANAGER, Role.ADMIN],
        INTERN: [Role.TEAM_MEMBER, Role.SPECIALIST, Role.SPECIALIST_LEAD, Role.TEAM_LEAD, Role.MANAGER, Role.ADMIN],
        TEAM_MEMBER: [Role.TEAM_LEAD, Role.MANAGER, Role.ADMIN],
        SPECIALIST: [Role.SPECIALIST_LEAD, Role.MANAGER, Role.ADMIN],
        SPECIALIST_LEAD: [Role.MANAGER, Role.ADMIN],
        TEAM_LEAD: [Role.MANAGER, Role.ADMIN],
        MANAGER: [Role.ADMIN],
        ADMIN: [] // Admins don't have managers
    };

    const allowedRoles = validManagerRoles[targetRole] || [];
    return users.filter(user => allowedRoles.includes(user.role));
};

/**
 * Get effective role from multiple roles (highest priority)
 */
export const getEffectiveRole = (roles: Role[]): Role => {
    if (!roles || roles.length === 0) return Role.VIEWER;

    return roles.reduce((highest, current) => {
        return ROLE_HIERARCHY[current] > ROLE_HIERARCHY[highest] ? current : highest;
    });
};

/**
 * Check if user has permission to create users with specific roles
 */
export const canCreateUserWithRole = (userRole: Role, targetRole: Role): boolean => {
    // Only admins can create other admins
    if (targetRole === Role.ADMIN && userRole === Role.ADMIN) {
        return true;
    }

    // Admins can create any role
    if (userRole === Role.ADMIN) {
        return true;
    }

    // Managers can create all roles except admin
    if (userRole === Role.MANAGER && targetRole !== Role.ADMIN) {
        return true;
    }

    // Team leads can create team members, specialists, and interns
    if (userRole === Role.TEAM_LEAD) {
        return [Role.TEAM_MEMBER, Role.SPECIALIST, Role.INTERN, Role.VIEWER].includes(targetRole);
    }

    // Specialist leads can create specialists and below
    if (userRole === Role.SPECIALIST_LEAD) {
        return [Role.SPECIALIST, Role.INTERN, Role.VIEWER].includes(targetRole);
    }

    return false;
};

/**
 * Validate manager-subordinate relationship
 */
export const isValidManagerRelationship = (managerRole: Role, subordinateRole: Role): boolean => {
    return canManageUser(managerRole, subordinateRole);
};

/**
 * Get role color for UI display
 */
export const getRoleColor = (role: Role): string => {
    const roleColors = {
        [Role.ADMIN]: '#dc2626', // Red
        [Role.MANAGER]: '#7c2d12', // Brown
        [Role.TEAM_LEAD]: '#2563eb', // Blue
        [Role.SPECIALIST_LEAD]: '#0891b2', // Cyan
        [Role.SPECIALIST]: '#059669', // Green
        [Role.TEAM_MEMBER]: '#ca8a04', // Yellow
        [Role.INTERN]: '#9333ea', // Purple
        [Role.VIEWER]: '#6b7280' // Gray
    };

    return roleColors[role] || '#6b7280';
};

/**
 * Get departments that a role typically belongs to
 */
export const getTypicalDepartments = (role: Role): string[] => {
    const roleDepartments: Record<Role, string[]> = {
        [Role.ADMIN]: [DEPARTMENT_STRUCTURE.ADMINISTRATION],
        [Role.MANAGER]: [DEPARTMENT_STRUCTURE.OPERATIONS, DEPARTMENT_STRUCTURE.ADMINISTRATION],
        [Role.TEAM_LEAD]: [DEPARTMENT_STRUCTURE.PRODUCTION, DEPARTMENT_STRUCTURE.QUALITY_ASSURANCE, DEPARTMENT_STRUCTURE.MAINTENANCE],
        [Role.SPECIALIST_LEAD]: [DEPARTMENT_STRUCTURE.QUALITY_ASSURANCE, DEPARTMENT_STRUCTURE.RESEARCH_DEVELOPMENT],
        [Role.SPECIALIST]: [DEPARTMENT_STRUCTURE.QUALITY_ASSURANCE, DEPARTMENT_STRUCTURE.RESEARCH_DEVELOPMENT, DEPARTMENT_STRUCTURE.PRODUCTION],
        [Role.TEAM_MEMBER]: [DEPARTMENT_STRUCTURE.PRODUCTION, DEPARTMENT_STRUCTURE.MAINTENANCE, DEPARTMENT_STRUCTURE.SALES_MARKETING],
        [Role.INTERN]: Object.values(DEPARTMENT_STRUCTURE),
        [Role.VIEWER]: Object.values(DEPARTMENT_STRUCTURE)
    };

    return roleDepartments[role] || [];
};

/**
 * Build organizational hierarchy from flat user list
 */
export const buildOrganizationalHierarchy = (users: Array<{
    id: string;
    name: string;
    role: Role;
    managerId?: string | null;
    email: string;
    department: string;
}>) => {
    const userMap = new Map();
    const children = new Map();
    const roots: typeof users = [];

    // Initialize maps
    users.forEach(user => {
        userMap.set(user.id, user);
        children.set(user.id, []);
    });

    // Build parent-child relationships
    users.forEach(user => {
        if (user.managerId && userMap.has(user.managerId)) {
            children.get(user.managerId).push(user);
        } else {
            roots.push(user);
        }
    });

    return { userMap, children, roots };
};

/**
 * Get user's subordinates (direct and indirect)
 */
export const getUserSubordinates = (
    userId: string,
    users: Array<{ id: string, managerId?: string | null }>,
    includeSelf: boolean = false
): string[] => {
    const subordinates = new Set<string>();

    if (includeSelf) {
        subordinates.add(userId);
    }

    const findSubordinates = (managerId: string) => {
        users.forEach(user => {
            if (user.managerId === managerId) {
                subordinates.add(user.id);
                findSubordinates(user.id); // Recursive for indirect reports
            }
        });
    };

    findSubordinates(userId);
    return Array.from(subordinates);
};

/**
 * Validate role transition (promotion/demotion)
 */
export const validateRoleTransition = (
    currentRole: Role,
    newRole: Role,
    userPerformingAction: Role
): { valid: boolean; reason?: string } => {
    // Check if the user performing the action has permission
    if (!canCreateUserWithRole(userPerformingAction, newRole)) {
        return {
            valid: false,
            reason: `${FARM_ROLE_DISPLAY_NAMES[userPerformingAction]} cannot assign ${FARM_ROLE_DISPLAY_NAMES[newRole]} role`
        };
    }

    // Prevent self-demotion for admins
    if (currentRole === Role.ADMIN && newRole !== Role.ADMIN && userPerformingAction === Role.ADMIN) {
        return {
            valid: false,
            reason: 'Admins cannot demote themselves. Another admin must perform this action.'
        };
    }

    return { valid: true };
}; 