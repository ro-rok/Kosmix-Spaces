/**
 * Performance optimization utilities for the premium workspace platform
 */

import React from 'react';

// Image lazy loading with progressive enhancement
export interface LazyImageOptions {
  threshold?: number;
  rootMargin?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private loadedImages = new Set<string>();

  constructor(options: LazyImageOptions = {}) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          threshold: options.threshold || 0.1,
          rootMargin: options.rootMargin || '50px'
        }
      );
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        this.loadImage(img);
        this.observer?.unobserve(img);
      }
    });
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    if (!src || this.loadedImages.has(src)) return;

    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = src;
      img.classList.add('loaded');
      this.loadedImages.add(src);
    };
    tempImg.onerror = () => {
      img.classList.add('error');
    };
    tempImg.src = src;
  }

  observe(img: HTMLImageElement) {
    if (this.observer) {
      this.observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  disconnect() {
    this.observer?.disconnect();
  }
}

// Enhanced caching strategies
export interface CacheConfig {
  maxAge: number;
  maxSize: number;
  strategy: 'lru' | 'fifo';
}

export class PerformanceCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; accessCount: number }>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxAge: config.maxAge || 5 * 60 * 1000, // 5 minutes
      maxSize: config.maxSize || 100,
      strategy: config.strategy || 'lru'
    };
  }

  set(key: string, data: T): void {
    // Remove expired entries
    this.cleanup();

    // Remove oldest entry if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 0
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.config.maxAge) {
      this.cache.delete(key);
      return null;
    }

    // Update access count for LRU
    entry.accessCount++;
    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.maxAge) {
        this.cache.delete(key);
      }
    }
  }

  private evict(): void {
    if (this.cache.size === 0) return;

    let keyToRemove: string;
    
    if (this.config.strategy === 'lru') {
      // Remove least recently used (lowest access count)
      let minAccessCount = Infinity;
      keyToRemove = '';
      
      for (const [key, entry] of this.cache.entries()) {
        if (entry.accessCount < minAccessCount) {
          minAccessCount = entry.accessCount;
          keyToRemove = key;
        }
      }
    } else {
      // FIFO - remove oldest entry
      keyToRemove = this.cache.keys().next().value;
    }

    this.cache.delete(keyToRemove);
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: this.calculateHitRate()
    };
  }

  private calculateHitRate(): number {
    if (this.cache.size === 0) return 0;
    
    const totalAccess = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0);
    
    return totalAccess / this.cache.size;
  }
}

// File upload optimization
export interface UploadConfig {
  maxConcurrent: number;
  chunkSize: number;
  retryAttempts: number;
  retryDelay: number;
}

export class OptimizedUploader {
  private config: UploadConfig;
  private activeUploads = new Set<string>();
  private uploadQueue: Array<() => Promise<void>> = [];

  constructor(config: Partial<UploadConfig> = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent || 3,
      chunkSize: config.chunkSize || 1024 * 1024, // 1MB chunks
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000
    };
  }

  async uploadFile(
    file: File,
    uploadFn: (file: File) => Promise<any>,
    onProgress?: (progress: number) => void,
    onComplete?: (result: any) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const uploadId = `${file.name}-${Date.now()}`;
    
    const uploadTask = async () => {
      this.activeUploads.add(uploadId);
      
      try {
        let attempt = 0;
        let lastError: Error | null = null;

        while (attempt < this.config.retryAttempts) {
          try {
            onProgress?.(0);
            
            // Simulate progress for non-chunked uploads
            const progressInterval = setInterval(() => {
              const currentProgress = Math.min(90, (Date.now() % 3000) / 3000 * 90);
              onProgress?.(currentProgress);
            }, 100);

            const result = await uploadFn(file);
            
            clearInterval(progressInterval);
            onProgress?.(100);
            onComplete?.(result);
            return;
            
          } catch (error) {
            lastError = error as Error;
            attempt++;
            
            if (attempt < this.config.retryAttempts) {
              await this.delay(this.config.retryDelay * attempt);
            }
          }
        }
        
        throw lastError || new Error('Upload failed after retries');
        
      } catch (error) {
        onError?.(error as Error);
      } finally {
        this.activeUploads.delete(uploadId);
        this.processQueue();
      }
    };

    if (this.activeUploads.size < this.config.maxConcurrent) {
      uploadTask();
    } else {
      this.uploadQueue.push(uploadTask);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.uploadQueue.length > 0 && this.activeUploads.size < this.config.maxConcurrent) {
      const nextUpload = this.uploadQueue.shift();
      if (nextUpload) {
        nextUpload();
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getActiveUploads(): number {
    return this.activeUploads.size;
  }

  getQueueLength(): number {
    return this.uploadQueue.length;
  }

  cancelAll(): void {
    this.uploadQueue.length = 0;
    this.activeUploads.clear();
  }
}

// Performance monitoring
export interface PerformanceMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers(): void {
    // Observe navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      this.measureNavigationTiming();
    }

    // Observe paint timing
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.firstContentfulPaint = entry.startTime;
            }
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);

        // Observe LCP
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.largestContentfulPaint = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // Observe CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.metrics.cumulativeLayoutShift = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);

        // Observe FID
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.metrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }
  }

  private measureNavigationTiming(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
          this.metrics.timeToInteractive = navigation.domInteractive - navigation.fetchStart;
        }
      }, 0);
    });
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  reportMetrics(): void {
    const metrics = this.getMetrics();
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.table(metrics);
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production' && Object.keys(metrics).length > 0) {
      // This would integrate with your analytics system
      console.log('Performance metrics:', metrics);
    }
  }

  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Bundle size optimization utilities
export function preloadRoute(routeComponent: () => Promise<any>): void {
  // Preload route component on hover or focus
  const link = document.createElement('link');
  link.rel = 'modulepreload';
  
  routeComponent().then(module => {
    // Component is now preloaded
    console.log('Route preloaded:', module);
  }).catch(error => {
    console.warn('Failed to preload route:', error);
  });
}

export function prefetchData(queryKey: string[], queryFn: () => Promise<any>): void {
  // Prefetch data for better perceived performance
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      queryFn().then(data => {
        console.log('Data prefetched for:', queryKey);
      }).catch(error => {
        console.warn('Failed to prefetch data:', error);
      });
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      queryFn().catch(() => {});
    }, 100);
  }
}

// Memory management
export function createMemoryEfficientComponent<T extends object>(
  component: React.ComponentType<T>,
  shouldUpdate: (prevProps: T, nextProps: T) => boolean = () => true
): React.MemoExoticComponent<React.ComponentType<T>> {
  return React.memo(component, (prevProps, nextProps) => {
    return !shouldUpdate(prevProps, nextProps);
  });
}

// Global performance cache instance
export const performanceCache = new PerformanceCache({
  maxAge: 5 * 60 * 1000, // 5 minutes
  maxSize: 50,
  strategy: 'lru'
});

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Report metrics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.reportMetrics();
    }, 2000);
  });

  // Report metrics before page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.reportMetrics();
  });
}