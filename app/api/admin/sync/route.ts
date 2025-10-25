import { NextResponse } from 'next/server';
import { fetchEvents } from '@/lib/data';

/**
 * Admin sync endpoint
 * Refreshes data from Supabase stories table
 */
export async function GET() {
  try {
    // Fetch latest stories from Supabase (this triggers cache revalidation)
    const stories = await fetchEvents('en');

    return NextResponse.json({
      message: 'Sync completed successfully',
      count: stories.length,
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    console.error('Error during sync:', error);
    return NextResponse.json({
      error: 'Sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
