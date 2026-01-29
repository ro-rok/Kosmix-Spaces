import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function SessionExpiryHandler() {
  const { isSessionExpired, refreshSession, logout, userRole } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isSessionExpired) {
      setShowDialog(true);
    }
  }, [isSessionExpired]);

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    try {
      await refreshSession();
      setShowDialog(false);
    } catch (error) {
      // If refresh fails, logout will be handled by the auth context
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    setShowDialog(false);
    logout();
  };

  const getLoginPath = () => {
    return userRole === 'admin' ? '/admin/login' : '/partner/login';
  };

  if (!showDialog) return null;

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expired</AlertDialogTitle>
          <AlertDialogDescription>
            Your session has expired for security reasons. You can try to refresh your session or log in again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshSession}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Session'}
          </Button>
          <AlertDialogAction onClick={handleLogout}>
            Log In Again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}