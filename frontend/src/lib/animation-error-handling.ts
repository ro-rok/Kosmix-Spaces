// Animation error handling and recovery
export interface ErrorRecoveryStrategy {
  fallbackToCSS: boolean;
  disableAnimations: boolean;
  retryAttempts: number;
  reportError: boolean;
  gracefulDegradation: boolean;
}

class AnimationErrorHandler {
  private strategy: ErrorRecoveryStrategy;

  constructor(strategy: ErrorRecoveryStrategy) {
    this.strategy = strategy;
  }

  handleError(error: Error): void {
    if (this.strategy.reportError) {
      console.error('Animation error:', error);
    }
  }

  getStrategy(): ErrorRecoveryStrategy {
    return this.strategy;
  }

  updateStrategy(updates: Partial<ErrorRecoveryStrategy>): void {
    this.strategy = { ...this.strategy, ...updates };
  }
}

let globalErrorHandler: AnimationErrorHandler | null = null;

export function getGlobalAnimationErrorHandler(
  strategy: ErrorRecoveryStrategy
): AnimationErrorHandler {
  if (!globalErrorHandler) {
    globalErrorHandler = new AnimationErrorHandler(strategy);
  }
  return globalErrorHandler;
}

export function cleanupGlobalAnimationErrorHandler(): void {
  globalErrorHandler = null;
}

export function useAnimationErrorHandling(strategy: ErrorRecoveryStrategy) {
  return {
    handleError: (error: Error) => {
      const handler = getGlobalAnimationErrorHandler(strategy);
      handler.handleError(error);
    },
    strategy,
  };
}

export function withAnimationErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  strategy: ErrorRecoveryStrategy
): T {
  return ((...args: any[]) => {
    try {
      return fn(...args);
    } catch (error) {
      const handler = getGlobalAnimationErrorHandler(strategy);
      handler.handleError(error as Error);
      
      if (strategy.gracefulDegradation) {
        return null; // Return null or default value on error
      }
      throw error;
    }
  }) as T;
}