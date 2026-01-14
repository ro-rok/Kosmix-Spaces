// Animation configuration types and presets
export interface DeviceCapabilities {
  supportsMotion: boolean;
  reducedMotion: boolean;
  supportsTransform3d: boolean;
  supportsWillChange: boolean;
  devicePixelRatio: number;
  maxTouchPoints: number;
  connectionSpeed: 'slow' | 'fast' | 'unknown';
  memoryLevel: 'low' | 'medium' | 'high';
}

export interface AnimationConfig {
  smoothScroll: {
    enabled: boolean;
    duration: number;
    easing: string;
  };
  transitions: {
    defaultDuration: number;
    defaultEasing: string;
    pageTransition: {
      transition: {
        duration: number;
        ease: readonly [number, number, number, number];
      };
    };
    modalTransition: {
      transition: {
        duration: number;
        ease: readonly [number, number, number, number];
      };
    };
  };
  scrollAnimations: {
    enabled: boolean;
    duration?: number;
    ease?: string;
    staggerDelay: number;
    triggerOnce: boolean;
  };
  microInteractions: {
    enabled: boolean;
    hoverScale: number;
    clickScale: number;
    focusScale: number;
    duration: number;
    easing: string;
  };
  accessibility: {
    respectReducedMotion: boolean;
    fallbackToInstant: boolean;
    announceAnimations: boolean;
  };
  performance: {
    maxConcurrentAnimations: number;
    debounceResize: number;
  };
}

export interface AnimationPresets {
  minimal: AnimationConfig;
  subtle: AnimationConfig;
  standard: AnimationConfig;
  enhanced: AnimationConfig;
  performance: AnimationConfig;
}

// Default animation configuration
export const defaultAnimationConfig: AnimationConfig = {
  smoothScroll: {
    enabled: false, // Disabled by default to prevent scroll issues
    duration: 1.2,
    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },
  transitions: {
    defaultDuration: 0.3,
    defaultEasing: 'ease-in-out',
    pageTransition: {
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
    modalTransition: {
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  },
  scrollAnimations: {
    enabled: true,
    duration: 0.8,
    ease: 'power2.out',
    staggerDelay: 0.1,
    triggerOnce: true,
  },
  microInteractions: {
    enabled: true,
    hoverScale: 1.05,
    clickScale: 0.95,
    focusScale: 1.02,
    duration: 0.2,
    easing: 'ease-out',
  },
  accessibility: {
    respectReducedMotion: true,
    fallbackToInstant: false,
    announceAnimations: false,
  },
  performance: {
    maxConcurrentAnimations: 10,
    debounceResize: 150,
  },
};

// Animation presets
export const animationPresets: AnimationPresets = {
  minimal: {
    ...defaultAnimationConfig,
    smoothScroll: { ...defaultAnimationConfig.smoothScroll, enabled: false },
    scrollAnimations: { ...defaultAnimationConfig.scrollAnimations, enabled: false },
    microInteractions: { ...defaultAnimationConfig.microInteractions, enabled: false },
    performance: { maxConcurrentAnimations: 3, debounceResize: 200 },
  },
  subtle: {
    ...defaultAnimationConfig,
    transitions: {
      ...defaultAnimationConfig.transitions,
      defaultDuration: 0.2,
    },
    performance: { maxConcurrentAnimations: 5, debounceResize: 150 },
  },
  standard: defaultAnimationConfig,
  enhanced: {
    ...defaultAnimationConfig,
    smoothScroll: {
      ...defaultAnimationConfig.smoothScroll,
      duration: 1.5,
    },
    transitions: {
      ...defaultAnimationConfig.transitions,
      defaultDuration: 0.4,
    },
    performance: { maxConcurrentAnimations: 15, debounceResize: 100 },
  },
  performance: {
    ...defaultAnimationConfig,
    smoothScroll: { ...defaultAnimationConfig.smoothScroll, enabled: false },
    scrollAnimations: { ...defaultAnimationConfig.scrollAnimations, enabled: false },
    microInteractions: { ...defaultAnimationConfig.microInteractions, enabled: false },
    transitions: {
      ...defaultAnimationConfig.transitions,
      defaultDuration: 0.1,
    },
    performance: { maxConcurrentAnimations: 3, debounceResize: 200 },
  },
};

// Device capability detection
export function detectDeviceCapabilities(): DeviceCapabilities {
  const supportsMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return {
    supportsMotion,
    reducedMotion,
    supportsTransform3d: true,
    supportsWillChange: true,
    devicePixelRatio: window.devicePixelRatio || 1,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    connectionSpeed: 'unknown',
    memoryLevel: 'medium',
  };
}

// Select preset based on device capabilities
export function selectPresetForDevice(capabilities: DeviceCapabilities): keyof AnimationPresets {
  if (capabilities.reducedMotion) {
    return 'minimal';
  }
  
  if (capabilities.memoryLevel === 'low') {
    return 'performance';
  }
  
  return 'standard';
}

// Convert animation config to Lenis options
export function configToLenisOptions(config: AnimationConfig): any {
  return {
    duration: config.smoothScroll.duration,
    easing: (t: number) => t, // Simple linear easing
    smooth: config.smoothScroll.enabled,
  };
}