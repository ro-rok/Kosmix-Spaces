import { useState, useEffect, useCallback } from 'react';
import { gsapRegistry, type GSAPPerformanceMetrics, getPerformanceRecommendations } from '../lib/gsap-utils';

export interface GSAPPerformanceHookReturn {
  metrics: GSAPPerformanceMetrics;
  recommendations: string[];
  isPerformanceGood: boolean;
  refreshMetrics: () => void;
}

export function useGSAPPerformance(
  refreshInterval: number = 1000
): GSAPPerformanceHookReturn {
  const [metrics, setMetrics] = useState<GSAPPerformanceMetrics>(() => 
    gsapRegistry.getPerformanceMetrics()
  );
  const [recommendations, setRecommendations] = useState<string[]>([]);
  
  // Refresh metrics manually
  const refreshMetrics = useCallback(() => {
    const newMetrics = gsapRegistry.getPerformanceMetrics();
    setMetrics(newMetrics);
    setRecommendations(getPerformanceRecommendations());
  }, []);
  
  // Auto-refresh metrics at specified interval
  useEffect(() => {
    const interval = setInterval(refreshMetrics, refreshInterval);
    
    // Initial refresh
    refreshMetrics();
    
    return () => clearInterval(interval);
  }, [refreshMetrics, refreshInterval]);
  
  // Determine if performance is good
  const isPerformanceGood = metrics.fps >= 30 && 
                           metrics.activeAnimations <= 10 && 
                           metrics.activeTriggers <= 20;
  
  return {
    metrics,
    recommendations,
    isPerformanceGood,
    refreshMetrics,
  };
}

// Hook for monitoring specific animation performance
export function useAnimationPerformance(animationId?: string) {
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    if (!animationId) return;
    
    const checkActive = () => {
      const activeAnimations = gsapRegistry.getActiveAnimations();
      setIsActive(activeAnimations.includes(animationId));
    };
    
    // Check initially
    checkActive();
    
    // Check periodically
    const interval = setInterval(checkActive, 500);
    
    return () => clearInterval(interval);
  }, [animationId]);
  
  return { isActive };
}

export default useGSAPPerformance;