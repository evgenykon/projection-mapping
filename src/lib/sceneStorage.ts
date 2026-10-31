import type { SyncState } from '../types';

const LIBRARY_KEY = 'pm-scene-library';
const LAST_KEY = 'pm-scene-last';

export interface SavedScene {
  name: string;
  savedAt: string;
  state: SyncState;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode / quota. The in-memory state still works.
  }
}

export function listSavedScenes(): SavedScene[] {
  const scenes = readJson<SavedScene[]>(LIBRARY_KEY, []);
  return [...scenes].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function saveSceneToLibrary(name: string, state: SyncState): SavedScene {
  const trimmed = name.trim() || 'Без названия';
  const scenes = listSavedScenes().filter((scene) => scene.name !== trimmed);
  const saved: SavedScene = {
    name: trimmed,
    savedAt: new Date().toISOString(),
    state,
  };
  writeJson(LIBRARY_KEY, [saved, ...scenes]);
  saveLastScene(state);
  return saved;
}

export function deleteSceneFromLibrary(name: string): void {
  const scenes = listSavedScenes().filter((scene) => scene.name !== name);
  writeJson(LIBRARY_KEY, scenes);
}

export function saveLastScene(state: SyncState): void {
  writeJson(LAST_KEY, {
    savedAt: new Date().toISOString(),
    state,
  });
}

export function loadLastScene(): SyncState | null {
  const data = readJson<{ state?: SyncState } | null>(LAST_KEY, null);
  return data?.state ?? null;
}

export function clearLastScene(): void {
  try {
    localStorage.removeItem(LAST_KEY);
  } catch {
    // ignore
  }
}

function safeFileName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zа-яё0-9-_]+/giu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'scene';
}

export function downloadSceneFile(state: SyncState, name: string): void {
  const payload = {
    version: 1,
    name,
    savedAt: new Date().toISOString(),
    state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeFileName(name)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readSceneFile(file: File): Promise<SyncState> {
  const text = await file.text();
  const parsed = JSON.parse(text) as
    | { state?: SyncState }
    | SyncState
    | null;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid scene file');
  }
  const candidate = 'state' in parsed && parsed.state ? parsed.state : parsed;
  if (!candidate || !Array.isArray((candidate as SyncState).objects)) {
    throw new Error('Invalid scene file');
  }
  return candidate as SyncState;
}
