import { Customer, Rider, DeliveryOrder, MaintenanceAlert, ExpenseRecord, SyncAction } from '../types';
import { INITIAL_CUSTOMERS, INITIAL_RIDERS, INITIAL_ORDERS, INITIAL_MAINTENANCE_ALERTS, INITIAL_EXPENSES } from '../data/mockData';

const STORAGE_KEYS = {
  CUSTOMERS: 'velopulse_customers_v1',
  RIDERS: 'velopulse_riders_v1',
  ORDERS: 'velopulse_orders_v1',
  MAINTENANCE: 'velopulse_maintenance_v1',
  EXPENSES: 'velopulse_expenses_v1',
  SYNC_QUEUE: 'velopulse_sync_queue_v1',
  DARK_MODE: 'velopulse_dark_mode_v1',
  CURRENT_ROLE: 'velopulse_current_role_v1',
  ACTIVE_RIDER_ID: 'velopulse_active_rider_id_v1',
};

// Safe JSON parser
function safeGet<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    console.warn(`Storage get error for ${key}:`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Storage set error for ${key}:`, e);
  }
}

export const StorageService = {
  getCustomers(): Customer[] {
    return safeGet<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },
  saveCustomers(customers: Customer[]): void {
    safeSet(STORAGE_KEYS.CUSTOMERS, customers);
  },

  getRiders(): Rider[] {
    return safeGet<Rider[]>(STORAGE_KEYS.RIDERS, INITIAL_RIDERS);
  },
  saveRiders(riders: Rider[]): void {
    safeSet(STORAGE_KEYS.RIDERS, riders);
  },

  getOrders(): DeliveryOrder[] {
    return safeGet<DeliveryOrder[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  },
  saveOrders(orders: DeliveryOrder[]): void {
    safeSet(STORAGE_KEYS.ORDERS, orders);
  },

  getMaintenanceAlerts(): MaintenanceAlert[] {
    return safeGet<MaintenanceAlert[]>(STORAGE_KEYS.MAINTENANCE, INITIAL_MAINTENANCE_ALERTS);
  },
  saveMaintenanceAlerts(alerts: MaintenanceAlert[]): void {
    safeSet(STORAGE_KEYS.MAINTENANCE, alerts);
  },

  getExpenses(): ExpenseRecord[] {
    return safeGet<ExpenseRecord[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  },
  saveExpenses(expenses: ExpenseRecord[]): void {
    safeSet(STORAGE_KEYS.EXPENSES, expenses);
  },

  getSyncQueue(): SyncAction[] {
    return safeGet<SyncAction[]>(STORAGE_KEYS.SYNC_QUEUE, []);
  },
  saveSyncQueue(queue: SyncAction[]): void {
    safeSet(STORAGE_KEYS.SYNC_QUEUE, queue);
  },

  enqueueSync(action: SyncAction['action'], payload: any): SyncAction {
    const queue = this.getSyncQueue();
    const item: SyncAction = {
      id: 'sync-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      action,
      payload,
      timestamp: Date.now(),
      synced: false,
    };
    queue.push(item);
    this.saveSyncQueue(queue);
    return item;
  },

  clearSyncedQueue(): void {
    const queue = this.getSyncQueue().filter(q => !q.synced);
    this.saveSyncQueue(queue);
  },

  resetAllData(): void {
    this.saveCustomers(INITIAL_CUSTOMERS);
    this.saveRiders(INITIAL_RIDERS);
    this.saveOrders(INITIAL_ORDERS);
    this.saveMaintenanceAlerts(INITIAL_MAINTENANCE_ALERTS);
    this.saveExpenses(INITIAL_EXPENSES);
    this.saveSyncQueue([]);
  }
};

// Web Audio synthesizer for crisp operational feedback
export const SoundEffects = {
  playSuccessChime() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.16); // D6
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      
      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // AudioContext may be restricted before interaction
    }
  },

  playNotificationTone() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(740, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  },

  playAlertTone() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(370, now + 0.1);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }
};
