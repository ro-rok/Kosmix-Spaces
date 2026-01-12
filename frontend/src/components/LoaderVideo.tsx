import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { useAnimation } from '@/contexts/AnimationContext';
import { createOptimizedAnimation, gsapRegistry } from '@/lib/gsap-utils';
import { cn } from '@/lib/utils';

interface LoaderVideoProps {
  /**
   * Video source URL or path
   */
  videoSrc: string;
  /**
   * Text to display below the video
   */
  text?: string;
  /**
   * Additional text lines
   */
  subText?: string[];
  /**
   * Video size
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Show loader
   */
  show: boolean;
  /**
   * Auto-hide after duration (in seconds)
   */
  autoHideDuration?: number;
  /**
   * Callback when loader completes
   */
  onComplete?: () => void;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Background overlay
   */
  overlay?: boolean;
  /**
   * Video loop
   */
  loop?: boolean;
  /**
   * Video autoplay
   */
  autoplay?: boolean;
  /**
   * Video muted
   */
  muted?: boolean;
  /**
   * Text animation type
   */
  textAnimation?: 'fade' | 'typewriter' | 'slide' | 'bounce';
}

/**
 * LoaderVideo component with animated text below
 */
export function LoaderVideo({
  videoSrc,
  text,
  subText = [],
  size = 'md',
  show,
  autoHideDuration,
  onComplete,
  className,
  overlay = true,
  loop = true,
  autoplay = true,
  muted = true,
  textAnimation = 'fade',
}: LoaderVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const { config, isReducedMotion } = useAnimation();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  // Size configurations
  const sizeConfig = {
    sm: { video: 'w-32 h-32', text: 'text-sm', container: 'max-w-xs' },
    md: { video: 'w-48 h-48', text: 'text-base', container: 'max-w-sm' },
    lg: { video: 'w-64 h-64', text: 'text-lg', container: 'max-w-md' },
    xl: { video: 'w-80 h-80', text: 'text-xl', container: 'max-w-lg' },
  };

  const { video: videoSize, text: textSize, container: containerSize } = sizeConfig[size];

  // Initialize video animations
  useEffect(() => {
    if (!show || !videoRef.current || !containerRef.current) return;

    const video = videoRef.current;
    const container = containerRef.current;

    // Video entrance animation
    if (!isReducedMotion) {
      createOptimizedAnimation(
        'loader-video-entrance',
        container,
        {
          scale: 0.8,
          opacity: 0,
          duration: 0.6,
          ease: 'back.out(1.7)',
          onComplete: () => {
            setVideoLoaded(true);
          },
        }
      );

      // Animate to visible state
      createOptimizedAnimation(
        'loader-video-show',
        container,
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          ease: 'back.out(1.7)',
          delay: 0.1,
        }
      );
    } else {
      setVideoLoaded(true);
    }

    // Auto-hide functionality
    if (autoHideDuration) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, autoHideDuration * 1000);

      return () => clearTimeout(timer);
    }
  }, [show, isReducedMotion, autoHideDuration, onComplete]);

  // Text animations
  useEffect(() => {
    if (!videoLoaded || !textRef.current || !text) return;

    const textElement = textRef.current;

    switch (textAnimation) {
      case 'typewriter':
        animateTypewriter(textElement, text);
        break;
      case 'slide':
        animateSlide(textElement);
        break;
      case 'bounce':
        animateBounce(textElement);
        break;
      case 'fade':
      default:
        animateFade(textElement);
        break;
    }
  }, [videoLoaded, text, textAnimation, isReducedMotion]);

  // Subtext cycling animation
  useEffect(() => {
    if (!videoLoaded || subText.length === 0) return;

    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % subText.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [videoLoaded, subText.length]);

  // Animation functions
  const animateFade = (element: HTMLElement) => {
    if (isReducedMotion) return;

    createOptimizedAnimation(
      'loader-text-fade',
      element,
      {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0.3,
      }
    );

    createOptimizedAnimation(
      'loader-text-show',
      element,
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0.5,
      }
    );
  };

  const animateTypewriter = (element: HTMLElement, textContent: string) => {
    if (isReducedMotion) {
      element.textContent = textContent;
      return;
    }

    element.textContent = '';
    const chars = textContent.split('');
    
    chars.forEach((char, index) => {
      setTimeout(() => {
        element.textContent += char;
      }, index * 100 + 500);
    });
  };

  const animateSlide = (element: HTMLElement) => {
    if (isReducedMotion) return;

    createOptimizedAnimation(
      'loader-text-slide',
      element,
      {
        x: -50,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        delay: 0.3,
      }
    );

    createOptimizedAnimation(
      'loader-text-slide-show',
      element,
      {
        x: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out',
        delay: 0.5,
      }
    );
  };

  const animateBounce = (element: HTMLElement) => {
    if (isReducedMotion) return;

    createOptimizedAnimation(
      'loader-text-bounce',
      element,
      {
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        ease: 'bounce.out',
        delay: 0.3,
      }
    );

    createOptimizedAnimation(
      'loader-text-bounce-show',
      element,
      {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: 'bounce.out',
        delay: 0.5,
      }
    );
  };

  // Handle video events
  const handleVideoLoad = () => {
    if (!isReducedMotion) {
      setVideoLoaded(true);
    }
  };

  const handleVideoError = () => {
    console.warn('LoaderVideo: Failed to load video:', videoSrc);
    setVideoLoaded(true); // Still show text even if video fails
  };

  // Container animation variants
  const containerVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.9,
    },
    visible: { 
      opacity: 1,
      scale: 1,
      transition: {
        duration: config.transitions.defaultDuration,
        ease: 'easeOut',
      },
    },
    exit: { 
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: config.transitions.defaultDuration * 0.7,
        ease: 'easeIn',
      },
    },
  };

  // Text variants for different animations
  const getTextVariants = () => {
    const baseTransition = {
      duration: config.transitions.defaultDuration,
      ease: 'easeOut',
    };

    switch (textAnimation) {
      case 'slide':
        return {
          hidden: { opacity: 0, x: -30 },
          visible: { 
            opacity: 1, 
            x: 0,
            transition: { ...baseTransition, delay: 0.3 },
          },
        };
      case 'bounce':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { 
            opacity: 1, 
            scale: 1,
            transition: { 
              ...baseTransition, 
              delay: 0.3,
              type: 'spring',
              stiffness: 200,
            },
          },
        };
      case 'fade':
      default:
        return {
          hidden: { opacity: 0, y: 20 },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: { ...baseTransition, delay: 0.3 },
          },
        };
    }
  };

  const textVariants = getTextVariants();

  return (
    <AnimatePresence>
      {show && (
        <>
          {overlay && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: config.transitions.defaultDuration }}
            />
          )}
          
          <motion.div
            ref={containerRef}
            className={cn(
              'fixed inset-0 flex flex-col items-center justify-center z-50',
              containerSize,
              'mx-auto px-4',
              className
            )}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Video Container */}
            <div className={cn(
              'relative rounded-lg overflow-hidden shadow-2xl mb-6',
              videoSize
            )}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                src={videoSrc}
                loop={loop}
                autoPlay={autoplay}
                muted={muted}
                playsInline
                onLoadedData={handleVideoLoad}
                onError={handleVideoError}
              />
              
              {/* Video overlay for better text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Text Content */}
            {(text || subText.length > 0) && (
              <motion.div
                ref={textRef}
                className="text-center text-white"
                variants={textVariants}
                initial="hidden"
                animate={videoLoaded ? "visible" : "hidden"}
              >
                {text && (
                  <h2 className={cn(
                    textSize,
                    'font-semibold mb-2',
                    textAnimation === 'typewriter' ? 'font-mono' : ''
                  )}>
                    {textAnimation === 'typewriter' ? '' : text}
                  </h2>
                )}
                
                {subText.length > 0 && (
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentTextIndex}
                      className="text-sm text-white/80"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {subText[currentTextIndex]}
                    </motion.p>
                  </AnimatePresence>
                )}
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Simple video loader with minimal configuration
 */
interface SimpleLoaderVideoProps {
  videoSrc: string;
  text: string;
  show: boolean;
  onComplete?: () => void;
}

export function SimpleLoaderVideo({
  videoSrc,
  text,
  show,
  onComplete,
}: SimpleLoaderVideoProps) {
  return (
    <LoaderVideo
      videoSrc={videoSrc}
      text={text}
      show={show}
      onComplete={onComplete}
      size="md"
      autoHideDuration={3}
      textAnimation="fade"
    />
  );
}

export default LoaderVideo;