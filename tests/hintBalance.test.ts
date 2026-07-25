import { describe, expect, test } from 'vitest';

import { wordBank } from '@/content/wordBank';
import { categoryWords, hintTexts } from '@/domain/word';

/// The hint system only works if every facet stays deniable: sharp enough to
/// narrow the field, blunt enough that hearing it twice never pins a word.
/// These bounds are what keep new words from quietly breaking that.
const TAGS_PER_WORD = 3;
const MIN_WORDS_PER_FACET = 6;
const MAX_FACET_SHARE = 0.22;
const MAX_HINT_LENGTH = 45;

const categories = wordBank.categories;

describe('hint balance', () => {
  test('every category loads', () => {
    expect(categories).toHaveLength(9);
  });

  test('every word carries three known unique facets', () => {
    for (const category of categories) {
      for (const entry of category.entries) {
        expect(entry.hintIDs, `${category.id}/${entry.text}`).toHaveLength(
          TAGS_PER_WORD,
        );
        expect(
          new Set(entry.hintIDs).size,
          `${category.id}/${entry.text} has duplicate facets`,
        ).toBe(TAGS_PER_WORD);
        for (const id of entry.hintIDs) {
          expect(
            category.hints[id],
            `${category.id}/${entry.text} references unknown facet "${id}"`,
          ).toBeTruthy();
        }
      }
    }
  });

  test('every facet covers enough words without dominating its category', () => {
    for (const category of categories) {
      const counts = new Map<string, number>();
      for (const entry of category.entries) {
        for (const id of entry.hintIDs) {
          counts.set(id, (counts.get(id) ?? 0) + 1);
        }
      }

      for (const id of Object.keys(category.hints)) {
        const count = counts.get(id) ?? 0;
        expect(count, `${category.id}/${id} covers too few words`).toBeGreaterThanOrEqual(
          MIN_WORDS_PER_FACET,
        );
        expect(
          count / category.entries.length,
          `${category.id}/${id} dominates the category`,
        ).toBeLessThanOrEqual(MAX_FACET_SHARE);
      }
    }
  });

  test('no hint names a word from its own category', () => {
    for (const category of categories) {
      const words = categoryWords(category).map((word) => word.toLowerCase());
      for (const [id, text] of Object.entries(category.hints)) {
        const lower = text.toLowerCase();
        for (const word of words) {
          expect(
            lower.includes(word),
            `${category.id}/${id} names "${word}"`,
          ).toBe(false);
        }
      }
    }
  });

  // The bound applies to the facet lines only. The category-level fallback is
  // allowed to run longer (music's is 48 chars) and the Swift suite exempts it too.
  test('facet lines stay short enough to read on a card', () => {
    for (const category of categories) {
      for (const [id, text] of Object.entries(category.hints)) {
        expect(text.length, `${category.id}/${id}: "${text}"`).toBeLessThanOrEqual(
          MAX_HINT_LENGTH,
        );
      }
    }
  });

  test('hintTexts returns the word facets, with a category fallback', () => {
    for (const category of categories) {
      const word = category.entries[0].text;
      expect(hintTexts(category, word), category.id).toHaveLength(TAGS_PER_WORD);
      expect(hintTexts(category, 'Not A Real Word'), category.id).toEqual([
        category.hint,
      ]);
    }
  });
});
