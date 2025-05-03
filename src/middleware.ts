import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req: request, secret });
  const isAuthenticated = !!token;

  // Path the user is trying to access
  const { pathname } = request.nextUrl;
  
  // Paths that require authentication
  const protectedPaths = ['/profile', '/favorites', '/watch-history'];
  // Check if the path requires authentication
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // Authentication logic
  if (isProtectedPath && !isAuthenticated) {
    // Redirect to login if trying to access a protected route while not authenticated
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  // If trying to access login/signup pages while already authenticated, redirect to home
  if ((pathname.startsWith('/login') || pathname.startsWith('/signup')) && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/profile/:path*',
    '/favorites/:path*',
    '/watch-history/:path*',
    '/login',
    '/signup',
  ],
}; 