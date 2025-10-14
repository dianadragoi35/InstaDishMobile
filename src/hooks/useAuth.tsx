import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  verifyRecoveryToken: (accessToken: string, refreshToken?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'instadish_auth_token';
const AUTH_REFRESH_TOKEN_KEY = 'instadish_refresh_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Store tokens securely when session changes
        if (session) {
          await SecureStore.setItemAsync(AUTH_TOKEN_KEY, session.access_token);
          if (session.refresh_token) {
            await SecureStore.setItemAsync(AUTH_REFRESH_TOKEN_KEY, session.refresh_token);
          }
        } else {
          // Clear tokens on logout
          await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
          await SecureStore.deleteItemAsync(AUTH_REFRESH_TOKEN_KEY);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function initializeAuth(): Promise<void> {
    try {
      // Try to restore session from Supabase client storage (AsyncStorage)
      const { data: { session: existingSession } } = await supabase.auth.getSession();

      if (existingSession) {
        setSession(existingSession);
        setUser(existingSession.user);
      } else {
        // Try to restore from SecureStore as fallback
        const accessToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        const refreshToken = await SecureStore.getItemAsync(AUTH_REFRESH_TOKEN_KEY);

        if (accessToken && refreshToken) {
          // Attempt to refresh the session
          const { data: { session: refreshedSession }, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Session restore failed:', error.message);
            // Clear invalid tokens
            await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
            await SecureStore.deleteItemAsync(AUTH_REFRESH_TOKEN_KEY);
          } else if (refreshedSession) {
            setSession(refreshedSession);
            setUser(refreshedSession.user);
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signUp(email: string, password: string): Promise<void> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        throw new Error('Please check your email to confirm your account');
      }

      // Session will be set automatically via onAuthStateChange
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  }

  async function signIn(email: string, password: string): Promise<void> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Session will be set automatically via onAuthStateChange
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  async function signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Clear local state and secure storage
      setSession(null);
      setUser(null);
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(AUTH_REFRESH_TOKEN_KEY);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  }

  async function resetPassword(email: string): Promise<void> {
    try {
      // Use a custom redirect URL that includes access_token and refresh_token as hash params
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'instadish://reset-password',
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.message || 'Failed to send reset email');
    }
  }

  async function updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Update password error:', error);
      throw new Error(error.message || 'Failed to update password');
    }
  }

  async function verifyRecoveryToken(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      // Establish a full session using the tokens from the recovery link
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });

      if (error) {
        throw error;
      }

      console.log('Recovery session established for user:', data.user?.email);
      // Session will be set automatically via onAuthStateChange
    } catch (error: any) {
      console.error('Verify recovery token error:', error);
      throw new Error(error.message || 'Failed to verify recovery token');
    }
  }

  const value: AuthContextType = {
    session,
    user,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    verifyRecoveryToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
