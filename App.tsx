import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/config/queryClient';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import AuthScreen from './src/screens/auth/AuthScreen';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

function AppContent() {
  const { user, isLoading } = useAuth();

  // Loading state while checking authentication
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  // Show auth screen if not authenticated, otherwise show main app
  return (
    <>
      {user ? <AppNavigator /> : <AuthScreen />}
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
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
