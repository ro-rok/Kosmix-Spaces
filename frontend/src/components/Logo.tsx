import React, { useState } from 'react';
import { getLogoSrc, LOGO_ASSETS } from '@/lib/assets';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** Size of the logo */
  size?: 'small' | 'medium' | 'large';
  /** Custom className */
  className?: string;
  /** Alt text for the logo */
  alt?: string;
  /** Whether to show fallback text if image fails */
  showFallbackText?: boolean;
}

const sizeClasses = {
  small: 'h-5 w-5',
  medium: 'h-8 w-8',
  large: 'h-12 w-12'
};

export function Logo({ 
  size = 'small', 
  className, 
  alt = 'Kosmix Spaces',
  showFallbackText = false 
}: LogoProps) {
  const [currentSrc, setCurrentSrc] = useState(getLogoSrc(size));
  const [hasError, setHasError] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  const fallbackSources = [
    LOGO_ASSETS.favicon32,
    LOGO_ASSETS.logo,
    LOGO_ASSETS.faviconIco,
    LOGO_ASSETS.appleTouchIcon
  ];

  const handleError = () => {
    const nextIndex = fallbackIndex + 1;
    if (nextIndex < fallbackSources.length) {
      setCurrentSrc(fallbackSources[nextIndex]);
      setFallbackIndex(nextIndex);
    } else {
      setHasError(true);
    }
  };

  const handleLoad = () => {
    setHasError(false);
  };

  if (hasError) {
    if (showFallbackText) {
      return (
        <div className={cn(
          'flex items-center justify-center bg-primary text-primary-foreground rounded font-bold text-xs',
          sizeClasses[size],
          className
        )}>
          KS
        </div>
      );
    }
    return null;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={cn(sizeClasses[size], className)}
      onError={handleError}
      onLoad={handleLoad}
      loading="eager"
    />
  );
}