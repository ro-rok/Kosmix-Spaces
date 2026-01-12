import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useAnimation } from '@/contexts/AnimationContext';
import type { 
  AnimationConfig, 
  AnimationPresets,
  DeviceCapabilities 
} from '@/lib/animation-config';
import { animationPresets, selectPresetForDevice } from '@/lib/animation-config';

export interface UseAnimationConfigOptions {
  /**
   * Watch for specific config changes
   */
  watchKeys?: (keyof AnimationConfig)[];
  /**
   * Callback when config changes
   */
  onConfigChange?: (config: AnimationConfig, changedKeys: string[]) => void;
  /**
   * Enable automatic preset selection based on device capabilities
   */
  autoSelectPreset?: boolean;
  /**
   * Debounce config updates (ms)
   */
  debounceMs?: number;
}

export interface UseAnimationConfigReturn {
  /**
   * Current animation configuration
   */
  config: AnimationConfig;
  /**
   * Whether reduced motion is enabled
   */
  isReducedMotion: boolean;
  /**
   * Current device capabilities
   */
  deviceCapabilities: DeviceCapabilities;
  /**
   * Whether animations are globally enabled
   */
  animationsEnabled: boolean;
  /**
   * Update specific config values
   */
  updateConfig: (updates: Partial<AnimationConfig>) => void;
  /**
   * Reset to a specific preset
   */
  resetToPreset: (preset: keyof AnimationPresets) => void;
  /**
   * Get a specific config value with type safety
   */
  getConfigValue: <K extends keyof AnimationConfig>(key: K) => AnimationConfig[K];
  /**
   * Update a specific nested config value
   */
  updateConfigValue: <K extends keyof AnimationConfig>(
    key: K, 
    value: Partial<AnimationConfig[K]>
  ) => void;
  /**
   * Get effective duration (respects reduced motion)
   */
  getEffectiveDuration: (baseDuration: number) => number;
  /**
   * Get effective easing (respects reduced motion)
   */
  getEffectiveEasing: (baseEasing: string) => string;
  /**
   * Check if a specific animation type is enabled
   */
  isAnimationTypeEnabled: (type: 'smoothScroll' | 'scrollAnimations' | 'microInteractions') => boolean;
  /**
   * Get animation props with reduced motion fallbacks
   */
  getAnimationProps: <T extends Record<string, any>>(
    animationProps: T,
    fallbackProps?: Partial<T>
  ) => T | Partial<T>;
  /**
   * Available presets
   */
  presets: AnimationPresets;
  /**
   * Current preset name (if using a preset)
   */
  currentPreset: keyof AnimationPresets | null;
}

/**
 * Hook for accessing and managing animation configuration
 * Provides utilities for configuration updates and accessibility handling
 */
