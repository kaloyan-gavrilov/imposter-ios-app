'use client';

import { AVATAR_SPRITES } from '@/art/avatarSprites';
import { AVATAR_PALETTES } from '@/art/palettes';
import { AvatarView } from '@/design/AvatarView';
import { PixelButton } from '@/design/PixelButton';
import { PixelText, PixelTitle } from '@/design/PixelText';
import { PALETTE, grid } from '@/design/theme';
import { PLAYER_MIN_COUNT } from '@/domain/player';
import { useRoster } from '@/domain/rosterStore';
import { engine } from '@/domain/useEngine';

export function HomeView() {
  const players = useRoster((state) => state.players);
  const canStart = players.length >= PLAYER_MIN_COUNT;

  return (
    <div
      className="flex min-h-full flex-col items-center"
      style={{ gap: grid(8) }}
    >
      <div className="flex-1" />

      <div className="flex flex-col items-center" style={{ gap: grid(3) }}>
        <PixelTitle text="Imposter" size="display" />
        <PixelText size="caption" color={PALETTE.inkDim}>
          one of you is lying
        </PixelText>
      </div>

      <div className="flex" style={{ marginInline: grid(2) }}>
        {AVATAR_SPRITES.slice(0, 5).map((sprite, index) => (
          <div key={sprite.id} style={{ marginLeft: index === 0 ? 0 : -grid(2) }}>
            <AvatarView
              spriteID={sprite.id}
              paletteID={AVATAR_PALETTES[index % AVATAR_PALETTES.length].id}
              size={52}
            />
          </div>
        ))}
      </div>

      <div className="flex-1" />

      <div
        className="flex w-full flex-col items-center"
        style={{ gap: grid(4), paddingBottom: grid(10) }}
      >
        <PixelButton
          disabled={!canStart}
          onClick={() => engine().openSettings()}
        >
          Start Game
        </PixelButton>

        <PixelButton
          fill={PALETTE.surfaceRaised}
          feedback="tap"
          onClick={() => engine().openPlayers()}
        >
          {`Players (${players.length})`}
        </PixelButton>

        {!canStart && (
          <PixelText size="caption" color={PALETTE.imposter}>
            {`add at least ${PLAYER_MIN_COUNT} players`}
          </PixelText>
        )}
      </div>
    </div>
  );
}
