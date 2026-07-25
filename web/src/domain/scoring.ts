import type { Player } from './player';
import { isImposter, type Round } from './round';

/// Pure scoring rules — kept free of UI so they can be unit tested directly.
export const CREW_CATCH_POINTS = 2;
export const IMPOSTER_SURVIVE_POINTS = 3;
export const IMPOSTER_GUESS_POINTS = 2;

/// Points earned this round, keyed by player.
export function award(
  round: Round,
  players: readonly Player[],
): Record<string, number> {
  const deltas: Record<string, number> = {};
  const add = (id: string, points: number) => {
    deltas[id] = (deltas[id] ?? 0) + points;
  };

  switch (round.outcome) {
    case 'imposterCaught':
      // Everyone on the crew banks points; imposters get nothing for being caught.
      for (const player of players) {
        if (!isImposter(round, player.id)) add(player.id, CREW_CATCH_POINTS);
      }
      break;
    case 'wrongEjection':
    case 'noEjection':
      for (const id of round.imposterIDs) add(id, IMPOSTER_SURVIVE_POINTS);
      break;
    case null:
      break;
  }

  // Consolation: a caught imposter who names the word still scores.
  if (round.imposterGuessedCorrectly) {
    for (const id of round.imposterIDs) add(id, IMPOSTER_GUESS_POINTS);
  }

  return deltas;
}

/// Case/whitespace/accent tolerant match for the imposter's word guess.
/// Mirrors the Swift `folding(options: [.diacriticInsensitive, .caseInsensitive])`
/// followed by keeping only letters and numbers.
export function guessMatches(guess: string, word: string): boolean {
  const normalised = normalise(guess);
  return normalised.length > 0 && normalised === normalise(word);
}

function normalise(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}
