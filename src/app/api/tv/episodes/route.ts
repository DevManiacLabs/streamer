import { NextRequest, NextResponse } from 'next/server';
import { checkAndUpdateEpisodeAvailability } from '@/api/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { tvId, seasonNumber, episodeNumber } = await request.json();
    
    if (!tvId || !seasonNumber || !episodeNumber) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    const isAvailable = await checkAndUpdateEpisodeAvailability(
      parseInt(tvId),
      parseInt(seasonNumber),
      parseInt(episodeNumber)
    );
    
    return NextResponse.json({ success: true, available: isAvailable });
  } catch (error) {
    console.error('Error checking episode availability:', error);
    return NextResponse.json(
      { error: 'Failed to check episode availability' },
      { status: 500 }
    );
  }
} 