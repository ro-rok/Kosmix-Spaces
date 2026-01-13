// Gesture utilities for touch interactions
export interface TouchGestureOptions {
  threshold?: number;
  velocity?: number;
  direction?: 'horizontal' | 'vertical' | 'both';
}

export interface GestureEvent {
  type: 'swipe' | 'tap' | 'pinch';
  direction?: 'left' | 'right' | 'up' | 'down';
  velocity?: number;
  distance?: number;
}

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface SwipeResult {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  duration: number;
}

export interface GestureConfig {
  minDistance: number;
  maxDuration: number;
  velocityThreshold: number;
  enableRipple: boolean;
}

export class GestureRecognizer {
  private element: Element;
  private options: TouchGestureOptions;
  private startX = 0;
  private startY = 0;
  private startTime = 0;

  constructor(element: Element, options: TouchGestureOptions = {}) {
    this.element = element;
    this.options = {
      threshold: 50,
      velocity: 0.3,
      direction: 'both',
      ...options,
    };
  }

  onGesture(callback: (event: GestureEvent) => void): () => void {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      this.startX = touch.clientX;
      this.startY = touch.clientY;
      this.startTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();

      const deltaX = endX - this.startX;
      const deltaY = endY - this.startY;
      const deltaTime = endTime - this.startTime;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / deltaTime;

      if (distance > (this.options.threshold || 50) && velocity > (this.options.velocity || 0.3)) {
        let direction: 'left' | 'right' | 'up' | 'down';
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        callback({
          type: 'swipe',
          direction,
          velocity,
          distance,
        });
      } else if (distance < 10 && deltaTime < 300) {
        callback({
          type: 'tap',
        });
      }
    };

    this.element.addEventListener('touchstart', handleTouchStart);
    this.element.addEventListener('touchend', handleTouchEnd);

    return () => {
      this.element.removeEventListener('touchstart', handleTouchStart);
      this.element.removeEventListener('touchend', handleTouchEnd);
    };
  }
}

export function createGestureRecognizer(
  element: Element,
  options?: TouchGestureOptions
): GestureRecognizer {
  return new GestureRecognizer(element, options);
}

export function showGestureToast(message: string): void {
  // Minimal implementation - could integrate with toast system
  console.log('Gesture:', message);
}

export function trackGestureAnalytics(gesture: GestureEvent): void {
  // Minimal implementation - could integrate with analytics
  console.log('Gesture tracked:', gesture);
}

export function validateGesture(gesture: GestureEvent): boolean {
  return gesture.type !== undefined;
}

export function createGestureRipple(element: Element, x: number, y: number): void {
  // Create a simple ripple effect
  const ripple = document.createElement('div');
  ripple.style.position = 'absolute';
  ripple.style.borderRadius = '50%';
  ripple.style.background = 'rgba(255, 255, 255, 0.3)';
  ripple.style.transform = 'scale(0)';
  ripple.style.animation = 'ripple 0.6s linear';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  
  (element as HTMLElement).appendChild(ripple);
  
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

export function getOptimalGestureConfig(): GestureConfig {
  return {
    minDistance: 50,
    maxDuration: 1000,
    velocityThreshold: 0.3,
    enableRipple: true,
  };
}