import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export function ConnectionStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await api.healthCheck();
        setStatus('connected');
        setError('');
      } catch (err) {
        setStatus('disconnected');
        setError(err instanceof Error ? err.message : 'Connection failed');
      }
    };

    // Initial check
    checkConnection();
    
    // Only poll when disconnected, and reduce frequency
    let interval: NodeJS.Timeout;
    if (status === 'disconnected') {
      // Check every 5 minutes when disconnected
      interval = setInterval(checkConnection, 300000);
    } else if (status === 'checking') {
      // Check every 30 seconds when initially checking
      interval = setInterval(checkConnection, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  if (status === 'connected') {
    return null; // Don't show anything when connected
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className={`rounded-lg border p-3 shadow-lg ${
        status === 'checking' 
          ? 'border-blue-200 bg-blue-50' 
          : 'border-red-200 bg-red-50'
      }`}>
        <div className="flex items-center gap-2">
          {status === 'checking' ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <div>
            <p className={`text-sm font-medium ${
              status === 'checking' ? 'text-blue-800' : 'text-red-800'
            }`}>
              {status === 'checking' ? 'Connecting to server...' : 'Server disconnected'}
            </p>
            {error && (
              <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}