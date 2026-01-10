import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "dots" | "pulse" | "spinner";
  className?: string;
  text?: string;
}

export function Loading({ size = "md", variant = "default", className, text }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <div className="flex space-x-1">
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        {text && <span className="ml-2 text-sm text-muted-foreground">{text}</span>}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn("bg-primary rounded-full animate-pulse", sizeClasses[size])}></div>
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// Premium loading overlay for full-screen loading
export function LoadingOverlay({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center glass">
      <div className="card-premium p-8 text-center space-y-4 animate-scale-in">
        <Loading size="lg" text={text} />
      </div>
    </div>
  );
}

// Inline loading for content areas
export function InlineLoading({ text, className }: { text?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <Loading text={text} />
    </div>
  );
}

// Button loading state
export function ButtonLoading({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  return <Loader2 className={cn("animate-spin", size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6")} />;
}