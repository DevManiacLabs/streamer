import { NextResponse } from 'next/server';
import { cleanupOldContent } from '@/api/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // Clean up old content
    await cleanupOldContent();
    
    // Return success response with cache control headers
    return NextResponse.json(
      { 
        success: true,
        message: 'Content refreshed successfully',
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Error during content refresh:', error);
    return NextResponse.json(
      { error: 'Failed to refresh content' },
      { status: 500 }
    );
  }
} 