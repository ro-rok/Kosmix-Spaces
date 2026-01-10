/**
 * Enhanced button component with loading states and progress indicators
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";

const loadingButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground hover:bg-success/90",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Loading state types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof loadingButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingState?: LoadingState;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  progress?: number;
  showProgress?: boolean;
  onRetry?: () => void;
  retryText?: string;
  preventDoubleClick?: boolean;
  debounceMs?: number;
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    loadingState = 'idle',
    loadingText = "Loading...",
    successText = "Success!",
    errorText = "Error",
    progress,
    showProgress = false,
    onRetry,
    retryText = "Retry",
    preventDoubleClick = true,
    debounceMs = 300,
    children,
    onClick,
    disabled,
    ...props
  }, ref) => {
    const [isDebouncing, setIsDebouncing] = React.useState(false);
    const [internalLoadingState, setInternalLoadingState] = React.useState<LoadingState>('idle');
    const debounceTimeoutRef = React.useRef<NodeJS.Timeout>();
    
    // Use external loading state if provided, otherwise use internal
    const currentState = loadingState !== 'idle' ? loadingState : 
                        (loading ? 'loading' : internalLoadingState);
    
    const isLoading = currentState === 'loading' || loading;
    const isSuccess = currentState === 'success';
    const isError = currentState === 'error';
    const isDisabled = disabled || isLoading || isDebouncing;

    // Handle click with debouncing and double-click prevention
    const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled || !onClick) return;

      // Handle retry for error state
      if (isError && onRetry) {
        onRetry();
        return;
      }

      // Prevent double clicks
      if (preventDoubleClick && isDebouncing) {
        event.preventDefault();
        return;
      }

      // Set debouncing state
      if (preventDoubleClick) {
        setIsDebouncing(true);
        debounceTimeoutRef.current = setTimeout(() => {
          setIsDebouncing(false);
        }, debounceMs);
      }

      // Call original onClick
      onClick(event);
    }, [onClick, isDisabled, isError, onRetry, preventDoubleClick, isDebouncing, debounceMs]);

    // Cleanup timeout on unmount
    React.useEffect(() => {
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      };
    }, []);

    // Get button content based on state
    const getButtonContent = () => {
      if (isLoading) {
        return (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{loadingText}</span>
            {showProgress && typeof progress === 'number' && (
              <span className="text-xs opacity-75">({Math.round(progress)}%)</span>
            )}
          </div>
        );
      }

      if (isSuccess) {
        return (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successText}</span>
          </div>
        );
      }

      if (isError) {
        return (
          <div className="flex items-center gap-2">
            {onRetry ? (
              <>
                <RotateCcw className="h-4 w-4" />
                <span>{retryText}</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                <span>{errorText}</span>
              </>
            )}
          </div>
        );
      }

      return children;
    };

    // Get variant based on state
    const getVariant = () => {
      if (isSuccess) return 'success';
      if (isError) return onRetry ? 'warning' : 'destructive';
      return variant;
    };

    const Comp = asChild ? Slot : "button";
    
    return (
      <div className="relative">
        <Comp
          className={cn(loadingButtonVariants({ variant: getVariant(), size, className }))}
          ref={ref}
          onClick={handleClick}
          disabled={isDisabled}
          {...props}
        >
          {getButtonContent()}
        </Comp>
        
        {/* Progress bar overlay */}
        {showProgress && typeof progress === 'number' && isLoading && (
          <div className="absolute bottom-0 left-0 h-1 bg-primary/20 rounded-b-md overflow-hidden w-full">
            <div 
              className="h-full bg-primary-foreground/50 transition-all duration-300 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        )}
      </div>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export { LoadingButton, loadingButtonVariants };

// Hook for managing button loading states
export function useButtonLoadingState(initialState: LoadingState = 'idle') {
  const [state, setState] = React.useState<LoadingState>(initialState);
  const [progress, setProgress] = React.useState(0);

  const setLoading = React.useCallback((progress?: number) => {
    setState('loading');
    if (typeof progress === 'number') {
      setProgress(progress);
    }
  }, []);

  const setSuccess = React.useCallback((autoReset = true, resetDelay = 2000) => {
    setState('success');
    setProgress(100);
    
    if (autoReset) {
      setTimeout(() => {
        setState('idle');
        setProgress(0);
      }, resetDelay);
    }
  }, []);

  const setError = React.useCallback((autoReset = false, resetDelay = 3000) => {
    setState('error');
    setProgress(0);
    
    if (autoReset) {
      setTimeout(() => {
        setState('idle');
      }, resetDelay);
    }
  }, []);

  const reset = React.useCallback(() => {
    setState('idle');
    setProgress(0);
  }, []);

  const updateProgress = React.useCallback((value: number) => {
    setProgress(Math.max(0, Math.min(100, value)));
  }, []);

  return {
    state,
    progress,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    isIdle: state === 'idle',
    setLoading,
    setSuccess,
    setError,
    reset,
    updateProgress,
  };
}