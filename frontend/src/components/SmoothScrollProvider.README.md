# SmoothScrollProvider

A React component that provides smooth scrolling functionality using the Lenis library, integrated with the animation system.

## Features

- **Smooth momentum-based scrolling** using Lenis
- **Automatic initialization and cleanup** with proper error handling
- **Integration with AnimationContext** for global configuration
- **Accessibility support** with reduced motion detection
- **Performance optimization** with page visibility handling
- **Fallback to native scrolling** when smooth scrolling fails

## Usage

### Basic Setup

```tsx
import { AnimationProvider } from '../lib/animation';
import { SmoothScrollProvider } from './SmoothScrollProvider';

function App() {
  return (
    <AnimationProvider>
      <SmoothScrollProvider>
        <YourAppContent />
      </SmoothScrollProvider>
    </AnimationProvider>
  );
}
```

### With Custom Options

```tsx
import { SmoothScrollProvider } from './SmoothScrollProvider';

function App() {
  return (
    <SmoothScrollProvider
      options={{
        lerp: 0.1,
        duration: 1.2,
        touchMultiplier: 2,
      }}
      className="custom-scroll-wrapper"
    >
      <YourAppContent />
    </SmoothScrollProvider>
  );
}
```

### Using the Scroll Hook

```tsx
import { useSmoothScroll } from './SmoothScrollProvider';

function NavigationComponent() {
  const { scrollTo, isEnabled } = useSmoothScroll();

  return (
    <nav>
      <button onClick={() => scrollTo('#section1')}>
        Go to Section 1
      </button>
      <button onClick={() => scrollTo(0)}>
        Back to Top
      </button>
      <button onClick={() => scrollTo(document.getElementById('footer'))}>
        Go to Footer
      </button>
    </nav>
  );
}
```

## Props

### SmoothScrollProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | The content to wrap with smooth scrolling |
| `options` | `Partial<LenisOptions>` | `{}` | Custom Lenis configuration options |
| `className` | `string` | - | CSS class for the wrapper element |
| `wrapper` | `HTMLElement` | - | Custom wrapper element (optional) |
| `content` | `HTMLElement` | - | Custom content element (optional) |

### Lenis Options

The `options` prop accepts any valid Lenis configuration:

```tsx
interface LenisOptions {
  lerp?: number;              // Linear interpolation factor (0-1)
  duration?: number;          // Scroll duration multiplier
  orientation?: 'vertical' | 'horizontal';
  gestureOrientation?: 'vertical' | 'horizontal' | 'both';
  smoothWheel?: boolean;      // Enable smooth wheel scrolling
  touchMultiplier?: number;   // Touch scroll sensitivity
  normalizeWheel?: boolean;   // Normalize wheel delta
  syncTouch?: boolean;        // Sync touch scrolling
}
```

## Integration with Animation System

The SmoothScrollProvider automatically integrates with the AnimationContext:

- **Respects reduced motion preferences** - disables smooth scrolling when `prefers-reduced-motion` is set
- **Uses global animation configuration** - inherits settings from AnimationProvider
- **Provides Lenis instance** to the animation context for other components to use
- **Handles performance settings** - adjusts behavior based on device capabilities

## Error Handling

The component includes comprehensive error handling:

- **Initialization failures** - falls back to native scrolling and updates configuration
- **Runtime errors** - gracefully degrades to basic scrolling functionality
- **Page visibility changes** - pauses/resumes scrolling to conserve resources
- **Cleanup on unmount** - properly destroys Lenis instance and cancels animation frames

## Accessibility

- **Reduced motion support** - automatically disables smooth scrolling when user prefers reduced motion
- **Keyboard navigation** - preserves native keyboard scrolling behavior
- **Screen reader compatibility** - maintains semantic scrolling for assistive technologies
- **Focus management** - doesn't interfere with focus-based navigation

## Performance

- **Automatic resource management** - cleans up animation frames and event listeners
- **Page visibility handling** - pauses animations when page is hidden
- **Debounced resize handling** - optimizes performance during window resizing
- **Memory leak prevention** - proper cleanup of all resources

## Browser Support

- Modern browsers with ES6+ support
- Graceful degradation for older browsers
- Mobile and touch device support
- High DPI display optimization

## Demo

See `SmoothScrollDemo.tsx` for a complete working example with navigation and multiple sections.