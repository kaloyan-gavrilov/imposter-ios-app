import { categoryWords, parseCategory, type DealtWord, type WordCategory } from '@/domain/word';

import animals from './words/animals.json';
import food from './words/food.json';
import jobs from './words/jobs.json';
import movies from './words/movies.json';
import music from './words/music.json';
import objects from './words/objects.json';
import people from './words/people.json';
import places from './words/places.json';
import sports from './words/sports.json';

/// Order the categories appear in the picker.
const ORDER = [
  'food',
  'animals',
  'movies',
  'music',
  'places',
  'objects',
  'jobs',
  'sports',
  'people',
];

const RAW: Record<string, unknown> = {
  animals,
  food,
  jobs,
  movies,
  music,
  objects,
  people,
  places,
  sports,
};

/// Loads the bundled word lists once and hands out categories.
export class WordBank {
  readonly categories: WordCategory[];

  constructor(categories: WordCategory[]) {
    this.categories = categories;
  }

  category(id: string): WordCategory | undefined {
    return this.categories.find((category) => category.id === id);
  }

  /// Every word across the given categories, tagged with its source.
  pool(categoryIDs: readonly string[]): DealtWord[] {
    const wanted = new Set(categoryIDs);
    return this.categories
      .filter((category) => wanted.has(category.id))
      .flatMap((category) =>
        categoryWords(category).map((text) => ({
          categoryID: category.id,
          text,
        })),
      );
  }
}

export function loadBundled(): WordCategory[] {
  const loaded = Object.entries(RAW).map(([source, raw]) =>
    parseCategory(raw, source),
  );
  return loaded.sort((lhs, rhs) => {
    const l = ORDER.indexOf(lhs.id) === -1 ? ORDER.length : ORDER.indexOf(lhs.id);
    const r = ORDER.indexOf(rhs.id) === -1 ? ORDER.length : ORDER.indexOf(rhs.id);
    return l === r ? lhs.name.localeCompare(rhs.name) : l - r;
  });
}

export const wordBank = new WordBank(loadBundled());
