import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useAnimation } from '@/contexts/AnimationContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export interface UseScrollAnimationOptions {
  /**
   * Intersection observer threshold (0-1)
   * @default 0.1
   */
  threshold?: number;
  /**
   * Root margin for intersection observer
   * @default "0px 0px -10% 0px"
   */
  rootMargin?: string;
  /**
   * Whether to trigger animation only once
   * @default true
   */
  triggerOnce?: boolean;
  /**
   * Disable the scroll animation
   * @default false
   */
  disabled?: boolean;
  /**
   * Custom animation configuration
   */
  animation?: {
    from?: gsap.TweenVars;
    to?: gsap.TweenVars;
    duration?: number;
    ease?: string;
    stagger?: number;
  };
  /**
   * ScrollTrigger specific options
   */
  scrollTrigger?: {
    start?: string;
    end?: string;
    scrub?: boolean | number;
    pin?: boolean;
    markers?: boolean;
  };
  /**
   * Callback when element enters viewport
   */
  onEnter?: (element: HTMLElement) => void;
  /**
   * Callback when element exits viewport
   */
  onExit?: (element: HTMLElement) => void;
  /**
   * Callback when animation completes
   */
  onComplete?: (element: HTMLElement) => void;
}

export interface UseScrollAnimationReturn {
  /**
   * Ref to attach to the element to be animated
   */
  ref: React.RefObject<HTMLElement>;
  /**
   * Whether the element is currently in view
   */
  isInView: boolean;
  /**
   * Whether the animation has been triggered
   */
  hasTriggered: boolean;
  /**
   * Whether the animation is currently playing
   */
  isAnimating: boolean;
  /**
   * Manually trigger the animation
   */
  trigger: () => void;
  /**
   * Reset the animation state
   */
  reset: () => void;
  /**
   * Get the current scroll progress (0-1) if using scrub
   */
  scrollProgress: number;
}

/**
 * Hook for scroll-triggered animations using GSAP and Intersection Observer
 * Provides smooth animations when elements enter/exit the viewport
 */
