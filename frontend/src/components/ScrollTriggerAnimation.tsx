import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAnimation } from '../contexts/AnimationContext';
import { useAccessibleGSAP } from '../hooks/useAnimationAccessibility';
import { withAnimationErrorHandling } from '../lib/animation-error-handling';
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
  const createAnimation = useCallback(withAnimationErrorHandling(() => {
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
      }
    );
    
    // Register timeline for cleanup
    gsapRegistry.register(animationId, timeline);
    
    // Create ScrollTrigger using optimized utility
    const scrollTriggerInstance = createOptimizedScrollTrigger(
      `${animationId}-trigger`,
      {
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
      } as any, // Type assertion to handle GSAP type issues
      {
        respectReducedMotion: config.accessibility.respectReducedMotion,
        autoCleanup: true,
      }
    );
    
    timelineRef.current = timeline;
    scrollTriggerRef.current = scrollTriggerInstance;
  }, 'ScrollTriggerAnimation.createAnimation'), [
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
    
    return () => {
      clearTimeout(timeoutId);
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
  
  return (
    <div 
      ref={elementRef} 
      className={className}
      style={{
        // Ensure element is initially hidden if animations are enabled
        ...(shouldDisableAnimation ? {} : { opacity: 0 }),
      }}
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