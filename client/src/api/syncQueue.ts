import { Inspection } from '../types';
import { api } from './client';

const QUEUE_STORAGE_KEY = 'arvind_offline_sync_queue';
const SIMULATED_OFFLINE_KEY = 'arvind_simulated_offline';

export interface QueuedItem {
  queueId: string;
  type: 'CREATE_INSPECTION' | 'RESOLVE_INSPECTION';
  timestamp: string;
  data: any;
}

type SyncListener = (isOnline: boolean, pendingCount: number, syncing: boolean) => void;
const listeners = new Set<SyncListener>();

class SyncQueueManager {
  private isSimulatedOffline: boolean = false;
  private isSyncing: boolean = false;

  constructor() {
    this.isSimulatedOffline = localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange());
      window.addEventListener('offline', () => this.handleNetworkChange());
    }
  }

  public subscribe(listener: SyncListener) {
    listeners.add(listener);
    listener(this.isOnline(), this.getPendingCount(), this.isSyncing);
    return () => {
      listeners.delete(listener);
    };
  }

  private notify() {
    const online = this.isOnline();
    const count = this.getPendingCount();
    listeners.forEach(cb => cb(online, count, this.isSyncing));
  }

  public isOnline(): boolean {
    if (this.isSimulatedOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public setSimulatedOffline(value: boolean) {
    this.isSimulatedOffline = value;
    localStorage.setItem(SIMULATED_OFFLINE_KEY, String(value));
    this.notify();
    if (!value && typeof navigator !== 'undefined' && navigator.onLine) {
      this.syncNow();
    }
  }

  public getSimulatedOffline(): boolean {
    return this.isSimulatedOffline;
  }

  private handleNetworkChange() {
    this.notify();
    if (this.isOnline()) {
      this.syncNow();
    }
  }

  public getQueue(): QueuedItem[] {
    try {
      const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: QueuedItem[]) {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    this.notify();
  }

  public getPendingCount(): number {
    return this.getQueue().length;
  }

  public enqueueCreate(inspectionData: Partial<Inspection>): Inspection {
    const queueId = `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const syncId = inspectionData.client_sync_id || `offline-sync-${Date.now()}`;
    const now = new Date().toISOString();

    const localInspection: Inspection = {
      id: `LOCAL-${Date.now().toString().slice(-6)}`,
      date: inspectionData.date || now,
      plant: inspectionData.plant || 'Plant Floor',
      machine_id: inspectionData.machine_id || '',
      defect_type: inspectionData.defect_type || 'Other',
      severity: inspectionData.severity || 'Minor',
      status: 'Open',
      remarks: inspectionData.remarks || '',
      photo_url: inspectionData.photo_url || null,
      source: 'OFFLINE_SYNC',
      logged_by: inspectionData.logged_by || 'Shop-Floor Supervisor (Offline)',
      client_sync_id: syncId,
      created_at: now,
      updated_at: now,
      isPendingSync: true,
    };

    const queue = this.getQueue();
    queue.push({
      queueId,
      type: 'CREATE_INSPECTION',
      timestamp: now,
      data: localInspection,
    });

    this.saveQueue(queue);
    return localInspection;
  }

  public enqueueResolve(inspectionId: string, resolution_note: string, resolved_by?: string) {
    const queueId = `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const queue = this.getQueue();
    queue.push({
      queueId,
      type: 'RESOLVE_INSPECTION',
      timestamp: now,
      data: {
        action: 'resolve',
        id: inspectionId,
        resolution_note,
        resolved_by: resolved_by || 'Shop-Floor Supervisor (Offline)',
        resolved_at: now,
      },
    });

    this.saveQueue(queue);
  }

  public async syncNow(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    if (this.isSyncing) return { success: false, syncedCount: 0 };
    if (!this.isOnline()) return { success: false, syncedCount: 0, error: 'Cannot sync while offline' };

    const queue = this.getQueue();
    if (queue.length === 0) return { success: true, syncedCount: 0 };

    this.isSyncing = true;
    this.notify();

    try {
      // Map items for batch-sync endpoint
      const payloadItems = queue.map(q => q.data);
      const res = await api.batchSync(payloadItems);

      // On successful sync, clear queue
      localStorage.removeItem(QUEUE_STORAGE_KEY);
      this.isSyncing = false;
      this.notify();

      return {
        success: true,
        syncedCount: res.syncedCount || payloadItems.length,
      };
    } catch (err: any) {
      console.error('Offline sync failed:', err);
      this.isSyncing = false;
      this.notify();
      return {
        success: false,
        syncedCount: 0,
        error: err.message || 'Sync failed',
      };
    }
  }
}

export const syncQueue = new SyncQueueManager();

