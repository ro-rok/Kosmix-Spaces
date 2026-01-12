import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimation, useConditionalAnimation } from '@/contexts/AnimationContext';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Spinner variant
   */
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'ring';
  /**
   * Color theme
   */
  color?: 'primary' | 'secondary' | 'accent' | 'muted';
  /**
   * Show loading text
   */
  text?: string;
  /**
   * Text position relative to spinner
   */
  textPosition?: 'bottom' | 'right' | 'top' | 'left';
  /**
   * Custom className
   */
  className?: string;
  /**
   * Disable animations
   */
  disableAnimation?: boolean;
}

/**
 * LoadingSpinner component with various animated loading indicators
 */
export function LoadingSpinner({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  text,
  textPosition = 'bottom',
  className,
  disableAnimation = false,
}: LoadingSpinnerProps) {
  const { config, isReducedMotion } = useAnimation();

  // Size configurations
  const sizeConfig = {
    xs: { spinner: 'w-3 h-3', text: 'text-xs', gap: 'gap-1' },
    sm: { spinner: 'w-4 h-4', text: 'text-sm', gap: 'gap-2' },
    md: { spinner: 'w-6 h-6', text: 'text-base', gap: 'gap-3' },
    lg: { spinner: 'w-8 h-8', text: 'text-lg', gap: 'gap-4' },
    xl: { spinner: 'w-12 h-12', text: 'text-xl', gap: 'gap-5' },
  };

  // Color configurations
  const colorConfig = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    accent: 'text-purple-600',
    muted: 'text-gray-400',
  };

  const { spinner: spinnerSize, text: textSize, gap } = sizeConfig[size];
  const colorClass = colorConfig[color];

  // Layout configurations based on text position
  const getLayoutClasses = () => {
    const baseClasses = `flex items-center ${gap}`;
    
    switch (textPosition) {
      case 'right':
        return `${baseClasses} flex-row`;
      case 'left':
        return `${baseClasses} flex-row-reverse`;
      case 'top':
        return `${baseClasses} flex-col-reverse`;
      case 'bottom':
      default:
        return `${baseClasses} flex-col`;
    }
  };

  // Animation configurations
  const getAnimationDuration = () => {
    if (isReducedMotion || disableAnimation) return 0;
    
    switch (variant) {
      case 'pulse':
        return 1.5;
      case 'dots':
        return 1.2;
      case 'bars':
        return 1.0;
      default:
        return 1.0;
    }
  };

  const animationDuration = getAnimationDuration();

  // Spinner variants
  const SpinnerVariant = () => {
    const spinAnimation = useConditionalAnimation({
      animate: { rotate: 360 },
      transition: {
        duration: animationDuration,
        repeat: Infinity,
        ease: 'linear',
      },
    });

    if (isReducedMotion || disableAnimation) {
      return (
        <div className={cn(
          spinnerSize,
          'border-2 border-gray-200 border-t-current rounded-full',
          colorClass
        )} />
      );
    }

    return (
      <motion.div
        className={cn(
          spinnerSize,
          'border-2 border-gray-200 border-t-current rounded-full',
          colorClass
        )}
        {...spinAnimation}
      />
    );
  };

  const DotsVariant = () => {
    const dotSize = size === 'xs' ? 'w-1 h-1' : size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
    
    if (isReducedMotion || disableAnimation) {
      return (
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(dotSize, 'rounded-full', colorClass, 'bg-current')}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn(dotSize, 'rounded-full', colorClass, 'bg-current')}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: animationDuration,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    );
  };

  const PulseVariant = () => {
    const pulseAnimation = useConditionalAnimation({
      animate: {
        scale: [1, 1.1, 1],
        opacity: [0.7, 1, 0.7],
      },
      transition: {
        duration: animationDuration,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    });

    if (isReducedMotion || disableAnimation) {
      return (
        <div className={cn(
          spinnerSize,
          'rounded-full border-2 border-current',
          colorClass
        )} />
      );
    }

    return (
      <motion.div
        className={cn(
          spinnerSize,
          'rounded-full border-2 border-current',
          colorClass
        )}
        {...pulseAnimation}
      />
    );
  };

  const BarsVariant = () => {
    const barHeight = size === 'xs' ? 'h-3' : size === 'sm' ? 'h-4' : size === 'md' ? 'h-6' : size === 'lg' ? 'h-8' : 'h-10';
    const barWidth = 'w-1';
    
    if (isReducedMotion || disableAnimation) {
      return (
        <div className="flex space-x-1 items-end">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(barWidth, barHeight, 'bg-current', colorClass)}
              style={{ height: `${25 + (i % 2) * 25}%` }}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="flex space-x-1 items-end">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className={cn(barWidth, barHeight, 'bg-current', colorClass)}
            animate={{
              scaleY: [0.4, 1, 0.4],
            }}
            transition={{
              duration: animationDuration,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    );
  };

  const RingVariant = () => {
    const ringAnimation = useConditionalAnimation({
      animate: { rotate: 360 },
      transition: {
        duration: animationDuration,
        repeat: Infinity,
        ease: 'linear',
      },
    });

    if (isReducedMotion || disableAnimation) {
      return (
        <div className={cn(
          spinnerSize,
          'border-4 border-gray-200 border-l-current rounded-full',
          colorClass
        )} />
      );
    }

    return (
      <motion.div
        className={cn(
          spinnerSize,
          'border-4 border-gray-200 border-l-current rounded-full',
          colorClass
        )}
        {...ringAnimation}
      />
    );
  };

  // Render appropriate variant
  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return <DotsVariant />;
      case 'pulse':
        return <PulseVariant />;
      case 'bars':
        return <BarsVariant />;
      case 'ring':
        return <RingVariant />;
      case 'spinner':
      default:
        return <SpinnerVariant />;
    }
  };

  // Text animation
  const textAnimation = useConditionalAnimation({
    animate: {
      opacity: [0.5, 1, 0.5],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  });

  return (
    <div className={cn(getLayoutClasses(), className)}>
      {renderSpinner()}
      
      {text && (
        <>
          {isReducedMotion || disableAnimation ? (
            <span className={cn(textSize, colorClass)}>
              {text}
            </span>
          ) : (
            <motion.span
              className={cn(textSize, colorClass)}
              {...textAnimation}
            >
              {text}
            </motion.span>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Full-screen loading overlay
 */
interface LoadingOverlayProps extends LoadingSpinnerProps {
  /**
   * Show overlay
   */
  show: boolean;
  /**
   * Overlay background
   */
  background?: 'transparent' | 'blur' | 'dark' | 'light';
  /**
   * Z-index for overlay
   */
  zIndex?: number;
}

export function LoadingOverlay({
  show,
  background = 'blur',
  zIndex = 50,
  ...spinnerProps
}: LoadingOverlayProps) {
  const { config, isReducedMotion } = useAnimation();

  const backgroundClasses = {
    transparent: 'bg-transparent',
    blur: 'bg-white/80 backdrop-blur-sm',
    dark: 'bg-black/50',
    light: 'bg-white/90',
  };

  const overlayAnimation = useConditionalAnimation({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: config.transitions.defaultDuration,
    },
  });

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={cn(
            'fixed inset-0 flex items-center justify-center',
            backgroundClasses[background]
          )}
          style={{ zIndex }}
          {...overlayAnimation}
        >
          <LoadingSpinner
            size="lg"
            text="Loading..."
            {...spinnerProps}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Loading button state
 */
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Loading text
   */
  loadingText?: string;
  /**
   * Spinner size
   */
  spinnerSize?: LoadingSpinnerProps['size'];
  /**
   * Spinner variant
   */
  spinnerVariant?: LoadingSpinnerProps['variant'];
}

export function LoadingButton({
  children,
  loading = false,
  loadingText,
  spinnerSize = 'sm',
  spinnerVariant = 'spinner',
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'px-4 py-2 text-sm font-medium rounded-md',
        'bg-blue-600 text-white hover:bg-blue-700',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <LoadingSpinner
              size={spinnerSize}
              variant={spinnerVariant}
              color="secondary"
            />
            {loadingText && <span>{loadingText}</span>}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

export default LoadingSpinner;