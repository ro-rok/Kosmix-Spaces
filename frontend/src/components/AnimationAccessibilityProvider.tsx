import React, { useEffect, useState, useCallback } from 'react';
import { useAnimation } from '../contexts/AnimationContext';
import { 
  getGlobalAccessibilityManager, 
  cleanupGlobalAccessibilityManager,
  generateReducedMotionCSS,
  type AccessibilityPreferences 
} from '../lib/animation-accessibility';
import { 
  getGlobalAnimationErrorHandler, 
  cleanupGlobalAnimationErrorHandler,
  type ErrorRecoveryStrategy 
} from '../lib/animation-error-handling';

// Import the accessibility CSS
import '../styles/animation-accessibility.css';

interface AnimationAccessibilityProviderProps {
  children: React.ReactNode;
  /**
   * Custom error recovery strategy
   */
  errorRecoveryStrategy?: Partial<ErrorRecoveryStrategy>;
  /**
   * Enable development mode features
   */
  developmentMode?: boolean;
  /**
   * Enable accessibility testing mode
   */
  testingMode?: boolean;
  /**
   * Custom CSS injection for accessibility
   */
  customAccessibilityCSS?: string;
}

/**
 * Provider component that sets up comprehensive animation accessibility features
 * This should wrap your entire application or the parts that use animations
 */
export function AnimationAccessibilityProvider({
  children,
  errorRecoveryStrategy = {},
  developmentMode = process.env.NODE_ENV === 'development',
  testingMode = false,
  customAccessibilityCSS,
}: AnimationAccessibilityProviderProps) {
  const { config, updateConfig } = useAnimation();
  const [isInitialized, setIsInitialized] = useState(false);
  const [accessibilityPreferences, setAccessibilityPreferences] = useState<AccessibilityPreferences | null>(null);

  // Initialize accessibility systems
  useEffect(() => {
    // Set up global accessibility manager
    const accessibilityManager = getGlobalAccessibilityManager();

    // Set up global error handler
    const errorHandler = getGlobalAnimationErrorHandler({
      fallbackToCSS: true,
      disableAnimations: false,
      retryAttempts: 3,
      reportError: developmentMode,
      gracefulDegradation: true,
      ...errorRecoveryStrategy,
    });

    // Get initial preferences
    const initialPreferences = accessibilityManager.getPreferences();
    setAccessibilityPreferences(initialPreferences);

    // Subscribe to preference changes
    const unsubscribe = accessibilityManager.subscribe((preferences) => {
      setAccessibilityPreferences(preferences);
      
      // Auto-update animation config based on preferences
      if (preferences.reducedMotion && config.accessibility.respectReducedMotion) {
        updateConfig({
          smoothScroll: { 
            ...config.smoothScroll,
            enabled: false 
          },
          scrollAnimations: { 
            ...config.scrollAnimations,
            enabled: false 
          },
          microInteractions: { 
            ...config.microInteractions,
            enabled: false 
          },
          transitions: {
            ...config.transitions,
            defaultDuration: config.accessibility.fallbackToInstant ? 0 : 0.1,
          },
        });
      }
    });

    // Inject reduced motion CSS
    const reducedMotionCSS = generateReducedMotionCSS();
    injectCSS(reducedMotionCSS, 'reduced-motion-styles');

    // Inject custom accessibility CSS if provided
    if (customAccessibilityCSS) {
      injectCSS(customAccessibilityCSS, 'custom-accessibility-styles');
    }

    // Add body classes based on preferences
    updateBodyClasses(initialPreferences);

    setIsInitialized(true);

    // Cleanup function
    return () => {
      unsubscribe();
      cleanupGlobalAccessibilityManager();
      cleanupGlobalAnimationErrorHandler();
      removeInjectedCSS(['reduced-motion-styles', 'custom-accessibility-styles']);
    };
  }, [config.accessibility, updateConfig, errorRecoveryStrategy, developmentMode, customAccessibilityCSS]);

  // Update body classes when preferences change
  useEffect(() => {
    if (accessibilityPreferences) {
      updateBodyClasses(accessibilityPreferences);
    }
  }, [accessibilityPreferences]);

  // Add testing mode classes
  useEffect(() => {
    if (testingMode) {
      document.body.classList.add('a11y-test-mode');
    } else {
      document.body.classList.remove('a11y-test-mode');
    }

    return () => {
      document.body.classList.remove('a11y-test-mode');
    };
  }, [testingMode]);

  // Handle page visibility changes for performance
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.body.classList.add('page-hidden');
      } else {
        document.body.classList.remove('page-hidden');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Handle keyboard navigation detection
  useEffect(() => {
    let isKeyboardUser = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !isKeyboardUser) {
        isKeyboardUser = true;
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      if (isKeyboardUser) {
        isKeyboardUser = false;
        document.body.classList.remove('keyboard-navigation');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Utility function to inject CSS
  const injectCSS = useCallback((css: string, id: string) => {
    // Remove existing style if present
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }
    
    // Create and inject new style
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }, []);

  // Utility function to remove injected CSS
  const removeInjectedCSS = useCallback((ids: string[]) => {
    ids.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
      }
    });
  }, []);

  // Update body classes based on accessibility preferences
  const updateBodyClasses = useCallback((preferences: AccessibilityPreferences) => {
    // Remove existing accessibility classes
    document.body.classList.remove(
      'reduced-motion',
      'high-contrast',
      'forced-colors',
      'reduced-data',
      'reduced-transparency'
    );

    // Add classes based on current preferences
    if (preferences.reducedMotion) {
      document.body.classList.add('reduced-motion');
    }
    if (preferences.highContrast) {
      document.body.classList.add('high-contrast');
    }
    if (preferences.forcedColors) {
      document.body.classList.add('forced-colors');
    }
    if (preferences.prefersReducedData) {
      document.body.classList.add('reduced-data');
    }
    if (preferences.prefersReducedTransparency) {
      document.body.classList.add('reduced-transparency');
    }
  }, []);

  // Don't render children until accessibility systems are initialized
  if (!isInitialized) {
    return (
      <div className="accessibility-loading">
        <span className="sr-only">Initializing accessibility features...</span>
        {children}
      </div>
    );
  }

  return (
    <>
      {children}
      {/* Hidden live region for animation announcements */}
      <div
        id="animation-announcements"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      {/* Development mode accessibility info */}
      {developmentMode && accessibilityPreferences && (
        <AccessibilityDebugInfo preferences={accessibilityPreferences} />
      )}
    </>
  );
}

