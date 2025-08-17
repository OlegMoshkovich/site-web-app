import { createBrowserClient } from "@supabase/ssr";

// Create a lazy client instance to avoid build-time execution
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!supabaseInstance) {
    // Only check environment variables in browser context
    if (typeof window === 'undefined') {
      // Server-side: return a mock client that will be replaced at runtime
      return {} as ReturnType<typeof createBrowserClient>;
    }
    
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;
    
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabaseInstance = createBrowserClient(url, key);
  }
  return supabaseInstance;
}

// For backward compatibility, but this will throw if accessed during build
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get() {
    throw new Error('Direct supabase import not allowed. Use createClient() instead.');
  }
});
