// GSAP utilities
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export interface AnimationOptions {
  duration?: number;
  delay?: number;
  ease?: string;
  stagger?: number;
}

export interface GSAPPerformanceMetrics {
  fps: number;
  activeAnimations: number;
  activeTriggers: number;
  memoryUsage: number;
  lastUpdate: number;
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
const activeAnimations = new Set<string>();
const activeScrollTriggers = new Set<string>();

export const gsapRegistry = {
  register: (id: string, animation: any) => {
    activeAnimations.add(id);
  },
  unregister: (id: string) => {
    activeAnimations.delete(id);
  },
  registerScrollTrigger: (id: string, trigger: any) => {
    activeScrollTriggers.add(id);
  },
  getPerformanceMetrics: (): GSAPPerformanceMetrics => {
    return {
      fps: 60, // Mock FPS
      activeAnimations: activeAnimations.size,
      activeTriggers: activeScrollTriggers.size,
      memoryUsage: 0,
      lastUpdate: Date.now(),
    };
  },
  getActiveAnimations: (): string[] => {
    return Array.from(activeAnimations);
  },
};

export function getPerformanceRecommendations(): string[] {
  const metrics = gsapRegistry.getPerformanceMetrics();
  const recommendations: string[] = [];
  
  if (metrics.activeAnimations > 10) {
    recommendations.push('Consider reducing the number of concurrent animations');
  }
  
  if (metrics.activeTriggers > 20) {
    recommendations.push('Too many ScrollTriggers active - consider lazy loading');
  }
  
  if (metrics.fps < 30) {
    recommendations.push('Low FPS detected - simplify animations or reduce complexity');
  }
  
  return recommendations;
}

export function createOptimizedScrollTrigger(options: any): any {
  // Check if ScrollTrigger is available
  if (!ScrollTrigger || typeof ScrollTrigger.create !== 'function') {
    // ScrollTrigger not available - animations may not work correctly
    return {
      kill: () => {},
      refresh: () => {},
    };
  }
  
  // Configure scroller for Lenis if it's active
  const lenisWrapper = document.querySelector('[style*="position: fixed"]');
  
  const scrollTriggerConfig = {
    ...options,
    // Use Lenis wrapper as scroller if available
    scroller: lenisWrapper || window,
  };
  
  // Create and return the ScrollTrigger
  const trigger = ScrollTrigger.create(scrollTriggerConfig);
  
  // Register it
  if (options.id) {
    gsapRegistry.registerScrollTrigger(options.id, trigger);
  }
  
  return trigger;
}

export function createBatchScrollTriggers(elements: Element[], options: any = {}): any[] {
  // Minimal batch scroll trigger implementation
  return elements.map(() => ({
    kill: () => {},
    refresh: () => {},
  }));
}

export function createOptimizedAnimation(id: string, element: Element, options: any): void {
  // Minimal animation implementation - just a placeholder
}

export function isReducedMotionPreferred(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}