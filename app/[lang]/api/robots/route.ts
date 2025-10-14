import { NextResponse } from 'next/server';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const robots = `User-agent: *\nAllow: /\nSitemap: ${base}/api/sitemap`;
  return new NextResponse(robots, { headers: { 'Content-Type': 'text/plain' } });
}

