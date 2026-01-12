import { useCallback, useEffect, useRef } from 'react';
import { useAnimation } from '../contexts/AnimationContext';
import { 
  AnimationPriority, 
  type AnimationMetadata,
  registerScrollAnimation,
  registerTransitionAnimation,
  registerInteractionAnimation,
  registerLoadingAnimation,
} from '../lib/animation-registry';

// Hook for managing animation registration and cleanup
export function useAnimationRegistry() {
  const { animationRegistry } = useAnimation();
  const registeredAnimations = useRef<Set<string>>(new Set());

  // Register an animation with automatic cleanup on unmount
  const registerAnimation = useCallback((
    id: string,
    cleanup: () => void,
    metadata?: Partial<Omit<AnimationMetadata, 'id' | 'cleanup' | 'startTime'>>
  ) => {
    const fullMetadata: AnimationMetadata = {
      id,
      priority: AnimationPriority.NORMAL,
      type: 'interaction',
      startTime: performance.now(),
      cleanup,
      ...metadata,
    };

    animationRegistry.register(fullMetadata);
    registeredAnimations.current.add(id);
  }, [animationRegistry]);

  // Unregister a specific animation
  const unregisterAnimation = useCallback((id: string) => {
    animationRegistry.unregister(id);
    registeredAnimations.current.delete(id);
  }, [animationRegistry]);

  // Convenience methods for different animation types
  const registerScroll = useCallback((
    id: string,
    element: HTMLElement,
    cleanup: () => void,
    priority = AnimationPriority.NORMAL
  ) => {
    registerScrollAnimation(id, element, cleanup, priority);
    registeredAnimations.current.add(id);
  }, []);

  const registerTransition = useCallback((
    id: string,
    cleanup: () => void,
    priority = AnimationPriority.HIGH
  ) => {
    registerTransitionAnimation(id, cleanup, priority);
    registeredAnimations.current.add(id);
  }, []);

  const registerInteraction = useCallback((
    id: string,
    element: HTMLElement,
    cleanup: () => void,
    priority = AnimationPriority.NORMAL
  ) => {
    registerInteractionAnimation(id, element, cleanup, priority);
    registeredAnimations.current.add(id);
  }, []);

  const registerLoading = useCallback((
    id: string,
    cleanup: () => void,
    priority = AnimationPriority.HIGH
  ) => {
    registerLoadingAnimation(id, cleanup, priority);
    registeredAnimations.current.add(id);
  }, []);

  // Get performance metrics
  const getMetrics = useCallback(() => {
    return animationRegistry.getPerformanceMetrics();
  }, [animationRegistry]);

  // Get animations for a specific element
  const getAnimationsForElement = useCallback((element: HTMLElement) => {
    return animationRegistry.getAnimationsForElement(element);
  }, [animationRegistry]);

  // Cleanup all registered animations on unmount
  useEffect(() => {
    return () => {
      registeredAnimations.current.forEach(id => {
        animationRegistry.unregister(id);
      });
      registeredAnimations.current.clear();
    };
  }, [animationRegistry]);

  return {
    registerAnimation,
    unregisterAnimation,
    registerScroll,
    registerTransition,
    registerInteraction,
    registerLoading,
    getMetrics,
    getAnimationsForElement,
    registry: animationRegistry,
  };
}

// Hook for automatic animation ID generation
export function useAnimationId(prefix = 'anim'): string {
  const idRef = useRef<string>();
  
  if (!idRef.current) {
    idRef.current = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  return idRef.current;
}

// Hook for element-specific animation management
export function useElementAnimations(element: HTMLElement | null) {
  const { animationRegistry } = useAnimation();
  
  const getActiveAnimations = useCallback(() => {
    if (!element) return [];
    return animationRegistry.getAnimationsForElement(element);
  }, [element, animationRegistry]);
  
  const hasActiveAnimations = useCallback(() => {
    return getActiveAnimations().length > 0;
  }, [getActiveAnimations]);
  
  const cancelAllAnimations = useCallback(() => {
    const animations = getActiveAnimations();
    animations.forEach(anim => animationRegistry.unregister(anim.id));
  }, [getActiveAnimations, animationRegistry]);
  
  return {
    getActiveAnimations,
    hasActiveAnimations,
    cancelAllAnimations,
  };
}

// Hook for monitoring animation performance
export function useAnimationPerformance() {
  const { animationRegistry } = useAnimation();
  
  const getMetrics = useCallback(() => {
    return animationRegistry.getPerformanceMetrics();
  }, [animationRegistry]);
  
  const isOverloaded = useCallback(() => {
    const metrics = getMetrics();
    return metrics.activeCount > 8; // Threshold for performance concern
  }, [getMetrics]);
  
  return {
    getMetrics,
    isOverloaded,
  };
}