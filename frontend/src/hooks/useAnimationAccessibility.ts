import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAnimation } from '../contexts/AnimationContext';
import { 
  AccessibilityManager, 
  AnimationFallbackManager,
  type AccessibilityPreferences,
  type AnimationFallback,
  type FallbackOptions 
} from '../lib/animation-accessibility';

// Hook for comprehensive animation accessibility
export function useAnimationAccessibility(fallbackOptions?: Partial<FallbackOptions>) {
  const { config, isReducedMotion, updateConfig } = useAnimation();
  const [accessibilityManager] = useState(() => new AccessibilityManager(fallbackOptions));
  const [fallbackManager] = useState(() => new AnimationFallbackManager(fallbackOptions));
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(
    () => accessibilityManager.getPreferences()
  );

  // Subscribe to accessibility preference changes
  useEffect(() => {
    const unsubscribe = accessibilityManager.subscribe((newPreferences) => {
      setPreferences(newPreferences);
      
      // Auto-update animation config based on preferences
      if (newPreferences.reducedMotion && config.accessibility.respectReducedMotion) {
        updateConfig({
          smoothScroll: { 
            enabled: false,
            duration: config.smoothScroll.duration,
            easing: config.smoothScroll.easing,
          },
          scrollAnimations: { 
            enabled: false,
            duration: config.scrollAnimations.duration,
            ease: config.scrollAnimations.ease,
            staggerDelay: config.scrollAnimations.staggerDelay,
            triggerOnce: config.scrollAnimations.triggerOnce,
          },
          microInteractions: { 
            enabled: false,
            hoverScale: config.microInteractions.hoverScale,
            clickScale: config.microInteractions.clickScale,
            focusScale: config.microInteractions.focusScale,
            duration: config.microInteractions.duration,
            easing: config.microInteractions.easing,
          },
          transitions: {
            defaultDuration: config.accessibility.fallbackToInstant ? 0 : 0.1,
            defaultEasing: config.transitions.defaultEasing,
            pageTransition: config.transitions.pageTransition,
            modalTransition: config.transitions.modalTransition,
          },
        });
      }
    });

    return unsubscribe;
  }, [accessibilityManager, config, updateConfig]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      accessibilityManager.cleanup();
      fallbackManager.cleanup();
    };
  }, [accessibilityManager, fallbackManager]);

  // Get fallback for specific animation
  const getFallback = useCallback((
    animationId: string,
    animationType: 'transition' | 'scroll' | 'interaction' | 'loading',
    originalProps: any
  ): AnimationFallback => {
    return fallbackManager.getFallback(animationId, animationType, originalProps);
  }, [fallbackManager]);

  // Check if specific animation type should be disabled
  const shouldDisableAnimationType = useCallback((
    animationType: 'transition' | 'scroll' | 'interaction' | 'loading'
  ): boolean => {
    if (!preferences.reducedMotion) return false;
    if (!config.accessibility.respectReducedMotion) return false;

    switch (animationType) {
      case 'scroll':
        return !config.scrollAnimations.enabled;
      case 'interaction':
        return !config.microInteractions.enabled;
      case 'transition':
        return config.accessibility.fallbackToInstant;
      case 'loading':
        return false; // Loading animations are usually kept for functionality
      default:
        return false;
    }
  }, [preferences.reducedMotion, config]);

  // Get accessible animation props for Framer Motion
  const getAccessibleMotionProps = useCallback((
    originalProps: any,
    animationType: 'transition' | 'scroll' | 'interaction' | 'loading' = 'transition'
  ) => {
    if (shouldDisableAnimationType(animationType)) {
      return {
        initial: false,
        animate: originalProps.animate || {},
        transition: { duration: 0 },
      };
    }

    if (preferences.reducedMotion && config.accessibility.respectReducedMotion) {
      return {
        ...originalProps,
        transition: {
          ...originalProps.transition,
          duration: Math.min(originalProps.transition?.duration || 0.3, 0.1),
          ease: 'linear',
        },
      };
    }

    return originalProps;
  }, [shouldDisableAnimationType, preferences.reducedMotion, config.accessibility.respectReducedMotion]);

  // Get accessible GSAP animation props
  const getAccessibleGSAPProps = useCallback((
    originalProps: any,
    animationType: 'scroll' | 'interaction' = 'scroll'
  ) => {
    if (shouldDisableAnimationType(animationType)) {
      return {
        ...originalProps,
        duration: 0,
        ease: 'none',
      };
    }

    if (preferences.reducedMotion && config.accessibility.respectReducedMotion) {
      return {
        ...originalProps,
        duration: Math.min(originalProps.duration || 0.8, 0.1),
        ease: 'none',
      };
    }

    return originalProps;
  }, [shouldDisableAnimationType, preferences.reducedMotion, config.accessibility.respectReducedMotion]);

  // Get accessible CSS transition styles
  const getAccessibleCSSTransition = useCallback((
    originalTransition: string,
    animationType: 'transition' | 'interaction' = 'transition'
  ): string => {
    if (shouldDisableAnimationType(animationType)) {
      return 'none';
    }

    if (preferences.reducedMotion && config.accessibility.respectReducedMotion) {
      // Extract duration and replace with shorter duration
      return originalTransition.replace(/(\d+\.?\d*)(s|ms)/g, (match, duration, unit) => {
        const numDuration = parseFloat(duration);
        const newDuration = unit === 's' ? Math.min(numDuration, 0.1) : Math.min(numDuration, 100);
        return `${newDuration}${unit}`;
      });
    }

    return originalTransition;
  }, [shouldDisableAnimationType, preferences.reducedMotion, config.accessibility.respectReducedMotion]);

  // Announce animation to screen readers (if enabled)
  const announceAnimation = useCallback((
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    if (!config.accessibility.announceAnimations) return;

    // Create or update live region for announcements
    let liveRegion = document.getElementById('animation-announcements');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'animation-announcements';
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }

    // Update the live region content
    liveRegion.textContent = message;
    
    // Clear after a short delay to allow for repeated announcements
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 1000);
  }, [config.accessibility.announceAnimations]);

  return {
    preferences,
    isReducedMotion,
    shouldDisableAnimations: accessibilityManager.shouldDisableAnimations(),
    shouldReduceTransparency: accessibilityManager.shouldReduceTransparency(),
    shouldDisableAnimationType,
    getFallback,
    getAccessibleMotionProps,
    getAccessibleGSAPProps,
    getAccessibleCSSTransition,
    announceAnimation,
  };
}

