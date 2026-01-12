import React, { forwardRef, useState } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Card, CardProps } from '@/components/ui/card';
import { useAnimation, useConditionalAnimation } from '@/contexts/AnimationContext';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends CardProps {
  /**
   * Custom animation overrides
   */
  animationOverrides?: {
    hover?: MotionProps['whileHover'];
    tap?: MotionProps['whileTap'];
    focus?: MotionProps['whileFocus'];
    initial?: MotionProps['initial'];
    animate?: MotionProps['animate'];
    transition?: MotionProps['transition'];
  };
  /**
   * Disable animations for this card
   */
  disableAnimation?: boolean;
  /**
   * Animation intensity: 'subtle', 'normal', 'enhanced'
   */
  intensity?: 'subtle' | 'normal' | 'enhanced';
  /**
   * Enable click interactions
   */
  clickable?: boolean;
  /**
   * Show elevation on hover
   */
  elevateOnHover?: boolean;
  /**
   * Tilt effect on hover
   */
  tiltOnHover?: boolean;
  /**
   * Glow effect on hover
   */
  glowOnHover?: boolean;
}

/**
 * AnimatedCard component with smooth hover and interaction animations
 * Extends the base Card component with Framer Motion animations
 */
export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ 
    className, 
    children, 
    animationOverrides = {},
    disableAnimation = false,
    intensity = 'normal',
    clickable = false,
    elevateOnHover = true,
    tiltOnHover = false,
    glowOnHover = false,
    ...props 
  }, ref) => {
    const { config, isReducedMotion } = useAnimation();
    const [isHovered, setIsHovered] = useState(false);

    // Get animation values based on intensity and config
    const getAnimationValues = () => {
      const microConfig = config.microInteractions;
      
      const intensityMultipliers = {
        subtle: 0.5,
        normal: 1,
        enhanced: 1.5,
      };
      
      const multiplier = intensityMultipliers[intensity];
      
      return {
        hoverScale: 1 + (microConfig.hoverScale - 1) * multiplier,
        clickScale: 1 + (microConfig.clickScale - 1) * multiplier,
        duration: microConfig.duration,
        easing: microConfig.easing,
      };
    };

    const animationValues = getAnimationValues();

    // Define hover effects based on props
    const getHoverEffects = () => {
      let effects: any = {};

      if (elevateOnHover) {
        effects.y = -8 * (intensity === 'subtle' ? 0.5 : intensity === 'enhanced' ? 1.5 : 1);
        effects.boxShadow = intensity === 'enhanced' 
          ? '0 20px 40px rgba(0, 0, 0, 0.15)'
          : '0 10px 25px rgba(0, 0, 0, 0.1)';
      }

      if (tiltOnHover) {
        effects.rotateX = 5;
        effects.rotateY = 5;
      }

      if (glowOnHover) {
        effects.boxShadow = effects.boxShadow 
          ? `${effects.boxShadow}, 0 0 20px rgba(59, 130, 246, 0.3)`
          : '0 0 20px rgba(59, 130, 246, 0.3)';
      }

      effects.scale = animationValues.hoverScale;

      return effects;
    };

    // Define animation properties
    const animationProps = useConditionalAnimation({
      whileHover: {
        ...getHoverEffects(),
        transition: {
          duration: animationValues.duration,
          ease: animationValues.easing,
        },
        ...animationOverrides.hover,
      },
      
      whileTap: clickable ? {
        scale: animationValues.clickScale,
        y: elevateOnHover ? -4 : 0,
        transition: {
          duration: animationValues.duration * 0.5,
          ease: animationValues.easing,
        },
        ...animationOverrides.tap,
      } : undefined,
      
      whileFocus: {
        scale: 1.01,
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)',
        transition: {
          duration: animationValues.duration,
          ease: animationValues.easing,
        },
        ...animationOverrides.focus,
      },
      
      initial: animationOverrides.initial || { 
        scale: 1, 
        y: 0,
        rotateX: 0,
        rotateY: 0,
      },
      
      animate: animationOverrides.animate || { 
        scale: 1, 
        y: 0,
        rotateX: 0,
        rotateY: 0,
      },
      
      transition: {
        duration: animationValues.duration,
        ease: animationValues.easing,
        ...animationOverrides.transition,
      },
    });

    // Skip animations if disabled or reduced motion with instant fallback
    if (disableAnimation || (isReducedMotion && config.accessibility.fallbackToInstant)) {
      return (
        <Card
          ref={ref}
          className={className}
          {...props}
        >
          {children}
        </Card>
      );
    }

    return (
      <motion.div
        {...animationProps}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        style={{
          transformStyle: tiltOnHover ? 'preserve-3d' : undefined,
          perspective: tiltOnHover ? 1000 : undefined,
        }}
      >
        <Card
          ref={ref}
          className={cn(
            // Ensure card doesn't interfere with motion animations
            'transform-gpu',
            clickable && 'cursor-pointer',
            className
          )}
          {...props}
        >
          {children}
        </Card>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

/**
 * Card with reveal animation on scroll
 */
interface RevealCardProps extends AnimatedCardProps {
  /**
   * Animation direction for reveal
   */
  revealDirection?: 'up' | 'down' | 'left' | 'right';
  /**
   * Delay before reveal animation starts
   */
  revealDelay?: number;
}

export const RevealCard = forwardRef<HTMLDivElement, RevealCardProps>(
  ({ 
    revealDirection = 'up',
    revealDelay = 0,
    animationOverrides = {},
    ...props 
  }, ref) => {
    const { config } = useAnimation();

    // Define reveal animations based on direction
    const getRevealAnimation = () => {
      const distance = 30;
      
      const directions = {
        up: { y: distance },
        down: { y: -distance },
        left: { x: distance },
        right: { x: -distance },
      };

      return {
        initial: {
          opacity: 0,
          ...directions[revealDirection],
        },
        animate: {
          opacity: 1,
          x: 0,
          y: 0,
        },
        transition: {
          duration: config.transitions.defaultDuration,
          delay: revealDelay,
          ease: config.transitions.defaultEasing,
        },
      };
    };

    const revealAnimation = getRevealAnimation();

    return (
      <AnimatedCard
        ref={ref}
        animationOverrides={{
          ...animationOverrides,
          initial: {
            ...revealAnimation.initial,
            ...animationOverrides.initial,
          },
          animate: {
            ...revealAnimation.animate,
            ...animationOverrides.animate,
          },
          transition: {
            ...revealAnimation.transition,
            ...animationOverrides.transition,
          },
        }}
        {...props}
      />
    );
  }
);

RevealCard.displayName = 'RevealCard';

/**
 * Card grid with staggered animations
 */
interface AnimatedCardGridProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Stagger delay between card animations (seconds)
   */
  staggerDelay?: number;
  /**
   * Grid columns (responsive)
   */
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function AnimatedCardGrid({ 
  children, 
  className,
  staggerDelay = 0.1,
  columns = { default: 1, md: 2, lg: 3 }
}: AnimatedCardGridProps) {
  const { config, isReducedMotion } = useAnimation();

  // Generate grid classes based on columns prop
  const getGridClasses = () => {
    const classes = [`grid-cols-${columns.default}`];
    
    if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`);
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`);
    
    return classes.join(' ');
  };

  if (isReducedMotion) {
    return (
      <div className={cn('grid gap-6', getGridClasses(), className)}>
        {children}
      </div>
    );
  }

  const childrenArray = React.Children.toArray(children);

  return (
    <div className={cn('grid gap-6', getGridClasses(), className)}>
      {childrenArray.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * staggerDelay,
            duration: config.transitions.defaultDuration,
            ease: config.transitions.defaultEasing,
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

export default AnimatedCard;