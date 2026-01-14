import { createContext, useContext, ReactNode } from 'react';
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
        minDistance: touchGestures.config.minDistance,
        maxDuration: touchGestures.config.maxDuration,
        requiredFingers: touchGestures.config.requiredFingers,
        enableNavigation: enableTouchGestures,
        sensitivity: touchGestures.config.velocityThreshold,
      },
    },
  };

  return (
    <GestureContext.Provider value={contextValue}>
      {children}
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