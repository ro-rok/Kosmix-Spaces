import React, { createContext, useContext, ReactNode } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTouchGestures } from '@/hooks/useTouchGestures';

interface GestureContextType {
  keyboardShortcuts: {
    shortcuts: Record<string, string | null>;
  };
  touchGestures: {
    isGestureActive: boolean;
    config: {
      minDistance: number;
      maxDuration: number;
      requiredFingers: number;
      enableNavigation: boolean;
      sensitivity: number;
    };
  };
}

const GestureContext = createContext<GestureContextType | undefined>(undefined);

interface GestureProviderProps {
  children: ReactNode;
  enableKeyboardShortcuts?: boolean;
  enableTouchGestures?: boolean;
  enableDebugMode?: boolean;
}

export function GestureProvider({ 
  children, 
  enableKeyboardShortcuts = true,
  enableTouchGestures = true,
  enableDebugMode = false 
}: GestureProviderProps) {
  const keyboardShortcuts = useKeyboardShortcuts({
    enableAdminShortcut: enableKeyboardShortcuts,
    enableDebugShortcuts: enableDebugMode,
  });

  const touchGestures = useTouchGestures({
    minDistance: 100,
    maxDuration: 1000,
    requiredFingers: 3,
    enableNavigation: enableTouchGestures,
    enableDebug: enableDebugMode,
  });

  const contextValue: GestureContextType = {
    keyboardShortcuts,
    touchGestures: {
      isGestureActive: touchGestures.isGestureActive,
      config: {
        ...touchGestures.config,
        enableNavigation: enableTouchGestures,
      },
    },
  };

  return (
    <GestureContext.Provider value={contextValue}>
      {children}
      
      {/* Debug overlay */}
      {enableDebugMode && (
        <div className="fixed bottom-4 left-4 z-50 bg-black/80 text-white p-3 rounded-lg text-xs font-mono max-w-xs">
          <div className="mb-2 font-semibold">Gesture Debug</div>
          <div>Keyboard Shortcuts:</div>
          <ul className="ml-2 mb-2">
            {Object.entries(keyboardShortcuts.shortcuts).map(([key, shortcut]) => (
              shortcut && <li key={key}>{key}: {shortcut}</li>
            ))}
          </ul>
          <div>Touch Gestures:</div>
          <ul className="ml-2">
            <li>3-finger swipe enabled</li>
            <li>Active: {touchGestures.isGestureActive ? 'Yes' : 'No'}</li>
            <li>Min distance: {touchGestures.config.minDistance}px</li>
          </ul>
        </div>
      )}
    </GestureContext.Provider>
  );
}

export function useGestures() {
  const context = useContext(GestureContext);
  if (context === undefined) {
    throw new Error('useGestures must be used within a GestureProvider');
  }
  return context;
}

// Individual hooks for specific gesture types
export function useKeyboardShortcutsContext() {
  const context = useGestures();
  return context.keyboardShortcuts;
}

export function useTouchGesturesContext() {
  const context = useGestures();
  return context.touchGestures;
}