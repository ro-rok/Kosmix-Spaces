import React, { useState, useEffect } from 'react';
import { Keyboard, Hand, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTouchGesturesContext, useKeyboardShortcutsContext } from '@/components/GestureProvider';

interface GestureIndicatorProps {
  showOnHover?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export function GestureIndicator({ 
  showOnHover = true, 
  position = 'bottom-right',
  className 
}: GestureIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const touchGestures = useTouchGesturesContext();
  const keyboardShortcuts = useKeyboardShortcutsContext();

  // Show indicator when gesture is active
  useEffect(() => {
    if (touchGestures.isGestureActive) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [touchGestures.isGestureActive]);

  // Show keyboard shortcuts on key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey) {
        setShowKeyboard(true);
        const timer = setTimeout(() => setShowKeyboard(false), 3000);
        return () => clearTimeout(timer);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  if (!isVisible && !showKeyboard && showOnHover) {
    return null;
  }

  return (
    <div 
      className={cn(
        'fixed z-50 pointer-events-none',
        positionClasses[position],
        className
      )}
    >
      {/* Touch Gesture Indicator */}
      {isVisible && (
        <div className="bg-black/80 text-white px-3 py-2 rounded-lg shadow-lg animate-slide-up mb-2">
          <div className="flex items-center gap-2 text-sm">
            <Hand className="h-4 w-4" />
            <span>3-finger gesture detected</span>
          </div>
        </div>
      )}

      {/* Keyboard Shortcut Indicator */}
      {showKeyboard && (
        <div className="bg-black/80 text-white px-3 py-2 rounded-lg shadow-lg animate-slide-up">
          <div className="flex items-center gap-2 text-sm mb-2">
            <Keyboard className="h-4 w-4" />
            <span>Keyboard Shortcuts</span>
          </div>
          <div className="text-xs space-y-1">
            {Object.entries(keyboardShortcuts.shortcuts).map(([key, shortcut]) => (
              shortcut && (
                <div key={key} className="flex justify-between gap-4">
                  <span className="capitalize">{key}:</span>
                  <code className="bg-white/20 px-1 rounded">{shortcut}</code>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Gesture Guide (always visible on hover) */}
      {showOnHover && !isVisible && !showKeyboard && (
        <div 
          className="bg-black/60 text-white px-2 py-1 rounded text-xs opacity-0 hover:opacity-100 transition-opacity duration-300"
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>Gestures</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Floating gesture help component
export function GestureHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-40 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 md:hidden"
        aria-label="Show gesture help"
      >
        <Hand className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Navigation Gestures</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Hand className="h-4 w-4" />
                  3-Finger Touch Swipes
                </h4>
                <ul className="space-y-1 text-muted-foreground ml-6">
                  <li>← Left: Next page</li>
                  <li>→ Right: Previous page</li>
                  <li>↑ Up: Admin portal</li>
                  <li>↓ Down: Partner portal</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Keyboard className="h-4 w-4" />
                  Keyboard Shortcuts
                </h4>
                <ul className="space-y-1 text-muted-foreground ml-6">
                  <li><code className="bg-muted px-1 rounded">Ctrl+Shift+A</code> Admin</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}