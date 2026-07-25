import type { CSSProperties } from 'react';

import { spriteByID } from '@/art/avatarSprites';
import { paletteByID } from '@/art/palettes';
import { SPRITE_MARKUP } from '@/art/generated/sprites';
import { PALETTE, grid } from './theme';

interface AvatarViewProps {
  spriteID: string;
  paletteID: string;
  size?: number;
}

/// Draws a pre-rendered sprite. The five palette slots arrive as CSS custom
/// properties so one generated SVG covers all eight palettes.
export function AvatarView({ spriteID, paletteID, size = 64 }: AvatarViewProps) {
  const sprite = spriteByID(spriteID);
  const palette = paletteByID(paletteID);
  const markup = SPRITE_MARKUP[sprite.id] ?? '';

  const slots = Object.fromEntries(
    palette.hexes.map((hex, index) => [`--pal-${index}`, hex]),
  ) as CSSProperties;

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      role="img"
      aria-label={sprite.name}
      shapeRendering="crispEdges"
      style={{ ...slots, display: 'block', flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

interface AvatarTileProps extends AvatarViewProps {
  background?: string;
  border?: string;
}

/// Avatar inside a framed tile — the standard way players appear in lists/grids.
export function AvatarTile({
  background = PALETTE.surface,
  border = PALETTE.ink,
  ...avatar
}: AvatarTileProps) {
  return (
    <div
      className="inline-block"
      style={{
        background,
        border: `3px solid ${border}`,
        padding: grid(1),
        lineHeight: 0,
      }}
    >
      <AvatarView {...avatar} />
    </div>
  );
}