// Hook for specific animation fallback
export function useAnimationFallback(
  animationType: 'transition' | 'scroll' | 'interaction' | 'loading',
  originalProps: any,
  animationId?: string
) {
  const { getFallback, shouldDisableAnimationType } = useAnimationAccessibility();
  
  const fallback = useMemo(() => {
    const id = animationId || `${animationType}-${Math.random().toString(36).substr(2, 9)}`;
    return getFallback(id, animationType, originalProps);
  }, [getFallback, animationType, originalProps, animationId]);

  const shouldDisable = shouldDisableAnimationType(animationType);

  return {
    fallback,
    shouldDisable,
    isInstant: fallback.type === 'instant',
    isReduced: fallback.type === 'reduced' || fallback.type === 'css',
    styles: fallback.styles,
    duration: fallback.duration,
    className: fallback.className,
  };
}

// Hook for accessible motion props (Framer Motion integration)
export function useAccessibleMotion(
  originalProps: any,
  animationType: 'transition' | 'scroll' | 'interaction' | 'loading' = 'transition'
) {
  const { getAccessibleMotionProps } = useAnimationAccessibility();
  
  return useMemo(() => {
    return getAccessibleMotionProps(originalProps, animationType);
  }, [getAccessibleMotionProps, originalProps, animationType]);
}

// Hook for accessible GSAP props
export function useAccessibleGSAP(
  originalProps: any,
  animationType: 'scroll' | 'interaction' = 'scroll'
) {
  const { getAccessibleGSAPProps } = useAnimationAccessibility();
  
  return useMemo(() => {
    return getAccessibleGSAPProps(originalProps, animationType);
  }, [getAccessibleGSAPProps, originalProps, animationType]);
}

// Hook for accessible CSS transitions
export function useAccessibleCSS(
  originalTransition: string,
  animationType: 'transition' | 'interaction' = 'transition'
) {
  const { getAccessibleCSSTransition } = useAnimationAccessibility();
  
  return useMemo(() => {
    return getAccessibleCSSTransition(originalTransition, animationType);
  }, [getAccessibleCSSTransition, originalTransition, animationType]);
}