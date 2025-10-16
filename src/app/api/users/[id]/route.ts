import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureFarmAccess } from '@/lib/middleware/requestGuards';


interface UpdateUserRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    roles?: string;
    department?: string;
    position?: string;
    phone?: string;
    employeeId?: string;
    isActive?: boolean;
    managerId?: string;
}

// Helper function to safely parse roles/permissions
function safeParseJSON(value: any): any[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        if (value.startsWith('[') || value.startsWith('{')) {
            try {
                return JSON.parse(value);
            } catch (error) {
                console.warn('Failed to parse JSON, treating as single value:', value);
                return [value];
            }
        } else {
            return [value];
        }
    }
    return [];
}

// Import clean system admin detection (NO HARDCODED DATA)
import { isSystemAdmin } from '@/lib/utils/systemAdmin';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// 🔒 SECURITY: Verify farm access and prevent system admin access
async function verifyFarmUserAccess(farmId: string, userId: string): Promise<boolean> {
    if (!farmId) return false;

    // Check if user is associated with this farm
    const farmUser = await (prisma as any).farm_users.findFirst({
        where: {
            farm_id: farmId,
            user_id: userId,
            is_active: true
        },
        include: {
            users: true
        }
    });

    if (!farmUser) {
        return false;
    }

    // CRITICAL: Block access if user is system admin
    if (isSystemAdmin(farmUser.users)) {
        console.error('🚨 SECURITY BREACH ATTEMPT: Farm', farmId, 'tried to access system admin:', farmUser.users.email);
        return false;
    }

    return true;
}

// GET /api/users/[id] - Get single user
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;
        const { farmId } = await ensureFarmAccess(request);

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        if (!farmId) {
            return NextResponse.json(
                { error: 'Farm ID is required' },
                { status: 400 }
            );
        }

        console.log('🔒 SECURE: Checking user access for farm:', farmId, 'user:', userId);

        // 🚨 CRITICAL SECURITY CHECK: Verify farm access and block system admins
        const hasAccess = await verifyFarmUserAccess(farmId, userId);
        if (!hasAccess) {
            console.error('🚨 SECURITY BREACH PREVENTED: Unauthorized access attempt to user:', userId, 'from farm:', farmId);
            return NextResponse.json(
                { error: 'User not found or access denied' },
                { status: 404 }
            );
        }

        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                roles: true,
                department: true,
                position: true,
                phone: true,
                employeeId: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
                hireDate: true,
                managerId: true,
                manager: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                directReports: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        position: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Format the response
        const formattedUser = {
            ...user,
            name: `${user.firstName} ${user.lastName}`,
            role: user.roles,
            managerName: user.manager ? `${user.manager.firstName} ${user.manager.lastName}` : null
        };

        console.log('✅ SECURE: User access granted for farm:', farmId);
        return NextResponse.json(formattedUser);

    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user' },
            { status: 500 }
        );
    }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;
        const { farmId } = await ensureFarmAccess(request);
        const body = await request.json() as UpdateUserRequest;

        // Validate user ID
        if (!userId) {
            return NextResponse.json(
                { error: 'Invalid user ID provided' },
                { status: 400 }
            );
        }

        if (!farmId) {
            return NextResponse.json(
                { error: 'Farm ID is required' },
                { status: 400 }
            );
        }

        console.log('🔒 SECURE: Checking user update access for farm:', farmId, 'user:', userId);

        // 🚨 CRITICAL SECURITY CHECK: Verify farm access and block system admins
        const hasAccess = await verifyFarmUserAccess(farmId, userId);
        if (!hasAccess) {
            console.error('🚨 SECURITY BREACH PREVENTED: Unauthorized update attempt to user:', userId, 'from farm:', farmId);
            return NextResponse.json(
                { error: 'User not found or access denied' },
                { status: 404 }
            );
        }

        // Basic field validation
        if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await prisma.users.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check for unique constraints
        if (body.email && body.email !== existingUser.email) {
            const emailExists = await prisma.users.findUnique({
                where: { email: body.email.toLowerCase() }
            });

            if (emailExists) {
                return NextResponse.json(
                    { error: 'Email address already exists' },
                    { status: 409 }
                );
            }
        }

        if (body.employeeId && body.employeeId !== existingUser.employeeId) {
            const employeeIdExists = await prisma.users.findUnique({
                where: { employeeId: body.employeeId }
            });

            if (employeeIdExists) {
                return NextResponse.json(
                    { error: 'Employee ID already exists' },
                    { status: 409 }
                );
            }
        }

        // Update user data
        const updatedUser = await prisma.users.update({
            where: { id: userId },
            data: {
                firstName: body.firstName?.trim(),
                lastName: body.lastName?.trim(),
                email: body.email?.toLowerCase().trim(),
                roles: body.roles,
                department: body.department,
                position: body.position?.trim(),
                phone: body.phone?.trim(),
                employeeId: body.employeeId?.trim(),
                isActive: body.isActive,
                managerId: body.managerId,
                updatedAt: new Date()
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                roles: true,
                department: true,
                position: true,
                phone: true,
                employeeId: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
                hireDate: true
            }
        });

        console.log(`✅ SECURE: User updated successfully for farm ${farmId}:`, userId);

        return NextResponse.json({
            ...updatedUser,
            name: `${updatedUser.firstName} ${updatedUser.lastName}`,
            role: updatedUser.roles
        });

    } catch (error) {
        console.error('Error updating user:', error);

        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        const statusCode = errorMessage.includes('not found') ? 404 :
            errorMessage.includes('already exists') ? 409 : 500;

        return NextResponse.json(
            { error: errorMessage },
            { status: statusCode }
        );
    }
}

// DELETE /api/users/[id] - Soft delete user (set isActive to false)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;
        const { farmId } = await ensureFarmAccess(request);

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        if (!farmId) {
            return NextResponse.json(
                { error: 'Farm ID is required' },
                { status: 400 }
            );
        }

        console.log('🔒 SECURE: Checking user deletion access for farm:', farmId, 'user:', userId);

        // 🚨 CRITICAL SECURITY CHECK: Verify farm access and block system admins
        const hasAccess = await verifyFarmUserAccess(farmId, userId);
        if (!hasAccess) {
            console.error('🚨 SECURITY BREACH PREVENTED: Unauthorized deletion attempt of user:', userId, 'from farm:', farmId);
            return NextResponse.json(
                { error: 'User not found or access denied' },
                { status: 404 }
            );
        }

        // Check if user exists
        const user = await prisma.users.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Soft delete by setting isActive to false
        await prisma.users.update({
            where: { id: userId },
            data: {
                isActive: false,
                updatedAt: new Date()
            }
        });

        console.log(`✅ SECURE: User soft deleted successfully for farm ${farmId}:`, userId);

        return NextResponse.json({
            success: true,
            message: 'User deactivated successfully'
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}

// PUT /api/users/[id] - Replace user (delegates to PATCH)
export async function PUT(request: NextRequest, context: { params: { id: string } }) {
    return PATCH(request, context);
} 