import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Recipe Detail Screen
 * Shows full recipe details with ingredients and instructions
 * TODO: Implement in issue #12
 */
export default function RecipeDetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Recipe Detail Screen</Text>
      <Text style={styles.subtext}>To be implemented in issue #12</Text>
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
