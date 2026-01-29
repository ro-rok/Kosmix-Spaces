/**
 * Enhanced error handling system with retry logic and user-friendly messages
 */

import { useState, useCallback, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "./api";

// Error types for different scenarios
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION', 
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

// Enhanced error interface
export interface EnhancedError {
  type: ErrorType;
  code?: string;
  message: string;
  originalError?: any;
  retryable: boolean;
  userMessage: string;
  actionMessage?: string;
  details?: Record<string, any>;
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: ErrorType[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: [ErrorType.NETWORK, ErrorType.SERVER]
};

// User-friendly error messages
const ERROR_MESSAGES: Record<ErrorType, { message: string; action?: string }> = {
  [ErrorType.NETWORK]: {
    message: "Unable to connect to the server. Please check your internet connection.",
    action: "Retry"
  },
  [ErrorType.VALIDATION]: {
    message: "Please check the highlighted fields and try again.",
  },
  [ErrorType.AUTHENTICATION]: {
    message: "Your session has expired. Please log in again.",
    action: "Log In"
  },
  [ErrorType.AUTHORIZATION]: {
    message: "You don't have permission to perform this action.",
  },
  [ErrorType.NOT_FOUND]: {
    message: "The requested item was not found.",
  },
  [ErrorType.CONFLICT]: {
    message: "This action conflicts with existing data. Please refresh and try again.",
    action: "Refresh"
  },
  [ErrorType.SERVER]: {
    message: "Something went wrong on our end. Please try again in a moment.",
    action: "Retry"
  },
  [ErrorType.UNKNOWN]: {
    message: "An unexpected error occurred. Please try again.",
    action: "Retry"
  }
};

// Convert API error to enhanced error
export function normalizeError(error: any): EnhancedError {
  // Handle ApiError instances
  if (error instanceof ApiError) {
    let type: ErrorType;
    let retryable = false;

    switch (error.status) {
      case 0:
        type = ErrorType.NETWORK;
        retryable = true;
        break;
      case 401:
        type = ErrorType.AUTHENTICATION;
        break;
      case 403:
        type = ErrorType.AUTHORIZATION;
        break;
      case 404:
        type = ErrorType.NOT_FOUND;
        break;
      case 409:
        type = ErrorType.CONFLICT;
        break;
      case 422:
        type = ErrorType.VALIDATION;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        type = ErrorType.SERVER;
        retryable = true;
        break;
      default:
        type = ErrorType.UNKNOWN;
        retryable = error.status >= 500;
    }

    const errorConfig = ERROR_MESSAGES[type];
    return {
      type,
      code: error.code,
      message: error.message,
      originalError: error,
      retryable,
      userMessage: errorConfig.message,
      actionMessage: errorConfig.action,
      details: error.details
    };
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    const errorConfig = ERROR_MESSAGES[ErrorType.NETWORK];
    return {
      type: ErrorType.NETWORK,
      message: error.message,
      originalError: error,
      retryable: true,
      userMessage: errorConfig.message,
      actionMessage: errorConfig.action
    };
  }

  // Handle validation errors (Zod)
  if (error?.name === 'ZodError') {
    const errorConfig = ERROR_MESSAGES[ErrorType.VALIDATION];
    return {
      type: ErrorType.VALIDATION,
      message: 'Validation failed',
      originalError: error,
      retryable: false,
      userMessage: errorConfig.message,
      details: { zodErrors: error.errors }
    };
  }

  // Default unknown error
  const errorConfig = ERROR_MESSAGES[ErrorType.UNKNOWN];
  return {
    type: ErrorType.UNKNOWN,
    message: error?.message || 'Unknown error',
    originalError: error,
    retryable: false,
    userMessage: errorConfig.message,
    actionMessage: errorConfig.action
  };
}

// Retry function with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const enhancedError = normalizeError(error);

      // Don't retry if error is not retryable
      if (!enhancedError.retryable || !retryConfig.retryableErrors.includes(enhancedError.type)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === retryConfig.maxAttempts) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt - 1),
        retryConfig.maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;

      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }

  throw lastError;
}

