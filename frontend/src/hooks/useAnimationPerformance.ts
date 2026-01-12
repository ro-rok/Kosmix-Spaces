import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  globalDegradationManager, 
  globalPerformanceMonitor,
  globalResourceManager,
  type PerformanceMetrics,
  type DevicePerformanceProfile 
} from '../lib/animation-performance';
import { getAnimationRegistry } from '../lib/animation-registry';

export interface AnimationPerformanceHookReturn {
  metrics: PerformanceMetrics;
  deviceProfile: DevicePerformanceProfile;
  isPerformanceGood: boolean;
  activeAnimationCount: number;
  resourceCount: number;
  pauseAnimations: () => void;
  resumeAnimations: () => void;
  forceCleanup: () => void;
  refreshMetrics: () => void;
}

export interface UseAnimationPerformanceOptions {
  autoStart?: boolean;
  refreshInterval?: number;
  onPerformanceDegradation?: (metrics: PerformanceMetrics) => void;
  onPerformanceRecovery?: (metrics: PerformanceMetrics) => void;
}

export function useAnimationPerformance(
  options: UseAnimationPerformanceOptions = {}
): AnimationPerformanceHookReturn {
  const {
    autoStart = true,
    refreshInterval = 1000,
    onPerformanceDegradation,
    onPerformanceRecovery
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>(() => 
    globalDegradationManager.getMetrics()
  );
  const [deviceProfile, setDeviceProfile] = useState<DevicePerformanceProfile>(() =>
    globalDegradationManager.getDeviceProfile()
  );
  const [activeAnimationCount, setActiveAnimationCount] = useState(0);
  const [resourceCount, setResourceCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const degradationUnsubscribeRef = useRef<(() => void) | null>(null);

  // Refresh all metrics
  const refreshMetrics = useCallback(() => {
    const newMetrics = globalDegradationManager.getMetrics();
    const newProfile = globalDegradationManager.getDeviceProfile();
    const registry = getAnimationRegistry();
    
    setMetrics(newMetrics);
    setDeviceProfile(newProfile);
    setActiveAnimationCount(registry.getActive().length);
    setResourceCount(globalResourceManager.getActiveResourceCount());
  }, []);

  // Pause all animations
  const pauseAnimations = useCallback(() => {
    if (isPaused) return;
    
    const registry = getAnimationRegistry();
    const activeAnimations = registry.getActive();
    
    // Store current animations and clear registry
    sessionStorage.setItem('pausedAnimations', JSON.stringify(activeAnimations));
    registry.cleanup();
    
    setIsPaused(true);
    console.log('Animations paused for performance');
  }, [isPaused]);

  // Resume animations
  const resumeAnimations = useCallback(() => {
    if (!isPaused) return;
    
    // Note: Resuming animations would require storing more metadata
    // For now, we just clear the paused state
    sessionStorage.removeItem('pausedAnimations');
    setIsPaused(false);
    console.log('Animations resumed');
  }, [isPaused]);

  // Force cleanup of all resources
  const forceCleanup = useCallback(() => {
    const registry = getAnimationRegistry();
    registry.cleanup();
    globalResourceManager.cleanupAll();
    refreshMetrics();
    console.log('Forced cleanup of all animation resources');
  }, [refreshMetrics]);

  // Set up performance monitoring
  useEffect(() => {
    if (!autoStart) return;

    // Set up degradation callbacks
    const unsubscribe = globalDegradationManager.onDegradation((profile) => {
      setDeviceProfile(profile);
      
      // Update animation registry with new profile
      const registry = getAnimationRegistry();
      if ('updateDeviceProfile' in registry) {
        (registry as any).updateDeviceProfile(profile);
      }
      
      // Auto-pause if performance is critical
      if (profile.tier === 'low' && profile.maxConcurrentAnimations === 0) {
        pauseAnimations();
      }
    });

    degradationUnsubscribeRef.current = unsubscribe;

    // Set up performance callbacks
    globalPerformanceMonitor.startMonitoring(
      (metrics) => {
        onPerformanceDegradation?.(metrics);
        console.warn('Performance degradation detected:', metrics);
      },
      (metrics) => {
        onPerformanceRecovery?.(metrics);
        console.log('Performance recovered:', metrics);
        if (isPaused) {
          resumeAnimations();
        }
      },
      (isVisible) => {
        if (!isVisible) {
          pauseAnimations();
        } else if (!isPaused) {
          resumeAnimations();
        }
      }
    );

    return () => {
      if (degradationUnsubscribeRef.current) {
        degradationUnsubscribeRef.current();
      }
      globalPerformanceMonitor.stopMonitoring();
    };
  }, [autoStart, onPerformanceDegradation, onPerformanceRecovery, pauseAnimations, resumeAnimations, isPaused]);

  // Set up metrics refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(refreshMetrics, refreshInterval);
      
      // Initial refresh
      refreshMetrics();
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refreshInterval, refreshMetrics]);

  // Determine if performance is good
  const isPerformanceGood = metrics.fps >= 30 && 
                           activeAnimationCount <= deviceProfile.maxConcurrentAnimations &&
                           !isPaused;

  return {
    metrics,
    deviceProfile,
    isPerformanceGood,
    activeAnimationCount,
    resourceCount,
    pauseAnimations,
    resumeAnimations,
    forceCleanup,
    refreshMetrics,
  };
}

// Hook for automatic performance management
export function useAutoPerformanceManagement(
  options: {
    enableAutoPause?: boolean;
    enableAutoCleanup?: boolean;
    performanceThreshold?: number;
  } = {}
) {
  const {
    enableAutoPause = true,
    enableAutoCleanup = true,
    performanceThreshold = 25
  } = options;

  const { 
    metrics, 
    isPerformanceGood, 
    pauseAnimations, 
    resumeAnimations, 
    forceCleanup 
  } = useAnimationPerformance({
    autoStart: true,
    refreshInterval: 500, // More frequent monitoring for auto-management
  });

  const lastPerformanceState = useRef(isPerformanceGood);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-pause/resume based on performance
  useEffect(() => {
    if (!enableAutoPause) return;

    const currentPerformanceGood = metrics.fps >= performanceThreshold;
    
    if (lastPerformanceState.current && !currentPerformanceGood) {
      // Performance degraded
      pauseAnimations();
    } else if (!lastPerformanceState.current && currentPerformanceGood) {
      // Performance recovered
      resumeAnimations();
    }
    
    lastPerformanceState.current = currentPerformanceGood;
  }, [metrics.fps, performanceThreshold, enableAutoPause, pauseAnimations, resumeAnimations]);

  // Auto-cleanup after period of inactivity
  useEffect(() => {
    if (!enableAutoCleanup) return;

    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }

    // Schedule cleanup if no animations are active
    if (metrics.animationCount === 0) {
      cleanupTimeoutRef.current = setTimeout(() => {
        forceCleanup();
      }, 30000); // 30 seconds of inactivity
    }

    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, [metrics.animationCount, enableAutoCleanup, forceCleanup]);

  return {
    isAutoManaged: enableAutoPause || enableAutoCleanup,
    currentFPS: metrics.fps,
    isPerformanceGood: metrics.fps >= performanceThreshold,
  };
}

export default useAnimationPerformance;