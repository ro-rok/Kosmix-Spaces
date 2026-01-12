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

      // Start the animation loop
      const raf = (time: number) => {
        lenis.raf(time);
        rafRef.current = requestAnimationFrame(raf);
      };
      rafRef.current = requestAnimationFrame(raf);

      // Add event listeners for debugging and monitoring
      if (process.env.NODE_ENV === 'development') {
        lenis.on('scroll', ({ scroll, limit, velocity, direction, progress }) => {
          console.debug('Lenis scroll:', { scroll, limit, velocity, direction, progress });
        });
      }

      // Update animation context with Lenis instance
      setLenisInstance(lenis);
      
      console.log('Lenis initialized successfully', lenis);
      
    } catch (error) {
      console.error('Failed to initialize Lenis:', error);
      
      // Fallback: disable smooth scrolling in config
      updateConfig({
        smoothScroll: {
          ...config.smoothScroll,
          enabled: false,
        },
      });
      
      // Ensure context is updated even on failure
      setLenisInstance(null);
    }
  }, [shouldEnableSmoothing, lenisOptions, config.smoothScroll, updateConfig, setLenisInstance]);

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
    }
  }, [setLenisInstance]);

  // Initialize on mount and when options change
  useEffect(() => {
    // Wait for DOM to be ready before initializing
    const initializeWhenReady = () => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLenis, { once: true });
      } else {
        // DOM is already ready
        initializeLenis();
      }
    };

    if (shouldEnableSmoothing) {
      initializeWhenReady();
    } else {
      cleanupLenis();
    }

    return cleanupLenis;
  }, [shouldEnableSmoothing, initializeLenis, cleanupLenis]);

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
        // If Lenis fails, clean up and disable smooth scrolling
        cleanupLenis();
        updateConfig({
          smoothScroll: {
            ...config.smoothScroll,
            enabled: false,
          },
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [cleanupLenis, config.smoothScroll, updateConfig]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Ensure cleanup happens on unmount
      cleanupLenis();
    };
  }, [cleanupLenis]);

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
    <div
      ref={wrapperRef}
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: shouldEnableSmoothing ? 'hidden' : 'auto',
      }}
    >
      {children}
    </div>
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