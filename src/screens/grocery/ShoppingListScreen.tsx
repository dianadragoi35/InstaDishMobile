import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Shopping List Screen
 * Shows all ingredients marked "need to buy" across all lists
 * TODO: Implement in issue #15
 */
export default function ShoppingListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Shopping List Screen</Text>
      <Text style={styles.subtext}>To be implemented in issue #15</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#6B7280',
  },
});
