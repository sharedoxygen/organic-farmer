import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await prisma.users.findUnique({
            where: {
                email: email.toLowerCase().trim(),
                isActive: true
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Verify password with legacy plaintext fallback and auto-migrate to bcrypt
        const stored = (user as any).password as string;
        const looksHashed = stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$');
        let isValidPassword = false;
        if (looksHashed) {
            isValidPassword = await bcrypt.compare(password, stored);
        } else {
            // Legacy plaintext support: compare directly, then migrate to hash on success
            isValidPassword = stored === password;
            if (isValidPassword) {
                const newHash = await bcrypt.hash(password, 12);
                await prisma.users.update({ where: { id: user.id }, data: { password: newHash } });
            }
        }

        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Update last login
        await prisma.users.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        // Parse roles from JSON string or use as string
        let roles = [];
        try {
            roles = user.roles ? JSON.parse(user.roles) : [];
        } catch (e) {
            // If roles is not valid JSON, treat it as a single role string
            roles = user.roles ? [user.roles] : [];
        }

        let permissions = [];
        try {
            permissions = user.permissions ? JSON.parse(user.permissions) : [];
        } catch (e) {
            permissions = [];
        }

        // Return user data (without password)
        const userData = {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            roles,
            permissions,
            department: user.department,
            position: user.position,
            employeeId: user.employeeId,
            phone: user.phone,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            is_system_admin: (user as any).is_system_admin ?? false,
            system_role: (user as any).system_role ?? null
        };

        // Sign JWT and set HttpOnly cookie
        const secret =
            process.env.AUTH_SECRET ||
            process.env.JWT_SECRET ||
            (process.env.NODE_ENV !== 'production' ? 'ofms_dev_secret_please_change' : undefined);
        if (!secret) {
            return NextResponse.json(
                { error: 'Server auth configuration missing' },
                { status: 500 }
            );
        }

        const token = jwt.sign(
            {
                sub: user.id,
                is_system_admin: userData.is_system_admin,
                system_role: userData.system_role,
                roles
            },
            secret,
            { expiresIn: '7d' }
        );

        const response = NextResponse.json({
            success: true,
            user: userData
        });

        response.cookies.set('ofms_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 