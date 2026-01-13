// GSAP utilities (minimal implementation without GSAP dependency)
export interface AnimationOptions {
  duration?: number;
  delay?: number;
  ease?: string;
  stagger?: number;
}

export function createStaggerAnimation(
  elements: Element[],
  options: AnimationOptions = {}
): void {
  // Minimal CSS-based stagger animation fallback
  elements.forEach((element, index) => {
    const delay = (options.stagger || 0.1) * index;
    const duration = options.duration || 0.3;
    
    (element as HTMLElement).style.transition = `all ${duration}s ease ${delay}s`;
    (element as HTMLElement).style.opacity = '1';
    (element as HTMLElement).style.transform = 'translateY(0)';
  });
}

export function animateIn(element: Element, options: AnimationOptions = {}): void {
  const duration = options.duration || 0.3;
  const delay = options.delay || 0;
  
  (element as HTMLElement).style.transition = `all ${duration}s ease ${delay}s`;
  (element as HTMLElement).style.opacity = '1';
  (element as HTMLElement).style.transform = 'translateY(0)';
}

export function animateOut(element: Element, options: AnimationOptions = {}): void {
  const duration = options.duration || 0.3;
  const delay = options.delay || 0;
  
  (element as HTMLElement).style.transition = `all ${duration}s ease ${delay}s`;
  (element as HTMLElement).style.opacity = '0';
  (element as HTMLElement).style.transform = 'translateY(20px)';
}

// GSAP registry and utilities
export const gsapRegistry = {
  register: (id: string, animation: any) => {
    console.log('Registered animation:', id);
  },
  unregister: (id: string) => {
    console.log('Unregistered animation:', id);
  },
};

export function createOptimizedScrollTrigger(options: any): any {
  // Minimal scroll trigger implementation
  return {
    kill: () => {},
    refresh: () => {},
  };
}

export function isReducedMotionPreferred(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}