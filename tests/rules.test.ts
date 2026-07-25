import { describe, expect, test } from 'vitest';

import { wordBank } from '@/content/wordBank';
import { iconByID, CATEGORY_ICONS } from '@/art/categoryIcons';
import { pickImposters, revealOrder } from '@/domain/roleAssigner';
import { deal } from '@/domain/wordDealer';
import { award, guessMatches } from '@/domain/scoring';
import {
  DEFAULT_SETTINGS,
  maxImposters,
  validationMessage,
} from '@/domain/settings';
import { categoryWords, wordKey } from '@/domain/word';
import type { Round } from '@/domain/round';
import { seededRng } from '@/lib/rng';
import { makeRoster, testBank } from './helpers';

const rng = () => seededRng(99);

describe('word bank', () => {
  test('loads exactly nine categories', () => {
    expect(wordBank.categories).toHaveLength(9);
  });

  test('every category carries at least 100 words', () => {
    for (const category of wordBank.categories) {
      expect(categoryWords(category).length, category.id).toBeGreaterThanOrEqual(
        100,
      );
    }
  });

  test('holds at least 1500 words in total', () => {
    const total = wordBank.categories.reduce(
      (sum, category) => sum + categoryWords(category).length,
      0,
    );
    expect(total).toBeGreaterThanOrEqual(1500);
  });

  test('no case-insensitive duplicates within a category', () => {
    for (const category of wordBank.categories) {
      const seen = new Set(
        categoryWords(category).map((word) => word.toLowerCase()),
      );
      expect(seen.size, category.id).toBe(categoryWords(category).length);
    }
  });

  test('every category has a hint and a matching pixel icon', () => {
    for (const category of wordBank.categories) {
      expect(category.hint.length, category.id).toBeGreaterThan(0);
      expect(iconByID(category.id).id, category.id).toBe(category.id);
    }
    expect(CATEGORY_ICONS).toHaveLength(9);
  });
});

describe('role assigner', () => {
  const roster = makeRoster(['A', 'B', 'C', 'D', 'E']);

  test('picks the requested count', () => {
    expect(pickImposters(roster, 2, [], rng())).toHaveLength(2);
  });

  test('never makes everyone an imposter', () => {
    const three = makeRoster(['A', 'B', 'C']);
    expect(pickImposters(three, 5, [], rng())).toHaveLength(2);
  });

  test('avoids last round imposters across repeated draws', () => {
    const random = rng();
    const previous = [roster[0].id];
    for (let i = 0; i < 20; i += 1) {
      const picked = pickImposters(roster, 1, previous, random);
      expect(picked).not.toContain(roster[0].id);
    }
  });

  test('falls back when everyone was previously an imposter', () => {
    const all = roster.map((player) => player.id);
    const picked = pickImposters(roster, 1, all, rng());
    expect(picked).toHaveLength(1);
    expect(all).toContain(picked[0]);
  });

  test('reveal order contains everyone exactly once', () => {
    const order = revealOrder(roster, rng());
    expect([...order].sort()).toEqual(roster.map((p) => p.id).sort());
  });
});

describe('word dealer', () => {
  test('does not repeat a word until the pool empties', () => {
    const bank = testBank(10);
    const random = rng();
    const used = new Set<string>();

    for (let i = 0; i < 10; i += 1) {
      const dealt = deal(bank, ['test'], used, false, random);
      expect(dealt, `deal ${i}`).not.toBeNull();
      expect(dealt!.recycled).toBe(false);
      used.add(wordKey(dealt!.word));
    }
    expect(used.size).toBe(10);
  });

  test('flags a recycled pool once exhausted', () => {
    const bank = testBank(3);
    const used = new Set(
      bank.pool(['test']).map((word) => wordKey(word)),
    );
    const dealt = deal(bank, ['test'], used, false, rng());
    expect(dealt!.recycled).toBe(true);
  });

  test('decoy differs from the word and shares its category', () => {
    const bank = testBank(10);
    const dealt = deal(bank, ['test'], new Set(), true, rng());
    expect(dealt!.decoy).not.toBeNull();
    expect(dealt!.decoy).not.toBe(dealt!.word.text);
    expect(categoryWords(bank.category('test')!)).toContain(dealt!.decoy);
  });

  test('returns nothing when no category is selected', () => {
    expect(deal(testBank(), [], new Set(), false, rng())).toBeNull();
  });
});

