import { NextResponse } from 'next/server';
import { runCompletePipeline } from '@/lib/ai/pipeline';

/**
 * Test endpoint for running the complete AI pipeline
 * POST /api/ai/test-pipeline
 */
export async function POST(req: Request) {
  try {
    console.log('🧪 Testing complete AI pipeline...');

    // Run pipeline
    const results = await runCompletePipeline();

    return NextResponse.json({
      success: true,
      message: 'Pipeline test completed successfully',
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Pipeline test failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}