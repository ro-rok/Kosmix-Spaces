import React from 'react';
import { useGSAPPerformance } from '../hooks/useGSAPPerformance';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';

interface GSAPPerformanceMonitorProps {
  showRecommendations?: boolean;
  className?: string;
}

export function GSAPPerformanceMonitor({ 
  showRecommendations = true,
  className 
}: GSAPPerformanceMonitorProps) {
  const { metrics, recommendations, isPerformanceGood, refreshMetrics } = useGSAPPerformance();
  
  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const getPerformanceColor = (fps: number) => {
    if (fps >= 50) return 'text-green-600';
    if (fps >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getPerformanceBadge = () => {
    if (isPerformanceGood) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Good
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Needs Attention
      </Badge>
    );
  };
  
  return (
    <Card className={`fixed bottom-4 right-4 w-80 z-50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            GSAP Performance
          </span>
          {getPerformanceBadge()}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* FPS Metric */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">FPS:</span>
          <span className={`font-mono font-semibold ${getPerformanceColor(metrics.fps)}`}>
            {metrics.fps}
          </span>
        </div>
        
        {/* Active Animations */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Active Animations:</span>
          <span className="font-mono font-semibold">
            {metrics.activeAnimations}
          </span>
        </div>
        
        {/* Active Triggers */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Active Triggers:</span>
          <span className="font-mono font-semibold">
            {metrics.activeTriggers}
          </span>
        </div>
        
        {/* Memory Usage (if available) */}
        {metrics.memoryUsage > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Memory:</span>
            <span className="font-mono font-semibold text-xs">
              {(metrics.memoryUsage / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>
        )}
        
        {/* Last Update */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Updated:</span>
          <span className="font-mono text-xs text-gray-500">
            {new Date(metrics.lastUpdate).toLocaleTimeString()}
          </span>
        </div>
        
        {/* Recommendations */}
        {showRecommendations && recommendations.length > 0 && (
          <Alert className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <div className="font-semibold mb-1">Recommendations:</div>
              <ul className="list-disc list-inside space-y-1">
                {recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Refresh Button */}
        <button
          onClick={refreshMetrics}
          className="w-full text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
        >
          Refresh Metrics
        </button>
      </CardContent>
    </Card>
  );
}

export default GSAPPerformanceMonitor;