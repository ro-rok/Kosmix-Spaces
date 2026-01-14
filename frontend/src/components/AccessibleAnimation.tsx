import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { useAnimationAccessibility } from '../hooks/useAnimationAccessibility';
import { reportError } from '../lib/animation-error-handling';

// Props for the AccessibleAnimation component
interface AccessibleAnimationProps extends Omit<MotionProps, 'ref'> {
  children: React.ReactNode;
  animationType?: 'transition' | 'scroll' | 'interaction' | 'loading';
  fallbackComponent?: React.ComponentType<any>;
  fallbackProps?: any;
  enableErrorRecovery?: boolean;
  announceToScreenReader?: boolean;
  screenReaderMessage?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Accessible animation wrapper component
export const AccessibleAnimation = forwardRef<HTMLDivElement, AccessibleAnimationProps>(
  ({
    children,
    animationType = 'transition',
    fallbackComponent: FallbackComponent,
    fallbackProps = {},
    enableErrorRecovery = true,
    announceToScreenReader = false,
    screenReaderMessage,
    className = '',
    style = {},
    ...motionProps
  }, ref) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const [hasError, setHasError] = useState(false);
    
    // Combine refs
    const combinedRef = (node: HTMLDivElement) => {
      elementRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    // Get accessibility features
    const {
      preferences,
      shouldDisableAnimations,
      getAccessibleMotionProps,
      announceAnimation,
    } = useAnimationAccessibility();

    // Get accessible motion props
    const accessibleProps = getAccessibleMotionProps(motionProps, animationType);

    // Handle animation announcements
    useEffect(() => {
      if (announceToScreenReader && screenReaderMessage && !preferences.reducedMotion) {
        announceAnimation(screenReaderMessage);
      }
    }, [announceToScreenReader, screenReaderMessage, announceAnimation, preferences.reducedMotion]);

    // Error boundary for animation errors
    useEffect(() => {
      if (!enableErrorRecovery) return;

      const handleError = (event: ErrorEvent) => {
        setHasError(true);
        reportError({
          type: 'runtime',
          message: event.message,
          context: `AccessibleAnimation-${animationType}`,
          timestamp: Date.now(),
          stack: event.error?.stack,
        });
      };

      const handleRejection = (event: PromiseRejectionEvent) => {
        setHasError(true);
        reportError({
          type: 'runtime',
          message: String(event.reason),
          context: `AccessibleAnimation-${animationType}`,
          timestamp: Date.now(),
        });
      };

      // Set up error handling for the component
      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleRejection);
      };
    }, [enableErrorRecovery, animationType]);

    // Apply fallback styles if needed
    useEffect(() => {
      if (!elementRef.current) return;

      if (shouldDisableAnimations || hasError) {
        // Apply instant fallback styles
        const fallbackStyles: React.CSSProperties = {
          transition: 'none',
          animation: 'none',
          transform: 'none',
        };

        Object.assign(elementRef.current.style, fallbackStyles);
        elementRef.current.classList.add('animation-fallback');
      }
    }, [shouldDisableAnimations, hasError]);

    // If there's an error and a fallback component is provided
    if (hasError && FallbackComponent) {
      return (
        <FallbackComponent
          ref={combinedRef}
          className={`${className} animation-error-fallback`}
          style={style}
          {...fallbackProps}
        >
          {children}
        </FallbackComponent>
      );
    }

    // If animations should be disabled completely
    if (shouldDisableAnimations || hasError) {
      return (
        <div
          ref={combinedRef}
          className={`${className} animation-disabled`}
          style={{
            ...style,
            transition: 'none',
            animation: 'none',
          }}
        >
          {children}
        </div>
      );
    }

    // Render with accessible motion props
    try {
      return (
        <motion.div
          ref={combinedRef}
          className={`${className} accessible-animation`}
          style={style}
          {...accessibleProps}
        >
          {children}
        </motion.div>
      );
    } catch (error) {
      // Fallback to regular div if motion fails
      if (enableErrorRecovery) {
        console.warn('Motion component failed, falling back to regular div:', error);
        return (
          <div
            ref={combinedRef}
            className={`${className} animation-fallback`}
            style={style}
          >
            {children}
          </div>
        );
      }
      throw error;
    }
  }
);

