// Animation registry for managing concurrent animations

export enum AnimationPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export type AnimationType = 'scroll' | 'transition' | 'interaction' | 'loading';

export interface AnimationMetadata {
  id: string;
  type: AnimationType;
  priority: AnimationPriority;
  startTime: number;
  element?: HTMLElement;
  cleanup: () => void;
}

export interface AnimationInfo {
  id: string;
  type: string;
  element?: Element;
}

export interface PerformanceMetrics {
  activeCount: number;
  totalRegistered: number;
  averageDuration: number;
  droppedFrames: number;
}

export interface AnimationRegistryImpl {
  updatePerformanceSettings: (maxConcurrent: number, fpsThreshold: number) => void;
  cleanup: () => void;
  getActive: () => AnimationInfo[];
  register: (metadata: AnimationMetadata) => void;
  unregister: (id: string) => void;
  getPerformanceMetrics: () => PerformanceMetrics;
  getAnimationsForElement: (element: HTMLElement) => AnimationMetadata[];
}

class AnimationRegistry implements AnimationRegistryImpl {
  private maxConcurrentAnimations: number;
  private fpsThreshold: number;
  private activeAnimations: Map<string, AnimationInfo> = new Map();
  private animationMetadata: Map<string, AnimationMetadata> = new Map();
  private totalRegistered = 0;

  constructor(maxConcurrent: number = 10, fpsThreshold: number = 30) {
    this.maxConcurrentAnimations = maxConcurrent;
    this.fpsThreshold = fpsThreshold;
  }

  updatePerformanceSettings(maxConcurrent: number, fpsThreshold: number): void {
    this.maxConcurrentAnimations = maxConcurrent;
    this.fpsThreshold = fpsThreshold;
  }

  register(metadata: AnimationMetadata): void {
    this.animationMetadata.set(metadata.id, metadata);
    this.activeAnimations.set(metadata.id, {
      id: metadata.id,
      type: metadata.type,
      element: metadata.element,
    });
    this.totalRegistered++;
  }

  unregister(id: string): void {
    const metadata = this.animationMetadata.get(id);
    if (metadata) {
      metadata.cleanup();
      this.animationMetadata.delete(id);
      this.activeAnimations.delete(id);
    }
  }

  getPerformanceMetrics(): PerformanceMetrics {
    const now = performance.now();
    const durations = Array.from(this.animationMetadata.values())
      .map(m => now - m.startTime);
    
    return {
      activeCount: this.activeAnimations.size,
      totalRegistered: this.totalRegistered,
      averageDuration: durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0,
      droppedFrames: 0,
    };
  }

  getAnimationsForElement(element: HTMLElement): AnimationMetadata[] {
    return Array.from(this.animationMetadata.values())
      .filter(m => m.element === element);
  }

  getActive(): AnimationInfo[] {
    return Array.from(this.activeAnimations.values());
  }

  cleanup(): void {
    this.animationMetadata.forEach(m => m.cleanup());
    this.animationMetadata.clear();
    this.activeAnimations.clear();
  }
}

let registryInstance: AnimationRegistry | null = null;

export function getAnimationRegistry(
  maxConcurrent: number = 10,
  fpsThreshold: number = 30
): AnimationRegistryImpl {
  if (!registryInstance) {
    registryInstance = new AnimationRegistry(maxConcurrent, fpsThreshold);
  }
  return registryInstance;
}

// Animation registration helper functions
export function registerScrollAnimation(
  id: string, 
  element: HTMLElement, 
  cleanup: () => void, 
  priority: AnimationPriority = AnimationPriority.NORMAL
): void {
  const registry = getAnimationRegistry();
  registry.register({
    id,
    type: 'scroll',
    priority,
    element,
    cleanup,
    startTime: performance.now(),
  });
}

export function registerInteractionAnimation(
  id: string, 
  element: HTMLElement, 
  cleanup: () => void, 
  priority: AnimationPriority = AnimationPriority.NORMAL
): void {
  const registry = getAnimationRegistry();
  registry.register({
    id,
    type: 'interaction',
    priority,
    element,
    cleanup,
    startTime: performance.now(),
  });
}

export function registerTransitionAnimation(
  id: string, 
  cleanup: () => void, 
  priority: AnimationPriority = AnimationPriority.HIGH
): void {
  const registry = getAnimationRegistry();
  registry.register({
    id,
    type: 'transition',
    priority,
    cleanup,
    startTime: performance.now(),
  });
}

export function registerLoadingAnimation(
  id: string, 
  cleanup: () => void, 
  priority: AnimationPriority = AnimationPriority.HIGH
): void {
  const registry = getAnimationRegistry();
  registry.register({
    id,
    type: 'loading',
    priority,
    cleanup,
    startTime: performance.now(),
  });
}