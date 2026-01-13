import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnimation } from '@/contexts/AnimationContext';

export function ScrollToTop() {
  const { pathname } = useLocation();
  const { lenis, config } = useAnimation();

  useEffect(() => {
    console.log('ScrollToTop triggered for:', pathname);
    console.log('Lenis instance:', lenis);
    console.log('Smooth scroll enabled:', config.smoothScroll.enabled);
    
    const scrollToTop = () => {
      console.log('Attempting to scroll to top...');
      
      // 1. Use Lenis if available and enabled
      if (lenis && config.smoothScroll.enabled) {
        console.log('Using Lenis scroll');
        try {
          lenis.scrollTo(0, { immediate: false, duration: 1 });
          console.log('Lenis scroll executed');
          return;
        } catch (error) {
          console.warn('Lenis scroll failed:', error);
        }
      }
      
      // 2. Try global Lenis instance
      const globalLenis = (window as any).lenis;
      if (globalLenis) {
        console.log('Using global Lenis scroll');
        try {
          globalLenis.scrollTo(0, { immediate: false, duration: 1 });
          console.log('Global Lenis scroll executed');
          return;
        } catch (error) {
          console.warn('Global Lenis scroll failed:', error);
        }
      }
      
      // 3. Force scroll on the SmoothScrollProvider container
      const smoothScrollContainer = document.querySelector('[style*="position: fixed"]');
      if (smoothScrollContainer) {
        console.log('Using container scroll');
        try {
          smoothScrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
          console.log('Container scroll executed');
          return;
        } catch (error) {
          console.warn('Container scroll failed:', error);
        }
      }
      
      // 4. Fallback to native window scrolling
      console.log('Using native window scroll');
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        console.log('Native scroll executed');
      } catch (error) {
        console.warn('Native scroll failed, using instant scroll');
        // Final fallback - instant scroll
        window.scrollTo(0, 0);
      }
    };

    // Use multiple timing strategies to ensure it works
    const timeouts = [0, 50, 100, 200];
    
    timeouts.forEach(delay => {
      setTimeout(() => {
        requestAnimationFrame(scrollToTop);
      }, delay);
    });

  }, [pathname, lenis, config.smoothScroll.enabled]);

  return null;
}