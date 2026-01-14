import React, { forwardRef } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Button, ButtonProps } from '@/components/ui/button';
import { useAnimation, useConditionalAnimation } from '@/contexts/AnimationContext';
import { useAccessibleMotion } from '@/hooks/useAnimationAccessibility';
import { AccessibleAnimation } from './AccessibleAnimation';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends ButtonProps {
  /**
   * Custom animation overrides
   */
  animationOverrides?: {
    hover?: Record<string, any>;
    tap?: Record<string, any>;
    focus?: Record<string, any>;
    initial?: Record<string, any>;
    animate?: Record<string, any>;
    transition?: Record<string, any>;
  };
  /**
   * Disable animations for this button
   */
  disableAnimation?: boolean;
  /**
   * Animation intensity: 'subtle', 'normal', 'enhanced'
   */
  intensity?: 'subtle' | 'normal' | 'enhanced';
}

/**
 * AnimatedButton component with smooth hover, click, and focus animations
 * Extends the base Button component with Framer Motion animations
 * Includes comprehensive accessibility support and fallback systems
 */
export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ 
    className, 
    children, 
    animationOverrides = {},
    disableAnimation = false,
    intensity = 'normal',
    disabled,
    asChild = false,
    ...props 
  }, ref) => {
    const { config, isReducedMotion } = useAnimation();

    // Get animation values based on intensity and config
    const getAnimationValues = () => {
      const microConfig = config.microInteractions;
      
      // More subtle intensity multipliers for better visual appeal
      const intensityMultipliers = {
        subtle: 0.3,    // Very subtle: 1.015 hover scale
        normal: 0.6,    // Moderate: 1.03 hover scale
        enhanced: 1.0,  // Standard: 1.05 hover scale
      };
      
      const multiplier = intensityMultipliers[intensity];
      
      return {
        hoverScale: 1 + (microConfig.hoverScale - 1) * multiplier,
        clickScale: 1 - (1 - microConfig.clickScale) * multiplier,
        focusScale: 1 + (microConfig.focusScale - 1) * multiplier,
        duration: microConfig.duration,
        easing: microConfig.easing,
      };
    };

    const animationValues = getAnimationValues();

    // Define base animation properties with subtle, polished effects
    const baseAnimationProps = {
      whileHover: !disabled ? {
        scale: animationValues.hoverScale,
        y: -1, // Subtle lift effect
        transition: {
          duration: animationValues.duration,
          ease: 'easeOut',
        },
        ...(animationOverrides.hover || {}),
      } : undefined,
      
      whileTap: !disabled ? {
        scale: animationValues.clickScale,
        y: 0, // Press down effect
        transition: {
          duration: 0.1, // Very fast for immediate feedback
          ease: 'easeInOut',
        },
        ...(animationOverrides.tap || {}),
      } : undefined,
      
      whileFocus: !disabled ? {
        scale: animationValues.focusScale,
        transition: {
          duration: animationValues.duration,
          ease: animationValues.easing,
        },
        ...(animationOverrides.focus || {}),
      } : undefined,
      
      initial: animationOverrides.initial || { scale: 1, y: 0 },
      animate: animationOverrides.animate || { scale: 1, y: 0 },
      
      transition: {
        duration: animationValues.duration,
        ease: 'easeOut' as any,
        ...(animationOverrides.transition || {}),
      },
    };

    // Get accessible animation props
    const accessibleAnimationProps = useAccessibleMotion(baseAnimationProps, 'interaction');

    // Skip animations if disabled
    if (disableAnimation) {
      return (
        <Button
          ref={ref}
          className={className}
          disabled={disabled}
          asChild={asChild}
          {...props}
        >
          {children}
        </Button>
      );
    }

    // If asChild is true, wrap children with motion.div and use Slot for Button
    if (asChild) {
      return (
        <Button
          ref={ref}
          className={className}
          disabled={disabled}
          asChild
          {...props}
        >
          <motion.div
            className="inline-flex items-center justify-center w-full h-full"
            style={{ willChange: 'transform' }}
            {...accessibleAnimationProps}
          >
            {children}
          </motion.div>
        </Button>
      );
    }

    // Apply motion directly to Button using motion component
    const MotionButton = motion.create(Button);

    return (
      <MotionButton
        ref={ref}
        className={className}
        style={{ willChange: 'transform' }}
        disabled={disabled}
        {...accessibleAnimationProps}
        {...props}
      >
        {children}
      </MotionButton>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

/**
 * Floating Action Button with enhanced animations
 */
interface AnimatedFABProps extends AnimatedButtonProps {
  /**
   * Show ripple effect on click
   */
  showRipple?: boolean;
}

export const AnimatedFAB = forwardRef<HTMLButtonElement, AnimatedFABProps>(
  ({ 
    className, 
    children, 
    showRipple = true,
    intensity = 'enhanced',
    animationOverrides = {},
    ...props 
  }, ref) => {
    const { config } = useAnimation();

    // Enhanced animations for FAB
    const fabAnimations = {
      hover: {
        scale: 1.1,
        rotate: 5,
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
        ...(animationOverrides.hover || {}),
      },
      tap: {
        scale: 0.95,
        rotate: -2,
        ...(animationOverrides.tap || {}),
      },
      focus: {
        scale: 1.05,
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)',
        ...(animationOverrides.focus || {}),
      },
    };

    return (
      <AnimatedButton
        ref={ref}
        className={cn(
          'rounded-full w-14 h-14 shadow-lg',
          'fixed bottom-6 right-6 z-50',
          className
        )}
        animationOverrides={fabAnimations}
        intensity={intensity}
        {...props}
      >
        {children}
      </AnimatedButton>
    );
  }
);

AnimatedFAB.displayName = 'AnimatedFAB';

/**
 * Button group with staggered animations and accessibility support
 */
interface AnimatedButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Stagger delay between button animations (seconds)
   */
  staggerDelay?: number;
  /**
   * Animation direction for stagger
   */
  staggerDirection?: 'normal' | 'reverse';
}

export function AnimatedButtonGroup({ 
  children, 
  className,
  staggerDelay = 0.1,
  staggerDirection = 'normal'
}: AnimatedButtonGroupProps) {
  const { config } = useAnimation();

  const childrenArray = React.Children.toArray(children);
  const staggeredChildren = staggerDirection === 'reverse' 
    ? childrenArray.reverse() 
    : childrenArray;

  return (
    <div className={className}>
      {staggeredChildren.map((child, index) => (
        <AccessibleAnimation
          key={index}
          animationType="interaction"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * staggerDelay,
            duration: config.transitions.defaultDuration,
            ease: config.transitions.defaultEasing as any,
          }}
          enableErrorRecovery={true}
          fallbackComponent={({ children }: any) => <div>{children}</div>}
        >
          {child}
        </AccessibleAnimation>
      ))}
    </div>
  );
}

export default AnimatedButton;