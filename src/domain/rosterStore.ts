import { create } from 'zustand';

import { ROSTER_KEY, load, save } from '@/lib/storage';
import {
  PLAYER_MAX_COUNT,
  cyclePalette,
  cycleSprite,
  makePlayer,
  type Player,
} from './player';

interface RosterState {
  players: Player[];
  /// False until localStorage has been read, so the first paint can match the
  /// server render instead of flashing a stale empty roster.
  hydrated: boolean;

  hydrate(): void;
  add(name: string): Player | null;
  update(player: Player): void;
  remove(id: string): void;
  rename(id: string, name: string): void;
  nextSprite(id: string): void;
  nextPalette(id: string): void;
  nameExists(name: string, excluding?: string): boolean;
}

/// Roster of players, persisted so names and avatars survive a reload.
/// (Word cache and scores deliberately do NOT persist.)
export const useRoster = create<RosterState>((set, get) => {
  function commit(players: Player[]) {
    set({ players });
    save(ROSTER_KEY, players);
  }

  return {
    players: [],
    hydrated: false,

    hydrate() {
      if (get().hydrated) return;
      const stored = load<Player[]>(ROSTER_KEY);
      set({ players: Array.isArray(stored) ? stored : [], hydrated: true });
    },

    nameExists(name, excluding) {
      const target = name.trim().toLowerCase();
      return get().players.some(
        (player) =>
          player.id !== excluding && player.name.toLowerCase() === target,
      );
    },

    add(name) {
      const trimmed = name.trim();
      const { players } = get();
      if (players.length >= PLAYER_MAX_COUNT) return null;
      if (trimmed.length === 0) return null;
      if (get().nameExists(trimmed)) return null;

      const player = makePlayer(trimmed, players);
      commit([...players, player]);
      return player;
    },

    update(player) {
      commit(
        get().players.map((existing) =>
          existing.id === player.id ? player : existing,
        ),
      );
    },

    remove(id) {
      commit(get().players.filter((player) => player.id !== id));
    },

    rename(id, name) {
      const trimmed = name.trim();
      if (trimmed.length === 0 || get().nameExists(trimmed, id)) return;
      commit(
        get().players.map((player) =>
          player.id === id ? { ...player, name: trimmed } : player,
        ),
      );
    },

    nextSprite(id) {
      commit(
        get().players.map((player) =>
          player.id === id ? cycleSprite(player) : player,
        ),
      );
    },

    nextPalette(id) {
      commit(
        get().players.map((player) =>
          player.id === id ? cyclePalette(player) : player,
        ),
      );
    },
  };
});