describe('scoring', () => {
  const players = makeRoster(['A', 'B', 'C', 'D']);

  function round(overrides: Partial<Round>): Round {
    return {
      number: 1,
      word: { categoryID: 'test', text: 'Pizza' },
      decoyWord: null,
      imposterHint: '',
      imposterIDs: [players[0].id],
      revealOrder: players.map((p) => p.id),
      firstSpeakerID: players[0].id,
      votes: {},
      ejectedID: null,
      wasRevote: false,
      imposterGuess: null,
      imposterGuessedCorrectly: false,
      outcome: null,
      ...overrides,
    };
  }

  test('crew banks two each when the imposter is caught', () => {
    const deltas = award(round({ outcome: 'imposterCaught' }), players);
    expect(deltas[players[0].id]).toBeUndefined();
    expect(deltas[players[1].id]).toBe(2);
    expect(deltas[players[3].id]).toBe(2);
  });

  test('imposter banks three on a wrong ejection', () => {
    const deltas = award(round({ outcome: 'wrongEjection' }), players);
    expect(deltas[players[0].id]).toBe(3);
    expect(deltas[players[1].id]).toBeUndefined();
  });

  test('a hung vote scores like survival', () => {
    const deltas = award(round({ outcome: 'noEjection' }), players);
    expect(deltas[players[0].id]).toBe(3);
  });

  test('a caught imposter still scores two for a correct guess', () => {
    const deltas = award(
      round({ outcome: 'imposterCaught', imposterGuessedCorrectly: true }),
      players,
    );
    expect(deltas[players[0].id]).toBe(2);
    expect(deltas[players[1].id]).toBe(2);
  });

  test.each([
    ['hotdog', 'Hot dog', true],
    ['Hot Dog', 'hotdog', true],
    ['  pizza  ', 'Pizza', true],
    ['pizzas', 'Pizza', false],
    ['', 'Pizza', false],
    ['   ', 'Pizza', false],
    ['creme brulee', 'Crème brûlée', true],
    ['CRÈME BRÛLÉE', 'Creme Brulee', true],
    ['fish-n-chips', 'Fish n Chips', true],
    ['rock&roll', 'Rock & Roll', true],
    ['pizz', 'Pizza', false],
  ])('guessMatches(%j, %j) === %s', (guess, word, expected) => {
    expect(guessMatches(guess, word)).toBe(expected);
  });
});

describe('game settings', () => {
  test.each([
    [3, 1],
    [4, 1],
    [5, 2],
    [6, 2],
    [7, 3],
    [8, 3],
    [16, 7],
  ])('maxImposters(%i) === %i', (players, expected) => {
    expect(maxImposters(players)).toBe(expected);
  });

  test('maxImposters never drops below one across the supported range', () => {
    for (let count = 3; count <= 16; count += 1) {
      expect(maxImposters(count)).toBeGreaterThanOrEqual(1);
      expect(maxImposters(count)).toBeLessThan(count);
    }
  });

  test('rejects too few players', () => {
    expect(validationMessage(DEFAULT_SETTINGS, 2)).toBe(
      'Need at least 3 players',
    );
  });

  test('rejects an empty category selection', () => {
    expect(
      validationMessage({ ...DEFAULT_SETTINGS, categoryIDs: [] }, 5),
    ).toBe('Pick at least one category');
  });

  test('rejects too many imposters', () => {
    expect(
      validationMessage({ ...DEFAULT_SETTINGS, imposterCount: 3 }, 5),
    ).toBe('Too many imposters for 5 players');
  });

  test('accepts a valid combination', () => {
    expect(validationMessage(DEFAULT_SETTINGS, 5)).toBeNull();
  });
});
