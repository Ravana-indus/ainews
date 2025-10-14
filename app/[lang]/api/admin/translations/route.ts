import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { isAdminRequest } from '@/lib/auth';

export async function GET() {
  // reading is allowed without admin token for demo; uncomment to require
  // if (!isAdminRequest(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { data, error } = await supabase.from('v_translations').select('*').order('canonical_title', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}
