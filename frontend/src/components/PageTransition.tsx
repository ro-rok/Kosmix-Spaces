import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigationType } from 'react-router-dom';
import { useAnimation } from '@/contexts/AnimationContext';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageTransition component provides smooth transitions between routes
 * Handles browser back/forward navigation with appropriate animations
 * Respects reduced motion preferences and animation configuration
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const { config, isReducedMotion } = useAnimation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'entering' | 'exiting' | 'idle'>('idle');

  // Update display location when location changes
  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('exiting');
    }
  }, [location, displayLocation]);

  // Get transition variants based on navigation type and configuration
  const getTransitionVariants = () => {
    const baseTransition = config.transitions.pageTransition;
    
    // If reduced motion is enabled, use minimal transitions
    if (isReducedMotion) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.1, ease: 'linear' },
      };
    }

    // Customize transitions based on navigation type
    switch (navigationType) {
      case 'POP': // Browser back/forward
        return {
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 20 },
          transition: baseTransition.transition,
        };
      
      case 'PUSH': // Forward navigation
        return {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          transition: baseTransition.transition,
        };
      
      case 'REPLACE': // Replace navigation
        return {
          initial: { opacity: 0, scale: 0.98 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.02 },
          transition: baseTransition.transition,
        };
      
      default:
        return baseTransition;
    }
  };

  const variants = getTransitionVariants();

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        if (transitionStage === 'exiting') {
          setDisplayLocation(location);
          setTransitionStage('entering');
        }
      }}
    >
      <motion.div
        key={displayLocation.pathname}
        className={className}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        onAnimationComplete={(definition) => {
          if (definition === 'animate' && transitionStage === 'entering') {
            setTransitionStage('idle');
          }
        }}
        // Ensure proper stacking context for transitions
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '100%',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook to get current transition state
 * Useful for coordinating other animations with page transitions
 */
export function usePageTransitionState() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward' | 'replace'>('forward');

  useEffect(() => {
    setIsTransitioning(true);
    
    // Determine transition direction
    switch (navigationType) {
      case 'POP':
        setTransitionDirection('backward');
        break;
      case 'PUSH':
        setTransitionDirection('forward');
        break;
      case 'REPLACE':
        setTransitionDirection('replace');
        break;
    }

    // Reset transitioning state after animation duration
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 500); // Slightly longer than typical transition duration

    return () => clearTimeout(timer);
  }, [location, navigationType]);

  return {
    isTransitioning,
    transitionDirection,
    navigationType,
  };
}

/**
 * Higher-order component to wrap pages with transitions
 */
export function withPageTransition<P extends object>(
  Component: React.ComponentType<P>,
  transitionClassName?: string
) {
  const WrappedComponent = (props: P) => (
    <PageTransition className={transitionClassName}>
      <Component {...props} />
    </PageTransition>
  );

  WrappedComponent.displayName = `withPageTransition(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default PageTransition;