import { createStore, type StoreApi } from 'zustand/vanilla';

import { randomElement, systemRng, type Rng } from '@/lib/rng';
import { wordBank as defaultBank, type WordBank } from '@/content/wordBank';
import type { Player } from './player';
import {
  DEFAULT_SETTINGS,
  type GameSettings,
} from './settings';
import { isImposter, voteLeader, type Round } from './round';
import { pickImposters, revealOrder } from './roleAssigner';
import { deal } from './wordDealer';
import { award, guessMatches } from './scoring';
import { wordKey } from './word';

export type GamePhase =
  | 'home'
  | 'players'
  | 'settings'
  | 'reveal'
  | 'discussion'
  | 'voting'
  | 'noVoteReveal'
  | 'imposterGuess'
  | 'roundResult'
  | 'gameOver';

/// What a player sees when they hold their reveal card.
export type RevealCard =
  | { kind: 'crew'; word: string }
  | { kind: 'imposterBlind'; partners: string[] }
  | { kind: 'imposterHint'; hint: string; partners: string[] };

export function isImposterCard(card: RevealCard): boolean {
  return card.kind !== 'crew';
}

export interface EngineState {
  phase: GamePhase;
  players: Player[];
  rounds: Round[];
  scores: Record<string, number>;
  lastDeltas: Record<string, number>;
  /// Set when a category pool ran out and had to be recycled mid-game.
  recycledPool: boolean;

  settings: GameSettings;

  /// Index into the current round's revealOrder while passing the device.
  revealIndex: number;
  /// Index into `players` while collecting secret votes.
  voteIndex: number;

  /// Which words this session has already dealt. Memory only, by design —
  /// reloading the page wipes it and nothing hits storage.
  usedKeys: Set<string>;
}

export interface EngineActions {
  setSettings(update: Partial<GameSettings>): void;

  goHome(): void;
  openPlayers(): void;
  openSettings(): void;

  startGame(roster: Player[]): void;
  startRound(): void;
  skipRound(): void;

  advanceReveal(): void;
  beginVoting(): void;
  revealNoVote(): void;
  finishNoVoteRound(): void;

  castVote(voter: string, target: string): void;

  submitImposterGuess(guess: string): void;
  skipImposterGuess(): void;

  continueAfterResult(): void;
  endGame(): void;
  playAgainSamePlayers(): void;
}

export type EngineStore = EngineState & EngineActions;

export interface EngineDeps {
  bank?: WordBank;
  rng?: Rng;
  settings?: GameSettings;
}

const INITIAL: Omit<EngineState, 'settings'> = {
  phase: 'home',
  players: [],
  rounds: [],
  scores: {},
  lastDeltas: {},
  recycledPool: false,
  revealIndex: 0,
  voteIndex: 0,
  usedKeys: new Set<string>(),
};

