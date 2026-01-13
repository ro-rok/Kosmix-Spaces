// Animation accessibility management
export interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
}

export interface AnimationFallback {
  type: 'css' | 'instant' | 'disabled';
  duration?: number;
  easing?: string;
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

  constructor(options?: Partial<FallbackOptions>) {
    this.options = options || {};
    this.preferences = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      largeText: false,
    };
  }

  getPreferences(): AccessibilityPreferences {
    return this.preferences;
  }

  updatePreferences(updates: Partial<AccessibilityPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
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

  getFallback(id: string): AnimationFallback | undefined {
    return this.fallbacks.get(id);
  }

  applyFallback(id: string): void {
    const fallback = this.getFallback(id);
    if (fallback) {
      // Apply fallback logic
      console.log('Applying fallback:', id, fallback);
    }
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