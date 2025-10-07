import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/config/queryClient';
import AppNavigator from './src/navigation/AppNavigator';
import { useEffect, useState } from 'react';
import { supabase } from './src/services/supabase';
import AuthScreen from './src/screens/auth/AuthScreen';
import { ActivityIndicator, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Loading state
  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {isAuthenticated ? <AppNavigator /> : <AuthScreen />}
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
