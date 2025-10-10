import { createClient } from '@supabase/supabase-js';
import { supabase as clientSupabase } from './supabaseClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rqyknbyloifjuztbcmjc.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function getServerSupabase() {
  if (serviceKey) {
    return createClient(supabaseUrl, serviceKey);
  }
  return clientSupabase;
}

