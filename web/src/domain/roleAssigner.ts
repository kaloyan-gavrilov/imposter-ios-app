import type { Player } from './player';
import { shuffled, type Rng } from '@/lib/rng';

/// Picks who the imposters are. Pure and injectable so tests can pin the RNG.
///
/// `previousImposters` are the imposters from the round just played; avoided when
/// there are enough other players, so nobody gets stuck with the role.
export function pickImposters(
  players: readonly Player[],
  count: number,
  previousImposters: readonly string[],
  rng: Rng,
): string[] {
  const ids = players.map((player) => player.id);
  if (count <= 0 || ids.length === 0) return [];

  const wanted = Math.min(count, Math.max(1, ids.length - 1));

  const previous = new Set(previousImposters);
  const fresh = ids.filter((id) => !previous.has(id));
  const pool = fresh.length >= wanted ? fresh : ids;

  return shuffled(pool, rng).slice(0, wanted);
}

export function revealOrder(players: readonly Player[], rng: Rng): string[] {
  return shuffled(
    players.map((player) => player.id),
    rng,
  );
}
