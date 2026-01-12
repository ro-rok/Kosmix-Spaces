import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAnimation } from '@/contexts/AnimationContext';

interface RouteTransitionProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Disable transitions for specific routes (e.g., modals, overlays)
   */
  disableTransition?: boolean;
  /**
   * Custom transition overrides
   */
  customTransition?: {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
  };
}

/**
 * RouteTransition component handles transitions between different routes
 * Designed to work with React Router's location changes
 */
export function RouteTransition({ 
  children, 
  className, 
  disableTransition = false,
  customTransition 
}: RouteTransitionProps) {
  const location = useLocation();
  const { config, isReducedMotion } = useAnimation();
  const [isNavigating, setIsNavigating] = useState(false);

  // Track navigation state
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Skip transitions if disabled or reduced motion
  if (disableTransition || (isReducedMotion && config.accessibility.fallbackToInstant)) {
    return <div className={className}>{children}</div>;
  }

  // Get transition configuration
  const getTransitionConfig = () => {
    if (customTransition) {
      return customTransition;
    }

    if (isReducedMotion) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.1, ease: 'linear' },
      };
    }

    return config.transitions.pageTransition;
  };

  const transitionConfig = getTransitionConfig();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname + location.search}
        className={className}
        initial={transitionConfig.initial}
        animate={transitionConfig.animate}
        exit={transitionConfig.exit}
        transition={transitionConfig.transition}
        // Prevent layout shift during transitions
        style={{
          width: '100%',
          minHeight: 'inherit',
        }}
        // Add data attribute for debugging
        data-route={location.pathname}
        data-navigating={isNavigating}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Layout component that preserves certain elements during route transitions
 * Useful for keeping headers, footers, or sidebars stable
 */
interface TransitionLayoutProps {
  children: React.ReactNode;
  preserveElements?: React.ReactNode;
  className?: string;
}

export function TransitionLayout({ 
  children, 
  preserveElements, 
  className 
}: TransitionLayoutProps) {
  return (
    <div className={className}>
      {preserveElements}
      <RouteTransition>
        {children}
      </RouteTransition>
    </div>
  );
}

/**
 * Hook to prevent navigation during transitions
 * Useful for preventing rapid navigation that could cause issues
 */
export function useNavigationGuard() {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { config } = useAnimation();

  useEffect(() => {
    setIsTransitioning(true);
    
    const transitionDuration = config.transitions.defaultDuration * 1000;
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDuration + 100); // Add small buffer

    return () => clearTimeout(timer);
  }, [location, config.transitions.defaultDuration]);

  return {
    isTransitioning,
    canNavigate: !isTransitioning,
  };
}

/**
 * Component to show loading state during route transitions
 */
interface RouteLoadingProps {
  isLoading?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RouteLoading({ 
  isLoading = false, 
  children, 
  fallback 
}: RouteLoadingProps) {
  const { config, isReducedMotion } = useAnimation();

  const loadingVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const contentVariants = {
    initial: { opacity: 0, y: isReducedMotion ? 0 : 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: isReducedMotion ? 0 : -10 },
  };

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          variants={loadingVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: config.transitions.defaultDuration }}
        >
          {fallback || <div>Loading...</div>}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          variants={contentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ 
            duration: config.transitions.defaultDuration,
            ease: config.transitions.defaultEasing,
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RouteTransition;