/// Owns the whole game. Views read state and call intents; no view mutates state
/// directly. Ported from `GameEngine.swift`.
export function createEngineStore(
  deps: EngineDeps = {},
): StoreApi<EngineStore> {
  const bank = deps.bank ?? defaultBank;
  const rng = deps.rng ?? systemRng;

  return createStore<EngineStore>((set, get) => {
    /// Replaces the in-flight round. Rounds are immutable-by-copy so React sees a
    /// new array identity on every mutation.
    function patchRound(update: Partial<Round>): Round | null {
      const { rounds } = get();
      const current = rounds[rounds.length - 1];
      if (!current) return null;
      const next = { ...current, ...update };
      set({ rounds: [...rounds.slice(0, -1), next] });
      return next;
    }

    function finishRound() {
      const state = get();
      const round = currentRound(state);
      if (!round) return;

      const deltas = award(round, state.players);
      const scores = { ...state.scores };
      for (const [id, points] of Object.entries(deltas)) {
        scores[id] = (scores[id] ?? 0) + points;
      }
      set({ lastDeltas: deltas, scores, phase: 'roundResult' });
    }

    function resolveVote() {
      const state = get();
      const round = currentRound(state);
      if (!round) return;

      const leader = voteLeader(round);
      let resolved: Round;

      if (leader) {
        resolved =
          patchRound({
            ejectedID: leader,
            outcome: isImposter(round, leader)
              ? 'imposterCaught'
              : 'wrongEjection',
          }) ?? round;
      } else if (round.wasRevote) {
        resolved = patchRound({ ejectedID: null, outcome: 'noEjection' }) ?? round;
      } else {
        // First tie gets one revote before the imposters walk free.
        patchRound({ wasRevote: true, votes: {} });
        set({ voteIndex: 0 });
        return;
      }

      const caught = resolved.outcome === 'imposterCaught';
      if (caught && get().settings.allowImposterGuess) {
        set({ phase: 'imposterGuess' });
      } else {
        finishRound();
      }
    }

    return {
      ...INITIAL,
      usedKeys: new Set<string>(),
      settings: deps.settings ?? { ...DEFAULT_SETTINGS },

      setSettings(update) {
        set({ settings: { ...get().settings, ...update } });
      },

      goHome: () => set({ phase: 'home' }),
      openPlayers: () => set({ phase: 'players' }),
      openSettings: () => set({ phase: 'settings' }),

      startGame(roster) {
        const scores: Record<string, number> = {};
        for (const player of roster) scores[player.id] = 0;

        set({
          players: roster,
          rounds: [],
          scores,
          lastDeltas: {},
          recycledPool: false,
        });
        get().startRound();
      },

      startRound() {
        const state = get();
        if (state.players.length === 0) return;

        const previous = currentRound(state)?.imposterIDs ?? [];
        const imposters = pickImposters(
          state.players,
          state.settings.imposterCount,
          previous,
          rng,
        );
        const order = revealOrder(state.players, rng);

        const dealt = deal(
          bank,
          state.settings.categoryIDs,
          state.usedKeys,
          state.settings.imposterMode === 'decoy',
          rng,
        );
        if (!dealt) return;

        let usedKeys = new Set(state.usedKeys);
        if (dealt.recycled) {
          // Clear only the categories in play, not the whole cache.
          const active = new Set(state.settings.categoryIDs);
          usedKeys = new Set(
            [...usedKeys].filter((key) => !active.has(key.split('#')[0])),
          );
          set({ recycledPool: true });
        }
        usedKeys.add(wordKey(dealt.word));

        const round: Round = {
          number: state.rounds.length + 1,
          word: dealt.word,
          decoyWord: dealt.decoy,
          imposterHint: dealt.hint,
          imposterIDs: imposters,
          revealOrder: order,
          firstSpeakerID: randomElement(order, rng) ?? order[0],
          votes: {},
          ejectedID: null,
          wasRevote: false,
          imposterGuess: null,
          imposterGuessedCorrectly: false,
          outcome: null,
        };

        set({
          rounds: [...state.rounds, round],
          usedKeys,
          revealIndex: 0,
          voteIndex: 0,
          phase: 'reveal',
        });
      },

      /// Abandons the in-flight round with no scoring and deals a fresh word
      /// under the same round number.
      skipRound() {
        const state = get();
        if (state.rounds.length === 0) return;
        set({ rounds: state.rounds.slice(0, -1) });
        get().startRound();
      },

      advanceReveal() {
        const state = get();
        const round = currentRound(state);
        if (!round) return;
        if (state.revealIndex + 1 < round.revealOrder.length) {
          set({ revealIndex: state.revealIndex + 1 });
        } else {
          set({ phase: 'discussion' });
        }
      },

      beginVoting() {
        set({ voteIndex: 0, phase: 'voting' });
      },

      /// No-voting mode: skip straight from discussion to showing who the
      /// imposter(s) were. No votes cast, no scoring.
      revealNoVote() {
        set({ phase: 'noVoteReveal' });
      },

      /// Leaves the no-vote reveal screen. No scores were touched, so the
      /// last round just ends the game rather than showing a scoreboard.
      finishNoVoteRound() {
        if (isFinalRound(get())) {
          get().endGame();
        } else {
          get().startRound();
        }
      },

      castVote(voter, target) {
        const state = get();
        const round = currentRound(state);
        if (!round) return;

        patchRound({ votes: { ...round.votes, [voter]: target } });

        if (state.voteIndex + 1 < state.players.length) {
          set({ voteIndex: state.voteIndex + 1 });
        } else {
          resolveVote();
        }
      },

      submitImposterGuess(guess) {
        const round = currentRound(get());
        if (!round) return;
        patchRound({
          imposterGuess: guess,
          imposterGuessedCorrectly: guessMatches(guess, round.word.text),
        });
        finishRound();
      },

      skipImposterGuess() {
        finishRound();
      },

      continueAfterResult() {
        if (isFinalRound(get())) {
          set({ phase: 'gameOver' });
        } else {
          get().startRound();
        }
      },

      /// Ends the game and returns to the menu. Scores go, the word cache stays
      /// for the session.
      endGame() {
        set({
          players: [],
          rounds: [],
          scores: {},
          lastDeltas: {},
          phase: 'home',
        });
      },

      playAgainSamePlayers() {
        const roster = get().players;
        if (roster.length === 0) return;
        get().startGame(roster);
      },
    };
  });
}

// MARK: - Derived state
// Free functions rather than store members so they stay trivially testable and
// don't re-run on every unrelated state change.

export function currentRound(state: EngineState): Round | undefined {
  return state.rounds[state.rounds.length - 1];
}

export function isFinalRound(state: EngineState): boolean {
  return state.rounds.length >= state.settings.roundCount;
}

export function playerByID(
  state: EngineState,
  id: string | null | undefined,
): Player | undefined {
  if (!id) return undefined;
  return state.players.find((player) => player.id === id);
}

export function revealPlayer(state: EngineState): Player | undefined {
  const round = currentRound(state);
  if (!round || state.revealIndex >= round.revealOrder.length) return undefined;
  return playerByID(state, round.revealOrder[state.revealIndex]);
}

export function votingPlayer(state: EngineState): Player | undefined {
  return state.players[state.voteIndex];
}

export function standings(
  state: EngineState,
): { player: Player; score: number }[] {
  return state.players
    .map((player) => ({ player, score: state.scores[player.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);
}

/// What a given player should see on their reveal card.
export function cardFor(state: EngineState, player: Player): RevealCard {
  const round = currentRound(state);
  if (!round) return { kind: 'crew', word: '' };
  if (!isImposter(round, player.id)) {
    return { kind: 'crew', word: round.word.text };
  }

  const partners = partnerNames(state, player.id, round);

  switch (state.settings.imposterMode) {
    case 'blind':
      return { kind: 'imposterBlind', partners };
    case 'hint':
      return { kind: 'imposterHint', hint: round.imposterHint, partners };
    case 'decoy':
      // Decoy looks exactly like a crew card on purpose.
      return { kind: 'crew', word: round.decoyWord ?? round.word.text };
  }
}

function partnerNames(
  state: EngineState,
  id: string,
  round: Round,
): string[] {
  if (!state.settings.impostersKnowEachOther) return [];
  return round.imposterIDs
    .filter((other) => other !== id)
    .map((other) => playerByID(state, other)?.name)
    .filter((name): name is string => Boolean(name))
    .sort();
}
