import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const { data: evts } = await supabase
    .from('events')
    .select('id, last_updated_at')
    .order('last_updated_at', { ascending: false })
    .limit(100);
  const urls = [
    `${base}/`,
    `${base}/about`,
    `${base}/methodology`,
    `${base}/sources`,
    `${base}/newsletter`,
    `${base}/privacy`,
    `${base}/terms`,
  ];
  const eventUrls = (evts || []).map((e) => `${base}/event/${e.id}`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls, ...eventUrls].map(u => `<url><loc>${u}</loc></url>`).join('\n')}\n</urlset>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } });
}

