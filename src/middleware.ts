import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Add security headers and process tenant context
    const response = NextResponse.next();

    // Security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // CSP for production security
    if (process.env.NODE_ENV === 'production') {
        response.headers.set(
            'Content-Security-Policy',
            [
                "default-src 'self'",
                // Disallow eval; restrict inline scripts (Next rarely needs inline scripts)
                "script-src 'self'",
                // Allow inline styles for CSS-in-JS; tighten if/when converting to non-inline with hashes/nonces
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: https:",
                "font-src 'self' data:",
                "connect-src 'self'",
                // Forbid framing
                "frame-ancestors 'none'",
                // Upgrade insecure requests in production
                'upgrade-insecure-requests'
            ].join('; ')
        );
    }

    // 🔒 TENANT ISOLATION: Enforce farm context for API routes
    if (pathname.startsWith('/api/')) {
        const farmId = request.headers.get('X-Farm-ID');
        const isAuthRoute = pathname.startsWith('/api/auth/');
        const isSystemFarmAdminRoute = pathname.startsWith('/api/farms');
        const isTenantSelection = pathname.startsWith('/api/tenant/select-farm');

        // Allow auth endpoints and system admin farm management without X-Farm-ID
        if (!isAuthRoute && !isSystemFarmAdminRoute && !isTenantSelection) {
            if (!farmId || farmId.trim().length === 0) {
                return NextResponse.json(
                    { error: 'X-Farm-ID header is required for API access' },
                    { status: 400 }
                );
            }
        }

        return response;
    }

    // Public routes that don't require authentication
    const publicRoutes = ['/', '/auth/signin', '/auth/signup'];
    if (publicRoutes.includes(pathname)) {
        return response;
    }

    // For authenticated routes, let the component handle auth check
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}; 