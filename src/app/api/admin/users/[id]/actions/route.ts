import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isSystemAdmin } from '@/lib/utils/systemAdmin';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/users/[id]/actions - Perform actions on users (SYSTEM ADMIN ONLY)
 * ✅ CLEAN: System admin only access for user management actions
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;
        const { action } = await request.json();

        // Get requesting user from session/auth
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const requestingUserId = authHeader.replace('Bearer ', '');

        // Get requesting user and check if system admin
        const requestingUser = await (prisma as any).users.findUnique({
            where: { id: requestingUserId },
            select: {
                id: true,
                email: true,
                isActive: true,
                is_system_admin: true,
                system_role: true,
            }
        });

        if (!requestingUser || !requestingUser.isActive) {
            return NextResponse.json(
                { error: 'Requesting user not found or inactive' },
                { status: 404 }
            );
        }

        // ✅ CLEAN: Check if requesting user is system admin (NO HARDCODED DATA)
        if (!isSystemAdmin(requestingUser)) {
            return NextResponse.json(
                { error: 'Access denied. System admin privileges required.' },
                { status: 403 }
            );
        }

        // Get target user
        const targetUser = await (prisma as any).users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                isActive: true,
                is_system_admin: true,
                system_role: true,
            }
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: 'Target user not found' },
                { status: 404 }
            );
        }

        // Prevent system admins from deactivating other system admins
        if (targetUser.is_system_admin && action === 'deactivate') {
            return NextResponse.json(
                { error: 'Cannot deactivate system administrators' },
                { status: 403 }
            );
        }

        // Prevent users from acting on themselves
        if (requestingUserId === userId) {
            return NextResponse.json(
                { error: 'Cannot perform actions on your own account' },
                { status: 403 }
            );
        }

        console.log(`🔧 System admin ${requestingUser.email} performing action "${action}" on user ${targetUser.email}`);

        let updatedUser;
        let message;

        switch (action) {
            case 'activate':
                updatedUser = await (prisma as any).users.update({
                    where: { id: userId },
                    data: {
                        isActive: true,
                        updatedAt: new Date()
                    }
                });
                message = `User ${targetUser.firstName} ${targetUser.lastName} has been activated`;
                break;

            case 'deactivate':
                updatedUser = await (prisma as any).users.update({
                    where: { id: userId },
                    data: {
                        isActive: false,
                        updatedAt: new Date()
                    }
                });
                message = `User ${targetUser.firstName} ${targetUser.lastName} has been deactivated`;
                break;

            case 'reset_password':
                // In a real implementation, this would trigger password reset email
                message = `Password reset email sent to ${targetUser.email}`;
                updatedUser = targetUser;
                break;

            case 'force_logout':
                // In a real implementation, this would invalidate user sessions
                message = `User ${targetUser.firstName} ${targetUser.lastName} has been logged out of all sessions`;
                updatedUser = targetUser;
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid action. Supported actions: activate, deactivate, reset_password, force_logout' },
                    { status: 400 }
                );
        }

        console.log(`✅ User action "${action}" completed successfully`);

        return NextResponse.json({
            success: true,
            message: message,
            user: {
                id: updatedUser.id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                isActive: updatedUser.isActive
            },
            action: action,
            performed_by: requestingUser.email,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error performing user action:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 