// Animation performance monitoring and management
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: number;
  animationCount: number;
}

export interface DevicePerformanceProfile {
  tier: 'low' | 'medium' | 'high';
  maxConcurrentAnimations: number;
  capabilities: {
    supportsHardwareAcceleration: boolean;
    preferredFrameRate: number;
  };
}

type DegradationCallback = (profile: DevicePerformanceProfile) => void;

class DegradationManager {
  private callbacks: Set<DegradationCallback> = new Set();
  private currentProfile: DevicePerformanceProfile = {
    tier: 'medium',
    maxConcurrentAnimations: 10,
    capabilities: {
      supportsHardwareAcceleration: true,
      preferredFrameRate: 60,
    },
  };
  
  onDegradation(callback: DegradationCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }
  
  getDeviceProfile(): DevicePerformanceProfile {
    return this.currentProfile;
  }
  
  private notifyCallbacks(): void {
    this.callbacks.forEach(cb => cb(this.currentProfile));
  }
}

type PerformanceCallback = (metrics: PerformanceMetrics) => void;
type VisibilityCallback = (isVisible: boolean) => void;

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
    animationCount: 0,
  };
  private degradationCallback?: PerformanceCallback;
  private recoveryCallback?: PerformanceCallback;
  private visibilityCallback?: VisibilityCallback;

  getMetrics(): PerformanceMetrics {
    return this.metrics;
  }

  startMonitoring(
    onDegradation?: PerformanceCallback,
    onRecovery?: PerformanceCallback,
    onVisibilityChange?: VisibilityCallback
  ): void {
    this.degradationCallback = onDegradation;
    this.recoveryCallback = onRecovery;
    this.visibilityCallback = onVisibilityChange;
  }

  stopMonitoring(): void {
    this.degradationCallback = undefined;
    this.recoveryCallback = undefined;
    this.visibilityCallback = undefined;
  }
}

class ResourceManager {
  private resources: Map<string, any> = new Map();

  allocate(id: string, resource: any): void {
    this.resources.set(id, resource);
  }

  deallocate(id: string): void {
    this.resources.delete(id);
  }

  cleanup(): void {
    this.resources.clear();
  }

  cleanupAll(): void {
    this.cleanup();
  }

  getActiveResourceCount(): number {
    return this.resources.size;
  }
}

export const globalDegradationManager = new DegradationManager();
export const globalPerformanceMonitor = new PerformanceMonitor();
export const globalResourceManager = new ResourceManager();