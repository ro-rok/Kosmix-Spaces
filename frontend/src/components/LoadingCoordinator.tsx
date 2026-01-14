import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimation } from '@/contexts/AnimationContext';
import { LoadingSpinner, LoadingOverlay } from './LoadingSpinner';

interface LoadingState {
  id: string;
  message?: string;
  progress?: number;
  type: 'page' | 'component' | 'action' | 'global';
}

interface LoadingContextValue {
  loadingStates: LoadingState[];
  isLoading: boolean;
  isPageLoading: boolean;
  isGlobalLoading: boolean;
  startLoading: (id: string, options?: Partial<LoadingState>) => void;
  stopLoading: (id: string) => void;
  updateLoading: (id: string, updates: Partial<LoadingState>) => void;
  clearAllLoading: () => void;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

/**
 * Hook to use loading coordination
 */
export function useLoadingCoordinator(): LoadingContextValue {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingCoordinator must be used within a LoadingCoordinatorProvider');
  }
  return context;
}

/**
 * Loading coordinator provider
 */
interface LoadingCoordinatorProviderProps {
  children: React.ReactNode;
  /**
   * Show global loading overlay for page-type loading states
   */
  showGlobalOverlay?: boolean;
  /**
   * Auto-clear loading states after timeout (ms)
   */
  autoTimeout?: number;
}

export function LoadingCoordinatorProvider({
  children,
  showGlobalOverlay = true,
  autoTimeout = 30000, // 30 seconds default timeout
}: LoadingCoordinatorProviderProps) {
  const [loadingStates, setLoadingStates] = useState<LoadingState[]>([]);
  const { config } = useAnimation();

  // Computed states
  const isLoading = loadingStates.length > 0;
  const isPageLoading = loadingStates.some(state => state.type === 'page');
  const isGlobalLoading = loadingStates.some(state => state.type === 'global');

  // Start loading
  const startLoading = useCallback((id: string, options: Partial<LoadingState> = {}) => {
    const newState: LoadingState = {
      id,
      type: 'component',
      ...options,
    };

    setLoadingStates(prev => {
      // Remove existing state with same ID
      const filtered = prev.filter(state => state.id !== id);
      return [...filtered, newState];
    });

    // Auto-timeout
    if (autoTimeout > 0) {
      setTimeout(() => {
        stopLoading(id);
      }, autoTimeout);
    }
  }, [autoTimeout]);

  // Stop loading
  const stopLoading = useCallback((id: string) => {
    setLoadingStates(prev => prev.filter(state => state.id !== id));
  }, []);

  // Update loading state
  const updateLoading = useCallback((id: string, updates: Partial<LoadingState>) => {
    setLoadingStates(prev => 
      prev.map(state => 
        state.id === id ? { ...state, ...updates } : state
      )
    );
  }, []);

  // Clear all loading states
  const clearAllLoading = useCallback(() => {
    setLoadingStates([]);
  }, []);

  // Context value
  const contextValue: LoadingContextValue = {
    loadingStates,
    isLoading,
    isPageLoading,
    isGlobalLoading,
    startLoading,
    stopLoading,
    updateLoading,
    clearAllLoading,
  };

  // Get primary loading state for overlay
  const primaryLoadingState = loadingStates.find(state => 
    state.type === 'global' || state.type === 'page'
  ) || loadingStates[0];

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      
      {/* Global loading overlay */}
      {showGlobalOverlay && (isGlobalLoading || isPageLoading) && (
        <LoadingOverlay
          show={true}
          text={primaryLoadingState?.message || 'Loading...'}
          background="blur"
          size="lg"
          variant="spinner"
        />
      )}
    </LoadingContext.Provider>
  );
}

/**
 * Component-level loading wrapper
 */
interface LoadingWrapperProps {
  children: React.ReactNode;
  /**
   * Loading ID for coordination
   */
  loadingId: string;
  /**
   * Show loading state
   */
  loading?: boolean;
  /**
   * Loading message
   */
  message?: string;
  /**
   * Loading spinner props
   */
  spinnerProps?: React.ComponentProps<typeof LoadingSpinner>;
  /**
   * Fallback content during loading
   */
  fallback?: React.ReactNode;
  /**
   * Minimum loading duration (ms) to prevent flashing
   */
  minDuration?: number;
  /**
   * Delay before showing loading (ms) to prevent flashing for quick operations
   */
  delay?: number;
}

