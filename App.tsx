import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/config/queryClient';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { TimerProvider } from './src/contexts/TimerContext';
import AuthScreen from './src/screens/auth/AuthScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';

const RootStack = createNativeStackNavigator();

const linking = {
  prefixes: ['instadish://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
    },
  },
};

function AppContent() {
  const { user, isLoading, session, verifyRecoveryToken } = useAuth();
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Check if app was opened with a deep link
    Linking.getInitialURL().then(async (url) => {
      if (url?.includes('reset-password') || url?.includes('type=recovery')) {
        await handleRecoveryLink(url);
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      if (url.includes('reset-password') || url.includes('type=recovery')) {
        await handleRecoveryLink(url);
      }
    });

    return () => subscription.remove();
  }, []);

  async function handleRecoveryLink(url: string) {
    console.log('Handling recovery link:', url);

    setIsVerifying(true);

    try {
      // Check if URL contains access_token in hash (Supabase redirect format)
      const hashMatch = url.match(/#(.+)/);
      if (hashMatch) {
        const hashParams = new URLSearchParams(hashMatch[1]);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('Setting session from hash params');
          await verifyRecoveryToken(accessToken, refreshToken);
        }
      }

      // Wait briefly for session to be established
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error handling recovery link:', error);
    } finally {
      setIsVerifying(false);
      setShowResetPassword(true);
    }
  }

  // Loading state while checking authentication or verifying token
  if (isLoading || isVerifying) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  // Show reset password screen if coming from email link (prioritize over main app)
  if (showResetPassword) {
    return (
      <NavigationContainer linking={linking}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="ResetPassword">
            {(props) => (
              <ResetPasswordScreen
                {...props}
                onPasswordUpdated={() => setShowResetPassword(false)}
              />
            )}
          </RootStack.Screen>
        </RootStack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    );
  }

  // If user is authenticated, show main app
  if (user) {
    return (
      <>
        <AppNavigator />
        <StatusBar style="auto" />
      </>
    );
  }

  // Otherwise show auth screen
  return (
    <>
      <AuthScreen />
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TimerProvider>
          <AppContent />
        </TimerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});
