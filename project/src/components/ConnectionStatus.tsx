import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { getConnectionState } from '../lib/supabase';

const ConnectionStatus = () => {
  const { isConnected, connectionError } = getConnectionState();

  if (isConnected) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
        {connectionError ? (
          <>
            <AlertCircle className="w-5 h-5" />
            <span>Connection error: Please check your internet connection</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            <span>Connecting to server...</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;