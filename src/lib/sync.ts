import { supabase } from './supabase';
import { useAppStore } from '../store/useAppStore';
import type { DailyLog, Settings, Split, UserProfile, WeightEntry } from '../types/app';

/**
 * Local-first cloud sync.
 *
 * The whole persisted app-state blob is stored as a single JSON document per
 * user (`user_state.data`), reconciled last-write-wins by `updated_at`. The app
 * stays fully usable offline and logged-out; when signed in and online we pull
 * on login and push (debounced) on every change.
 */

/** The slice of the store we back up — mirrors what Zustand persists locally. */
interface SyncedState {
  settings: Settings;
  splits: Split[];
  logs: Record<string, DailyLog>;
  profile: UserProfile | null;
  weightLog: WeightEntry[];
  notificationsReadAt: number;
}

const SYNCED_KEYS: (keyof SyncedState)[] = [
  'settings',
  'splits',
  'logs',
  'profile',
  'weightLog',
  'notificationsReadAt',
];

const META_KEY = 'workout-sync-meta';
const PUSH_DEBOUNCE_MS = 1500;

let currentUserId: string | null = null;
let unsubscribeStore: (() => void) | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let applyingRemote = false; // suppress the push echo while hydrating from cloud
let pendingPush = false; // a change is waiting to be flushed (e.g. while offline)

/** Snapshot the synced slice of the current store state. */
function snapshot(): SyncedState {
  const s = useAppStore.getState();
  return {
    settings: s.settings,
    splits: s.splits,
    logs: s.logs,
    profile: s.profile,
    weightLog: s.weightLog,
    notificationsReadAt: s.notificationsReadAt,
  };
}

/** ms epoch of this device's last successful sync (pull or push), 0 if never. */
function readSyncedAt(): number {
  const raw = localStorage.getItem(META_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

function writeSyncedAt(ms: number) {
  localStorage.setItem(META_KEY, String(ms));
}

/** Latest `updated_at` this device has synced against, exposed for the UI. */
export function getLastSyncedAt(): number {
  return readSyncedAt();
}

async function pull(userId: string): Promise<{ data: SyncedState; updatedAt: number } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_state')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { data: data.data as SyncedState, updatedAt: Date.parse(data.updated_at) };
}

async function pushNow(userId: string): Promise<void> {
  if (!supabase) return;
  const updatedAtIso = new Date().toISOString();
  const { error } = await supabase
    .from('user_state')
    .upsert({ user_id: userId, data: snapshot(), updated_at: updatedAtIso });
  if (error) throw error;
  writeSyncedAt(Date.parse(updatedAtIso));
  pendingPush = false;
}

/** Merge only the synced keys into the store without clobbering action methods. */
function applyRemote(data: SyncedState) {
  applyingRemote = true;
  const patch: Partial<SyncedState> = {};
  for (const key of SYNCED_KEYS) {
    if (data[key] !== undefined) (patch as Record<string, unknown>)[key] = data[key];
  }
  useAppStore.setState(patch);
  applyingRemote = false;
}

/**
 * Decide direction on login. If the cloud row changed since this device last
 * synced (including a brand-new device, where lastSynced is 0), the cloud wins
 * and we restore it; otherwise this device is at least as fresh, so we push up.
 * First login with an empty cloud simply backs the local data up.
 */
async function reconcileOnLogin(userId: string): Promise<void> {
  const remote = await pull(userId);
  if (!remote) {
    await pushNow(userId);
    return;
  }
  if (remote.updatedAt > readSyncedAt()) {
    applyRemote(remote.data);
    writeSyncedAt(remote.updatedAt);
  } else {
    await pushNow(userId);
  }
}

function schedulePush() {
  if (!currentUserId || applyingRemote) return;
  pendingPush = true;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void flush();
  }, PUSH_DEBOUNCE_MS);
}

/** Push now if we have pending work and we're online + signed in. */
async function flush(): Promise<void> {
  if (!currentUserId || !pendingPush) return;
  if (!navigator.onLine) return; // stay pending; the 'online' handler retries
  try {
    await pushNow(currentUserId);
  } catch {
    // Leave pendingPush set so a later change or reconnect retries.
  }
}

function handleOnline() {
  void flush();
}

/** Begin syncing for a signed-in user: reconcile, then push on every change. */
export async function startSync(userId: string): Promise<void> {
  if (!supabase) return;
  if (currentUserId === userId) return; // already running for this user
  stopSync();
  currentUserId = userId;

  try {
    await reconcileOnLogin(userId);
  } catch {
    // Reconcile failed (offline / transient). We still subscribe below so local
    // edits queue up and flush once connectivity returns.
  }

  unsubscribeStore = useAppStore.subscribe(() => schedulePush());
  window.addEventListener('online', handleOnline);
}

/** Stop syncing (on sign-out). Leaves local data and the store untouched. */
export function stopSync(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  unsubscribeStore?.();
  unsubscribeStore = null;
  window.removeEventListener('online', handleOnline);
  currentUserId = null;
  pendingPush = false;
}

/** Force an immediate push (used by the "Sync now" button). */
export async function syncNow(): Promise<void> {
  if (!currentUserId) return;
  pendingPush = true;
  await flush();
}
