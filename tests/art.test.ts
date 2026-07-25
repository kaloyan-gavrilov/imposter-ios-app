import { describe, expect, test } from 'vitest';

import {
  AVATAR_SPRITES,
  SPRITE_SIDE,
  spriteSlot,
} from '@/art/avatarSprites';
import { AVATAR_PALETTES } from '@/art/palettes';
import {
  CATEGORY_ICONS,
  ICON_SIDE,
  UNKNOWN_ICON,
  iconSlot,
} from '@/art/categoryIcons';
import { mergeRuns } from '@/art/mergeRuns';
import { SPRITE_MARKUP } from '@/art/generated/sprites';
import { ICON_MARKUP } from '@/art/generated/icons';

describe('sprites', () => {
  test('every sprite is sixteen by sixteen', () => {
    for (const sprite of AVATAR_SPRITES) {
      expect(sprite.rows, `${sprite.id} row count`).toHaveLength(SPRITE_SIDE);
      for (const row of sprite.rows) {
        expect(row.length, `${sprite.id} row width: ${row}`).toBe(SPRITE_SIDE);
      }
    }
  });

  test('sprite ids are unique', () => {
    const ids = new Set(AVATAR_SPRITES.map((sprite) => sprite.id));
    expect(ids.size).toBe(AVATAR_SPRITES.length);
  });

  test('sprites only use known characters', () => {
    for (const sprite of AVATAR_SPRITES) {
      for (const row of sprite.rows) {
        expect(/^[.12345]*$/.test(row), `${sprite.id} has stray characters`).toBe(
          true,
        );
      }
    }
  });

  test('palettes cover every slot', () => {
    for (const palette of AVATAR_PALETTES) {
      expect(palette.hexes, `${palette.id} needs 5 colours`).toHaveLength(5);
    }
  });

  test('palette ids are unique', () => {
    const ids = new Set(AVATAR_PALETTES.map((palette) => palette.id));
    expect(ids.size).toBe(AVATAR_PALETTES.length);
  });
});

describe('category icons', () => {
  test('every icon is sixteen by sixteen with six colours', () => {
    for (const icon of [...CATEGORY_ICONS, UNKNOWN_ICON]) {
      expect(icon.rows, `${icon.id} row count`).toHaveLength(ICON_SIDE);
      for (const row of icon.rows) {
        expect(row.length, `${icon.id} row width: ${row}`).toBe(ICON_SIDE);
        expect(/^[.123456]*$/.test(row), `${icon.id} stray chars`).toBe(true);
      }
      expect(icon.hexes, `${icon.id} needs 6 colours`).toHaveLength(6);
    }
  });
});

/// Guards the build-time codegen: merged rects must cover exactly the pixels the
/// source ASCII grid describes, with the same slot at every position.
describe('generated svg', () => {
  function expandRuns(
    rows: readonly string[],
    slotOf: (character: string) => number | null,
  ): Map<string, number> {
    const pixels = new Map<string, number>();
    for (const run of mergeRuns(rows, slotOf)) {
      for (let x = run.x; x < run.x + run.width; x += 1) {
        pixels.set(`${x},${run.y}`, run.slot);
      }
    }
    return pixels;
  }

  function sourcePixels(
    rows: readonly string[],
    slotOf: (character: string) => number | null,
  ): Map<string, number> {
    const pixels = new Map<string, number>();
    rows.forEach((row, y) => {
      [...row].forEach((character, x) => {
        const slot = slotOf(character);
        if (slot !== null) pixels.set(`${x},${y}`, slot);
      });
    });
    return pixels;
  }

  test('merged runs cover the same pixels as every sprite grid', () => {
    for (const sprite of AVATAR_SPRITES) {
      expect(
        [...expandRuns(sprite.rows, spriteSlot).entries()].sort(),
        sprite.id,
      ).toEqual([...sourcePixels(sprite.rows, spriteSlot).entries()].sort());
    }
  });

  test('merged runs cover the same pixels as every icon grid', () => {
    for (const icon of [...CATEGORY_ICONS, UNKNOWN_ICON]) {
      expect(
        [...expandRuns(icon.rows, iconSlot).entries()].sort(),
        icon.id,
      ).toEqual([...sourcePixels(icon.rows, iconSlot).entries()].sort());
    }
  });

  test('generated markup exists for every sprite and icon', () => {
    for (const sprite of AVATAR_SPRITES) {
      expect(SPRITE_MARKUP[sprite.id], sprite.id).toBeTruthy();
    }
    for (const icon of [...CATEGORY_ICONS, UNKNOWN_ICON]) {
      expect(ICON_MARKUP[icon.id], icon.id).toBeTruthy();
    }
  });

  test('generated markup is smaller than one rect per pixel', () => {
    for (const sprite of AVATAR_SPRITES) {
      const rects = SPRITE_MARKUP[sprite.id].match(/<rect/g)?.length ?? 0;
      expect(rects, sprite.id).toBeLessThan(SPRITE_SIDE * SPRITE_SIDE);
    }
  });
});
