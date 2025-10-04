import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Grocery List Detail Screen
 * Shows items in a grocery list with add/remove/check functionality
 * TODO: Implement in issue #14
 */
export default function GroceryListDetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Grocery List Detail Screen</Text>
      <Text style={styles.subtext}>To be implemented in issue #14</Text>
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
