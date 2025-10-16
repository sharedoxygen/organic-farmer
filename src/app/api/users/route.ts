import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess, HttpError } from '@/lib/middleware/requestGuards';
import bcrypt from 'bcryptjs';
import { Role } from '@/types/roles';


// Helper function to safely parse roles/permissions
function safeParseJSON(value: any): any[] {
    if (!value) return [];

    // If it's already an array, return it
    if (Array.isArray(value)) return value;

    // If it's a string, try to parse as JSON first
    if (typeof value === 'string') {
        // If it starts with [ or {, it's likely JSON
        if (value.startsWith('[') || value.startsWith('{')) {
            try {
                return JSON.parse(value);
            } catch (error) {
                console.warn('Failed to parse JSON, treating as single value:', value);
                return [value];
            }
        } else {
            // It's a plain string value, wrap in array
            return [value];
        }
    }

    return [];
}

// Import clean system admin detection (NO HARDCODED DATA)
import { isSystemAdmin } from '@/lib/utils/systemAdmin';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// GET /api/users - Get all users from database
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { farmId } = await ensureFarmAccess(request);

        console.log('🔒 SECURE: Fetching users for farm:', farmId);

        // Get users that are associated with this farm through farm_users table
        const farmUsers = await (prisma as any).farm_users.findMany({
            where: {
                farm_id: farmId,
                is_active: true
            },
            include: {
                users: true
            }
        });

        // Extract the user data and add farm-specific role
        const users = farmUsers.map((farmUser: any) => ({
            ...farmUser.users,
            farmRole: farmUser.role, // Role specific to this farm
            permissions: farmUser.permissions || '[]'
        }));

        // 🚨 CRITICAL SECURITY FIX: Filter out system administrators
        const filteredUsers = users.filter((user: any) => {
            const isAdmin = isSystemAdmin(user);
            if (isAdmin) {
                console.warn('🚨 SECURITY BREACH PREVENTED: System admin excluded from farm query:', user.email);
                // Log this security incident
                console.error('🔒 SECURITY ALERT: Farm', farmId, 'attempted to access system admin:', user.email);
            }
            return !isAdmin;
        });

        // Parse JSON fields for frontend with safe parsing
        const parsedUsers = filteredUsers.map((user: Record<string, unknown>) => ({
            ...user,
            roles: safeParseJSON(user.roles),
            permissions: safeParseJSON(user.permissions),
            farmRole: user.farmRole || 'TEAM_MEMBER'
        }));

        console.log(`✅ SECURE: Found ${parsedUsers.length} farm users (${users.length - parsedUsers.length} system admins excluded) for farm ${farmId}`);

        return NextResponse.json({
            success: true,
            data: parsedUsers,
            pagination: {
                page: 1,
                limit: 100,
                total: parsedUsers.length,
                pages: 1
            }
        });

    } catch (error) {
        if (error instanceof HttpError) {
            return NextResponse.json({ success: false, error: error.message, data: [] }, { status: error.status });
        }
        console.error('Error fetching users:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch users',
                data: []
            },
            { status: 500 }
        );
    }
}

// POST /api/users - Create new user (demo mode)
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();

        const { farmId } = await ensureFarmAccess(request);

        // Validate required fields
        if (!body.firstName || !body.lastName || !body.email) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'First name, last name, and email are required'
                },
                { status: 400 }
            );
        }

        console.log('👤 Creating new user for farm:', farmId);

        // Check for duplicate email
        const existingUser = await (prisma as any).users.findUnique({
            where: { email: body.email }
        });

        if (existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'User with this email already exists'
                },
                { status: 409 }
            );
        }

        // Check for duplicate employee ID
        if (body.employeeId) {
            const existingEmployeeId = await (prisma as any).users.findUnique({
                where: { employeeId: body.employeeId }
            });

            if (existingEmployeeId) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Employee ID already exists'
                    },
                    { status: 409 }
                );
            }
        }

        // Generate unique user ID and hash password if provided
        const userId = crypto.randomUUID();
        const rawPassword: string | undefined = body.password;
        const passwordHash = rawPassword ? await bcrypt.hash(rawPassword, 12) : undefined;

        // Use transaction to create user and farm association
        const result = await (prisma as any).$transaction(async (tx: any) => {
            // Create the user
            const user = await tx.users.create({
                data: {
                    id: userId,
                    firstName: body.firstName.trim(),
                    lastName: body.lastName.trim(),
                    email: body.email.toLowerCase().trim(),
                    password: passwordHash || '',
                    roles: JSON.stringify([body.role || Role.TEAM_MEMBER]),
                    phone: body.phone || '',
                    employeeId: body.employeeId || '',
                    department: body.department || '',
                    position: body.position || '',
                    hireDate: new Date(),
                    isActive: true,
                    permissions: JSON.stringify(['BASIC_ACCESS']),
                    managerId: body.managerId || null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });

            // Create farm-user association
            const farmUser = await tx.farm_users.create({
                data: {
                    farm_id: farmId,
                    user_id: userId,
                    role: body.role || Role.TEAM_MEMBER,
                    permissions: JSON.stringify(body.permissions || []),
                    is_active: true,
                    joined_at: new Date()
                }
            });

            return { user, farmUser };
        });

        // Parse JSON fields for response using safe parser
        const responseUser = {
            ...result.user,
            roles: safeParseJSON(result.user.roles),
            permissions: safeParseJSON(result.user.permissions),
            farmRole: result.farmUser.role
        };

        console.log('✅ User created and associated with farm:', responseUser.email);

        return NextResponse.json({
            success: true,
            data: responseUser
        });

    } catch (error) {
        if (error instanceof HttpError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.status });
        }
        console.error('Error creating user:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create user'
            },
            { status: 500 }
        );
    }
} 