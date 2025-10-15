import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RecipeStep } from '../types';

interface StepCardProps {
  step: RecipeStep;
  stepNumber: number;
  totalSteps: number;
}

/**
 * StepCard Component
 * Displays a single recipe step in cooking mode with large, readable text
 */
export default function StepCard({ step, stepNumber, totalSteps }: StepCardProps) {
  return (
    <View style={styles.container}>
      {/* Step Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Step {stepNumber} of {totalSteps}
        </Text>
      </View>

      {/* Step Number Badge */}
      <View style={styles.stepNumberBadge}>
        <Text style={styles.stepNumberText}>{stepNumber}</Text>
      </View>

      {/* Step Instruction */}
      <Text style={styles.instructionText}>{step.instruction}</Text>

      {/* Optional Timer */}
      {step.time && (
        <View style={styles.timerContainer}>
          <MaterialCommunityIcons name="clock-outline" size={24} color="#D97706" />
          <Text style={styles.timerText}>{step.time} min</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  progressContainer: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  stepNumberBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 3,
    borderColor: '#D97706',
  },
  stepNumberText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#D97706',
  },
  instructionText: {
    fontSize: 26,
    lineHeight: 38,
    color: '#111827',
    textAlign: 'left',
    paddingHorizontal: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D97706',
  },
  timerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#D97706',
  },
});
