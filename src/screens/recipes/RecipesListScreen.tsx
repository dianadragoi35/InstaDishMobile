import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Recipes List Screen
 * Shows all user recipes with search and add functionality
 * TODO: Implement in issue #11
 */
export default function RecipesListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Recipes List Screen</Text>
      <Text style={styles.subtext}>To be implemented in issue #11</Text>
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