export function useAnimationConfig(
  options: UseAnimationConfigOptions = {}
): UseAnimationConfigReturn {
  const {
    watchKeys,
    onConfigChange,
    autoSelectPreset = false,
    debounceMs = 100,
  } = options;

  const {
    config,
    isReducedMotion,
    deviceCapabilities,
    updateConfig: contextUpdateConfig,
    resetToPreset: contextResetToPreset,
  } = useAnimation();

  const previousConfigRef = useRef<AnimationConfig>(config);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Determine if animations are globally enabled
  const animationsEnabled = useMemo(() => {
    return !isReducedMotion && (
      config.smoothScroll.enabled ||
      config.scrollAnimations.enabled ||
      config.microInteractions.enabled
    );
  }, [isReducedMotion, config]);

  // Detect current preset (if any)
  const currentPreset = useMemo((): keyof AnimationPresets | null => {
    for (const [presetName, presetConfig] of Object.entries(animationPresets)) {
      if (JSON.stringify(presetConfig) === JSON.stringify(config)) {
        return presetName as keyof AnimationPresets;
      }
    }
    return null;
  }, [config]);

  // Watch for config changes
  useEffect(() => {
    if (!onConfigChange) return;

    const previousConfig = previousConfigRef.current;
    const currentConfig = config;

    // Determine what changed
    const changedKeys: string[] = [];
    
    if (watchKeys) {
      // Only check specified keys
      watchKeys.forEach(key => {
        if (JSON.stringify(previousConfig[key]) !== JSON.stringify(currentConfig[key])) {
          changedKeys.push(key);
        }
      });
    } else {
      // Check all keys
      Object.keys(currentConfig).forEach(key => {
        const configKey = key as keyof AnimationConfig;
        if (JSON.stringify(previousConfig[configKey]) !== JSON.stringify(currentConfig[configKey])) {
          changedKeys.push(key);
        }
      });
    }

    if (changedKeys.length > 0) {
      onConfigChange(currentConfig, changedKeys);
    }

    previousConfigRef.current = currentConfig;
  }, [config, watchKeys, onConfigChange]);

  // Auto-select preset based on device capabilities
  useEffect(() => {
    if (!autoSelectPreset) return;

    const recommendedPreset = selectPresetForDevice(deviceCapabilities);
    const recommendedConfig = animationPresets[recommendedPreset];

    // Only update if significantly different
    if (JSON.stringify(config) !== JSON.stringify(recommendedConfig)) {
      console.log(`Auto-selecting animation preset: ${recommendedPreset}`);
      contextResetToPreset(recommendedPreset);
    }
  }, [autoSelectPreset, deviceCapabilities, config, contextResetToPreset]);

  // Debounced update config
  const updateConfig = useCallback((updates: Partial<AnimationConfig>) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      contextUpdateConfig(updates);
    }, debounceMs);
  }, [contextUpdateConfig, debounceMs]);

  // Reset to preset
  const resetToPreset = useCallback((preset: keyof AnimationPresets) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    contextResetToPreset(preset);
  }, [contextResetToPreset]);

  // Get specific config value
  const getConfigValue = useCallback(<K extends keyof AnimationConfig>(key: K): AnimationConfig[K] => {
    return config[key];
  }, [config]);

  // Update specific nested config value
  const updateConfigValue = useCallback(<K extends keyof AnimationConfig>(
    key: K, 
    value: Partial<AnimationConfig[K]>
  ) => {
    updateConfig({
      [key]: {
        ...config[key],
        ...value,
      },
    } as Partial<AnimationConfig>);
  }, [config, updateConfig]);

  // Get effective duration (respects reduced motion)
  const getEffectiveDuration = useCallback((baseDuration: number): number => {
    if (isReducedMotion && config.accessibility.fallbackToInstant) {
      return 0;
    }
    
    if (isReducedMotion) {
      return Math.min(baseDuration, 0.1);
    }
    
    return baseDuration;
  }, [isReducedMotion, config.accessibility.fallbackToInstant]);

  // Get effective easing (respects reduced motion)
  const getEffectiveEasing = useCallback((baseEasing: string): string => {
    if (isReducedMotion) {
      return 'linear'; // Simple easing for reduced motion
    }
    
    return baseEasing;
  }, [isReducedMotion]);

  // Check if specific animation type is enabled
  const isAnimationTypeEnabled = useCallback((
    type: 'smoothScroll' | 'scrollAnimations' | 'microInteractions'
  ): boolean => {
    if (isReducedMotion && config.accessibility.respectReducedMotion) {
      return false;
    }
    
    switch (type) {
      case 'smoothScroll':
        return config.smoothScroll.enabled;
      case 'scrollAnimations':
        return config.scrollAnimations.enabled;
      case 'microInteractions':
        return config.microInteractions.enabled;
      default:
        return false;
    }
  }, [isReducedMotion, config]);

  // Get animation props with reduced motion fallbacks
  const getAnimationProps = useCallback(<T extends Record<string, any>>(
    animationProps: T,
    fallbackProps?: Partial<T>
  ): T | Partial<T> => {
    if (isReducedMotion && config.accessibility.respectReducedMotion) {
      return fallbackProps || {};
    }
    
    return animationProps;
  }, [isReducedMotion, config.accessibility.respectReducedMotion]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    config,
    isReducedMotion,
    deviceCapabilities,
    animationsEnabled,
    updateConfig,
    resetToPreset,
    getConfigValue,
    updateConfigValue,
    getEffectiveDuration,
    getEffectiveEasing,
    isAnimationTypeEnabled,
    getAnimationProps,
    presets: animationPresets,
    currentPreset,
  };
}

