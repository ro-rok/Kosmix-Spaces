import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  validateGesture, 
  createGestureRipple, 
  showGestureToast, 
  getOptimalGestureConfig,
  trackGestureAnalytics,
  type TouchPoint,
  type SwipeResult,
  type GestureConfig 
} from '@/lib/gesture-utils';

interface TouchGestureConfig {
  minDistance?: number;
  maxDuration?: number;
  requiredFingers?: number;
  enableNavigation?: boolean;
  enableDebug?: boolean;
  customConfig?: Partial<GestureConfig>;
}

export function useTouchGestures(config: TouchGestureConfig = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get optimal configuration based on device
  const optimalConfig = getOptimalGestureConfig();
  const gestureConfig: GestureConfig = {
    ...optimalConfig,
    ...config.customConfig,
    minDistance: config.minDistance ?? optimalConfig.minDistance,
    maxDuration: config.maxDuration ?? optimalConfig.maxDuration,
    requiredFingers: config.requiredFingers ?? optimalConfig.requiredFingers,
  };
  
  const {
    enableNavigation = true,
    enableDebug = false,
  } = config;

  const touchStartRef = useRef<TouchPoint[]>([]);
  const isSwipingRef = useRef(false);

  const handleSwipe = useCallback((swipe: SwipeResult) => {
    if (!enableNavigation || swipe.fingers !== gestureConfig.requiredFingers) return;

    const currentPath = location.pathname;
    let navigationTarget = '';
    let navigationDescription = '';

    // Navigation logic based on swipe direction
    switch (swipe.direction) {
      case 'right':
        // Swipe right - Go back or to home
        if (currentPath !== '/') {
          if (window.history.length > 1) {
            navigate(-1);
            navigationDescription = 'Going back';
          } else {
            navigate('/');
            navigationTarget = '/';
            navigationDescription = 'Going to home';
          }
        } else {
          navigationDescription = 'Already at home';
        }
        break;

      case 'left':
        // Swipe left - Go to explore or forward
        if (currentPath === '/') {
          navigate('/explore');
          navigationTarget = '/explore';
          navigationDescription = 'Going to explore';
        } else if (currentPath === '/explore') {
          navigate('/how-it-works');
          navigationTarget = '/how-it-works';
          navigationDescription = 'Going to how it works';
        } else {
          // Try to go forward in history
          navigate(1);
          navigationDescription = 'Going forward';
        }
        break;

      case 'up':
        // Swipe up - Go to admin (if not already there)
        if (!currentPath.startsWith('/admin')) {
          navigate('/admin/login');
          navigationTarget = '/admin/login';
          navigationDescription = 'Opening admin portal';
        } else {
          navigationDescription = 'Already in admin area';
        }
        break;

      case 'down':
        // Swipe down - Go to partner portal (if not already there)
        if (!currentPath.startsWith('/partner')) {
          navigate('/partner/login');
          navigationTarget = '/partner/login';
          navigationDescription = 'Opening partner portal';
        } else {
          navigationDescription = 'Already in partner area';
        }
        break;
    }

    // Show feedback
    showGestureToast(`${gestureConfig.requiredFingers}-finger swipe ${swipe.direction}: ${navigationDescription}`);

    // Track analytics
    trackGestureAnalytics({
      type: 'swipe',
      gestureType: 'touch',
      action: `swipe_${swipe.direction}`,
      direction: swipe.direction,
      duration: swipe.duration,
      success: !!navigationTarget,
      timestamp: Date.now(),
    });
  }, [navigate, location.pathname, enableNavigation, gestureConfig.requiredFingers]);

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      // Initialize tracking on first touch
      if (touchStartRef.current.length === 0) {
        isSwipingRef.current = true;
      }
      
      // Continue adding touches as they come in, up to the required number
      if (touchStartRef.current.length < gestureConfig.requiredFingers) {
        // Find new touches that we haven't tracked yet
        const newTouches = Array.from(event.touches).filter(touch => 
          !touchStartRef.current.some(t => t.identifier === touch.identifier)
        );
        
        // Add each new touch to our tracking array
        newTouches.forEach(touch => {
          if (touchStartRef.current.length < gestureConfig.requiredFingers) {
            touchStartRef.current.push({
              x: touch.clientX,
              y: touch.clientY,
              timestamp: Date.now(),
              identifier: touch.identifier,
            });
            
            if (enableDebug) {
              console.log(`Gesture: Added finger ${touchStartRef.current.length}/${gestureConfig.requiredFingers}`);
            }
          }
        });
        
        // If we've reached the required number of fingers, prevent default scrolling
        if (touchStartRef.current.length === gestureConfig.requiredFingers) {
          event.preventDefault();
          
          if (enableDebug) {
            console.log(`Gesture: All ${gestureConfig.requiredFingers} fingers detected, ready for swipe`);
          }
        }
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isSwipingRef.current && touchStartRef.current.length === gestureConfig.requiredFingers) {
        // Prevent scrolling during multi-finger gesture when we have the required number
        event.preventDefault();
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (isSwipingRef.current) {
        const remainingTouches = Array.from(event.touches);
        const changedTouches = Array.from(event.changedTouches);
        
        if (enableDebug) {
          console.log(`Gesture: TouchEnd - remaining: ${remainingTouches.length}, changed: ${changedTouches.length}, tracked: ${touchStartRef.current.length}`);
        }
        
        // Check if we had the required number of fingers at the start
        const hadRequiredFingers = touchStartRef.current.length === gestureConfig.requiredFingers;
        
        // If all fingers are lifted and we had the required number at the start
        if (remainingTouches.length === 0 && hadRequiredFingers) {
          // Map changed touches to their corresponding start points
          const touchEndPoints: TouchPoint[] = [];
          
          for (const startTouch of touchStartRef.current) {
            const endTouch = changedTouches.find(t => t.identifier === startTouch.identifier);
            if (endTouch) {
              touchEndPoints.push({
                x: endTouch.clientX,
                y: endTouch.clientY,
                timestamp: Date.now(),
                identifier: endTouch.identifier,
              });
            } else {
              // If we can't find matching end touch, use the start position
              // (this shouldn't happen but is a safety fallback)
              touchEndPoints.push({
                ...startTouch,
                timestamp: Date.now(),
              });
            }
          }

          // Only validate if we have matching end points for all start points
          if (touchEndPoints.length === touchStartRef.current.length) {
            if (enableDebug) {
              console.log('Gesture: Validating gesture...');
            }
            
            const swipe = validateGesture(touchStartRef.current, touchEndPoints, gestureConfig);
            if (swipe) {
              if (enableDebug) {
                console.log(`Gesture: Valid ${swipe.fingers}-finger ${swipe.direction} swipe detected!`);
              }
              handleSwipe(swipe);
            } else if (enableDebug) {
              console.log('Gesture: Validation failed - did not meet requirements');
            }
          }
        }

        // Reset state when all fingers are lifted
        if (remainingTouches.length === 0) {
          if (enableDebug) {
            console.log('Gesture: All fingers lifted, resetting');
          }
          isSwipingRef.current = false;
          touchStartRef.current = [];
        }
      }
    };

    const handleTouchCancel = () => {
      isSwipingRef.current = false;
      touchStartRef.current = [];
    };

    // Add event listeners with passive: false to allow preventDefault
    // Use capture phase to ensure we get events before other handlers
    const options = { passive: false, capture: true };
    
    try {
      document.addEventListener('touchstart', handleTouchStart, options);
      document.addEventListener('touchmove', handleTouchMove, options);
      document.addEventListener('touchend', handleTouchEnd, options);
      document.addEventListener('touchcancel', handleTouchCancel, options);
    } catch (error) {
      console.error('Gesture: Failed to attach event listeners', error);
    }

    return () => {
      try {
        document.removeEventListener('touchstart', handleTouchStart, options);
        document.removeEventListener('touchmove', handleTouchMove, options);
        document.removeEventListener('touchend', handleTouchEnd, options);
        document.removeEventListener('touchcancel', handleTouchCancel, options);
      } catch (error) {
        console.error('Gesture: Failed to remove event listeners', error);
      }
    };
  }, [handleSwipe, gestureConfig, enableDebug]);

  return {
    isGestureActive: isSwipingRef.current,
    config: gestureConfig,
  };
}