import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { useAnimation } from '@/contexts/AnimationContext';

export interface PageTransitionState {
  isTransitioning: boolean;
  direction: 'forward' | 'backward' | 'replace' | 'initial';
  previousPath: string | null;
  currentPath: string;
  transitionId: string;
  progress: number; // 0-1 transition progress
  phase: 'entering' | 'exiting' | 'idle'; // Current transition phase
}

export interface UsePageTransitionOptions {
  /**
   * Duration to consider a transition active (ms)
   */
  transitionDuration?: number;
  /**
   * Callback when transition starts
   */
  onTransitionStart?: (state: PageTransitionState) => void;
  /**
   * Callback when transition completes
   */
  onTransitionComplete?: (state: PageTransitionState) => void;
  /**
   * Callback for transition progress updates
   */
  onTransitionProgress?: (progress: number, state: PageTransitionState) => void;
  /**
   * Disable transition tracking
   */
  disabled?: boolean;
  /**
   * Enable smooth progress tracking
   */
  enableProgressTracking?: boolean;
  /**
   * Delay before starting transition (ms)
   */
  startDelay?: number;
}

/**
 * Hook for managing page transitions with React Router
 * Provides state and utilities for coordinating animations with navigation
 * Enhanced with progress tracking and animation system integration
 */
