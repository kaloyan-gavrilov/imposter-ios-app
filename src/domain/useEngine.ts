'use client';

import { useStore } from 'zustand';

import { createEngineStore, type EngineStore } from './engineStore';

/// The app's single engine instance. Created once at module scope so a fast
/// refresh in dev doesn't reset a game in progress.
export const engineStore = createEngineStore();

export function useEngine<T>(selector: (state: EngineStore) => T): T {
  return useStore(engineStore, selector);
}

/// For derived values that build a fresh object or array (cards, standings).
/// Those can't be selectors: useSyncExternalStore compares snapshots by
/// identity, so a new reference on every read re-renders forever. Subscribing
/// to the whole state is safe — its identity only changes on a real update.
export function useEngineState(): EngineStore {
  return useStore(engineStore);
}

/// For event handlers, where reading the latest state beats subscribing to it.
export const engine = () => engineStore.getState();