export function useScrollAnimation(
  options: UseScrollAnimationOptions = {}
): UseScrollAnimationReturn {
  const {
    threshold = 0.1,
    rootMargin = "0px 0px -10% 0px",
    triggerOnce = true,
    disabled = false,
    animation,
    scrollTrigger,
    onEnter,
    onExit,
    onComplete,
  } = options;

  const { config, isReducedMotion, animationRegistry } = useAnimation();
  const elementRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const animationIdRef = useRef<string>('');

  const [isInView, setIsInView] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Determine if animations should be enabled
  const animationsEnabled = !disabled && 
                           !isReducedMotion && 
                           config.scrollAnimations.enabled;

  // Default animation configuration
  const defaultAnimation = useMemo(() => ({
    from: { opacity: 0, y: 30 },
    to: { opacity: 1, y: 0 },
    duration: config.scrollAnimations.duration,
    ease: config.scrollAnimations.ease,
    stagger: config.scrollAnimations.staggerDelay,
  }), [config.scrollAnimations]);

  // Merge animation options
  const effectiveAnimation = useMemo(() => ({
    ...defaultAnimation,
    ...animation,
  }), [defaultAnimation, animation]);

  // Default ScrollTrigger configuration
  const defaultScrollTrigger = useMemo(() => ({
    start: 'top 80%',
    end: 'bottom 20%',
    scrub: false,
    pin: false,
    markers: false,
  }), []);

  // Merge ScrollTrigger options
  const effectiveScrollTrigger = useMemo(() => ({
    ...defaultScrollTrigger,
    ...scrollTrigger,
  }), [defaultScrollTrigger, scrollTrigger]);

  // Generate unique animation ID
  const generateAnimationId = useCallback(() => {
    return `scroll-animation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Create and configure the animation
  const createAnimation = useCallback(() => {
    if (!elementRef.current || !animationsEnabled) return null;

    const element = elementRef.current;
    const animationId = generateAnimationId();
    animationIdRef.current = animationId;

    // Set initial state
    gsap.set(element, effectiveAnimation.from);

    // Create timeline
    const timeline = gsap.timeline({
      paused: true,
      onStart: () => {
        setIsAnimating(true);
        onEnter?.(element);
      },
      onComplete: () => {
        setIsAnimating(false);
        setHasTriggered(true);
        onComplete?.(element);
      },
      onReverseComplete: () => {
        setIsAnimating(false);
        if (!triggerOnce) {
          setHasTriggered(false);
        }
        onExit?.(element);
      },
    });

    // Add animation to timeline
    timeline.to(element, {
      ...effectiveAnimation.to,
      duration: effectiveAnimation.duration,
      ease: effectiveAnimation.ease,
    });

    // Register animation for cleanup
    animationRegistry.register({
      id: animationId,
      type: 'scroll',
      priority: 1, // NORMAL priority
      startTime: performance.now(),
      element: elementRef.current || undefined,
      cleanup: () => {
        timeline.kill();
        if (scrollTriggerRef.current) {
          scrollTriggerRef.current.kill();
          scrollTriggerRef.current = null;
        }
      },
    });

    return timeline;
  }, [
    animationsEnabled,
    effectiveAnimation,
    triggerOnce,
    onEnter,
    onExit,
    onComplete,
    animationRegistry,
    generateAnimationId,
  ]);

  // Create ScrollTrigger
  const createScrollTrigger = useCallback(() => {
    if (!elementRef.current || !animationRef.current || !animationsEnabled) return;

    const element = elementRef.current;
    const timeline = animationRef.current;

    const scrollTriggerInstance = ScrollTrigger.create({
      trigger: element,
      start: effectiveScrollTrigger.start,
      end: effectiveScrollTrigger.end,
      scrub: effectiveScrollTrigger.scrub,
      pin: effectiveScrollTrigger.pin,
      markers: effectiveScrollTrigger.markers,
      animation: timeline,
      toggleActions: triggerOnce ? "play none none none" : "play none none reverse",
      onEnter: () => {
        setIsInView(true);
        if (!effectiveScrollTrigger.scrub) {
          timeline.play();
        }
      },
      onLeave: () => {
        setIsInView(false);
        if (!triggerOnce && !effectiveScrollTrigger.scrub) {
          timeline.reverse();
        }
      },
      onEnterBack: () => {
        setIsInView(true);
        if (!triggerOnce && !effectiveScrollTrigger.scrub) {
          timeline.play();
        }
      },
      onLeaveBack: () => {
        setIsInView(false);
        if (!triggerOnce && !effectiveScrollTrigger.scrub) {
          timeline.reverse();
        }
      },
      onUpdate: (self) => {
        setScrollProgress(self.progress);
      },
    });

    scrollTriggerRef.current = scrollTriggerInstance;
  }, [
    animationsEnabled,
    effectiveScrollTrigger,
    triggerOnce,
  ]);

  // Fallback intersection observer for reduced motion
  const createIntersectionObserver = useCallback(() => {
    if (!elementRef.current || animationsEnabled) return;

    const element = elementRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const inView = entry.isIntersecting;
          setIsInView(inView);
          
          if (inView && !hasTriggered) {
            setHasTriggered(true);
            onEnter?.(element);
            
            // Apply final state immediately for reduced motion
            if (isReducedMotion && config.accessibility.fallbackToInstant) {
              gsap.set(element, effectiveAnimation.to);
            }
          } else if (!inView && !triggerOnce && hasTriggered) {
            setHasTriggered(false);
            onExit?.(element);
            
            // Reset to initial state for reduced motion
            if (isReducedMotion && config.accessibility.fallbackToInstant) {
              gsap.set(element, effectiveAnimation.from);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);
    observerRef.current = observer;
  }, [
    animationsEnabled,
    threshold,
    rootMargin,
    hasTriggered,
    triggerOnce,
    isReducedMotion,
    config.accessibility.fallbackToInstant,
    effectiveAnimation,
    onEnter,
    onExit,
  ]);

  // Initialize animation system
  useEffect(() => {
    if (!elementRef.current) return;

    // Create animation timeline
    const timeline = createAnimation();
    animationRef.current = timeline;

    if (animationsEnabled && timeline) {
      // Use GSAP ScrollTrigger for full animations
      createScrollTrigger();
    } else {
      // Use intersection observer for reduced motion fallback
      createIntersectionObserver();
    }

    return () => {
      // Cleanup
      if (animationIdRef.current) {
        animationRegistry.unregister(animationIdRef.current);
      }
      
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
      
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      
      if (animationRef.current) {
        animationRef.current.kill();
        animationRef.current = null;
      }
    };
  }, [
    createAnimation,
    createScrollTrigger,
    createIntersectionObserver,
    animationsEnabled,
    animationRegistry,
  ]);

  // Manual trigger function
  const trigger = useCallback(() => {
    if (!animationRef.current) return;
    
    setIsAnimating(true);
    animationRef.current.play();
  }, []);

  // Reset function
  const reset = useCallback(() => {
    if (!elementRef.current) return;

    setIsInView(false);
    setHasTriggered(false);
    setIsAnimating(false);
    setScrollProgress(0);

    // Reset element to initial state
    gsap.set(elementRef.current, effectiveAnimation.from);
    
    if (animationRef.current) {
      animationRef.current.progress(0).pause();
    }
  }, [effectiveAnimation.from]);

  // Refresh ScrollTrigger when config changes
  useEffect(() => {
    if (scrollTriggerRef.current) {
      ScrollTrigger.refresh();
    }
  }, [config]);

  return {
    ref: elementRef,
    isInView,
    hasTriggered,
    isAnimating,
    trigger,
    reset,
    scrollProgress,
  };
}

/**
 * Hook for staggered scroll animations on multiple elements
 */
export function useStaggeredScrollAnimation(
  count: number,
  options: Omit<UseScrollAnimationOptions, 'animation'> & {
    stagger?: number;
    animation?: Omit<UseScrollAnimationOptions['animation'], 'stagger'>;
  } = {}
) {
  const { stagger = 0.1, animation, ...restOptions } = options;
  
  const animations = useMemo(() => {
    return Array.from({ length: count }, (_, index) => ({
      ...restOptions,
      animation: {
        ...animation,
        stagger: stagger * index,
      },
    }));
  }, [count, stagger, animation, restOptions]);

  const hooks = animations.map((animationOptions) => 
    useScrollAnimation(animationOptions)
  );

  return {
    refs: hooks.map(hook => hook.ref),
    states: hooks.map(hook => ({
      isInView: hook.isInView,
      hasTriggered: hook.hasTriggered,
      isAnimating: hook.isAnimating,
      scrollProgress: hook.scrollProgress,
    })),
    controls: {
      triggerAll: () => hooks.forEach(hook => hook.trigger()),
      resetAll: () => hooks.forEach(hook => hook.reset()),
    },
  };
}

export default useScrollAnimation;