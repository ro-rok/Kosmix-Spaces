import React, { useState } from 'react';
import { useAnimationPerformance, useAutoPerformanceManagement } from '../hooks/useAnimationPerformance';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Pause, 
  Play, 
  Trash2,
  Settings,
  Monitor,
  Zap
} from 'lucide-react';

interface AnimationPerformanceMonitorProps {
  showRecommendations?: boolean;
  showControls?: boolean;
  enableAutoManagement?: boolean;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function AnimationPerformanceMonitor({ 
  showRecommendations = true,
  showControls = true,
  enableAutoManagement = false,
  className = '',
  position = 'bottom-right'
}: AnimationPerformanceMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const {
    metrics,
    deviceProfile,
    isPerformanceGood,
    activeAnimationCount,
    resourceCount,
    pauseAnimations,
    resumeAnimations,
    forceCleanup,
    refreshMetrics,
  } = useAnimationPerformance({
    autoStart: true,
    refreshInterval: 1000,
  });

  const autoManagement = useAutoPerformanceManagement({
    enableAutoPause: enableAutoManagement,
    enableAutoCleanup: enableAutoManagement,
    performanceThreshold: 25,
  });

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

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
        Poor
      </Badge>
    );
  };

  const getDeviceTierBadge = () => {
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={colors[deviceProfile.tier]}>
        <Monitor className="w-3 h-3 mr-1" />
        {deviceProfile.tier.toUpperCase()}
      </Badge>
    );
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      resumeAnimations();
      setIsPaused(false);
    } else {
      pauseAnimations();
      setIsPaused(true);
    }
  };

  const handleCleanup = () => {
    forceCleanup();
    refreshMetrics();
  };

  // Compact view when not expanded
  if (!isExpanded) {
    return (
      <div className={`fixed ${getPositionClasses()} z-50 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="bg-white/90 backdrop-blur-sm shadow-lg"
        >
          <Activity className="w-4 h-4 mr-2" />
          <span className={`font-mono ${getPerformanceColor(metrics.fps)}`}>
            {metrics.fps} FPS
          </span>
          {!isPerformanceGood && (
            <AlertTriangle className="w-3 h-3 ml-2 text-red-500" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className={`fixed ${getPositionClasses()} w-80 z-50 bg-white/95 backdrop-blur-sm shadow-xl ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Animation Performance
          </span>
          <div className="flex items-center gap-2">
            {getPerformanceBadge()}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">FPS:</span>
              <span className={`font-mono font-semibold text-sm ${getPerformanceColor(metrics.fps)}`}>
                {metrics.fps}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Animations:</span>
              <span className="font-mono font-semibold text-sm">
                {activeAnimationCount}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Resources:</span>
              <span className="font-mono font-semibold text-sm">
                {resourceCount}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Frame Time:</span>
              <span className="font-mono font-semibold text-sm">
                {metrics.frameTime.toFixed(1)}ms
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">CPU:</span>
              <span className="font-mono font-semibold text-sm">
                {metrics.cpuUsage.toFixed(0)}%
              </span>
            </div>
            
            {metrics.memoryUsage > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Memory:</span>
                <span className="font-mono font-semibold text-xs">
                  {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Device Profile */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-gray-600">Device Tier:</span>
          {getDeviceTierBadge()}
        </div>

        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Max Concurrent:</span>
            <span>{deviceProfile.maxConcurrentAnimations}</span>
          </div>
          <div className="flex justify-between">
            <span>Complex Animations:</span>
            <span>{deviceProfile.enableComplexAnimations ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span>GPU Acceleration:</span>
            <span>{deviceProfile.enableGPUAcceleration ? 'Yes' : 'No'}</span>
          </div>
        </div>

        {/* Auto Management Status */}
        {enableAutoManagement && (
          <Alert className="py-2">
            <Zap className="h-3 w-3" />
            <AlertDescription className="text-xs">
              Auto-management: {autoManagement.isAutoManaged ? 'Active' : 'Inactive'}
              {autoManagement.isAutoManaged && (
                <span className="block">
                  Current FPS: {autoManagement.currentFPS} 
                  ({autoManagement.isPerformanceGood ? 'Good' : 'Poor'})
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Control Buttons */}
        {showControls && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePauseToggle}
              className="flex-1 text-xs"
            >
              {isPaused ? (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3 mr-1" />
                  Pause
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanup}
              className="flex-1 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Cleanup
            </Button>
          </div>
        )}

        {/* Performance Recommendations */}
        {showRecommendations && !isPerformanceGood && (
          <Alert className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <div className="font-semibold mb-1">Performance Issues Detected:</div>
              <ul className="list-disc list-inside space-y-1">
                {metrics.fps < 30 && (
                  <li>Low FPS detected - consider reducing animation complexity</li>
                )}
                {activeAnimationCount > deviceProfile.maxConcurrentAnimations && (
                  <li>Too many concurrent animations for this device</li>
                )}
                {metrics.frameTime > 33 && (
                  <li>High frame time - animations may appear choppy</li>
                )}
                {metrics.cpuUsage > 80 && (
                  <li>High CPU usage - consider pausing non-essential animations</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Refresh Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshMetrics}
          className="w-full text-xs bg-gray-50 hover:bg-gray-100"
        >
          <Settings className="w-3 h-3 mr-1" />
          Refresh Metrics
        </Button>

        {/* Last Update */}
        <div className="text-xs text-gray-400 text-center">
          Updated: {new Date(metrics.timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}

export default AnimationPerformanceMonitor;