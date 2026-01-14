import React, { forwardRef } from 'react';
import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAnimation, useConditionalAnimation } from '@/contexts/AnimationContext';
import { cn } from '@/lib/utils';

interface AnimatedModalProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> {
  /**
   * Custom animation overrides
   */
  animationOverrides?: {
    overlay?: MotionProps;
    content?: MotionProps;
  };
  /**
   * Disable animations for this modal
   */
  disableAnimation?: boolean;
  /**
   * Animation preset: 'fade', 'scale', 'slide', 'bounce'
   */
  animationPreset?: 'fade' | 'scale' | 'slide' | 'bounce';
  /**
   * Slide direction (when using slide preset)
   */
  slideDirection?: 'up' | 'down' | 'left' | 'right';
  /**
   * Modal size affects animation intensity
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /**
   * Content props
   */
  contentProps?: React.ComponentProps<typeof DialogContent>;
  /**
   * Children to render inside the modal
   */
  children: React.ReactNode;
}

/**
 * AnimatedModal component with smooth entrance and exit animations
 * Extends the base Dialog component with Framer Motion animations
 */
export function AnimatedModal({
  children,
  animationOverrides = {},
  disableAnimation = false,
  animationPreset = 'scale',
  slideDirection = 'up',
  size = 'md',
  contentProps,
  ...props
}: AnimatedModalProps) {
  const { config, isReducedMotion } = useAnimation();

  // Get animation variants based on preset
  const getAnimationVariants = () => {
    if (isReducedMotion || disableAnimation) {
      return {
        overlay: {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.1 },
        },
        content: {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.1 },
        },
      };
    }

    const baseTransition = config.transitions.modalTransition.transition;

    switch (animationPreset) {
      case 'fade':
        return {
          overlay: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: baseTransition,
          },
          content: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: { ...baseTransition, delay: 0.05 },
          },
        };

      case 'scale':
        return {
          overlay: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: baseTransition,
          },
          content: {
            initial: { opacity: 0, scale: 0.95 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.95 },
            transition: baseTransition,
          },
        };

      case 'slide':
        const slideVariants = {
          up: { y: 50 },
          down: { y: -50 },
          left: { x: 50 },
          right: { x: -50 },
        };

        return {
          overlay: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: baseTransition,
          },
          content: {
            initial: { 
              opacity: 0, 
              ...slideVariants[slideDirection],
            },
            animate: { 
              opacity: 1, 
              x: 0, 
              y: 0,
            },
            exit: { 
              opacity: 0, 
              ...slideVariants[slideDirection],
            },
            transition: baseTransition,
          },
        };

      case 'bounce':
        return {
          overlay: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
            transition: baseTransition,
          },
          content: {
            initial: { 
              opacity: 0, 
              scale: 0.8,
              y: 30,
            },
            animate: { 
              opacity: 1, 
              scale: 1,
              y: 0,
            },
            exit: { 
              opacity: 0, 
              scale: 0.8,
              y: 30,
            },
            transition: {
              type: 'spring' as const,
              damping: 25,
              stiffness: 300,
            },
          },
        };

      default:
        return {
          overlay: config.transitions.modalTransition,
          content: config.transitions.modalTransition,
        };
    }
  };

  const variants = getAnimationVariants();

  // Apply animation overrides
  const overlayVariants = useConditionalAnimation({
    ...variants.overlay,
    ...animationOverrides.overlay,
  });

  const contentVariants = useConditionalAnimation({
    ...variants.content,
    ...animationOverrides.content,
  });

  // Get size classes
  const getSizeClasses = () => {
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full mx-4',
    };
    return sizeClasses[size];
  };

  return (
    <Dialog {...props}>
      <AnimatePresence>
        {props.open && (
          <DialogContent
            {...contentProps}
            className={cn(
              getSizeClasses(),
              contentProps?.className
            )}
            asChild
          >
            <motion.div
              {...contentVariants}
              // Ensure proper stacking and positioning
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 50,
              }}
            >
              {children}
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

/**
 * Animated Modal Header with staggered content animation
 */
interface AnimatedModalHeaderProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function AnimatedModalHeader({
  title,
  description,
  children,
  className,
}: AnimatedModalHeaderProps) {
  const { config, isReducedMotion } = useAnimation();

  if (isReducedMotion) {
    return (
      <DialogHeader className={className}>
        {title && <DialogTitle>{title}</DialogTitle>}
        {description && <DialogDescription>{description}</DialogDescription>}
        {children}
      </DialogHeader>
    );
  }

  const staggerVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <DialogHeader className={className}>
      {title && (
        <motion.div
          variants={staggerVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: config.transitions.defaultDuration,
            delay: 0.1,
          }}
        >
          <DialogTitle>{title}</DialogTitle>
        </motion.div>
      )}
      
      {description && (
        <motion.div
          variants={staggerVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: config.transitions.defaultDuration,
            delay: 0.15,
          }}
        >
          <DialogDescription>{description}</DialogDescription>
        </motion.div>
      )}
      
      {children && (
        <motion.div
          variants={staggerVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: config.transitions.defaultDuration,
            delay: 0.2,
          }}
        >
          {children}
        </motion.div>
      )}
    </DialogHeader>
  );
}

/**
 * Animated Modal Footer with action button animations
 */
interface AnimatedModalFooterProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Stagger the footer content animation
   */
  staggerContent?: boolean;
}

export function AnimatedModalFooter({
  children,
  className,
  staggerContent = true,
}: AnimatedModalFooterProps) {
  const { config, isReducedMotion } = useAnimation();

  if (isReducedMotion || !staggerContent) {
    return <DialogFooter className={className}>{children}</DialogFooter>;
  }

  const childrenArray = React.Children.toArray(children);

  return (
    <DialogFooter className={className}>
      {childrenArray.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: config.transitions.defaultDuration,
            delay: 0.1 + (index * 0.05),
          }}
        >
          {child}
        </motion.div>
      ))}
    </DialogFooter>
  );
}

/**
 * Confirmation Modal with enhanced animations
 */
interface AnimatedConfirmModalProps extends AnimatedModalProps {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'destructive';
}

export function AnimatedConfirmModal({
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  animationPreset = 'bounce',
  ...props
}: AnimatedConfirmModalProps) {
  return (
    <AnimatedModal
      animationPreset={animationPreset}
      size="sm"
      {...props}
    >
      <AnimatedModalHeader
        title={title}
        description={description}
      />
      
      <AnimatedModalFooter>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className={cn(
            'px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2',
            variant === 'destructive'
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          )}
        >
          {confirmText}
        </button>
      </AnimatedModalFooter>
    </AnimatedModal>
  );
}

export default AnimatedModal;