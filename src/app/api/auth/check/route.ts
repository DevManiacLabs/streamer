import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/auth';

// This route cannot be statically generated as it uses server-side session data
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (session) {
      return NextResponse.json({
        authenticated: true,
        user: session.user,
        message: 'User is authenticated',
      });
    }
    
    return NextResponse.json({
      authenticated: false,
      message: 'User is not authenticated',
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      {
        authenticated: false,
        error: 'Failed to check authentication status',
      },
      { status: 500 }
    );
  }
} 