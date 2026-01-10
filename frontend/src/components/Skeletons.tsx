import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Enhanced skeleton with shimmer effect
interface PremiumSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "shimmer";
}

export function PremiumSkeleton({ className, variant = "default", ...props }: PremiumSkeletonProps) {
  return (
    <Skeleton
      className={cn(
        variant === "shimmer" && "shimmer bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50",
        className
      )}
      {...props}
    />
  );
}

export function ListingCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("card-premium overflow-hidden", className)}>
      <PremiumSkeleton className="aspect-[16/10] w-full" variant="shimmer" />
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <PremiumSkeleton className="h-6 w-3/4" />
          <PremiumSkeleton className="h-4 w-1/2" />
        </div>
        <div className="flex justify-between items-center">
          <PremiumSkeleton className="h-4 w-20" />
          <div className="flex gap-1">
            <PremiumSkeleton className="h-6 w-16 rounded-full" />
            <PremiumSkeleton className="h-6 w-12 rounded-full" />
          </div>
        </div>
        <div className="flex gap-1">
          <PremiumSkeleton className="h-5 w-14 rounded-full" />
          <PremiumSkeleton className="h-5 w-18 rounded-full" />
          <PremiumSkeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-1">
          <PremiumSkeleton className="h-5 w-24" />
          <PremiumSkeleton className="h-3 w-32" />
        </div>
        <div className="flex gap-2">
          <PremiumSkeleton className="h-9 flex-1 rounded-lg" />
          <PremiumSkeleton className="h-9 flex-1 rounded-lg" />
          <PremiumSkeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ListingGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListingDetailSkeleton() {
  return (
    <div className="pb-24 md:pb-0">
      {/* Breadcrumb skeleton */}
      <div className="border-b border-border bg-muted/30">
        <div className="container py-3">
          <PremiumSkeleton className="h-4 w-48" />
        </div>
      </div>
      
      <div className="container py-6 md:py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Main content */}
          <div className="space-y-8">
            {/* Hero image */}
            <PremiumSkeleton className="aspect-[16/10] w-full rounded-xl" variant="shimmer" />
            
            {/* Title and location */}
            <div className="space-y-3">
              <PremiumSkeleton className="h-8 w-3/4" />
              <PremiumSkeleton className="h-5 w-1/3" />
              <div className="flex gap-2">
                <PremiumSkeleton className="h-6 w-20 rounded-full" />
                <PremiumSkeleton className="h-6 w-24 rounded-full" />
                <PremiumSkeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
            
            {/* Navigation tabs */}
            <div className="flex gap-6 border-b border-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <PremiumSkeleton key={i} className="h-4 w-20 mb-3" />
              ))}
            </div>
            
            {/* Overview section */}
            <div className="space-y-4">
              <PremiumSkeleton className="h-6 w-32" />
              <div className="space-y-2">
                <PremiumSkeleton className="h-4 w-full" />
                <PremiumSkeleton className="h-4 w-5/6" />
                <PremiumSkeleton className="h-4 w-4/6" />
              </div>
            </div>
            
            {/* Offerings section */}
            <div className="space-y-6">
              <PremiumSkeleton className="h-6 w-40" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card-premium p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <PremiumSkeleton className="h-5 w-32" />
                      <PremiumSkeleton className="h-4 w-48" />
                    </div>
                    <PremiumSkeleton className="h-6 w-24" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <PremiumSkeleton key={j} className="aspect-[4/3] rounded-lg" variant="shimmer" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Sticky sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="card-premium p-6 space-y-6">
                <div className="space-y-3">
                  <PremiumSkeleton className="h-6 w-32" />
                  <PremiumSkeleton className="h-8 w-24" />
                  <PremiumSkeleton className="h-4 w-40" />
                </div>
                
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <PremiumSkeleton className="h-4 w-20" />
                      <PremiumSkeleton className="h-10 w-full rounded-lg" />
                    </div>
                  ))}
                </div>
                
                <div className="space-y-3">
                  <PremiumSkeleton className="h-12 w-full rounded-lg" />
                  <div className="flex gap-2">
                    <PremiumSkeleton className="h-10 flex-1 rounded-lg" />
                    <PremiumSkeleton className="h-10 flex-1 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Table skeleton for admin/partner pages with mobile responsiveness
export function TableSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Mobile card view skeleton */}
      <div className="block md:hidden space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="card-premium p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <PremiumSkeleton className="h-5 w-3/4" />
                <PremiumSkeleton className="h-4 w-1/2" />
              </div>
              <PremiumSkeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <PremiumSkeleton className="h-3 w-12" />
                <PremiumSkeleton className="h-4 w-16" />
              </div>
              <div className="space-y-1">
                <PremiumSkeleton className="h-3 w-12" />
                <PremiumSkeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <PremiumSkeleton className="h-8 flex-1 rounded-lg" />
              <PremiumSkeleton className="h-8 flex-1 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Desktop table view skeleton */}
      <div className="hidden md:block card-premium overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <PremiumSkeleton className="h-6 w-48" />
        </div>
        
        {/* Table header */}
        <div className="flex items-center gap-4 p-4 border-b border-border bg-muted/30">
          {Array.from({ length: 6 }).map((_, i) => (
            <PremiumSkeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border">
            {Array.from({ length: 6 }).map((_, j) => (
              <PremiumSkeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Form skeleton with premium styling
export function FormSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("card-premium p-6 space-y-6", className)}>
      <div className="space-y-2">
        <PremiumSkeleton className="h-7 w-48" />
        <PremiumSkeleton className="h-4 w-64" />
      </div>
      
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <PremiumSkeleton className="h-4 w-24" />
            <PremiumSkeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      
      <div className="flex gap-3 pt-4">
        <PremiumSkeleton className="h-10 w-24 rounded-lg" />
        <PremiumSkeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}

// Dashboard skeleton with stats cards
export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <PremiumSkeleton className="h-8 w-64" />
        <PremiumSkeleton className="h-4 w-96" />
      </div>
      
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-premium p-6 space-y-2">
            <PremiumSkeleton className="h-4 w-20" />
            <PremiumSkeleton className="h-8 w-16" />
            <PremiumSkeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      
      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-premium p-6 space-y-4">
          <PremiumSkeleton className="h-6 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <PremiumSkeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <PremiumSkeleton className="h-4 w-3/4" />
                  <PremiumSkeleton className="h-3 w-1/2" />
                </div>
                <PremiumSkeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="card-premium p-6 space-y-4">
          <PremiumSkeleton className="h-6 w-40" />
          <PremiumSkeleton className="h-64 w-full rounded-lg" variant="shimmer" />
        </div>
      </div>
    </div>
  );
}
