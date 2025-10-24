/**
 * Timer Context
 * Global state management for cooking timers
 * Supports multiple simultaneous timers across recipe steps
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Platform, Vibration } from 'react-native';

export enum TimerStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export interface Timer {
  id: string; // Unique ID: `${recipeId}-${stepIndex}`
  stepIndex: number;
  initialDuration: number; // Initial duration in seconds
  remainingDuration: number; // Remaining time in seconds
  status: TimerStatus;
}

interface TimerContextType {
  timers: Map<string, Timer>;
  startTimer: (id: string, stepIndex: number, duration: number) => void;
  pauseTimer: (id: string) => void;
  resumeTimer: (id: string) => void;
  cancelTimer: (id: string) => void;
  getTimer: (id: string) => Timer | undefined;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

interface TimerProviderProps {
  children: React.ReactNode;
}

export function TimerProvider({ children }: TimerProviderProps) {
  const [timers, setTimers] = useState<Map<string, Timer>>(new Map());
  const intervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Handle timer completion (alert + haptic)
   */
  const handleTimerComplete = useCallback((timerId: string) => {
    // Vibrate device
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate([0, 500, 200, 500]);
    }

    // Update timer status
    setTimers((prev) => {
      const newTimers = new Map(prev);
      const timer = newTimers.get(timerId);
      if (timer) {
        newTimers.set(timerId, {
          ...timer,
          status: TimerStatus.COMPLETED,
          remainingDuration: 0,
        });
      }
      return newTimers;
    });

    // Clear interval
    const interval = intervalRefs.current.get(timerId);
    if (interval) {
      clearInterval(interval);
      intervalRefs.current.delete(timerId);
    }
  }, []);

  /**
   * Start a new timer
   */
  const startTimer = useCallback(async (id: string, stepIndex: number, duration: number) => {
    console.log('Starting timer:', { id, stepIndex, duration });

    // Cancel any existing timer with this ID
    const existingTimer = timers.get(id);
    if (existingTimer) {
      cancelTimer(id);
    }

    // Create timer
    const newTimer: Timer = {
      id,
      stepIndex,
      initialDuration: duration,
      remainingDuration: duration,
      status: TimerStatus.RUNNING,
    };

    setTimers((prev) => new Map(prev).set(id, newTimer));

    // Start countdown interval
    const interval = setInterval(() => {
      setTimers((prev) => {
        const newTimers = new Map(prev);
        const timer = newTimers.get(id);

        if (!timer || timer.status !== TimerStatus.RUNNING) {
          clearInterval(interval);
          intervalRefs.current.delete(id);
          return prev;
        }

        const newRemaining = timer.remainingDuration - 1;

        // Update the timer display first
        newTimers.set(id, {
          ...timer,
          remainingDuration: Math.max(0, newRemaining),
        });

        // Check if timer is complete
        if (newRemaining <= 0) {
          handleTimerComplete(id);
        }

        return newTimers;
      });
    }, 1000);

    intervalRefs.current.set(id, interval);
  }, [timers, handleTimerComplete]);

  /**
   * Pause a running timer
   */
  const pauseTimer = useCallback((id: string) => {
    const timer = timers.get(id);
    if (!timer || timer.status !== TimerStatus.RUNNING) return;

    // Clear interval
    const interval = intervalRefs.current.get(id);
    if (interval) {
      clearInterval(interval);
      intervalRefs.current.delete(id);
    }

    // Update status
    setTimers((prev) => {
      const newTimers = new Map(prev);
      newTimers.set(id, {
        ...timer,
        status: TimerStatus.PAUSED,
      });
      return newTimers;
    });
  }, [timers]);

  /**
   * Resume a paused timer
   */
  const resumeTimer = useCallback(async (id: string) => {
    const timer = timers.get(id);
    if (!timer || timer.status !== TimerStatus.PAUSED) return;

    // Update status
    setTimers((prev) => {
      const newTimers = new Map(prev);
      newTimers.set(id, {
        ...timer,
        status: TimerStatus.RUNNING,
      });
      return newTimers;
    });

    // Restart countdown interval
    const interval = setInterval(() => {
      setTimers((prev) => {
        const newTimers = new Map(prev);
        const currentTimer = newTimers.get(id);

        if (!currentTimer || currentTimer.status !== TimerStatus.RUNNING) {
          clearInterval(interval);
          intervalRefs.current.delete(id);
          return prev;
        }

        const newRemaining = currentTimer.remainingDuration - 1;

        if (newRemaining <= 0) {
          handleTimerComplete(id);
          return newTimers;
        }

        newTimers.set(id, {
          ...currentTimer,
          remainingDuration: newRemaining,
        });

        return newTimers;
      });
    }, 1000);

    intervalRefs.current.set(id, interval);
  }, [timers, handleTimerComplete]);

  /**
   * Cancel a timer completely
   */
  const cancelTimer = useCallback((id: string) => {
    const timer = timers.get(id);
    if (!timer) return;

    // Clear interval
    const interval = intervalRefs.current.get(id);
    if (interval) {
      clearInterval(interval);
      intervalRefs.current.delete(id);
    }

    // Remove timer
    setTimers((prev) => {
      const newTimers = new Map(prev);
      newTimers.delete(id);
      return newTimers;
    });
  }, [timers]);

  /**
   * Get timer by ID
   */
  const getTimer = useCallback((id: string): Timer | undefined => {
    return timers.get(id);
  }, [timers]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Clear all intervals
      intervalRefs.current.forEach((interval) => clearInterval(interval));
      intervalRefs.current.clear();
    };
  }, []);

  const value: TimerContextType = {
    timers,
    startTimer,
    pauseTimer,
    resumeTimer,
    cancelTimer,
    getTimer,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

/**
 * Hook to access timer context
 */
export function useTimer(): TimerContextType {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider');
  }
  return context;
}
