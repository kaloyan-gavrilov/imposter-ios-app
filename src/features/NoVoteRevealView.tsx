'use client';

import { AvatarView } from '@/design/AvatarView';
import { PixelButton } from '@/design/PixelButton';
import { PixelPanel } from '@/design/PixelPanel';
import { PixelText, PixelTitle } from '@/design/PixelText';
import { PALETTE, grid } from '@/design/theme';
import { currentRound, isFinalRound } from '@/domain/engineStore';
import { engine, useEngineState } from '@/domain/useEngine';

/// No-voting mode: just show who the imposter(s) were and the word. No
/// ejection, no scoring, no scoreboard.
export function NoVoteRevealView() {
  const state = useEngineState();
  const round = currentRound(state);
  const imposters = round
    ? state.players.filter((player) => round.imposterIDs.includes(player.id))
    : [];
  const finalRound = isFinalRound(state);

  if (!round) return null;

  return (
    <div className="flex min-h-full flex-col" style={{ gap: grid(4) }}>
      <PixelText
        size="caption"
        color={PALETTE.inkDim}
        className="text-center"
        style={{ paddingTop: grid(5) }}
      >
        {`round ${round.number} reveal`}
      </PixelText>

      <div className="hide-scrollbars flex-1 overflow-y-auto">
        <div
          className="flex flex-col"
          style={{ gap: grid(4), paddingBlock: grid(2) }}
        >
          <PixelPanel>
            <div
              className="flex w-full flex-col items-center"
              style={{ gap: grid(2) }}
            >
              <PixelText size="micro" color={PALETTE.inkDim}>
                {imposters.length > 1
                  ? 'the imposters were'
                  : 'the imposter was'}
              </PixelText>
              <div className="flex justify-center" style={{ gap: grid(3) }}>
                {imposters.map((imposter) => (
                  <div
                    key={imposter.id}
                    className="flex flex-col items-center"
                    style={{ gap: grid(1) }}
                  >
                    <AvatarView
                      spriteID={imposter.spriteID}
                      paletteID={imposter.paletteID}
                      size={56}
                    />
                    <PixelText size="caption">{imposter.name}</PixelText>
                  </div>
                ))}
              </div>
            </div>
          </PixelPanel>

          <PixelPanel fill={PALETTE.crew}>
            <div
              className="flex w-full flex-col items-center text-center"
              style={{ gap: grid(2) }}
            >
              <PixelText size="micro" color="rgba(14,16,32,0.7)">
                the word was
              </PixelText>
              <PixelText
                size="heading"
                color={PALETTE.background}
                preserveCase
                className="text-balance"
              >
                {round.word.text}
              </PixelText>
            </div>
          </PixelPanel>
        </div>
      </div>

      <div className="w-full" style={{ paddingBottom: grid(6) }}>
        <PixelButton onClick={() => engine().finishNoVoteRound()}>
          {finalRound ? 'End Game' : 'Next Round'}
        </PixelButton>
      </div>
    </div>
  );
}