/**
 * Hook for creating animation-aware components
 * Provides common patterns for handling reduced motion and config changes
 */
export function useAnimationAware(options: {
  /**
   * Animation type this component uses
   */
  animationType?: 'smoothScroll' | 'scrollAnimations' | 'microInteractions';
  /**
   * Default animation props
   */
  defaultProps?: Record<string, any>;
  /**
   * Reduced motion fallback props
   */
  reducedMotionProps?: Record<string, any>;
  /**
   * Callback when animation state changes
   */
  onAnimationStateChange?: (enabled: boolean) => void;
} = {}) {
  const {
    animationType,
    defaultProps = {},
    reducedMotionProps = {},
    onAnimationStateChange,
  } = options;

  const {
    isReducedMotion,
    animationsEnabled,
    isAnimationTypeEnabled,
    getAnimationProps,
    getEffectiveDuration,
    getEffectiveEasing,
  } = useAnimationConfig();

  // Determine if this specific animation type is enabled
  const isEnabled = useMemo(() => {
    if (!animationsEnabled) return false;
    if (!animationType) return animationsEnabled;
    return isAnimationTypeEnabled(animationType);
  }, [animationsEnabled, animationType, isAnimationTypeEnabled]);

  // Get effective props
  const effectiveProps = useMemo(() => {
    return getAnimationProps(defaultProps, reducedMotionProps);
  }, [defaultProps, reducedMotionProps, getAnimationProps]);

  // Notify when animation state changes
  useEffect(() => {
    onAnimationStateChange?.(isEnabled);
  }, [isEnabled, onAnimationStateChange]);

  return {
    isEnabled,
    isReducedMotion,
    props: effectiveProps,
    getEffectiveDuration,
    getEffectiveEasing,
  };
}

/**
 * Hook for performance-aware animation configuration
 * Automatically adjusts config based on performance metrics
 */
export function usePerformanceAwareConfig(options: {
  /**
   * Enable automatic performance adjustments
   */
  enableAutoAdjustment?: boolean;
  /**
   * FPS threshold for performance adjustments
   */
  fpsThreshold?: number;
  /**
   * Memory usage threshold (MB)
   */
  memoryThreshold?: number;
} = {}) {
  const {
    enableAutoAdjustment = true,
    fpsThreshold = 30,
    memoryThreshold = 100,
  } = options;

  const { 
    config, 
    updateConfig, 
    resetToPreset, 
    deviceCapabilities 
  } = useAnimationConfig();

  const performanceCheckRef = useRef<NodeJS.Timeout>();

  // Performance monitoring and adjustment
  useEffect(() => {
    if (!enableAutoAdjustment) return;

    const checkPerformance = () => {
      // Simple performance check (in a real app, you'd use more sophisticated metrics)
      const now = performance.now();
      let frameCount = 0;
      
      const countFrames = () => {
        frameCount++;
        if (performance.now() - now < 1000) {
          requestAnimationFrame(countFrames);
        } else {
          const fps = frameCount;
          
          // Adjust config based on performance
          if (fps < fpsThreshold) {
            console.warn(`Low FPS detected (${fps}), switching to performance preset`);
            resetToPreset('performance');
          } else if (fps > 50 && deviceCapabilities.memoryConstraints === 'high') {
            // Good performance, can use enhanced preset
            if (config !== animationPresets.enhanced) {
              console.log(`Good performance detected (${fps}), switching to enhanced preset`);
              resetToPreset('enhanced');
            }
          }
        }
      };
      
      requestAnimationFrame(countFrames);
    };

    // Check performance every 10 seconds
    performanceCheckRef.current = setInterval(checkPerformance, 10000);

    return () => {
      if (performanceCheckRef.current) {
        clearInterval(performanceCheckRef.current);
      }
    };
  }, [
    enableAutoAdjustment, 
    fpsThreshold, 
    config, 
    resetToPreset, 
    deviceCapabilities
  ]);

  return {
    isMonitoring: enableAutoAdjustment,
    fpsThreshold,
    memoryThreshold,
  };
}

export default useAnimationConfig;