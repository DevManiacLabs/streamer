import { NextResponse } from 'next/server';
import { cleanupOldContent } from '@/api/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // Clean up old content
    await cleanupOldContent();
    
    // Return success response
    return NextResponse.json({ 
      success: true,
      message: 'Content cleanup completed successfully'
    });
  } catch (error) {
    console.error('Error during content cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup content' },
      { status: 500 }
    );
  }
} 