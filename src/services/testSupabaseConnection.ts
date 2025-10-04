import { supabase } from './supabase';

/**
 * Test Supabase connection by attempting to fetch session
 * This will verify that the client is properly configured
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    // Test 1: Check if client is initialized
    if (!supabase) {
      console.error('❌ Supabase client is not initialized');
      return false;
    }

    // Test 2: Try to get current session (even if null, connection works)
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Supabase connection error:', error.message);
      return false;
    }

    console.log('✅ Supabase client connected successfully');
    console.log('Session:', data.session ? 'Active' : 'No active session');

    // Test 3: Verify auth methods are available
    const authMethods = {
      signUp: typeof supabase.auth.signUp === 'function',
      signIn: typeof supabase.auth.signInWithPassword === 'function',
      signOut: typeof supabase.auth.signOut === 'function',
    };

    console.log('Auth methods available:', authMethods);

    return true;
  } catch (error) {
    console.error('❌ Unexpected error testing Supabase connection:', error);
    return false;
  }
}
