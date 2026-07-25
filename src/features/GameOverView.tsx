'use client';

import { AvatarView } from '@/design/AvatarView';
import { PixelButton } from '@/design/PixelButton';
import { PixelText, PixelTitle } from '@/design/PixelText';
import { PALETTE, grid } from '@/design/theme';
import { standings } from '@/domain/engineStore';
import { engine, useEngineState } from '@/domain/useEngine';

export function GameOverView() {
  const podium = standings(useEngineState());
  const winner = podium[0];

  return (
    <div className="flex min-h-full flex-col" style={{ gap: grid(4) }}>
      <div className="flex justify-center" style={{ paddingTop: grid(8) }}>
        <PixelTitle text="Game Over" size="title" />
      </div>

      {winner && (
        <div className="flex flex-col items-center" style={{ gap: grid(2) }}>
          <AvatarView
            spriteID={winner.player.spriteID}
            paletteID={winner.player.paletteID}
            size={104}
          />
          <PixelText size="micro" color={PALETTE.inkDim}>
            winner
          </PixelText>
          <PixelTitle
            text={winner.player.name}
            size="heading"
            shadowColor={PALETTE.gold}
          />
          <PixelText size="caption" color={PALETTE.gold}>
            {`${winner.score} points`}
          </PixelText>
        </div>
      )}

      <div className="hide-scrollbars flex-1 overflow-y-auto">
        <div
          className="flex flex-col"
          style={{ gap: grid(2), paddingBlock: grid(2) }}
        >
          {podium.map((entry, index) => (
            <div
              key={entry.player.id}
              className="flex items-center"
              style={{
                gap: grid(2),
                background: PALETTE.surface,
                border: `2px solid ${index === 0 ? PALETTE.gold : PALETTE.surfaceRaised}`,
                padding: grid(2),
              }}
            >
              <PixelText
                size="caption"
                color={PALETTE.inkDim}
                className="text-center"
                style={{ width: 24 }}
              >
                {index + 1}
              </PixelText>
              <AvatarView
                spriteID={entry.player.spriteID}
                paletteID={entry.player.paletteID}
                size={32}
              />
              <PixelText size="caption" className="flex-1 truncate">
                {entry.player.name}
              </PixelText>
              <PixelText color={index === 0 ? PALETTE.gold : PALETTE.ink}>
                {entry.score}
              </PixelText>
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex w-full flex-col"
        style={{ gap: grid(3), paddingBottom: grid(6) }}
      >
        <PixelButton onClick={() => engine().playAgainSamePlayers()}>
          Play Again
        </PixelButton>
        <PixelButton
          fill={PALETTE.surfaceRaised}
          size="body"
          feedback="tap"
          onClick={() => engine().endGame()}
        >
          Main Menu
        </PixelButton>
      </div>
    </div>
  );
}
