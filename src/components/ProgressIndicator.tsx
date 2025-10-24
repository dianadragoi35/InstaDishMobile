import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * ProgressIndicator Component
 * Displays current step position and visual progress bar
 * Shows "Step X of Y" with proportional progress visualization
 */
export default function ProgressIndicator({
  currentStep,
  totalSteps,
}: ProgressIndicatorProps) {
  // Calculate progress percentage (0-100)
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      {/* Step Text */}
      <Text style={styles.stepText}>
        Step {currentStep} of {totalSteps}
      </Text>

      {/* Progress Bar Container */}
      <View style={styles.progressBarContainer}>
        {/* Filled Progress Bar */}
        <View
          style={[
            styles.progressBarFill,
            { width: `${progress}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981', // Green primary brand color
    borderRadius: 2,
  },
});
