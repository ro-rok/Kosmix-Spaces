/**
 * Enhanced toast system with structured error handling and retry actions
 */

import { toast as baseToast } from "@/hooks/use-toast";
import { EnhancedError, ErrorType } from "./error-handling";

// Enhanced toast options
export interface EnhancedToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success" | "warning";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  persistent?: boolean;
}

// Toast type definitions
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

// Enhanced toast functions
export const enhancedToast = {
  // Success toast
  success: (message: string, options: Partial<EnhancedToastOptions> = {}) => {
    return baseToast({
      title: options.title || "Success",
      description: message,
      variant: "default",
      duration: options.duration || 4000,
      action: options.action ? {
        altText: options.action.label,
        onClick: options.action.onClick,
        children: options.action.label
      } : undefined,
      ...options
    });
  },

  // Error toast with enhanced error handling
  error: (error: string | EnhancedError, options: Partial<EnhancedToastOptions> = {}) => {
    let title = options.title || "Error";
    let description = "";
    let action = options.action;

    if (typeof error === 'string') {
      description = error;
    } else {
      description = error.userMessage;
      
      // Add retry action for retryable errors
      if (error.retryable && error.actionMessage && !action) {
        action = {
          label: error.actionMessage,
          onClick: () => {
            // This should be provided by the caller
            console.warn('Retry action not implemented');
          }
        };
      }

      // Customize title based on error type
      switch (error.type) {
        case ErrorType.NETWORK:
          title = "Connection Error";
          break;
        case ErrorType.VALIDATION:
          title = "Validation Error";
          break;
        case ErrorType.AUTHENTICATION:
          title = "Authentication Required";
          break;
        case ErrorType.AUTHORIZATION:
          title = "Access Denied";
          break;
        case ErrorType.NOT_FOUND:
          title = "Not Found";
          break;
        case ErrorType.CONFLICT:
          title = "Conflict";
          break;
        case ErrorType.SERVER:
          title = "Server Error";
          break;
        default:
          title = "Error";
      }
    }

    return baseToast({
      title,
      description,
      variant: "destructive",
      duration: options.duration || 6000,
      action: action ? {
        altText: action.label,
        onClick: action.onClick,
        children: action.label
      } : undefined,
      ...options
    });
  },

  // Warning toast
  warning: (message: string, options: Partial<EnhancedToastOptions> = {}) => {
    return baseToast({
      title: options.title || "Warning",
      description: message,
      variant: "default", // Using default as warning variant may not exist
      duration: options.duration || 5000,
      action: options.action ? {
        altText: options.action.label,
        onClick: options.action.onClick,
        children: options.action.label
      } : undefined,
      ...options
    });
  },

  // Info toast
  info: (message: string, options: Partial<EnhancedToastOptions> = {}) => {
    return baseToast({
      title: options.title || "Info",
      description: message,
      variant: "default",
      duration: options.duration || 4000,
      action: options.action ? {
        altText: options.action.label,
        onClick: options.action.onClick,
        children: options.action.label
      } : undefined,
      ...options
    });
  },

  // Loading toast (persistent until dismissed)
  loading: (message: string, options: Partial<EnhancedToastOptions> = {}) => {
    return baseToast({
      title: options.title || "Loading",
      description: message,
      variant: "default",
      duration: options.duration || Infinity, // Persistent by default
      ...options
    });
  },

  // Form validation error toast
  validationError: (message: string = "Please check the highlighted fields and try again.", options: Partial<EnhancedToastOptions> = {}) => {
    return enhancedToast.error(message, {
      title: "Validation Error",
      duration: 4000,
      ...options
    });
  },

  // Network error toast with retry
  networkError: (onRetry?: () => void, options: Partial<EnhancedToastOptions> = {}) => {
    return enhancedToast.error("Unable to connect to the server. Please check your internet connection.", {
      title: "Connection Error",
      action: onRetry ? {
        label: "Retry",
        onClick: onRetry
      } : undefined,
      duration: 8000,
      ...options
    });
  },

  // Authentication error toast
  authError: (onLogin?: () => void, options: Partial<EnhancedToastOptions> = {}) => {
    return enhancedToast.error("Your session has expired. Please log in again.", {
      title: "Authentication Required",
      action: onLogin ? {
        label: "Log In",
        onClick: onLogin
      } : undefined,
      duration: 8000,
      ...options
    });
  },

  // Server error toast with retry
  serverError: (onRetry?: () => void, options: Partial<EnhancedToastOptions> = {}) => {
    return enhancedToast.error("Something went wrong on our end. Please try again in a moment.", {
      title: "Server Error",
      action: onRetry ? {
        label: "Retry",
        onClick: onRetry
      } : undefined,
      duration: 6000,
      ...options
    });
  },

  // Form submission success
  formSuccess: (message: string = "Your information has been saved successfully.", options: Partial<EnhancedToastOptions> = {}) => {
    return enhancedToast.success(message, {
      title: "Saved",
      duration: 3000,
      ...options
    });
  },

  // Form submission error
  formError: (error: string | EnhancedError, onRetry?: () => void, options: Partial<EnhancedToastOptions> = {}) => {
    const action = onRetry ? {
      label: "Retry",
      onClick: onRetry
    } : undefined;

    return enhancedToast.error(error, {
      action,
      duration: 6000,
      ...options
    });
  },

  // Upload progress toast
  uploadProgress: (progress: number, fileName?: string, options: Partial<EnhancedToastOptions> = {}) => {
    const message = fileName 
      ? `Uploading ${fileName}... ${Math.round(progress)}%`
      : `Uploading... ${Math.round(progress)}%`;

    return enhancedToast.loading(message, {
      title: "Upload in Progress",
      duration: Infinity,
      ...options
    });
  },

  // Upload success
  uploadSuccess: (fileName?: string, options: Partial<EnhancedToastOptions> = {}) => {
    const message = fileName 
      ? `${fileName} uploaded successfully`
      : "Upload completed successfully";

    return enhancedToast.success(message, {
      title: "Upload Complete",
      duration: 3000,
      ...options
    });
  },

  // Upload error
  uploadError: (fileName?: string, onRetry?: () => void, options: Partial<EnhancedToastOptions> = {}) => {
    const message = fileName 
      ? `Failed to upload ${fileName}`
      : "Upload failed";

    return enhancedToast.error(message, {
      title: "Upload Failed",
      action: onRetry ? {
        label: "Retry",
        onClick: onRetry
      } : undefined,
      duration: 6000,
      ...options
    });
  }
};

