import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log("Supabase URL is:", supabaseUrl ? "FOUND" : "MISSING!");
console.log("Supabase Key is:", supabaseAnonKey ? "FOUND" : "MISSING!");

// This creates a single, secure connection to your Postgres database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);