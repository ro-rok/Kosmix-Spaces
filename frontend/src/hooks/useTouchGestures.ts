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
      if (event.touches.length === gestureConfig.requiredFingers) {
        isSwipingRef.current = true;
        touchStartRef.current = Array.from(event.touches).map((touch, index) => ({
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now(),
          identifier: touch.identifier,
        }));
        
        // Prevent default to avoid scrolling during gesture
        event.preventDefault();
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isSwipingRef.current && event.touches.length === gestureConfig.requiredFingers) {
        // Prevent scrolling during multi-finger gesture
        event.preventDefault();
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (isSwipingRef.current && touchStartRef.current.length === gestureConfig.requiredFingers) {
        // Get the touch points that just ended
        const remainingTouches = Array.from(event.touches);
        const changedTouches = Array.from(event.changedTouches);
        
        // If all fingers are lifted
        if (remainingTouches.length === 0 && changedTouches.length === gestureConfig.requiredFingers) {
          const touchEndPoints: TouchPoint[] = changedTouches.map(touch => ({
            x: touch.clientX,
            y: touch.clientY,
            timestamp: Date.now(),
            identifier: touch.identifier,
          }));

          const swipe = validateGesture(touchStartRef.current, touchEndPoints, gestureConfig);
          if (swipe) {
            handleSwipe(swipe);
          }
        }

        // Reset state
        isSwipingRef.current = false;
        touchStartRef.current = [];
      }
    };

    const handleTouchCancel = () => {
      isSwipingRef.current = false;
      touchStartRef.current = [];
    };

    // Add event listeners with passive: false to allow preventDefault
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [handleSwipe, gestureConfig, enableDebug]);

  return {
    isGestureActive: isSwipingRef.current,
    config: gestureConfig,
  };
}