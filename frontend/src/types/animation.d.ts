// Animation library type declarations

// Lenis type declarations
declare module 'lenis' {
  export interface LenisOptions {
    lerp?: number;
    duration?: number;
    orientation?: 'vertical' | 'horizontal';
    gestureOrientation?: 'vertical' | 'horizontal' | 'both';
    smoothWheel?: boolean;
    touchMultiplier?: number;
    infinite?: boolean;
    wrapper?: HTMLElement;
    content?: HTMLElement;
    wheelEventsTarget?: HTMLElement;
    eventsTarget?: HTMLElement;
    normalizeWheel?: boolean;
    syncTouch?: boolean;
    syncTouchLerp?: number;
    __experimental__naiveDimensions?: boolean;
  }

  export interface LenisScrollToOptions {
    offset?: number;
    lerp?: number;
    duration?: number;
    easing?: (t: number) => number;
    immediate?: boolean;
    lock?: boolean;
    force?: boolean;
    onComplete?: () => void;
  }

  export default class Lenis {
    constructor(options?: LenisOptions);
    
    // Properties
    animatedScroll: number;
    dimensions: {
      wrapper: { width: number; height: number };
      content: { width: number; height: number };
    };
    direction: number;
    isHorizontal: boolean;
    isLocked: boolean;
    isStopped: boolean;
    limit: number;
    progress: number;
    rootElement: HTMLElement;
    scroll: number;
    targetScroll: number;
    time: number;
    actualScroll: number;
    velocity: number;
    
    // Methods
    raf(time: number): void;
    scrollTo(target: number | string | HTMLElement, options?: LenisScrollToOptions): void;
    on(event: string, callback: (...args: any[]) => void): () => void;
    off(event: string, callback: (...args: any[]) => void): void;
    setScroll(scroll: number): void;
    resize(): void;
    start(): void;
    stop(): void;
    destroy(): void;
  }
}

// Framer Motion is already well-typed, but we can extend if needed
declare module 'framer-motion' {
  // Re-export main types for consistency
  export * from 'framer-motion/dist/types';
}

// GSAP type declarations (extending the existing @types/gsap)
declare module 'gsap' {
  // Re-export GSAP types
  export * from 'gsap/types';
  
  // Additional ScrollTrigger types if needed
  export interface ScrollTriggerStaticProps {
    create(vars: ScrollTriggerInstanceVars): ScrollTrigger;
    refresh(): void;
    update(): void;
    clearScrollMemory(): void;
    maxScroll(element?: string | Element): number;
    getScrollFunc(element?: string | Element): () => number;
    saveStyles(targets: string | Element | Element[]): void;
    revert(soft?: boolean, media?: string): void;
    addEventListener(type: string, callback: EventListener): void;
    removeEventListener(type: string, callback: EventListener): void;
    normalizeScroll(config?: boolean | ScrollTriggerNormalizeVars): void;
    observe(vars?: ScrollTriggerObserveVars): void;
    unobserve(): void;
    isInViewport(element: Element, ratio?: number, horizontal?: boolean): boolean;
    positionInViewport(element: Element, horizontal?: boolean): number;
    killAll(revert?: boolean): void;
    sort(): void;
    batch(targets: string | Element[], vars: ScrollTriggerBatchVars): ScrollTrigger[];
  }
}

// Re-export animation configuration types from lib
export type {
  AnimationConfig,
  DeviceCapabilities,
  AnimationPresets,
} from '../lib/animation-config';

// Animation context value interface
export interface AnimationContextValue {
  config: import('../lib/animation-config').AnimationConfig;
  lenis: import('lenis').default | null;
  isReducedMotion: boolean;
  isInitialized: boolean;
  deviceCapabilities: import('../lib/animation-config').DeviceCapabilities;
  animationRegistry: import('../lib/animation-registry').AnimationRegistryImpl;
  updateConfig: (updates: Partial<import('../lib/animation-config').AnimationConfig>) => void;
  resetToPreset: (preset: keyof import('../lib/animation-config').AnimationPresets) => void;
  setLenisInstance: (lenisInstance: import('lenis').default | null) => void;
  // Performance monitoring integration
  deviceProfile: import('../lib/animation-performance').DevicePerformanceProfile;
  isPerformanceGood: boolean;
}

export interface AnimationState {
  isInitialized: boolean;
  activeAnimations: Set<string>;
  scrollPosition: number;
  isScrolling: boolean;
  reducedMotion: boolean;
  performance: {
    fps: number;
    memoryUsage: number;
    activeElements: number;
  };
}

export interface AnimationRegistry {
  register: (id: string, cleanup: () => void) => void;
  unregister: (id: string) => void;
  cleanup: () => void;
  getActive: () => string[];
}