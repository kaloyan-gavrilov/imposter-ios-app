/// One bundled word list.
///
/// Hints are per-word, but the phrasings live in a shared `hints` table and are
/// reused across many words on purpose: a facet like "some people keep one at
/// home" is true of dozens of animals, so hearing it again in a later game never
/// pins the word — it only narrows the field. `hint` stays as the category-level
/// fallback for any word that has no facets of its own.
export interface WordCategory {
  id: string;
  name: string;
  hint: string;
  /// Facet id -> the line the imposter reads.
  hints: Record<string, string>;
  entries: WordEntry[];
}

/// A word plus the facet ids that describe it.
export interface WordEntry {
  text: string;
  hintIDs: string[];
}

/// A dealt word plus where it came from, so results screens can show both.
export interface DealtWord {
  categoryID: string;
  text: string;
}

export function wordKey(word: DealtWord): string {
  return `${word.categoryID}#${word.text}`;
}

export function categoryWords(category: WordCategory): string[] {
  return category.entries.map((entry) => entry.text);
}

/// Every hint line available for a word; category fallback if it has none.
export function hintTexts(category: WordCategory, word: string): string[] {
  const entry = category.entries.find((candidate) => candidate.text === word);
  if (!entry) return [category.hint];
  const texts = entry.hintIDs
    .map((id) => category.hints[id])
    .filter((text): text is string => Boolean(text));
  return texts.length === 0 ? [category.hint] : texts;
}

/// Mirrors the custom `Decodable` conformance in WordCategory.swift: the JSON key
/// is `words`, and each entry decodes from either a bare string or an object.
/// Throws rather than silently dropping data — a malformed word file should fail
/// the build, not a round.
export function parseCategory(raw: unknown, source: string): WordCategory {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`${source}: expected an object`);
  }
  const value = raw as Record<string, unknown>;

  const id = requireString(value.id, `${source}.id`);
  const name = requireString(value.name, `${source}.name`);
  const hint = requireString(value.hint, `${source}.hint`);

  const hints: Record<string, string> = {};
  if (value.hints !== undefined) {
    if (typeof value.hints !== 'object' || value.hints === null) {
      throw new Error(`${source}.hints: expected an object`);
    }
    for (const [key, text] of Object.entries(value.hints)) {
      hints[key] = requireString(text, `${source}.hints.${key}`);
    }
  }

  if (!Array.isArray(value.words)) {
    throw new Error(`${source}.words: expected an array`);
  }
  const entries = value.words.map((entry, index) =>
    parseEntry(entry, `${source}.words[${index}]`),
  );

  return { id, name, hint, hints, entries };
}

function parseEntry(raw: unknown, source: string): WordEntry {
  if (typeof raw === 'string') {
    return { text: raw, hintIDs: [] };
  }
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`${source}: expected a string or an object`);
  }
  const value = raw as Record<string, unknown>;
  const text = requireString(value.text, `${source}.text`);

  let hintIDs: string[] = [];
  if (value.hints !== undefined) {
    if (!Array.isArray(value.hints)) {
      throw new Error(`${source}.hints: expected an array`);
    }
    hintIDs = value.hints.map((id, index) =>
      requireString(id, `${source}.hints[${index}]`),
    );
  }

  return { text, hintIDs };
}

function requireString(value: unknown, source: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${source}: expected a string`);
  }
  return value;
}
