import { PLAYER_MIN_COUNT } from './player';

/// What the imposter's card shows.
export type ImposterMode = 'blind' | 'hint' | 'decoy';

export const IMPOSTER_MODES: ImposterMode[] = ['blind', 'hint', 'decoy'];

export const IMPOSTER_MODE_TITLE: Record<ImposterMode, string> = {
  blind: 'Blind',
  hint: 'Hint',
  decoy: 'Decoy',
};

export const IMPOSTER_MODE_EXPLANATION: Record<ImposterMode, string> = {
  blind: 'Imposter sees nothing. Pure bluffing.',
  hint: 'Imposter sees one vague clue about the actual word.',
  decoy: "Imposter gets a wrong word and isn't told they're the imposter.",
};

/// Discussion timer length, in seconds. 0 is off.
export type DiscussionTimer = 0 | 60 | 90 | 120 | 180;

export const DISCUSSION_TIMERS: DiscussionTimer[] = [0, 60, 90, 120, 180];

export const DISCUSSION_TIMER_TITLE: Record<DiscussionTimer, string> = {
  0: 'Off',
  60: '1:00',
  90: '1:30',
  120: '2:00',
  180: '3:00',
};

export interface GameSettings {
  categoryIDs: string[];
  imposterCount: number;
  roundCount: number;
  imposterMode: ImposterMode;
  timer: DiscussionTimer;
  /// A caught imposter gets one shot at guessing the secret word.
  allowImposterGuess: boolean;
  /// Imposters see each other's names on their card.
  impostersKnowEachOther: boolean;
  /// Skip voting entirely: after discussion, a single button reveals the
  /// imposter(s) and the round ends there. No scoring, no scoreboard.
  noVoting: boolean;
}

export const MAX_ROUNDS = 10;
export const ROUND_OPTIONS = [1, 3, 5, 7, 10];

export const DEFAULT_SETTINGS: GameSettings = {
  categoryIDs: ['food'],
  imposterCount: 1,
  roundCount: 3,
  imposterMode: 'hint',
  timer: 90,
  allowImposterGuess: true,
  impostersKnowEachOther: false,
  noVoting: false,
};

/// Keeping imposters a strict minority is what makes the vote meaningful.
export function maxImposters(playerCount: number): number {
  return Math.max(1, Math.floor((playerCount - 1) / 2));
}

/// Human-readable reason the current combination can't start, or null if fine.
export function validationMessage(
  settings: GameSettings,
  playerCount: number,
): string | null {
  if (playerCount < PLAYER_MIN_COUNT) {
    return `Need at least ${PLAYER_MIN_COUNT} players`;
  }
  if (settings.categoryIDs.length === 0) {
    return 'Pick at least one category';
  }
  if (settings.imposterCount > maxImposters(playerCount)) {
    return `Too many imposters for ${playerCount} players`;
  }
  return null;
}

export function isValid(settings: GameSettings, playerCount: number): boolean {
  return validationMessage(settings, playerCount) === null;
}
