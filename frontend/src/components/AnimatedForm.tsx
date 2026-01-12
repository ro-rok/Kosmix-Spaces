import React, { forwardRef, useState } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { Input, InputProps } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAnimation, useConditionalAnimation } from '@/contexts/AnimationContext';
import { cn } from '@/lib/utils';

interface AnimatedInputProps extends InputProps {
  /**
   * Custom animation overrides
   */
  animationOverrides?: {
    focus?: MotionProps['whileFocus'];
    hover?: MotionProps['whileHover'];
    initial?: MotionProps['initial'];
    animate?: MotionProps['animate'];
    transition?: MotionProps['transition'];
  };
  /**
   * Disable animations for this input
   */
  disableAnimation?: boolean;
  /**
   * Show floating label animation
   */
  floatingLabel?: boolean;
  /**
   * Label text for floating label
   */
  label?: string;
  /**
   * Show focus ring animation
   */
  showFocusRing?: boolean;
  /**
   * Error state for validation animations
   */
  error?: boolean;
  /**
   * Success state for validation animations
   */
  success?: boolean;
}

/**
 * AnimatedInput component with smooth focus and validation animations
 */
export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ 
    className, 
    animationOverrides = {},
    disableAnimation = false,
    floatingLabel = false,
    label,
    showFocusRing = true,
    error = false,
    success = false,
    onFocus,
    onBlur,
    ...props 
  }, ref) => {
    const { config, isReducedMotion } = useAnimation();
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

    // Handle focus events
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      onBlur?.(e);
    };

    // Get validation colors
    const getValidationColor = () => {
      if (error) return 'rgb(239, 68, 68)'; // red-500
      if (success) return 'rgb(34, 197, 94)'; // green-500
      return 'rgb(59, 130, 246)'; // blue-500
    };

    // Define animation properties
    const animationProps = useConditionalAnimation({
      whileFocus: showFocusRing ? {
        boxShadow: `0 0 0 3px ${getValidationColor()}40`, // 40 = 25% opacity
        borderColor: getValidationColor(),
        scale: 1.01,
        transition: {
          duration: config.microInteractions.duration,
          ease: config.microInteractions.easing,
        },
        ...animationOverrides.focus,
      } : undefined,
      
      whileHover: {
        borderColor: getValidationColor(),
        transition: {
          duration: config.microInteractions.duration * 0.5,
          ease: config.microInteractions.easing,
        },
        ...animationOverrides.hover,
      },
      
      initial: animationOverrides.initial || {},
      animate: animationOverrides.animate || {},
      
      transition: {
        duration: config.microInteractions.duration,
        ease: config.microInteractions.easing,
        ...animationOverrides.transition,
      },
    });

    // Skip animations if disabled or reduced motion with instant fallback
    if (disableAnimation || (isReducedMotion && config.accessibility.fallbackToInstant)) {
      return (
        <div className="relative">
          {floatingLabel && label && (
            <Label 
              className={cn(
                'absolute left-3 transition-all duration-200',
                isFocused || hasValue 
                  ? 'top-0 text-xs bg-background px-1 -translate-y-1/2' 
                  : 'top-1/2 -translate-y-1/2 text-muted-foreground'
              )}
            >
              {label}
            </Label>
          )}
          <Input
            ref={ref}
            className={cn(
              error && 'border-red-500 focus:border-red-500',
              success && 'border-green-500 focus:border-green-500',
              floatingLabel && 'pt-6',
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
        </div>
      );
    }

    return (
      <div className="relative">
        {floatingLabel && label && (
          <motion.div
            className="absolute left-3 pointer-events-none z-10"
            initial={false}
            animate={{
              top: isFocused || hasValue ? 0 : '50%',
              y: isFocused || hasValue ? '-50%' : '-50%',
              scale: isFocused || hasValue ? 0.85 : 1,
              color: isFocused ? getValidationColor() : undefined,
            }}
            transition={{
              duration: config.microInteractions.duration,
              ease: config.microInteractions.easing,
            }}
          >
            <Label className="bg-background px-1">
              {label}
            </Label>
          </motion.div>
        )}
        
        <motion.div {...animationProps}>
          <Input
            ref={ref}
            className={cn(
              'transform-gpu',
              error && 'border-red-500',
              success && 'border-green-500',
              floatingLabel && 'pt-6',
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
        </motion.div>
      </div>
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput';

/**
 * AnimatedTextarea component with similar animations to AnimatedInput
 */
interface AnimatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  animationOverrides?: AnimatedInputProps['animationOverrides'];
  disableAnimation?: boolean;
  floatingLabel?: boolean;
  label?: string;
  showFocusRing?: boolean;
  error?: boolean;
  success?: boolean;
}

export const AnimatedTextarea = forwardRef<HTMLTextAreaElement, AnimatedTextareaProps>(
  ({ 
    className, 
    animationOverrides = {},
    disableAnimation = false,
    floatingLabel = false,
    label,
    showFocusRing = true,
    error = false,
    success = false,
    onFocus,
    onBlur,
    ...props 
  }, ref) => {
    const { config, isReducedMotion } = useAnimation();
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      onBlur?.(e);
    };

    const getValidationColor = () => {
      if (error) return 'rgb(239, 68, 68)';
      if (success) return 'rgb(34, 197, 94)';
      return 'rgb(59, 130, 246)';
    };

    const animationProps = useConditionalAnimation({
      whileFocus: showFocusRing ? {
        boxShadow: `0 0 0 3px ${getValidationColor()}40`,
        borderColor: getValidationColor(),
        scale: 1.01,
        transition: {
          duration: config.microInteractions.duration,
          ease: config.microInteractions.easing,
        },
        ...animationOverrides.focus,
      } : undefined,
      
      whileHover: {
        borderColor: getValidationColor(),
        transition: {
          duration: config.microInteractions.duration * 0.5,
          ease: config.microInteractions.easing,
        },
        ...animationOverrides.hover,
      },
    });

    if (disableAnimation || (isReducedMotion && config.accessibility.fallbackToInstant)) {
      return (
        <div className="relative">
          {floatingLabel && label && (
            <Label 
              className={cn(
                'absolute left-3 transition-all duration-200',
                isFocused || hasValue 
                  ? 'top-0 text-xs bg-background px-1 -translate-y-1/2' 
                  : 'top-4 text-muted-foreground'
              )}
            >
              {label}
            </Label>
          )}
          <Textarea
            ref={ref}
            className={cn(
              error && 'border-red-500 focus:border-red-500',
              success && 'border-green-500 focus:border-green-500',
              floatingLabel && 'pt-6',
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
        </div>
      );
    }

    return (
      <div className="relative">
        {floatingLabel && label && (
          <motion.div
            className="absolute left-3 pointer-events-none z-10"
            initial={false}
            animate={{
              top: isFocused || hasValue ? 0 : 16,
              y: isFocused || hasValue ? '-50%' : 0,
              scale: isFocused || hasValue ? 0.85 : 1,
              color: isFocused ? getValidationColor() : undefined,
            }}
            transition={{
              duration: config.microInteractions.duration,
              ease: config.microInteractions.easing,
            }}
          >
            <Label className="bg-background px-1">
              {label}
            </Label>
          </motion.div>
        )}
        
        <motion.div {...animationProps}>
          <Textarea
            ref={ref}
            className={cn(
              'transform-gpu',
              error && 'border-red-500',
              success && 'border-green-500',
              floatingLabel && 'pt-6',
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
        </motion.div>
      </div>
    );
  }
);

AnimatedTextarea.displayName = 'AnimatedTextarea';

/**
 * Form field with animated validation feedback
 */
interface AnimatedFormFieldProps {
  children: React.ReactNode;
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

export function AnimatedFormField({
  children,
  label,
  error,
  success,
  hint,
  required = false,
  className,
}: AnimatedFormFieldProps) {
  const { config, isReducedMotion } = useAnimation();

  const messageVariants = {
    initial: { opacity: 0, y: -10, height: 0 },
    animate: { opacity: 1, y: 0, height: 'auto' },
    exit: { opacity: 0, y: -10, height: 0 },
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      {children}
      
      {/* Animated feedback messages */}
      {!isReducedMotion && (error || success || hint) && (
        <motion.div
          variants={messageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            duration: config.microInteractions.duration,
            ease: config.microInteractions.easing,
          }}
        >
          {error && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full" />
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-500 flex items-center gap-1">
              <span className="w-1 h-1 bg-green-500 rounded-full" />
              {success}
            </p>
          )}
          {hint && !error && !success && (
            <p className="text-sm text-muted-foreground">
              {hint}
            </p>
          )}
        </motion.div>
      )}
      
      {/* Fallback for reduced motion */}
      {isReducedMotion && (error || success || hint) && (
        <div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-500">{success}</p>}
          {hint && !error && !success && <p className="text-sm text-muted-foreground">{hint}</p>}
        </div>
      )}
    </div>
  );
}

export default AnimatedInput;