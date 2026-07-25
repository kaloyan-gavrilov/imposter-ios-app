import type { DealtWord } from './word';

export type RoundOutcome =
  /// Crew ejected an imposter.
  | 'imposterCaught'
  /// Crew ejected an innocent player.
  | 'wrongEjection'
  /// Vote tied twice — nobody goes.
  | 'noEjection';

export const OUTCOME_HEADLINE: Record<RoundOutcome, string> = {
  imposterCaught: 'Imposter caught',
  wrongEjection: 'Wrong call',
  noEjection: 'Hung vote',
};

/// Everything a single round needs, built up as the round is played.
export interface Round {
  number: number;
  word: DealtWord;
  /// Only used in decoy mode.
  decoyWord: string | null;
  /// Only used in hint mode: the facet line every imposter this round sees.
  imposterHint: string;
  imposterIDs: string[];
  /// Order players are handed the device during reveal.
  revealOrder: string[];
  /// Who speaks first in discussion — random, keeps the same person from always leading.
  firstSpeakerID: string;

  /// voter id -> target id
  votes: Record<string, string>;
  ejectedID: string | null;
  wasRevote: boolean;
  imposterGuess: string | null;
  imposterGuessedCorrectly: boolean;
  outcome: RoundOutcome | null;
}

export function isImposter(round: Round, id: string): boolean {
  return round.imposterIDs.includes(id);
}

/// Vote tallies, highest first.
export function tally(round: Round): { playerID: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const target of Object.values(round.votes)) {
    counts.set(target, (counts.get(target) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([playerID, count]) => ({ playerID, count }))
    .sort((a, b) => b.count - a.count);
}

/// The single most-voted player, or null when there's a tie at the top.
export function voteLeader(round: Round): string | null {
  const counts = tally(round);
  const top = counts[0];
  if (!top) return null;
  const tied = counts.filter((entry) => entry.count === top.count);
  return tied.length === 1 ? top.playerID : null;
}
