import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Factory, ShieldAlert, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { syncQueue } from '../api/syncQueue';

interface HeaderProps {
  onOpenAuthModal?: () => void;
  onRefreshData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuthModal, onRefreshData }) => {
  const { user, demoLogin } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = syncQueue.subscribe((online, count, syncing) => {
      setIsOnline(online);
      setPendingCount(count);
      setIsSyncing(syncing);
    });
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) {
      setSyncToast('Cannot sync while offline. Reconnect first.');
      setTimeout(() => setSyncToast(null), 3000);
      return;
    }
    setIsSyncing(true);
    const res = await syncQueue.syncNow();
    setIsSyncing(false);
    if (res.success) {
      setSyncToast(`Synced ${res.syncedCount} items successfully!`);
      if (onRefreshData) onRefreshData();
    } else {
      setSyncToast(res.error || 'Sync failed');
    }
    setTimeout(() => setSyncToast(null), 3500);
  };

  const toggleSimulateOffline = () => {
    const current = syncQueue.getSimulatedOffline();
    syncQueue.setSimulatedOffline(!current);
    if (current && onRefreshData) {
      setTimeout(onRefreshData, 500);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-arvind-900 text-white shadow-md border-b border-arvind-800 safe-top">
      {/* Sync Toast Alert */}
      {syncToast && (
        <div className="bg-amber-500 text-arvind-950 text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-1.5 animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-5xl mx-auto px-3.5 py-2.5 flex items-center justify-between gap-2">
        {/* Left: Arvind Logo & Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-arvind-950 text-sm shadow-inner shrink-0 tracking-wider">
            A
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-white text-sm xs:text-base">
                ARVIND
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-arvind-800 text-amber-300 px-1.5 py-0.5 rounded border border-arvind-700">
                Quality
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-arvind-200 truncate">
              <Factory className="w-2.5 h-2.5 text-amber-400 shrink-0" />
              <span>Shop Floor</span>
            </div>
          </div>
        </div>

        {/* Right: Offline / Sync & User Switcher */}
        <div className="flex items-center gap-1.5 xs:gap-2 shrink-0">
          {/* Sync & Connectivity Pill */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border transition-all ${
              isOnline
                ? pendingCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
            }`}
            title={
              !isOnline
                ? `Offline (${pendingCount} queued). Tap to test.`
                : pendingCount > 0
                ? `${pendingCount} offline records ready to sync. Tap to sync.`
                : 'Connected to server'
            }
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
            ) : isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            )}
            <span className="text-[11px] hidden xs:inline">
              {isSyncing ? 'Syncing...' : isOnline ? (pendingCount > 0 ? `Sync (${pendingCount})` : 'Online') : `Offline (${pendingCount})`}
            </span>
            {pendingCount > 0 && !isSyncing && (
              <span className="xs:hidden w-4 h-4 bg-amber-400 text-slate-900 rounded-full text-[9px] font-black flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>

          {/* User Profile / Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-1 bg-arvind-800 hover:bg-arvind-700 text-arvind-100 px-2 py-1 rounded-lg border border-arvind-700 transition-colors"
              title="Switch User / Role"
            >
              <div className="w-5 h-5 rounded-full bg-arvind-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                {user?.name ? user.name[0] : 'S'}
              </div>
              <ChevronDown className="w-3 h-3 text-arvind-300" />
            </button>

            {/* User Dropdown */}
            {isUserDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Shop-Floor Supervisor'}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{user?.role || 'supervisor'}</p>
                </div>

                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Demo Persona Switch
                </div>

                <button
                  onClick={() => {
                    demoLogin('supervisor');
                    setIsUserDropdownOpen(false);
                    if (onRefreshData) onRefreshData();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-800">Shop-Floor Supervisor</div>
                    <div className="text-[10px] text-slate-500">Weaving & Finishing Shift</div>
                  </div>
                  {user?.username === 'supervisor' && <Check className="w-3.5 h-3.5 text-arvind-600" />}
                </button>

                <button
                  onClick={() => {
                    demoLogin('manager');
                    setIsUserDropdownOpen(false);
                    if (onRefreshData) onRefreshData();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-800">Quality Manager</div>
                    <div className="text-[10px] text-slate-500">Plant QA Head</div>
                  </div>
                  {user?.username === 'manager' && <Check className="w-3.5 h-3.5 text-arvind-600" />}
                </button>

                <button
                  onClick={() => {
                    demoLogin('admin');
                    setIsUserDropdownOpen(false);
                    if (onRefreshData) onRefreshData();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-800">Plant Admin</div>
                    <div className="text-[10px] text-slate-500">Operations Lead</div>
                  </div>
                  {user?.username === 'admin' && <Check className="w-3.5 h-3.5 text-arvind-600" />}
                </button>

                <div className="border-t border-slate-100 mt-1 pt-1 px-3 py-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600">Simulate Offline</span>
                  <button
                    onClick={toggleSimulateOffline}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
                      syncQueue.getSimulatedOffline()
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {syncQueue.getSimulatedOffline() ? 'OFFLINE ON' : 'TEST OFFLINE'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
