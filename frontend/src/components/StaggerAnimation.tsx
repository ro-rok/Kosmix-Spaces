import React, { useRef, useEffect, useCallback, useMemo, Children } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAnimation } from '../contexts/AnimationContext';
import { gsapRegistry, createOptimizedScrollTrigger, createBatchScrollTriggers } from '../lib/gsap-utils';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export interface StaggerAnimationProps {
  children: React.ReactNode;
  stagger: number;
  from?: 'start' | 'center' | 'end' | 'edges' | 'random' | number;
  animation: gsap.TweenVars;
  trigger?: string | HTMLElement;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  onComplete?: () => void;
  onStart?: () => void;
  className?: string;
  disabled?: boolean;
  direction?: 'normal' | 'reverse';
}

export function StaggerAnimation({
  children,
  stagger,
  from = 'start',
  animation,
  trigger,
  start = 'top 80%',
  end = 'bottom 20%',
  scrub = false,
  onComplete,
  onStart,
  className,
  disabled = false,
  direction = 'normal',
}: StaggerAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  
  const { config, isReducedMotion } = useAnimation();
  
  // Determine if animations should be disabled
  const shouldDisableAnimation = useMemo(() => {
    return disabled || 
           !config.scrollAnimations.enabled || 
           (isReducedMotion && config.accessibility.respectReducedMotion);
  }, [disabled, config.scrollAnimations.enabled, isReducedMotion, config.accessibility.respectReducedMotion]);
  
  // Calculate stagger configuration
  const staggerConfig = useMemo(() => {
    const baseStagger = stagger || config.scrollAnimations.staggerDelay;
    
    if (typeof from === 'number') {
      return { amount: baseStagger, from };
    }
    
    switch (from) {
      case 'center':
        return { amount: baseStagger, from: 'center' };
      case 'end':
        return { amount: baseStagger, from: 'end' };
      case 'edges':
        return { amount: baseStagger, from: 'edges' };
      case 'random':
        return { amount: baseStagger, from: 'random' };
      default:
        return { amount: baseStagger, from: 'start' };
    }
  }, [stagger, from, config.scrollAnimations.staggerDelay]);
  
  // Create staggered animation
  const createStaggerAnimation = useCallback(() => {
    if (!containerRef.current || shouldDisableAnimation) return;
    
    // Generate unique ID for this animation
    const animationId = `stagger-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Clean up existing animation
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    if (scrollTriggerRef.current) {
      scrollTriggerRef.current.kill();
    }
    
    // Get all child elements that should be animated
    const childElements = containerRef.current.children;
    if (childElements.length === 0) return;
    
    // Convert HTMLCollection to Array for easier manipulation
    const elementsArray = Array.from(childElements) as HTMLElement[];
    
    // Apply direction if reverse
    const targetElements = direction === 'reverse' ? elementsArray.reverse() : elementsArray;
    
    // Create new timeline
    const timeline = gsap.timeline({ paused: true });
    
    // Set initial state for all elements
    gsap.set(targetElements, {
      opacity: 0,
      y: 50,
      scale: 0.95,
      force3D: true, // Enable GPU acceleration
      ...animation.from,
    });
    
    // Create staggered animation
    timeline.to(targetElements, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: animation.duration || config.scrollAnimations.duration || 0.8,
      ease: animation.ease || config.scrollAnimations.ease || 'power2.out',
      force3D: true, // Enable GPU acceleration
      stagger: staggerConfig,
      ...animation,
      // Ensure we don't override the stagger configuration
      ...(animation.stagger ? {} : {}),
      onStart: () => {
        onStart?.();
      },
      onComplete: () => {
        onComplete?.();
      },
    });
    
    // Register timeline for cleanup
    gsapRegistry.register(animationId, timeline);
    
    // Create ScrollTrigger using optimized utility
    if (!scrub) {
      const scrollTriggerInstance = createOptimizedScrollTrigger(
        `${animationId}-trigger`,
        {
          trigger: trigger || containerRef.current,
          start,
          end,
          animation: timeline,
          onEnter: () => timeline.play(),
          onLeave: () => {
            // Only reverse if triggerOnce is false
            if (!config.scrollAnimations.triggerOnce) {
              timeline.reverse();
            }
          },
          onEnterBack: () => timeline.play(),
          onLeaveBack: () => {
            if (!config.scrollAnimations.triggerOnce) {
              timeline.reverse();
            }
          },
        },
        {
          respectReducedMotion: config.accessibility.respectReducedMotion,
          autoCleanup: true,
        }
      );
      
      scrollTriggerRef.current = scrollTriggerInstance;
    } else {
      // Create scrub animation
      const scrollTriggerInstance = createOptimizedScrollTrigger(
        `${animationId}-scrub-trigger`,
        {
          trigger: trigger || containerRef.current,
          start,
          end,
          scrub: typeof scrub === 'boolean' ? true : scrub,
          animation: timeline,
        },
        {
          respectReducedMotion: config.accessibility.respectReducedMotion,
          autoCleanup: true,
        }
      );
      
      scrollTriggerRef.current = scrollTriggerInstance;
    }
    
    timelineRef.current = timeline;
  }, [
    animation,
    trigger,
    start,
    end,
    scrub,
    staggerConfig,
    direction,
    onComplete,
    onStart,
    shouldDisableAnimation,
    config.scrollAnimations.duration,
    config.scrollAnimations.ease,
    config.scrollAnimations.triggerOnce,
  ]);
  
  // Initialize animation on mount and when dependencies change
  useEffect(() => {
    if (shouldDisableAnimation) {
      // If animations are disabled, ensure all elements are in final state
      if (containerRef.current) {
        const childElements = Array.from(containerRef.current.children) as HTMLElement[];
        gsap.set(childElements, {
          opacity: 1,
          y: 0,
          scale: 1,
          clearProps: 'all',
        });
      }
      return;
    }
    
    // Small delay to ensure DOM is ready and children are rendered
    const timeoutId = setTimeout(createStaggerAnimation, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [createStaggerAnimation, shouldDisableAnimation]);
  
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
      ref={containerRef} 
      className={className}
    >
      {children}
    </div>
  );
}

// Utility function for common stagger animation presets
export const staggerAnimationPresets = {
  fadeInUp: {
    from: { opacity: 0, y: 30 },
    to: { opacity: 1, y: 0 },
    duration: 0.6,
    ease: 'power2.out',
  },
  fadeInDown: {
    from: { opacity: 0, y: -30 },
    to: { opacity: 1, y: 0 },
    duration: 0.6,
    ease: 'power2.out',
  },
  fadeInLeft: {
    from: { opacity: 0, x: -30 },
    to: { opacity: 1, x: 0 },
    duration: 0.6,
    ease: 'power2.out',
  },
  fadeInRight: {
    from: { opacity: 0, x: 30 },
    to: { opacity: 1, x: 0 },
    duration: 0.6,
    ease: 'power2.out',
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.8 },
    to: { opacity: 1, scale: 1 },
    duration: 0.5,
    ease: 'back.out(1.7)',
  },
  slideInUp: {
    from: { opacity: 0, y: 50, rotationX: -15 },
    to: { opacity: 1, y: 0, rotationX: 0 },
    duration: 0.8,
    ease: 'power3.out',
  },
} as const;

// Hook for easier usage of stagger animations
export function useStaggerAnimation(
  animation: gsap.TweenVars,
  options?: Omit<StaggerAnimationProps, 'children' | 'animation'>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { config, isReducedMotion } = useAnimation();
  
  const shouldDisableAnimation = useMemo(() => {
    return options?.disabled || 
           !config.scrollAnimations.enabled || 
           (isReducedMotion && config.accessibility.respectReducedMotion);
  }, [options?.disabled, config.scrollAnimations.enabled, isReducedMotion, config.accessibility.respectReducedMotion]);
  
  useEffect(() => {
    if (!containerRef.current || shouldDisableAnimation) return;
    
    const childElements = Array.from(containerRef.current.children) as HTMLElement[];
    if (childElements.length === 0) return;
    
    const stagger = options?.stagger || config.scrollAnimations.staggerDelay;
    const direction = options?.direction || 'normal';
    const targetElements = direction === 'reverse' ? childElements.reverse() : childElements;
    
    // Set initial state
    gsap.set(targetElements, {
      opacity: 0,
      y: 50,
      ...animation.from,
    });
    
    // Create timeline
    const timeline = gsap.timeline({ paused: true });
    timeline.to(targetElements, {
      opacity: 1,
      y: 0,
      duration: animation.duration || config.scrollAnimations.duration || 0.8,
      ease: animation.ease || config.scrollAnimations.ease || 'power2.out',
      stagger: { amount: stagger, from: options?.from || 'start' },
      ...animation,
      onStart: options?.onStart,
      onComplete: options?.onComplete,
    });
    
    // Create ScrollTrigger
    const scrollTrigger = ScrollTrigger.create({
      trigger: options?.trigger || containerRef.current,
      start: options?.start || 'top 80%',
      end: options?.end || 'bottom 20%',
      scrub: options?.scrub || false,
      animation: timeline,
      onEnter: () => {
        if (!options?.scrub) timeline.play();
      },
      onLeave: () => {
        if (!options?.scrub && !config.scrollAnimations.triggerOnce) {
          timeline.reverse();
        }
      },
      onEnterBack: () => {
        if (!options?.scrub) timeline.play();
      },
      onLeaveBack: () => {
        if (!options?.scrub && !config.scrollAnimations.triggerOnce) {
          timeline.reverse();
        }
      },
    });
    
    return () => {
      timeline.kill();
      scrollTrigger.kill();
    };
  }, [
    animation,
    options,
    shouldDisableAnimation,
    config.scrollAnimations.staggerDelay,
    config.scrollAnimations.duration,
    config.scrollAnimations.ease,
    config.scrollAnimations.triggerOnce,
  ]);
  
  return containerRef;
}

export default StaggerAnimation;