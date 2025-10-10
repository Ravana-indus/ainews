import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rqyknbyloifjuztbcmjc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxeWtuYnlsb2lmanV6dGJjbWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MTUyNjUsImV4cCI6MjA3NTQ5MTI2NX0.uNFH3UwCU3YhmYnH4PGpUCrok_U4QLpPvrsvUBqrQBU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