export function usePageTransition(options: UsePageTransitionOptions = {}) {
  const {
    transitionDuration,
    onTransitionStart,
    onTransitionComplete,
    onTransitionProgress,
    disabled = false,
    enableProgressTracking = false,
    startDelay = 0,
  } = options;

  const location = useLocation();
  const navigationType = useNavigationType();
  const { config, isReducedMotion, animationRegistry } = useAnimation();
  
  const [transitionState, setTransitionState] = useState<PageTransitionState>({
    isTransitioning: false,
    direction: 'initial',
    previousPath: null,
    currentPath: location.pathname,
    transitionId: '',
    progress: 0,
    phase: 'idle',
  });

  const previousLocationRef = useRef(location);
  const transitionTimeoutRef = useRef<NodeJS.Timeout>();
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const transitionIdRef = useRef(0);
  const animationIdRef = useRef<string>('');

  // Calculate effective transition duration (respect reduced motion)
  const effectiveDuration = useMemo(() => {
    const baseDuration = transitionDuration || (config.transitions.defaultDuration * 1000);
    
    if (isReducedMotion && config.accessibility.fallbackToInstant) {
      return 0;
    }
    
    if (isReducedMotion) {
      return Math.min(baseDuration, 100); // Max 100ms for reduced motion
    }
    
    return baseDuration;
  }, [transitionDuration, config.transitions.defaultDuration, config.accessibility.fallbackToInstant, isReducedMotion]);

  // Progress tracking function
  const startProgressTracking = useCallback((duration: number, transitionId: string) => {
    if (!enableProgressTracking || duration === 0) return;

    const startTime = Date.now();
    const updateInterval = 16; // ~60fps

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setTransitionState(prev => {
        if (prev.transitionId !== transitionId) return prev; // Transition changed
        
        const newState = {
          ...prev,
          progress,
          phase: progress < 0.5 ? 'exiting' as const : 'entering' as const,
        };
        
        onTransitionProgress?.(progress, newState);
        return newState;
      });

      if (progress < 1) {
        progressIntervalRef.current = setTimeout(updateProgress, updateInterval);
      }
    };

    progressIntervalRef.current = setTimeout(updateProgress, updateInterval);
  }, [enableProgressTracking, onTransitionProgress]);

  // Clear progress tracking
  const clearProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearTimeout(progressIntervalRef.current);
      progressIntervalRef.current = undefined;
    }
  }, []);
  // Determine transition direction based on navigation type
  const getTransitionDirection = useCallback((navType: string): PageTransitionState['direction'] => {
    switch (navType) {
      case 'POP':
        return 'backward';
      case 'PUSH':
        return 'forward';
      case 'REPLACE':
        return 'replace';
      default:
        return 'initial';
    }
  }, []);

  // Handle location changes
  useEffect(() => {
    if (disabled) return;

    const previousLocation = previousLocationRef.current;
    const currentLocation = location;

    // Skip if location hasn't actually changed
    if (previousLocation.pathname === currentLocation.pathname && 
        previousLocation.search === currentLocation.search) {
      return;
    }

    // Clear any existing progress tracking
    clearProgressTracking();

    // Generate unique transition ID and register with animation system
    const transitionId = `transition-${++transitionIdRef.current}`;
    const animationId = `page-transition-${transitionId}`;
    animationIdRef.current = animationId;
    
    // Create new transition state
    const newState: PageTransitionState = {
      isTransitioning: true,
      direction: getTransitionDirection(navigationType),
      previousPath: previousLocation.pathname,
      currentPath: currentLocation.pathname,
      transitionId,
      progress: 0,
      phase: 'exiting',
    };

    // Register transition with animation registry
    animationRegistry.register({
      id: animationId,
      type: 'transition',
      priority: 2, // HIGH priority
      startTime: performance.now(),
      cleanup: () => {
        clearProgressTracking();
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
      },
    });

    // Start transition with optional delay
    const startTransition = () => {
      setTransitionState(newState);
      onTransitionStart?.(newState);

      // Start progress tracking
      startProgressTracking(effectiveDuration, transitionId);

      // Clear existing timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      // Set timeout to mark transition as complete
      transitionTimeoutRef.current = setTimeout(() => {
        const completedState: PageTransitionState = {
          ...newState,
          isTransitioning: false,
          progress: 1,
          phase: 'idle',
        };
        
        setTransitionState(completedState);
        onTransitionComplete?.(completedState);
        
        // Unregister from animation system
        animationRegistry.unregister(animationId);
        clearProgressTracking();
      }, effectiveDuration);
    };

    if (startDelay > 0) {
      setTimeout(startTransition, startDelay);
    } else {
      startTransition();
    }

    // Update previous location reference
    previousLocationRef.current = currentLocation;

    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      clearProgressTracking();
      if (animationIdRef.current) {
        animationRegistry.unregister(animationIdRef.current);
      }
    };
  }, [
    location, 
    navigationType, 
    disabled, 
    effectiveDuration, 
    startDelay,
    getTransitionDirection, 
    onTransitionStart, 
    onTransitionComplete,
    startProgressTracking,
    clearProgressTracking,
    animationRegistry,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      clearProgressTracking();
      if (animationIdRef.current) {
        animationRegistry.unregister(animationIdRef.current);
      }
    };
  }, [clearProgressTracking, animationRegistry]);

  // Manual transition control
  const startTransition = useCallback((customDirection?: PageTransitionState['direction']) => {
    if (disabled) return;

    const transitionId = `manual-transition-${++transitionIdRef.current}`;
    const animationId = `manual-page-transition-${transitionId}`;
    
    const newState: PageTransitionState = {
      isTransitioning: true,
      direction: customDirection || 'forward',
      previousPath: transitionState.currentPath,
      currentPath: location.pathname,
      transitionId,
      progress: 0,
      phase: 'exiting',
    };

    // Register with animation system
    animationRegistry.register({
      id: animationId,
      type: 'transition',
      priority: 2, // HIGH priority
      startTime: performance.now(),
      cleanup: () => {
        clearProgressTracking();
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
      },
    });

    setTransitionState(newState);
    onTransitionStart?.(newState);
    
    // Start progress tracking
    startProgressTracking(effectiveDuration, transitionId);
  }, [
    disabled, 
    transitionState.currentPath, 
    location.pathname, 
    onTransitionStart, 
    animationRegistry, 
    clearProgressTracking, 
    startProgressTracking, 
    effectiveDuration
  ]);

  const completeTransition = useCallback(() => {
    if (!transitionState.isTransitioning) return;

    const completedState: PageTransitionState = {
      ...transitionState,
      isTransitioning: false,
      progress: 1,
      phase: 'idle',
    };

    setTransitionState(completedState);
    onTransitionComplete?.(completedState);
    clearProgressTracking();

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    if (animationIdRef.current) {
      animationRegistry.unregister(animationIdRef.current);
    }
  }, [transitionState, onTransitionComplete, clearProgressTracking, animationRegistry]);

  // Utility functions
  const isNavigatingTo = useCallback((path: string) => {
    return transitionState.isTransitioning && transitionState.currentPath === path;
  }, [transitionState]);

  const isNavigatingFrom = useCallback((path: string) => {
    return transitionState.isTransitioning && transitionState.previousPath === path;
  }, [transitionState]);

  // Enhanced utility functions
  const getTransitionProgress = useCallback(() => {
    return transitionState.progress;
  }, [transitionState.progress]);

  const isInPhase = useCallback((phase: PageTransitionState['phase']) => {
    return transitionState.phase === phase;
  }, [transitionState.phase]);

  const canNavigate = !transitionState.isTransitioning;

  return {
    // State
    ...transitionState,
    canNavigate,
    
    // Utilities
    isNavigatingTo,
    isNavigatingFrom,
    getTransitionProgress,
    isInPhase,
    
    // Manual control
    startTransition,
    completeTransition,
    
    // Configuration
    effectiveDuration,
    isReducedMotion,
  };
}

