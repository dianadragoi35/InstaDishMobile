import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Grocery Lists Screen
 * Shows all grocery lists with create functionality
 * TODO: Implement in issue #13
 */
export default function GroceryListsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Grocery Lists Screen</Text>
      <Text style={styles.subtext}>To be implemented in issue #13</Text>
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