// Toast queue management for preventing spam
class ToastQueue {
  private queue: Array<{ id: string; timestamp: number }> = [];
  private readonly maxToasts = 3;
  private readonly minInterval = 1000; // 1 second between similar toasts

  canShow(message: string): boolean {
    const now = Date.now();
    const messageId = this.hashMessage(message);
    
    // Remove old toasts from queue
    this.queue = this.queue.filter(item => now - item.timestamp < 5000);
    
    // Check if we have too many toasts
    if (this.queue.length >= this.maxToasts) {
      return false;
    }
    
    // Check if similar message was shown recently
    const recentSimilar = this.queue.find(item => 
      item.id === messageId && now - item.timestamp < this.minInterval
    );
    
    if (recentSimilar) {
      return false;
    }
    
    // Add to queue
    this.queue.push({ id: messageId, timestamp: now });
    return true;
  }

  private hashMessage(message: string): string {
    // Simple hash function for message deduplication
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}

const toastQueue = new ToastQueue();

// Wrapper to prevent toast spam
export const toast = {
  ...enhancedToast,
  
  // Override methods to include queue management
  success: (message: string, options: Partial<EnhancedToastOptions> = {}) => {
    if (toastQueue.canShow(message)) {
      return enhancedToast.success(message, options);
    }
  },
  
  error: (error: string | EnhancedError, options: Partial<EnhancedToastOptions> = {}) => {
    const message = typeof error === 'string' ? error : error.userMessage;
    if (toastQueue.canShow(message)) {
      return enhancedToast.error(error, options);
    }
  },
  
  warning: (message: string, options: Partial<EnhancedToastOptions> = {}) => {
    if (toastQueue.canShow(message)) {
      return enhancedToast.warning(message, options);
    }
  },
  
  info: (message: string, options: Partial<EnhancedToastOptions> = {}) => {
    if (toastQueue.canShow(message)) {
      return enhancedToast.info(message, options);
    }
  }
};

// Export the enhanced toast as default
export default toast;