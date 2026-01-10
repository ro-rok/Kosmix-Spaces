import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { LazyImageLoader } from '@/lib/performance';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
  containerClassName?: string;
  showPlaceholder?: boolean;
  aspectRatio?: string;
}

const lazyLoader = new LazyImageLoader({
  threshold: 0.1,
  rootMargin: '50px'
});

export function LazyImage({
  src,
  alt,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y0ZjRmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNHB4Ij5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==',
  fallback,
  threshold,
  rootMargin,
  onLoad,
  onError,
  className,
  containerClassName,
  showPlaceholder = true,
  aspectRatio,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // Set up intersection observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(img);
          }
        });
      },
      {
        threshold: threshold || 0.1,
        rootMargin: rootMargin || '50px'
      }
    );

    observer.observe(img);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  useEffect(() => {
    if (isInView && !isLoaded && !hasError) {
      const img = imgRef.current;
      if (img) {
        // Set data-src for lazy loading
        img.dataset.src = src;
        lazyLoader.observe(img);
      }
    }
  }, [isInView, src, isLoaded, hasError]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const shouldShowPlaceholder = showPlaceholder && !isLoaded && !hasError;
  const shouldShowFallback = hasError && fallback;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        aspectRatio && `aspect-[${aspectRatio}]`,
        containerClassName
      )}
    >
      {/* Placeholder */}
      {shouldShowPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={placeholder}
            alt=""
            className="w-full h-full object-cover opacity-50"
            aria-hidden="true"
          />
        </div>
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={isInView ? src : placeholder}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          hasError && 'hidden',
          className
        )}
        loading="lazy"
        decoding="async"
        {...props}
      />

      {/* Fallback image */}
      {shouldShowFallback && (
        <img
          src={fallback}
          alt={alt}
          className={cn('w-full h-full object-cover', className)}
          {...props}
        />
      )}

      {/* Loading shimmer effect */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50 animate-pulse" />
      )}
    </div>
  );
}

// Responsive image component with multiple sources
interface ResponsiveImageProps extends LazyImageProps {
  sources: Array<{
    srcSet: string;
    media?: string;
    type?: string;
  }>;
}

export function ResponsiveImage({
  sources,
  src,
  alt,
  className,
  containerClassName,
  ...props
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      <picture>
        {sources.map((source, index) => (
          <source
            key={index}
            srcSet={source.srcSet}
            media={source.media}
            type={source.type}
          />
        ))}
        <LazyImage
          src={src}
          alt={alt}
          className={className}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          {...props}
        />
      </picture>
    </div>
  );
}

// Image gallery with lazy loading and progressive enhancement
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    thumbnail?: string;
    caption?: string;
  }>;
  className?: string;
  itemClassName?: string;
  aspectRatio?: string;
  columns?: number;
  gap?: string;
}

export function LazyImageGallery({
  images,
  className,
  itemClassName,
  aspectRatio = '4/3',
  columns = 3,
  gap = '4'
}: ImageGalleryProps) {
  return (
    <div
      className={cn(
        'grid',
        `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns}`,
        `gap-${gap}`,
        className
      )}
    >
      {images.map((image, index) => (
        <div key={index} className={cn('group', itemClassName)}>
          <LazyImage
            src={image.src}
            alt={image.alt}
            aspectRatio={aspectRatio}
            className="group-hover:scale-105 transition-transform duration-300"
            placeholder={image.thumbnail}
          />
          {image.caption && (
            <p className="mt-2 text-sm text-muted-foreground">
              {image.caption}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// Hero image with progressive enhancement
interface HeroImageProps extends LazyImageProps {
  priority?: boolean;
  sizes?: string;
}

export function HeroImage({
  priority = false,
  sizes = '100vw',
  className,
  ...props
}: HeroImageProps) {
  if (priority) {
    // For above-the-fold images, load immediately
    return (
      <img
        {...props}
        className={cn('w-full h-full object-cover', className)}
        loading="eager"
        decoding="sync"
        sizes={sizes}
      />
    );
  }

  return (
    <LazyImage
      {...props}
      className={className}
    />
  );
}