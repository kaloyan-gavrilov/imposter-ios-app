import { AVATAR_SPRITES } from '@/art/avatarSprites';
import { AVATAR_PALETTES } from '@/art/palettes';

export interface Player {
  id: string;
  name: string;
  spriteID: string;
  paletteID: string;
}

export const PLAYER_MIN_COUNT = 3;
export const PLAYER_MAX_COUNT = 16;

/// Next unused sprite/palette combo so freshly added players never look alike.
export function makePlayer(name: string, existing: readonly Player[]): Player {
  const usedSprites = new Set(existing.map((player) => player.spriteID));
  const sprite =
    AVATAR_SPRITES.find((candidate) => !usedSprites.has(candidate.id)) ??
    AVATAR_SPRITES[existing.length % AVATAR_SPRITES.length];
  const palette = AVATAR_PALETTES[existing.length % AVATAR_PALETTES.length];

  return {
    id: crypto.randomUUID(),
    name,
    spriteID: sprite.id,
    paletteID: palette.id,
  };
}

export function cycleSprite(player: Player, step = 1): Player {
  const index = AVATAR_SPRITES.findIndex((s) => s.id === player.spriteID);
  const from = index === -1 ? 0 : index;
  const next =
    (from + step + AVATAR_SPRITES.length) % AVATAR_SPRITES.length;
  return { ...player, spriteID: AVATAR_SPRITES[next].id };
}

export function cyclePalette(player: Player, step = 1): Player {
  const index = AVATAR_PALETTES.findIndex((p) => p.id === player.paletteID);
  const from = index === -1 ? 0 : index;
  const next =
    (from + step + AVATAR_PALETTES.length) % AVATAR_PALETTES.length;
  return { ...player, paletteID: AVATAR_PALETTES[next].id };
}
