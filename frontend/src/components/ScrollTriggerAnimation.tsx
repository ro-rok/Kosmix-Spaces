import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAnimation } from '../contexts/AnimationContext';
import { useAccessibleGSAP } from '../hooks/useAnimationAccessibility';
import { reportError } from '../lib/animation-error-handling';
import { gsapRegistry, createOptimizedScrollTrigger, isReducedMotionPreferred } from '../lib/gsap-utils';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export interface ScrollTriggerAnimationProps {
  children: React.ReactNode;
  animation: gsap.TweenVars;
  trigger?: string | HTMLElement;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  pin?: boolean;
  markers?: boolean;
  onEnter?: () => void;
  onLeave?: () => void;
  onEnterBack?: () => void;
  onLeaveBack?: () => void;
  onUpdate?: (self: ScrollTrigger) => void;
  className?: string;
  disabled?: boolean;
}

export function ScrollTriggerAnimation({
  children,
  animation,
  trigger,
  start = 'top 80%',
  end = 'bottom 20%',
  scrub = false,
  pin = false,
  markers = false,
  onEnter,
  onLeave,
  onEnterBack,
  onLeaveBack,
  onUpdate,
  className,
  disabled = false,
}: ScrollTriggerAnimationProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  
  const { config, isReducedMotion } = useAnimation();
  
  // Get accessible GSAP props
  const accessibleAnimation = useAccessibleGSAP(animation, 'scroll');
  
  // Determine if animations should be disabled
  const shouldDisableAnimation = useMemo(() => {
    return disabled || 
           !config.scrollAnimations.enabled || 
           (isReducedMotion && config.accessibility.respectReducedMotion);
  }, [disabled, config.scrollAnimations.enabled, isReducedMotion, config.accessibility.respectReducedMotion]);
  
  // Create animation timeline with error handling
  const createAnimation = useCallback(() => {
    try {
      if (!elementRef.current || shouldDisableAnimation) return;
      
      // Generate unique ID for this animation
      const animationId = `scroll-trigger-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Clean up existing animation
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
      }
      
      // Create new timeline
      const timeline = gsap.timeline({ paused: true });
    
    // Prepare element for animation
    if (elementRef.current) {
      (elementRef.current as HTMLElement).style.willChange = 'opacity, transform';
    }
    
    // Apply accessible animation to the element
    timeline.fromTo(elementRef.current, 
      {
        // Default from state (can be overridden by animation prop)
        opacity: 0,
        y: 50,
        scale: 0.95,
        ...accessibleAnimation.from,
      },
      {
        // Default to state (can be overridden by animation prop)
        opacity: 1,
        y: 0,
        scale: 1,
        duration: accessibleAnimation.duration || config.scrollAnimations.duration || 0.8,
        ease: accessibleAnimation.ease || config.scrollAnimations.ease || 'power2.out',
        force3D: true, // Enable GPU acceleration
        ...accessibleAnimation,
        // Ensure we don't override the element reference
        ...(accessibleAnimation.targets ? {} : {}),
        onComplete: () => {
          // Clear will-change after animation completes for better performance
          if (elementRef.current) {
            (elementRef.current as HTMLElement).style.willChange = 'auto';
          }
        },
      }
    );
    
    // Register timeline for cleanup
    gsapRegistry.register(animationId, timeline);
    
    // Create ScrollTrigger using optimized utility
    const scrollTriggerInstance = createOptimizedScrollTrigger({
      id: `${animationId}-trigger`,
      trigger: trigger || elementRef.current,
      start,
      end,
      scrub,
      pin,
      markers: markers && process.env.NODE_ENV === 'development',
      animation: timeline,
      onEnter: () => {
        if (!scrub) timeline.play();
        onEnter?.();
      },
      onLeave: () => {
        if (!scrub) timeline.reverse();
        onLeave?.();
      },
      onEnterBack: () => {
        if (!scrub) timeline.play();
        onEnterBack?.();
      },
      onLeaveBack: () => {
        if (!scrub) timeline.reverse();
        onLeaveBack?.();
      },
      onUpdate: onUpdate,
      respectReducedMotion: config.accessibility.respectReducedMotion,
      autoCleanup: true,
    } as any);
    
    timelineRef.current = timeline;
    scrollTriggerRef.current = scrollTriggerInstance;
    
    // CRITICAL FIX: If element is already in viewport, play animation immediately
    // This fixes the issue where content above the fold never appears
    setTimeout(() => {
      if (scrollTriggerInstance && elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight * 0.8;
        
        if (isInViewport && timeline.progress() === 0) {
          timeline.play();
        }
      }
    }, 100);
    } catch (error) {
      reportError({
        type: 'runtime',
        message: error instanceof Error ? error.message : 'ScrollTrigger animation error',
        context: 'ScrollTriggerAnimation.createAnimation',
        timestamp: Date.now(),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }, [
    accessibleAnimation,
    trigger,
    start,
    end,
    scrub,
    pin,
    markers,
    onEnter,
    onLeave,
    onEnterBack,
    onLeaveBack,
    onUpdate,
    shouldDisableAnimation,
    config.scrollAnimations.duration,
    config.scrollAnimations.ease,
    config.accessibility.respectReducedMotion,
  ]);
  
  // Initialize animation on mount and when dependencies change
  useEffect(() => {
    if (shouldDisableAnimation) {
      // If animations are disabled, ensure element is in final state
      if (elementRef.current) {
        gsap.set(elementRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          clearProps: 'all',
        });
      }
      return;
    }
    
    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(createAnimation, 50);
    
    // Failsafe: Ensure content is visible after max wait time
    const failsafeTimeoutId = setTimeout(() => {
      if (elementRef.current) {
        const opacity = window.getComputedStyle(elementRef.current).opacity;
        // Only force visibility if element is still invisible
        if (opacity === '0' || parseFloat(opacity) < 0.1) {
          gsap.to(elementRef.current, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
            clearProps: 'all',
          });
        }
      }
    }, 2000); // 2 second failsafe
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(failsafeTimeoutId);
    };
  }, [createAnimation, shouldDisableAnimation]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
      }
    };
  }, []);
  
  // Refresh ScrollTrigger when window resizes
  useEffect(() => {
    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Refresh ScrollTrigger after initial load to ensure proper positioning
  useEffect(() => {
    const handleLoad = () => {
      // Delay to ensure DOM is fully ready
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 500);
    };
    
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad, { once: true });
    }
    
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);
  
  return (
    <div 
      ref={elementRef} 
      className={className}
    >
      {children}
    </div>
  );
}

// Utility function to create common scroll animations
export const scrollAnimationPresets = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  slideUp: {
    from: { opacity: 0, y: 50 },
    to: { opacity: 1, y: 0 },
  },
  slideDown: {
    from: { opacity: 0, y: -50 },
    to: { opacity: 1, y: 0 },
  },
  slideLeft: {
    from: { opacity: 0, x: 50 },
    to: { opacity: 1, x: 0 },
  },
  slideRight: {
    from: { opacity: 0, x: -50 },
    to: { opacity: 1, x: 0 },
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.8 },
    to: { opacity: 1, scale: 1 },
  },
  rotateIn: {
    from: { opacity: 0, rotation: -10, scale: 0.9 },
    to: { opacity: 1, rotation: 0, scale: 1 },
  },
} as const;

// Hook for easier usage of scroll animations
export function useScrollTriggerAnimation(
  animation: gsap.TweenVars,
  options?: Omit<ScrollTriggerAnimationProps, 'children' | 'animation'>
) {
  const elementRef = useRef<HTMLDivElement>(null);
  const { config, isReducedMotion } = useAnimation();
  
  const shouldDisableAnimation = useMemo(() => {
    return options?.disabled || 
           !config.scrollAnimations.enabled || 
           (isReducedMotion && config.accessibility.respectReducedMotion);
  }, [options?.disabled, config.scrollAnimations.enabled, isReducedMotion, config.accessibility.respectReducedMotion]);
  
  useEffect(() => {
    if (!elementRef.current || shouldDisableAnimation) return;
    
    const timeline = gsap.timeline({ paused: true });
    timeline.fromTo(elementRef.current, 
      {
        opacity: 0,
        y: 50,
        ...animation.from,
      },
      {
        opacity: 1,
        y: 0,
        duration: animation.duration || config.scrollAnimations.duration || 0.8,
        ease: animation.ease || config.scrollAnimations.ease || 'power2.out',
        ...animation,
      }
    );
    
    const scrollTrigger = ScrollTrigger.create({
      trigger: options?.trigger || elementRef.current,
      start: options?.start || 'top 80%',
      end: options?.end || 'bottom 20%',
      scrub: options?.scrub || false,
      pin: options?.pin || false,
      markers: options?.markers && process.env.NODE_ENV === 'development',
      animation: timeline,
      onEnter: () => {
        if (!options?.scrub) timeline.play();
        options?.onEnter?.();
      },
      onLeave: () => {
        if (!options?.scrub) timeline.reverse();
        options?.onLeave?.();
      },
      onEnterBack: () => {
        if (!options?.scrub) timeline.play();
        options?.onEnterBack?.();
      },
      onLeaveBack: () => {
        if (!options?.scrub) timeline.reverse();
        options?.onLeaveBack?.();
      },
      onUpdate: options?.onUpdate,
    });
    
    return () => {
      timeline.kill();
      scrollTrigger.kill();
    };
  }, [animation, options, shouldDisableAnimation, config.scrollAnimations.duration, config.scrollAnimations.ease]);
  
  return elementRef;
}

export default ScrollTriggerAnimation;