AccessibleAnimation.displayName = 'AccessibleAnimation';

// Higher-order component for making any component accessible
export function withAccessibleAnimation<P extends object>(
  Component: React.ComponentType<P>,
  defaultAnimationType: 'transition' | 'scroll' | 'interaction' | 'loading' = 'transition'
) {
  const AccessibleComponent = forwardRef<any, P & Partial<AccessibleAnimationProps>>(
    ({ animationType = defaultAnimationType, ...props }, ref) => {
      const { getAccessibleMotionProps } = useAnimationAccessibility();
      
      // Extract motion props from component props
      const motionProps = {
        initial: (props as any).initial,
        animate: (props as any).animate,
        exit: (props as any).exit,
        transition: (props as any).transition,
        whileHover: (props as any).whileHover,
        whileTap: (props as any).whileTap,
        whileFocus: (props as any).whileFocus,
      };

      // Get accessible props
      const accessibleProps = getAccessibleMotionProps(motionProps, animationType);

      // Merge accessible props back into component props
      const finalProps = {
        ...props,
        ...accessibleProps,
      } as P;

      return <Component ref={ref} {...finalProps} />;
    }
  );

  AccessibleComponent.displayName = `withAccessibleAnimation(${Component.displayName || Component.name})`;
  return AccessibleComponent;
}

// Utility component for accessible scroll animations
interface AccessibleScrollAnimationProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  stagger?: number;
  animation?: {
    initial: any;
    animate: any;
    transition?: any;
  };
}

export const AccessibleScrollAnimation: React.FC<AccessibleScrollAnimationProps> = ({
  children,
  className = '',
  style = {},
  threshold = 0.1,
  rootMargin = '0px 0px -10% 0px',
  triggerOnce = true,
  stagger = 0,
  animation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}) => {
  const [isInView, setIsInView] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const { shouldDisableAnimations } = useAnimationAccessibility();

  // Set up intersection observer
  useEffect(() => {
    if (!elementRef.current || shouldDisableAnimations) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, shouldDisableAnimations]);

  // If animations are disabled, show content immediately
  if (shouldDisableAnimations) {
    return (
      <div ref={elementRef} className={`${className} scroll-animation-disabled`} style={style}>
        {children}
      </div>
    );
  }

  return (
    <AccessibleAnimation
      ref={elementRef}
      className={`${className} scroll-animation`}
      style={style}
      animationType="scroll"
      initial={animation.initial}
      animate={isInView ? animation.animate : animation.initial}
      transition={{
        ...animation.transition,
        delay: stagger,
      }}
    >
      {children}
    </AccessibleAnimation>
  );
};

// Utility component for accessible loading animations
interface AccessibleLoadingAnimationProps {
  children: React.ReactNode;
  isLoading: boolean;
  className?: string;
  style?: React.CSSProperties;
  loadingComponent?: React.ReactNode;
  announceLoading?: boolean;
  loadingMessage?: string;
}

export const AccessibleLoadingAnimation: React.FC<AccessibleLoadingAnimationProps> = ({
  children,
  isLoading,
  className = '',
  style = {},
  loadingComponent,
  announceLoading = true,
  loadingMessage = 'Loading content',
}) => {
  const { announceAnimation } = useAnimationAccessibility();

  // Announce loading state changes
  useEffect(() => {
    if (announceLoading) {
      if (isLoading) {
        announceAnimation(loadingMessage);
      } else {
        announceAnimation('Content loaded');
      }
    }
  }, [isLoading, announceLoading, loadingMessage, announceAnimation]);

  return (
    <AccessibleAnimation
      className={`${className} loading-animation`}
      style={style}
      animationType="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {isLoading ? (loadingComponent || <div>Loading...</div>) : children}
    </AccessibleAnimation>
  );
};

export default AccessibleAnimation;