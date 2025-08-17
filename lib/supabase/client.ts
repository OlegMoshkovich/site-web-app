import { createBrowserClient } from "@supabase/ssr";

// Create a single client instance
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
);

// Keep the function for backward compatibility if needed
export function createClient() {
  return supabase;
}