// Enhanced error handler with toast notifications
export function handleError(
  error: any,
  options: {
    showToast?: boolean;
    toastTitle?: string;
    onRetry?: () => void;
    onAuthError?: () => void;
    customMessage?: string;
  } = {}
) {
  const {
    showToast = true,
    toastTitle,
    onRetry,
    onAuthError,
    customMessage
  } = options;

  const enhancedError = normalizeError(error);

  // Handle authentication errors
  if (enhancedError.type === ErrorType.AUTHENTICATION && onAuthError) {
    onAuthError();
    return enhancedError;
  }

  // Show toast notification
  if (showToast) {
    const title = toastTitle || (enhancedError.type === ErrorType.VALIDATION ? "Validation Error" : "Error");
    const description = customMessage || enhancedError.userMessage;

    toast({
      title,
      description,
      variant: "destructive",
      action: enhancedError.retryable && onRetry ? {
        altText: enhancedError.actionMessage || "Retry",
        onClick: onRetry,
        children: enhancedError.actionMessage || "Retry"
      } : undefined
    });
  }

  return enhancedError;
}

// Form-specific error handler
export function handleFormError(
  error: any,
  setFieldErrors: (errors: Record<string, string>) => void,
  options: {
    showToast?: boolean;
    onAuthError?: () => void;
  } = {}
) {
  const enhancedError = handleError(error, {
    ...options,
    showToast: false // We'll handle toast separately for forms
  });

  // Handle validation errors
  if (enhancedError.type === ErrorType.VALIDATION && enhancedError.details) {
    const fieldErrors: Record<string, string> = {};

    // Handle Zod errors
    if (enhancedError.details.zodErrors) {
      enhancedError.details.zodErrors.forEach((err: any) => {
        const path = err.path?.join('.') || '_form';
        fieldErrors[path] = err.message;
      });
    }

    // Handle API validation errors
    if (Array.isArray(enhancedError.details)) {
      enhancedError.details.forEach((err: any) => {
        const path = err.loc?.join('.') || '_form';
        fieldErrors[path] = err.msg || 'Validation failed';
      });
    }

    setFieldErrors(fieldErrors);

    // Show toast for validation errors if requested
    if (options.showToast) {
      toast({
        title: "Validation Error",
        description: "Please check the highlighted fields and try again.",
        variant: "destructive"
      });
    }
  } else {
    // For non-validation errors, set a general form error
    setFieldErrors({ _form: enhancedError.userMessage });

    // Show toast for other errors
    if (options.showToast !== false) {
      toast({
        title: "Error",
        description: enhancedError.userMessage,
        variant: "destructive"
      });
    }
  }

  return enhancedError;
}

// Duplicate submission prevention
export class SubmissionGuard {
  private submittingKeys = new Set<string>();

  async guard<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.submittingKeys.has(key)) {
      throw new Error('Request already in progress');
    }

    this.submittingKeys.add(key);
    try {
      return await fn();
    } finally {
      this.submittingKeys.delete(key);
    }
  }

  isSubmitting(key: string): boolean {
    return this.submittingKeys.has(key);
  }

  clear(key?: string): void {
    if (key) {
      this.submittingKeys.delete(key);
    } else {
      this.submittingKeys.clear();
    }
  }
}

// Global submission guard instance
export const globalSubmissionGuard = new SubmissionGuard();

// Hook for managing loading states with progress
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<EnhancedError | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setProgress(0);
    setError(null);
  }, []);

  const updateProgress = useCallback((value: number) => {
    setProgress(Math.max(0, Math.min(100, value)));
  }, []);

  const stopLoading = useCallback((error?: any) => {
    setIsLoading(false);
    setProgress(100);
    if (error) {
      setError(normalizeError(error));
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    isLoading,
    progress,
    error,
    startLoading,
    updateProgress,
    stopLoading,
    reset
  };
}

// Network status detection
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Error boundary hook
export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const captureError = useCallback((error: Error) => {
    setError(error);
    // Log to analytics or error reporting service
  }, []);

  return {
    error,
    resetError,
    captureError,
    hasError: error !== null
  };
}