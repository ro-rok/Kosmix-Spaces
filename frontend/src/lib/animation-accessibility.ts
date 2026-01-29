// Animation accessibility management
export interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  forcedColors?: boolean;
  prefersReducedData?: boolean;
  prefersReducedTransparency?: boolean;
}

export interface AnimationFallback {
  type: 'css' | 'instant' | 'disabled' | 'reduced';
  duration?: number;
  easing?: string;
  styles?: React.CSSProperties;
  className?: string;
}

export interface FallbackOptions {
  enableCSSFallbacks: boolean;
  enableInstantFallbacks: boolean;
  respectSystemPreferences: boolean;
  customFallbacks: Record<string, AnimationFallback>;
}

export class AccessibilityManager {
  private preferences: AccessibilityPreferences;
  private options: Partial<FallbackOptions>;
  private listeners: Set<(preferences: AccessibilityPreferences) => void> = new Set();
  private mediaQueryList: MediaQueryList;

  constructor(options?: Partial<FallbackOptions>) {
    this.options = options || {};
    this.mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.preferences = {
      reducedMotion: this.mediaQueryList.matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      largeText: false,
    };

    // Listen for changes to reduced motion preference
    this.handleMediaQueryChange = this.handleMediaQueryChange.bind(this);
    this.mediaQueryList.addEventListener('change', this.handleMediaQueryChange);
  }

  private handleMediaQueryChange(e: MediaQueryListEvent): void {
    this.updatePreferences({ reducedMotion: e.matches });
  }

  getPreferences(): AccessibilityPreferences {
    return this.preferences;
  }

  updatePreferences(updates: Partial<AccessibilityPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.notifyListeners();
  }

  shouldDisableAnimations(): boolean {
    return this.preferences.reducedMotion && (this.options.respectSystemPreferences ?? true);
  }

  shouldReduceTransparency(): boolean {
    return this.preferences.highContrast;
  }

  subscribe(listener: (preferences: AccessibilityPreferences) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.preferences));
  }

  cleanup(): void {
    this.mediaQueryList.removeEventListener('change', this.handleMediaQueryChange);
    this.listeners.clear();
  }
}

export class AnimationFallbackManager {
  private fallbacks: Map<string, AnimationFallback> = new Map();
  private options: Partial<FallbackOptions>;

  constructor(options?: Partial<FallbackOptions>) {
    this.options = options || {};
  }

  registerFallback(id: string, fallback: AnimationFallback): void {
    this.fallbacks.set(id, fallback);
  }

  getFallback(
    id: string,
    animationType: 'transition' | 'scroll' | 'interaction' | 'loading',
    originalProps: any
  ): AnimationFallback {
    // Check for custom fallback first
    const customFallback = this.fallbacks.get(id);
    if (customFallback) {
      return customFallback;
    }

    // Check for type-specific custom fallback
    if (this.options.customFallbacks?.[animationType]) {
      return this.options.customFallbacks[animationType];
    }

    // Return default fallback based on options
    if (this.options.enableInstantFallbacks) {
      return { type: 'instant', duration: 0 };
    }

    if (this.options.enableCSSFallbacks) {
      return { type: 'css', duration: 0.1, easing: 'linear' };
    }

    // Default reduced motion fallback
    return { type: 'css', duration: 0.15, easing: 'ease' };
  }

  applyFallback(id: string): void {
    const fallback = this.fallbacks.get(id);
    if (fallback) {
      // Apply fallback logic
    }
  }

  cleanup(): void {
    this.fallbacks.clear();
  }
}

let globalManager: AccessibilityManager | null = null;

export function getGlobalAccessibilityManager(): AccessibilityManager {
  if (!globalManager) {
    globalManager = new AccessibilityManager();
  }
  return globalManager;
}

export function cleanupGlobalAccessibilityManager(): void {
  globalManager = null;
}

export function generateReducedMotionCSS(): string {
  return `
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;
}

export function applyAnimationFallback(element: Element, fallback: AnimationFallback): void {
  const htmlElement = element as HTMLElement;
  
  switch (fallback.type) {
    case 'instant':
      htmlElement.style.transition = 'none';
      break;
    case 'css':
      htmlElement.style.transition = `all ${fallback.duration || 0.3}s ${fallback.easing || 'ease'}`;
      break;
    case 'disabled':
      htmlElement.style.animation = 'none';
      htmlElement.style.transition = 'none';
      break;
  }
}