import { NextResponse } from 'next/server';
import { fetchLatestArticles } from '@/lib/data';

export async function GET() {
  const items = await fetchLatestArticles(3).catch(() => []);
  return NextResponse.json({ latest: items });
}
