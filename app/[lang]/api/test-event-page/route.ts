import { NextResponse } from 'next/server';
import { fetchEventById } from '../../../lib/data';

export async function GET() {
  const eventId = '4de584ef-e277-4a53-ab38-af4a95d6d605';

  try {
    const event = await fetchEventById(eventId, 'en');

    return NextResponse.json({
      success: true,
      event,
      hasSummaries: !!(event?.summary?.en),
      hasDetail: !!(event?.detail?.en),
      sourcesCount: event?.sources?.length || 0,
      sources: event?.sources || [],
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
