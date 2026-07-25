import { WordBank } from '@/content/wordBank';
import { createEngineStore, type EngineDeps } from '@/domain/engineStore';
import type { Player } from '@/domain/player';
import { DEFAULT_SETTINGS, type GameSettings } from '@/domain/settings';
import type { WordCategory } from '@/domain/word';
import { seededRng } from '@/lib/rng';

export function makeRoster(names: string[]): Player[] {
  return names.map((name, index) => ({
    id: `p${index}`,
    name,
    spriteID: `sprite${index}`,
    paletteID: `palette${index}`,
  }));
}

/// A synthetic single-category bank, matching the 50-word "test" category the
/// Swift GameEngineTests deal from.
export function testBank(wordCount = 50): WordBank {
  const category: WordCategory = {
    id: 'test',
    name: 'Test',
    hint: 'A test thing',
    hints: { alpha: 'It is alpha', beta: 'It is beta' },
    entries: Array.from({ length: wordCount }, (_, index) => ({
      text: `Word${index}`,
      hintIDs: ['alpha', 'beta'],
    })),
  };
  return new WordBank([category]);
}

export function testEngine(
  overrides: Partial<GameSettings> = {},
  deps: EngineDeps = {},
) {
  return createEngineStore({
    bank: deps.bank ?? testBank(),
    rng: deps.rng ?? seededRng(2026),
    settings: { ...DEFAULT_SETTINGS, categoryIDs: ['test'], ...overrides },
  });
}

/// Walks the reveal phase to its end.
export function revealAll(store: ReturnType<typeof testEngine>) {
  for (let i = 0; i < store.getState().players.length; i += 1) {
    store.getState().advanceReveal();
  }
}

/// Everyone votes for `target`, which is an unambiguous majority.
export function everyoneVotes(
  store: ReturnType<typeof testEngine>,
  target: string,
) {
  for (const player of store.getState().players) {
    store.getState().castVote(player.id, target);
  }
}