/**
 * Hook for coordinating content loading with page transitions
 * Enhanced with better timing control and loading state management
 */
export function useTransitionCoordination(options: {
  /**
   * Minimum loading time to show loading state (ms)
   */
  minLoadingTime?: number;
  /**
   * Maximum time to wait for content before proceeding (ms)
   */
  maxWaitTime?: number;
  /**
   * Callback when content loading starts
   */
  onLoadingStart?: () => void;
  /**
   * Callback when content loading completes
   */
  onLoadingComplete?: () => void;
} = {}) {
  const { 
    minLoadingTime = 200, 
    maxWaitTime = 5000,
    onLoadingStart,
    onLoadingComplete,
  } = options;
  
  const { 
    isTransitioning, 
    direction, 
    completeTransition, 
    progress, 
    phase 
  } = usePageTransition({
    enableProgressTracking: true,
  });
  
  const [contentReady, setContentReady] = useState(true);
  const [shouldDelayTransition, setShouldDelayTransition] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();
  const minTimeTimeoutRef = useRef<NodeJS.Timeout>();

  // Mark content as loading
  const startContentLoading = useCallback(() => {
    setContentReady(false);
    setShouldDelayTransition(true);
    setLoadingStartTime(Date.now());
    onLoadingStart?.();
    
    // Set maximum wait time
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn('Content loading timed out, proceeding with transition');
      completeContentLoading();
    }, maxWaitTime);
  }, [maxWaitTime, onLoadingStart]);

  // Mark content as ready
  const completeContentLoading = useCallback(() => {
    const now = Date.now();
    const loadingDuration = loadingStartTime ? now - loadingStartTime : 0;
    
    const finishLoading = () => {
      setContentReady(true);
      onLoadingComplete?.();
      
      // If we were delaying a transition, complete it now
      if (shouldDelayTransition && isTransitioning) {
        setTimeout(completeTransition, 50); // Small delay for smooth coordination
        setShouldDelayTransition(false);
      }
      
      // Clear timeouts
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (minTimeTimeoutRef.current) {
        clearTimeout(minTimeTimeoutRef.current);
      }
    };
    
    // Ensure minimum loading time is respected
    if (loadingDuration < minLoadingTime) {
      const remainingTime = minLoadingTime - loadingDuration;
      minTimeTimeoutRef.current = setTimeout(finishLoading, remainingTime);
    } else {
      finishLoading();
    }
  }, [
    loadingStartTime, 
    minLoadingTime, 
    shouldDelayTransition, 
    isTransitioning, 
    completeTransition, 
    onLoadingComplete
  ]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (minTimeTimeoutRef.current) {
        clearTimeout(minTimeTimeoutRef.current);
      }
    };
  }, []);

  return {
    isTransitioning,
    direction,
    progress,
    phase,
    contentReady,
    shouldDelayTransition,
    isLoading: !contentReady,
    startContentLoading,
    completeContentLoading,
  };
}

export default usePageTransition;