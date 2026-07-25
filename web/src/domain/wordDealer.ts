import { randomElement, type Rng } from '@/lib/rng';
import type { WordBank } from '@/content/wordBank';
import { categoryWords, hintTexts, wordKey, type DealtWord } from './word';

export interface Deal {
  word: DealtWord;
  /// Present only for decoy mode: another word from the same category.
  decoy: string | null;
  /// One of the word's hint facets, picked here so every imposter in the round
  /// reads the same line and re-taps don't reshuffle it.
  hint: string;
  /// True when the pool ran dry and had to be recycled.
  recycled: boolean;
}

/// Deals unused words from the selected categories. When a pool is exhausted the
/// used-set for those categories is cleared rather than failing the round.
export function deal(
  bank: WordBank,
  categoryIDs: readonly string[],
  usedKeys: ReadonlySet<string>,
  needsDecoy: boolean,
  rng: Rng,
): Deal | null {
  const pool = bank.pool(categoryIDs);
  if (pool.length === 0) return null;

  const unused = pool.filter((entry) => !usedKeys.has(wordKey(entry)));
  const recycled = unused.length === 0;
  const candidates = recycled ? pool : unused;

  const word = randomElement(candidates, rng);
  if (!word) return null;

  const category = bank.category(word.categoryID);

  let decoy: string | null = null;
  if (needsDecoy && category) {
    const sameCategory = categoryWords(category).filter(
      (text) => text !== word.text,
    );
    decoy = randomElement(sameCategory, rng) ?? null;
  }

  const hints = category ? hintTexts(category, word.text) : [];
  const hint = randomElement(hints, rng) ?? category?.hint ?? '';

  return { word, decoy, hint, recycled };
}
