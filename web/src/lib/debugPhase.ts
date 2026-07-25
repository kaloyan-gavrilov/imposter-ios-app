'use client';

/// Jumps straight to a screen for side-by-side comparison against the iOS build,
/// e.g. `?debugPhase=reveal`. Mirrors `DebugLaunch` in RootView.swift, which does
/// the same job via `-debugPhase <phase>`.
///
/// Development only — returns immediately in production builds.
import type { StoreApi } from 'zustand/vanilla';

import type { EngineStore, GamePhase } from '@/domain/engineStore';
import type { Player } from '@/domain/player';

const DEBUG_NAMES = ['Nyx', 'Bolt', 'Juno', 'Kai', 'Wren'];

export function readDebugPhase(): GamePhase | null {
  if (process.env.NODE_ENV === 'production') return null;
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('debugPhase');
  return (value as GamePhase | null) ?? null;
}

/// Seeds a roster if needed, then plays a game forward until `phase` has content.
export function applyDebugPhase(
  store: StoreApi<EngineStore>,
  phase: GamePhase,
  roster: Player[],
  addPlayer: (name: string) => Player | null,
  readRoster: () => Player[],
): void {
  let players = roster;
  if (players.length < DEBUG_NAMES.length) {
    for (const name of DEBUG_NAMES) addPlayer(name);
    players = readRoster();
  }

  const engine = () => store.getState();

  if (phase === 'home') return;
  if (phase === 'players') return engine().openPlayers();
  if (phase === 'settings') return engine().openSettings();

  engine().startGame(players);
  if (phase === 'reveal') return;

  for (let i = 0; i < players.length; i += 1) engine().advanceReveal();
  if (phase === 'discussion') return;

  if (phase === 'noVoteReveal') return engine().revealNoVote();

  engine().beginVoting();
  if (phase === 'voting') return;

  // Everyone piles onto the first imposter so the result screens have content.
  const target = engine().rounds.at(-1)?.imposterIDs[0];
  if (!target) return;
  for (const player of players) engine().castVote(player.id, target);
  if (phase === 'imposterGuess') return;

  if (engine().phase === 'imposterGuess') engine().skipImposterGuess();
  if (phase === 'roundResult') return;

  // gameOver: burn through the remaining rounds the same way.
  while (engine().phase !== 'gameOver') {
    engine().continueAfterResult();
    if (engine().phase !== 'reveal') break;

    for (let i = 0; i < players.length; i += 1) engine().advanceReveal();
    engine().beginVoting();
    const next = engine().rounds.at(-1)?.imposterIDs[0];
    if (!next) break;
    for (const player of players) engine().castVote(player.id, next);
    if (engine().phase === 'imposterGuess') engine().skipImposterGuess();
  }
}
