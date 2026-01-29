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
      return { amount: baseStagger, from: from as number };
    }
    
    switch (from) {
      case 'center':
        return { amount: baseStagger, from: 'center' as const };
      case 'end':
        return { amount: baseStagger, from: 'end' as const };
      case 'edges':
        return { amount: baseStagger, from: 'edges' as const };
      case 'random':
        return { amount: baseStagger, from: 'random' as const };
      default:
        return { amount: baseStagger, from: 'start' as const };
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
    if (childElements.length === 0) {
      // Silently return if no children - they may not be rendered yet
      // This is expected during initial render or when children are conditionally rendered
      return;
    }
    
    // Convert HTMLCollection to Array for easier manipulation
    const elementsArray = Array.from(childElements) as HTMLElement[];
    
    // Apply direction if reverse
    const targetElements = direction === 'reverse' ? elementsArray.reverse() : elementsArray;
    
    // Additional safety check
    if (targetElements.length === 0) {
      console.warn('StaggerAnimation: No target elements after processing');
      return;
    }
    
    // Create new timeline
    const timeline = gsap.timeline({ paused: true });
    
    // Set initial state for all elements with a safer approach
    // Use will-change to prepare for animation but keep elements visible initially
    targetElements.forEach(el => {
      (el as HTMLElement).style.willChange = 'opacity, transform';
    });
    
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
        // Clear will-change after animation completes for better performance
        targetElements.forEach(el => {
          (el as HTMLElement).style.willChange = 'auto';
        });
        onComplete?.();
      },
    });
    
    // Register timeline for cleanup
    gsapRegistry.register(animationId, timeline);
    
    // Find Lenis wrapper element if it exists
    const lenisWrapper = document.querySelector('[style*="position: fixed"]') as HTMLElement | null;
    
    // Create ScrollTrigger using optimized utility
    if (!scrub) {
      const scrollTriggerInstance = ScrollTrigger.create({
        trigger: trigger || containerRef.current,
        scroller: lenisWrapper || window,
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
      });
      
      // Register for cleanup
      gsapRegistry.registerScrollTrigger(`${animationId}-trigger`, scrollTriggerInstance);
      scrollTriggerRef.current = scrollTriggerInstance;
      
      // CRITICAL FIX: If element is already in viewport, play animation immediately
      // This fixes the issue where content above the fold never appears
      setTimeout(() => {
        if (scrollTriggerInstance && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const isInViewport = rect.top < window.innerHeight * 0.8;
          
          if (isInViewport && timeline.progress() === 0) {
            timeline.play();
          }
        }
      }, 100);
    } else {
      // Create scrub animation
      const scrollTriggerInstance = ScrollTrigger.create({
        trigger: trigger || containerRef.current,
        scroller: lenisWrapper || window,
        start,
        end,
        scrub: typeof scrub === 'boolean' ? true : scrub,
        animation: timeline,
      });
      
      // Register for cleanup
      gsapRegistry.registerScrollTrigger(`${animationId}-scrub-trigger`, scrollTriggerInstance);
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
        if (childElements.length > 0) {
          gsap.set(childElements, {
            opacity: 1,
            y: 0,
            scale: 1,
            clearProps: 'all',
          });
        }
      }
      return;
    }
    
    // Reduced delay for faster initialization
    const timeoutId = setTimeout(createStaggerAnimation, 50);
    
    // Failsafe: Ensure content is visible after max wait time
    const failsafeTimeoutId = setTimeout(() => {
      if (containerRef.current) {
        const childElements = Array.from(containerRef.current.children) as HTMLElement[];
        childElements.forEach(el => {
          const element = el as HTMLElement;
          // Only force visibility if element is still invisible
          const opacity = window.getComputedStyle(element).opacity;
          if (opacity === '0' || parseFloat(opacity) < 0.1) {
            gsap.to(element, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.3,
              ease: 'power2.out',
              clearProps: 'all',
            });
          }
        });
      }
    }, 2000); // 2 second failsafe
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(failsafeTimeoutId);
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