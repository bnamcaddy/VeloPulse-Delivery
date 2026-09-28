import React, { useState, useEffect } from 'react';
import { SyncAction } from '../types';
import { StorageService, SoundEffects } from '../services/storageService';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';

interface OfflineSyncEngineProps {
  onSyncCompleted: () => void;
}

export const OfflineSyncEngine: React.FC<OfflineSyncEngineProps> = ({ onSyncCompleted }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);
  const [pendingQueue, setPendingQueue] = useState<SyncAction[]>(StorageService.getSyncQueue());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Monitor real network changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerAutoSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      SoundEffects.playAlertTone();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check on local sync queue
    const interval = setInterval(() => {
      const q = StorageService.getSyncQueue().filter(item => !item.synced);
      setPendingQueue(q);
    }, 1500);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const effectiveOnline = isOnline && !simulatedOffline;

  const triggerAutoSync = () => {
    if (pendingQueue.length === 0) return;
    performSync();
  };

  const performSync = () => {
    setIsSyncing(true);
    SoundEffects.playNotificationTone();

    setTimeout(() => {
      // Mark all items as synced in storage
      const queue = StorageService.getSyncQueue();
      queue.forEach(item => { item.synced = true; });
      StorageService.saveSyncQueue([]);
      setPendingQueue([]);
      setIsSyncing(false);
      SoundEffects.playSuccessChime();
      setSyncFeedback(`Successfully synced ${queue.length} offline operations to cloud depot.`);
      onSyncCompleted();
      setTimeout(() => setSyncFeedback(null), 3000);
    }, 1000);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Network Status Pill */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors ${
        effectiveOnline
          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 animate-pulse'
      }`}>
        {effectiveOnline ? (
          <Wifi className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-rose-500" />
        )}
        <span className="hidden sm:inline font-sans">
          {effectiveOnline ? 'Cloud Synced' : 'Offline Mode (Local Storage)'}
        </span>
      </div>

      {/* Pending Queue Count & Sync Trigger */}
      {pendingQueue.length > 0 && (
        <button
          onClick={performSync}
          disabled={!effectiveOnline || isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors shadow-sm"
          title="Sync offline queue now"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>Sync ({pendingQueue.length})</span>
        </button>
      )}

      {/* Simulated Offline Toggle for Testing */}
      <button
        onClick={() => setSimulatedOffline(!simulatedOffline)}
        className="text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 underline"
        title="Toggle simulated elevator / underground offline state"
      >
        {simulatedOffline ? 'Restore Network' : 'Test Offline'}
      </button>

      {/* Sync toast notification */}
      {syncFeedback && (
        <div className="fixed bottom-4 right-4 z-50 p-3 rounded-xl bg-emerald-600 text-white text-xs font-medium shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{syncFeedback}</span>
        </div>
      )}
    </div>
  );
};