export function LoadingWrapper({
  children,
  loadingId,
  loading = false,
  message,
  spinnerProps,
  fallback,
  minDuration = 300,
  delay = 100,
}: LoadingWrapperProps) {
  const { startLoading, stopLoading } = useLoadingCoordinator();
  const { config, isReducedMotion } = useAnimation();
  const [showLoading, setShowLoading] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  // Handle loading state changes
  useEffect(() => {
    if (loading) {
      // Start loading with delay
      const delayTimer = setTimeout(() => {
        setShowLoading(true);
        setLoadingStartTime(Date.now());
        startLoading(loadingId, { 
          type: 'component', 
          message 
        });
      }, delay);

      return () => clearTimeout(delayTimer);
    } else {
      // Stop loading with minimum duration
      if (loadingStartTime && showLoading) {
        const elapsed = Date.now() - loadingStartTime;
        const remaining = Math.max(0, minDuration - elapsed);

        setTimeout(() => {
          setShowLoading(false);
          setLoadingStartTime(null);
          stopLoading(loadingId);
        }, remaining);
      } else {
        setShowLoading(false);
        setLoadingStartTime(null);
        stopLoading(loadingId);
      }
    }
  }, [loading, loadingId, message, startLoading, stopLoading, delay, minDuration, loadingStartTime, showLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLoading(loadingId);
    };
  }, [loadingId, stopLoading]);

  const contentVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const loadingVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  if (isReducedMotion) {
    return showLoading ? (
      fallback || (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner
            text={message}
            {...spinnerProps}
          />
        </div>
      )
    ) : (
      <>{children}</>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {showLoading ? (
        <motion.div
          key="loading"
          variants={loadingVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            duration: config.transitions.defaultDuration,
          }}
        >
          {fallback || (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner
                text={message}
                {...spinnerProps}
              />
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          variants={contentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            duration: config.transitions.defaultDuration,
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook for managing async operations with loading coordination
 */
export function useAsyncOperation() {
  const { startLoading, stopLoading, updateLoading } = useLoadingCoordinator();

  const executeWithLoading = useCallback(<T,>(
    operation: () => Promise<T>,
    options: {
      loadingId: string;
      message?: string;
      onProgress?: (progress: number) => void;
    }
  ): Promise<T> => {
    const { loadingId, message, onProgress } = options;

    return (async () => {
      try {
        startLoading(loadingId, { 
          type: 'action', 
          message,
          progress: 0,
        });

        // If progress callback is provided, set up progress updates
        if (onProgress) {
          const progressInterval = setInterval(() => {
            // This is a simple progress simulation
            // In real usage, the operation should call onProgress with actual progress
          }, 100);

          const result = await operation();
          clearInterval(progressInterval);
          return result;
        } else {
          return await operation();
        }
      } finally {
        stopLoading(loadingId);
      }
    })();
  }, [startLoading, stopLoading]);

  return {
    executeWithLoading,
    startLoading,
    stopLoading,
    updateLoading,
  };
}

/**
 * Progress indicator component
 */
interface ProgressIndicatorProps {
  /**
   * Progress value (0-100)
   */
  progress: number;
  /**
   * Show progress text
   */
  showText?: boolean;
  /**
   * Custom message
   */
  message?: string;
  /**
   * Size of progress bar
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Color theme
   */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export function ProgressIndicator({
  progress,
  showText = true,
  message,
  size = 'md',
  color = 'primary',
}: ProgressIndicatorProps) {
  const { config, isReducedMotion } = useAnimation();

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
  };

  const progressAnimation = isReducedMotion ? {} : {
    initial: { width: 0 },
    animate: { width: `${progress}%` },
    transition: {
      duration: config.transitions.defaultDuration,
      ease: config.transitions.defaultEasing as any,
    },
  };

  return (
    <div className="w-full space-y-2">
      {(showText || message) && (
        <div className="flex justify-between items-center text-sm">
          <span>{message || 'Loading...'}</span>
          {showText && <span>{Math.round(progress)}%</span>}
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <motion.div
          className={`h-full ${colorClasses[color]} rounded-full`}
          {...progressAnimation}
        />
      </div>
    </div>
  );
}

export default LoadingCoordinatorProvider;