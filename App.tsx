import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { testSupabaseConnection } from './src/services/testSupabaseConnection';

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');

  useEffect(() => {
    testSupabaseConnection().then((success) => {
      setConnectionStatus(success ? '✅ Supabase Connected!' : '❌ Connection Failed');
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>InstaDish Mobile</Text>
      <Text style={styles.status}>{connectionStatus}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  status: {
    fontSize: 16,
    color: '#666',
  },
});