// Debug component for development mode
interface AccessibilityDebugInfoProps {
  preferences: AccessibilityPreferences;
}

function AccessibilityDebugInfo({ preferences }: AccessibilityDebugInfoProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 9999,
        maxWidth: '300px',
        display: isVisible ? 'block' : 'none',
      }}
    >
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'absolute',
          top: '-30px',
          right: '0',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '4px 4px 0 0',
          fontSize: '10px',
          cursor: 'pointer',
        }}
      >
        A11Y Debug
      </button>
      <h4 style={{ margin: '0 0 10px 0' }}>Accessibility Status</h4>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        <li>Reduced Motion: {preferences.reducedMotion ? '✅' : '❌'}</li>
        <li>High Contrast: {preferences.highContrast ? '✅' : '❌'}</li>
        <li>Forced Colors: {preferences.forcedColors ? '✅' : '❌'}</li>
        <li>Reduced Data: {preferences.prefersReducedData ? '✅' : '❌'}</li>
        <li>Reduced Transparency: {preferences.prefersReducedTransparency ? '✅' : '❌'}</li>
      </ul>
    </div>
  );
}

// Hook to check if accessibility provider is available
export function useAnimationAccessibilityProvider() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Check if the live region exists (indicates provider is active)
    const liveRegion = document.getElementById('animation-announcements');
    setIsAvailable(!!liveRegion);
  }, []);

  return { isAvailable };
}

export default AnimationAccessibilityProvider;