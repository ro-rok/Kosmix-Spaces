import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import Lenis from 'lenis';
import type { LenisOptions } from 'lenis';
import { useAnimation } from '../contexts/AnimationContext';
import { configToLenisOptions } from '../lib/animation-config';
import { initializeAnchorLinks } from '../lib/smooth-scroll-utils';

interface SmoothScrollProviderProps {
  children: React.ReactNode;
  options?: Partial<LenisOptions>;
  className?: string;
  wrapper?: HTMLElement;
  content?: HTMLElement;
}

interface SmoothScrollRef {
  lenis: Lenis | null;
  scrollTo: (target: string | number | HTMLElement, options?: any) => void;
  start: () => void;
  stop: () => void;
  resize: () => void;
}

export function SmoothScrollProvider({
  children,
  options = {},
  className,
  wrapper,
  content,
}: SmoothScrollProviderProps) {
  const { config, isReducedMotion, updateConfig, setLenisInstance } = useAnimation();
  const lenisRef = useRef<Lenis | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Determine if smooth scrolling should be enabled
  const shouldEnableSmoothing = useMemo(() => {
    return config.smoothScroll.enabled && !isReducedMotion;
  }, [config.smoothScroll.enabled, isReducedMotion]);

  // Create Lenis options from config and props
  const lenisOptions = useMemo<LenisOptions>(() => {
    const configOptions = configToLenisOptions(config);
    
    return {
      ...configOptions,
      ...options,
      wrapper: wrapper || wrapperRef.current || undefined,
      content: content || undefined,
    };
  }, [config, options, wrapper, content]);

  // Initialize Lenis
  const initializeLenis = useCallback(() => {
    if (!shouldEnableSmoothing || lenisRef.current) {
      return;
    }

    try {
      const lenis = new Lenis(lenisOptions);
      lenisRef.current = lenis;

      // Make Lenis globally available for anchor navigation
      (window as any).lenis = lenis;
      
      // CRITICAL: Configure ScrollTrigger to use Lenis scroller
      // This tells ScrollTrigger to track scroll position from the Lenis wrapper
      if ((window as any).ScrollTrigger && wrapperRef.current) {
        const ScrollTrigger = (window as any).ScrollTrigger;
        ScrollTrigger.scrollerProxy(wrapperRef.current, {
          scrollTop(value?: number) {
            if (arguments.length && value !== undefined) {
              lenis.scrollTo(value, { immediate: true });
            }
            return lenis.animatedScroll;
          },
          getBoundingClientRect() {
            return {
              top: 0,
              left: 0,
              width: window.innerWidth,
              height: window.innerHeight,
            };
          },
          pinType: wrapperRef.current.style.transform ? "transform" : "fixed"
        });
        
        // Update ScrollTrigger on Lenis scroll
        lenis.on('scroll', () => {
          ScrollTrigger.update();
        });
      }

      // Start the animation loop
      const raf = (time: number) => {
        lenis.raf(time);
        rafRef.current = requestAnimationFrame(raf);
      };
      rafRef.current = requestAnimationFrame(raf);

      // Update animation context with Lenis instance
      setLenisInstance(lenis);
      
      // CRITICAL: Refresh ScrollTrigger after Lenis initializes
      setTimeout(() => {
        if ((window as any).ScrollTrigger) {
          (window as any).ScrollTrigger.refresh();
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to initialize Lenis:', error);
      setLenisInstance(null);
    }
  }, [shouldEnableSmoothing, lenisOptions, setLenisInstance]);

  // Cleanup Lenis
  const cleanupLenis = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (lenisRef.current) {
      lenisRef.current.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
      
      // Remove global reference
      delete (window as any).lenis;
      
      // Clean up ScrollTrigger scroller proxy
      if ((window as any).ScrollTrigger && wrapperRef.current) {
        const ScrollTrigger = (window as any).ScrollTrigger;
        ScrollTrigger.scrollerProxy(wrapperRef.current, null);
      }
    }
  }, [setLenisInstance]);

  // Initialize on mount and when options change
  useEffect(() => {
    if (shouldEnableSmoothing) {
      initializeLenis();
    } else {
      cleanupLenis();
    }

    return cleanupLenis;
  }, [shouldEnableSmoothing]);

  // Handle page load completion for better initialization
  useEffect(() => {
    const handleLoad = () => {
      if (lenisRef.current) {
        // Refresh Lenis after all resources are loaded
        lenisRef.current.resize();
      }
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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (lenisRef.current) {
        lenisRef.current.resize();
      }
    };

    const debouncedResize = debounce(handleResize, config.performance.debounceResize);
    
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [config.performance.debounceResize]);

  // Handle page visibility changes with error handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!lenisRef.current) return;

      try {
        if (document.hidden) {
          lenisRef.current.stop();
        } else {
          lenisRef.current.start();
          // Refresh on visibility change to handle potential layout changes
          lenisRef.current.resize();
        }
      } catch (error) {
        console.error('Error handling visibility change:', error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
        delete (window as any).lenis;
      }
    };
  }, []);

  // Initialize anchor link handling
  useEffect(() => {
    const cleanup = initializeAnchorLinks();
    return cleanup;
  }, []);

  // Provide scroll-to functionality
  const scrollTo = useCallback((target: string | number | HTMLElement, options?: any) => {
    try {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(target, options);
      } else {
        // Fallback to native scrolling
        if (typeof target === 'string') {
          const element = document.querySelector(target);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', ...options });
          }
        } else if (typeof target === 'number') {
          window.scrollTo({ top: target, behavior: 'smooth', ...options });
        } else if (target instanceof HTMLElement) {
          target.scrollIntoView({ behavior: 'smooth', ...options });
        }
      }
    } catch (error) {
      console.error('Error during scroll operation:', error);
      // Fallback to basic native scrolling without smooth behavior
      if (typeof target === 'string') {
        const element = document.querySelector(target);
        if (element) {
          element.scrollIntoView();
        }
      } else if (typeof target === 'number') {
        window.scrollTo({ top: target });
      } else if (target instanceof HTMLElement) {
        target.scrollIntoView();
      }
    }
  }, []);

  return (
    <>
      {shouldEnableSmoothing ? (
        <div
          ref={wrapperRef}
          className={className}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
      ) : (
        <div ref={wrapperRef} className={className}>
          {children}
        </div>
      )}
    </>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Hook to use smooth scroll functionality
export function useSmoothScroll() {
  const { config, isReducedMotion } = useAnimation();
  
  const scrollTo = useCallback((target: string | number | HTMLElement, options?: any) => {
    // This will be enhanced once we integrate with the context
    if (typeof target === 'string') {
      const element = document.querySelector(target);
      if (element) {
        element.scrollIntoView({ 
          behavior: isReducedMotion ? 'auto' : 'smooth', 
          ...options 
        });
      }
    } else if (typeof target === 'number') {
      window.scrollTo({ 
        top: target, 
        behavior: isReducedMotion ? 'auto' : 'smooth', 
        ...options 
      });
    } else if (target instanceof HTMLElement) {
      target.scrollIntoView({ 
        behavior: isReducedMotion ? 'auto' : 'smooth', 
        ...options 
      });
    }
  }, [isReducedMotion]);

  return {
    scrollTo,
    isEnabled: config.smoothScroll.enabled && !isReducedMotion,
  };
}