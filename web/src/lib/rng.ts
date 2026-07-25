/// Random source, injectable so tests can pin it — mirrors the
/// `RandomNumberGenerator` parameter threaded through the Swift engine.
export type Rng = () => number;

export const systemRng: Rng = () => Math.random();

/// xorshift64, ported from `SeededGenerator` in RootView.swift. Deterministic so
/// the starfield doesn't shimmer on every redraw and tests can replay a game.
export function seededRng(seed: number | bigint): Rng {
  const MASK = (1n << 64n) - 1n;
  let state =
    ((BigInt(seed) * 6_364_136_223_846_793_005n + 1n) & MASK) || 1n;

  return () => {
    state = (state ^ (state << 13n)) & MASK;
    state = state ^ (state >> 7n);
    state = (state ^ (state << 17n)) & MASK;
    // Top 53 bits give a double in [0, 1) without losing precision.
    return Number(state >> 11n) / 2 ** 53;
  };
}

export function randomElement<T>(items: readonly T[], rng: Rng): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(rng() * items.length)];
}

/// Fisher-Yates, matching `Array.shuffled(using:)`. Returns a new array.
export function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
