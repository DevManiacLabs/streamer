import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ROUTE_CONFIG } from '@/lib/config';

/**
 * Middleware to handle authentication and route protection
 * 
 * Checks if user is authenticated for protected routes and
 * redirects to login page if not.
 */
export async function middleware(request: NextRequest) {
  // Get NextAuth token
  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req: request, secret });
  const isAuthenticated = !!token;

  // Current path the user is trying to access
  const { pathname } = request.nextUrl;
  
  // List of paths that require authentication
  const protectedPaths = [
    ROUTE_CONFIG.USER.WATCH_HISTORY,
    ROUTE_CONFIG.USER.FAVORITES,
    ROUTE_CONFIG.AUTH.PROFILE,
  ];
  
  // Check if the current path is a protected path or starts with one
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  // Authentication logic
  if (isProtectedPath && !isAuthenticated) {
    // Create a redirect URL to the login page with callback to current page
    const redirectUrl = new URL(ROUTE_CONFIG.AUTH.LOGIN, request.url);
    redirectUrl.searchParams.set('callbackUrl', encodeURI(pathname));
    
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect away from auth pages if already authenticated
  if (isAuthenticated && (
    pathname === ROUTE_CONFIG.AUTH.LOGIN || 
    pathname === ROUTE_CONFIG.AUTH.SIGNUP
  )) {
    return NextResponse.redirect(new URL(ROUTE_CONFIG.HOME, request.url));
  }

  // Allow request to continue
  return NextResponse.next();
}

// Matching paths configuration
export const config = {
  // Define paths where middleware should be executed
  matcher: [
    '/profile/:path*',
    '/favorites/:path*',
    '/watch-history/:path*',
    '/login',
    '/signup',
  ],
}; 