/**
 * StepTimer Component
 * Interactive timer button for recipe steps with time references
 * Features: auto-detect duration, countdown display, pause/resume/cancel controls
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTimer, TimerStatus } from '../contexts/TimerContext';
import { formatDuration } from '../utils/timeDetection';

interface StepTimerProps {
  recipeId: string; // Unique recipe ID
  stepIndex: number; // Step index (0-based)
  duration: number; // Duration in seconds
  stepText: string; // Original step text for display
}

/**
 * StepTimer Component
 * Displays timer button with controls for a specific recipe step
 */
export default function StepTimer({ recipeId, stepIndex, duration, stepText }: StepTimerProps) {
  const { timers, startTimer, pauseTimer, resumeTimer, cancelTimer, getTimer } = useTimer();
  const timerId = `${recipeId}-${stepIndex}`;
  const timer = getTimer(timerId);
  const [showControls, setShowControls] = useState(false);

  /**
   * Show controls when timer is running or paused
   */
  useEffect(() => {
    if (timer && (timer.status === TimerStatus.RUNNING || timer.status === TimerStatus.PAUSED)) {
      setShowControls(true);
    } else if (timer && timer.status === TimerStatus.COMPLETED) {
      // Keep controls visible for a moment after completion
      setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [timer]);

  /**
   * Handle start timer button press
   */
  const handleStart = () => {
    startTimer(timerId, stepIndex, duration);
    setShowControls(true);
  };

  /**
   * Handle pause button press
   */
  const handlePause = () => {
    pauseTimer(timerId);
  };

  /**
   * Handle resume button press
   */
  const handleResume = () => {
    resumeTimer(timerId);
  };

  /**
   * Handle cancel button press
   */
  const handleCancel = () => {
    cancelTimer(timerId);
    setShowControls(false);
  };

  /**
   * Render timer based on status
   */
  const renderTimerContent = () => {
    if (!timer || timer.status === TimerStatus.IDLE) {
      // Idle state: show start button
      return (
        <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
          <MaterialCommunityIcons name="timer-outline" size={24} color="#D97706" />
          <Text style={styles.startButtonText}>Start Timer ({formatDuration(duration)})</Text>
        </TouchableOpacity>
      );
    }

    if (timer.status === TimerStatus.COMPLETED) {
      // Completed state: show completion message
      return (
        <View style={styles.completedContainer}>
          <MaterialCommunityIcons name="check-circle" size={32} color="#10B981" />
          <Text style={styles.completedText}>Timer Complete!</Text>
          <TouchableOpacity style={styles.restartButton} onPress={handleStart}>
            <MaterialCommunityIcons name="restart" size={20} color="#D97706" />
            <Text style={styles.restartButtonText}>Restart</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Running or paused state: show countdown and controls
    const isRunning = timer.status === TimerStatus.RUNNING;
    const isPaused = timer.status === TimerStatus.PAUSED;

    return (
      <View style={styles.activeTimerContainer}>
        {/* Timer Display */}
        <View style={[styles.timerDisplay, isPaused && styles.timerDisplayPaused]}>
          <MaterialCommunityIcons
            name={isRunning ? 'timer' : 'timer-pause'}
            size={32}
            color={isPaused ? '#6B7280' : '#D97706'}
          />
          <Text style={[styles.timerText, isPaused && styles.timerTextPaused]}>
            {formatDuration(timer.remainingDuration)}
          </Text>
        </View>

        {/* Controls */}
        {showControls && (
          <View style={styles.controlsContainer}>
            {/* Pause/Resume Button */}
            {isRunning ? (
              <TouchableOpacity style={styles.controlButton} onPress={handlePause}>
                <MaterialCommunityIcons name="pause" size={24} color="#6B7280" />
                <Text style={styles.controlButtonText}>Pause</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.controlButton} onPress={handleResume}>
                <MaterialCommunityIcons name="play" size={24} color="#D97706" />
                <Text style={styles.controlButtonText}>Resume</Text>
              </TouchableOpacity>
            )}

            {/* Cancel Button */}
            <TouchableOpacity style={styles.controlButton} onPress={handleCancel}>
              <MaterialCommunityIcons name="close" size={24} color="#EF4444" />
              <Text style={styles.controlButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return <View style={styles.container}>{renderTimerContent()}</View>;
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    width: '100%',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D97706',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D97706',
  },
  activeTimerContainer: {
    alignItems: 'center',
    gap: 16,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 20,
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#D97706',
  },
  timerDisplayPaused: {
    backgroundColor: '#F3F4F6',
    borderColor: '#9CA3AF',
  },
  timerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#D97706',
    fontVariant: ['tabular-nums'],
  },
  timerTextPaused: {
    color: '#6B7280',
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  completedContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  completedText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 8,
  },
  restartButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
});
