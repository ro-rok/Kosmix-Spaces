import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { showGestureToast, trackGestureAnalytics } from '@/lib/gesture-utils';

interface KeyboardShortcutsConfig {
  enableAdminShortcut?: boolean;
  enableDebugShortcuts?: boolean;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig = {}) {
  const navigate = useNavigate();
  const { enableAdminShortcut = true, enableDebugShortcuts = false } = config;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl + Shift + A - Open Admin
      if (enableAdminShortcut && event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        navigate('/admin/login');
        
        // Show toast notification
        showGestureToast('Opening admin portal');
        
        // Track analytics
        trackGestureAnalytics({
          gestureType: 'keyboard',
          action: 'admin_shortcut',
          success: true,
          timestamp: Date.now(),
        });
        return;
      }

      // Additional debug shortcuts (optional)
      if (enableDebugShortcuts) {
        // Ctrl + Shift + P - Partner Portal
        if (event.ctrlKey && event.shiftKey && event.key === 'P') {
          event.preventDefault();
          navigate('/partner/login');
          showGestureToast('Opening partner portal');
          trackGestureAnalytics({
            gestureType: 'keyboard',
            action: 'partner_shortcut',
            success: true,
            timestamp: Date.now(),
          });
          return;
        }

        // Ctrl + Shift + H - Home
        if (event.ctrlKey && event.shiftKey && event.key === 'H') {
          event.preventDefault();
          navigate('/');
          showGestureToast('Going to home');
          trackGestureAnalytics({
            gestureType: 'keyboard',
            action: 'home_shortcut',
            success: true,
            timestamp: Date.now(),
          });
          return;
        }

        // Ctrl + Shift + E - Explore
        if (event.ctrlKey && event.shiftKey && event.key === 'E') {
          event.preventDefault();
          navigate('/explore');
          showGestureToast('Going to explore');
          trackGestureAnalytics({
            gestureType: 'keyboard',
            action: 'explore_shortcut',
            success: true,
            timestamp: Date.now(),
          });
          return;
        }
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, enableAdminShortcut, enableDebugShortcuts]);

  return {
    shortcuts: {
      admin: enableAdminShortcut ? 'Ctrl + Shift + A' : null,
      ...(enableDebugShortcuts && {
        partner: 'Ctrl + Shift + P',
        home: 'Ctrl + Shift + H',
        explore: 'Ctrl + Shift + E',
      }),
    },
  };
}