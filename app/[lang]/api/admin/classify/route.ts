import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { classifyNewEvents } from '@/lib/ai/classify';

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const res = await classifyNewEvents();
  return NextResponse.json({ ok: true, ...res });
}

