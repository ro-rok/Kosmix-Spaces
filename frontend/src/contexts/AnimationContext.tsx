import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { AnimationContextValue } from '../types/animation.d';
import {
  type AnimationConfig,
  type DeviceCapabilities,
  type AnimationPresets,
  animationPresets,
  detectDeviceCapabilities,
  selectPresetForDevice,
  defaultAnimationConfig,
} from '../lib/animation-config';
import { getAnimationRegistry, type AnimationRegistryImpl } from '../lib/animation-registry';
import { 
  globalDegradationManager, 
  type DevicePerformanceProfile 
} from '../lib/animation-performance';
import { useAnimationPerformance } from '../hooks/useAnimationPerformance';
import type Lenis from 'lenis';

// Create the animation context
const AnimationContext = createContext<AnimationContextValue | null>(null);

// Animation provider props
interface AnimationProviderProps {
  children: React.ReactNode;
  initialPreset?: keyof AnimationPresets;
  customConfig?: Partial<AnimationConfig>;
}

// Custom hook to use animation context
export function useAnimation(): AnimationContextValue {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
}

// Animation provider component
export function AnimationProvider({ 
  children, 
  initialPreset,
  customConfig 
}: AnimationProviderProps) {
  // State for device capabilities and reduced motion
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities>(() => 
    detectDeviceCapabilities()
  );
  
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(() => 
    deviceCapabilities.reducedMotion
  );
  
  // Performance monitoring integration
  const {
    deviceProfile,
    isPerformanceGood,
    pauseAnimations,
    resumeAnimations,
  } = useAnimationPerformance({
    autoStart: true,
    onPerformanceDegradation: (metrics) => {
      console.warn('Animation performance degraded:', metrics);
      // Automatically switch to performance preset if performance is bad
      if (metrics.fps < 20) {
        resetToPreset('performance');
      }
    },
    onPerformanceRecovery: (metrics) => {
      console.log('Animation performance recovered:', metrics);
    },
  });
  
  // State for animation configuration
  const [config, setConfig] = useState<AnimationConfig>(() => {
    // Determine initial configuration
    let baseConfig: AnimationConfig;
    
    if (initialPreset) {
      baseConfig = animationPresets[initialPreset];
    } else {
      const autoPreset = selectPresetForDevice(deviceCapabilities);
      baseConfig = animationPresets[autoPreset];
    }
    
    // Apply custom config overrides if provided
    if (customConfig) {
      return {
        ...baseConfig,
        ...customConfig,
        // Deep merge nested objects
        smoothScroll: { ...baseConfig.smoothScroll, ...customConfig.smoothScroll },
        transitions: { ...baseConfig.transitions, ...customConfig.transitions },
        scrollAnimations: { ...baseConfig.scrollAnimations, ...customConfig.scrollAnimations },
        microInteractions: { ...baseConfig.microInteractions, ...customConfig.microInteractions },
        accessibility: { ...baseConfig.accessibility, ...customConfig.accessibility },
        performance: { ...baseConfig.performance, ...customConfig.performance },
      };
    }
    
    return baseConfig;
  });
  
  // State for Lenis instance
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Initialize animation registry with performance-aware settings
  const [animationRegistry] = useState<AnimationRegistryImpl>(() => {
    const registry = getAnimationRegistry(
      config.performance.maxConcurrentAnimations,
      30 // FPS threshold
    );
    
    // Connect registry to performance monitoring
    if ('updateDeviceProfile' in registry) {
      (registry as any).updateDeviceProfile(deviceProfile);
    }
    
    return registry;
  });
  
  // Listen for reduced motion preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const reducedMotion = e.matches;
      setIsReducedMotion(reducedMotion);
      
      // Update device capabilities
      setDeviceCapabilities(prev => ({
        ...prev,
        reducedMotion,
        supportsMotion: !reducedMotion,
      }));
      
      // If reduced motion is enabled, switch to subtle preset
      if (reducedMotion && config !== animationPresets.subtle) {
        setConfig(animationPresets.subtle);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [config]);
  
  // Listen for page visibility changes to pause animations
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause animations when page is hidden
        pauseAnimations();
        if (lenis) {
          lenis.stop();
        }
      } else {
        // Resume animations when page becomes visible
        resumeAnimations();
        if (lenis) {
          lenis.start();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [lenis, pauseAnimations, resumeAnimations]);
  
  // Update animation registry when device profile changes
  useEffect(() => {
    if ('updateDeviceProfile' in animationRegistry) {
      (animationRegistry as any).updateDeviceProfile(deviceProfile);
    }
    
    // Auto-adjust config based on device performance
    if (deviceProfile.tier === 'low' && config !== animationPresets.performance) {
      console.log('Switching to performance preset due to low device tier');
      resetToPreset('performance');
    }
  }, [deviceProfile, animationRegistry, config, resetToPreset]);
  
  // Update configuration function
  const updateConfig = useCallback((updates: Partial<AnimationConfig>) => {
    setConfig(prevConfig => {
      const newConfig = { ...prevConfig };
      
      // Deep merge the updates
      Object.keys(updates).forEach(key => {
        const updateKey = key as keyof AnimationConfig;
        const updateValue = updates[updateKey];
        
        if (updateValue && typeof updateValue === 'object' && !Array.isArray(updateValue)) {
          // Deep merge nested objects
          newConfig[updateKey] = {
            ...prevConfig[updateKey],
            ...updateValue,
          } as any;
        } else if (updateValue !== undefined) {
          // Direct assignment for primitive values
          newConfig[updateKey] = updateValue as any;
        }
      });
      
      // Update animation registry performance settings if they changed
      if (updates.performance?.maxConcurrentAnimations !== undefined) {
        animationRegistry.updatePerformanceSettings(
          updates.performance.maxConcurrentAnimations,
          30 // FPS threshold
        );
      }
      
      return newConfig;
    });
  }, [animationRegistry]);
  
  // Reset to preset function
  const resetToPreset = useCallback((preset: keyof AnimationPresets) => {
    const presetConfig = animationPresets[preset];
    setConfig(presetConfig);
    
    // Update animation registry with new performance settings
    animationRegistry.updatePerformanceSettings(
      presetConfig.performance.maxConcurrentAnimations,
      30 // FPS threshold
    );
    
    console.log(`Animation preset changed to: ${preset}`);
  }, [animationRegistry]);
  
  // Set Lenis instance (will be called by SmoothScrollProvider)
  const setLenisInstance = useCallback((lenisInstance: Lenis | null) => {
    setLenis(lenisInstance);
    setIsInitialized(lenisInstance !== null);
  }, []);
  
  // Cleanup animation registry on unmount
  useEffect(() => {
    return () => {
      animationRegistry.cleanup();
    };
  }, [animationRegistry]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AnimationContextValue>(() => ({
    config,
    lenis,
    isReducedMotion,
    isInitialized,
    deviceCapabilities,
    animationRegistry,
    updateConfig,
    resetToPreset,
    setLenisInstance,
    // Performance monitoring integration
    deviceProfile,
    isPerformanceGood,
  }), [
    config,
    lenis,
    isReducedMotion,
    isInitialized,
    deviceCapabilities,
    animationRegistry,
    updateConfig,
    resetToPreset,
    setLenisInstance,
    deviceProfile,
    isPerformanceGood,
  ]);
  
  // Apply reduced motion overrides to config
  const effectiveConfig = useMemo(() => {
    if (!isReducedMotion || !config.accessibility.respectReducedMotion) {
      return config;
    }
    
    // Override config for reduced motion
    return {
      ...config,
      smoothScroll: {
        ...config.smoothScroll,
        enabled: false,
      },
      scrollAnimations: {
        ...config.scrollAnimations,
        enabled: false,
      },
      microInteractions: {
        ...config.microInteractions,
        enabled: false,
      },
      transitions: {
        ...config.transitions,
        defaultDuration: config.accessibility.fallbackToInstant ? 0 : 0.1,
        pageTransition: {
          ...config.transitions.pageTransition,
          transition: { 
            duration: config.accessibility.fallbackToInstant ? 0 : 0.1,
            ease: [0.25, 0.1, 0.25, 1] as const,
          },
        },
        modalTransition: {
          ...config.transitions.modalTransition,
          transition: { 
            duration: config.accessibility.fallbackToInstant ? 0 : 0.1,
            ease: [0.25, 0.1, 0.25, 1] as const,
          },
        },
      },
    };
  }, [config, isReducedMotion]);
  
  // Update the context value with effective config
  const finalContextValue = useMemo<AnimationContextValue>(() => ({
    ...contextValue,
    config: effectiveConfig,
  }), [contextValue, effectiveConfig]);
  
  return (
    <AnimationContext.Provider value={finalContextValue}>
      {children}
    </AnimationContext.Provider>
  );
}

// Export context for advanced usage
export { AnimationContext };

// Utility hook to check if animations are enabled
export function useAnimationsEnabled(): boolean {
  const { config, isReducedMotion } = useAnimation();
  
  return !isReducedMotion && (
    config.smoothScroll.enabled ||
    config.scrollAnimations.enabled ||
    config.microInteractions.enabled
  );
}

// Utility hook to get effective animation duration
export function useAnimationDuration(baseDuration: number): number {
  const { config, isReducedMotion } = useAnimation();
  
  if (isReducedMotion && config.accessibility.fallbackToInstant) {
    return 0;
  }
  
  if (isReducedMotion) {
    return Math.min(baseDuration, 0.1);
  }
  
  return baseDuration;
}

// Utility hook for conditional animation props
export function useConditionalAnimation<T extends Record<string, any>>(
  animationProps: T,
  fallbackProps?: Partial<T>
): T | Partial<T> {
  const { isReducedMotion, config } = useAnimation();
  
  if (isReducedMotion && config.accessibility.respectReducedMotion) {
    return fallbackProps || {};
  }
  
  return animationProps;
}