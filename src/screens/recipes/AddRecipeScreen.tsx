import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Add Recipe Screen
 * AI-powered recipe parser - paste recipe text and parse with Gemini
 * TODO: Implement in issue #10
 */
export default function AddRecipeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Add Recipe Screen</Text>
      <Text style={styles.subtext}>To be implemented in issue #10</Text>
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
