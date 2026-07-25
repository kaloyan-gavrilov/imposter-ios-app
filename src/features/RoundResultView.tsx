'use client';

import { useState } from 'react';

import { AvatarView } from '@/design/AvatarView';
import { PixelButton } from '@/design/PixelButton';
import { PixelPanel } from '@/design/PixelPanel';
import { PixelText, PixelTitle } from '@/design/PixelText';
import { PALETTE, grid } from '@/design/theme';
import {
  currentRound,
  isFinalRound,
  playerByID,
  standings,
} from '@/domain/engineStore';
import { OUTCOME_HEADLINE, isImposter } from '@/domain/round';
import { engine, useEngineState } from '@/domain/useEngine';

/// Stepped reveal: who was ejected → were they the imposter → the word → the points.
export function RoundResultView() {
  const [step, setStep] = useState(0);

  const state = useEngineState();
  const round = currentRound(state);
  const ejected = playerByID(state, round?.ejectedID);
  const imposters = round
    ? state.players.filter((player) => isImposter(round, player.id))
    : [];
  const ranked = standings(state);
  const lastDeltas = state.lastDeltas;
  const finalRound = isFinalRound(state);

  if (!round) return null;

  const buttonTitle =
    step < 3 ? 'Reveal More' : finalRound ? 'Final Scores' : 'Next Round';

  return (
    <div className="flex min-h-full flex-col" style={{ gap: grid(4) }}>
      <PixelText
        size="caption"
        color={PALETTE.inkDim}
        className="text-center"
        style={{ paddingTop: grid(5) }}
      >
        {`round ${round.number} result`}
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
                voted out
              </PixelText>
              {ejected ? (
                <>
                  <AvatarView
                    spriteID={ejected.spriteID}
                    paletteID={ejected.paletteID}
                    size={72}
                  />
                  <PixelTitle text={ejected.name} size="heading" />
                </>
              ) : (
                <>
                  <PixelText size="heading" color={PALETTE.gold}>
                    nobody
                  </PixelText>
                  <PixelText size="micro" color={PALETTE.inkDim}>
                    the vote tied twice
                  </PixelText>
                </>
              )}
              {step >= 1 && round.outcome && (
                <PixelText
                  color={
                    round.outcome === 'imposterCaught'
                      ? PALETTE.crew
                      : PALETTE.imposter
                  }
                >
                  {OUTCOME_HEADLINE[round.outcome]}
                </PixelText>
              )}
            </div>
          </PixelPanel>

          {step >= 1 && (
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
          )}

          {step >= 2 && (
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
                {round.imposterGuess && (
                  <PixelText
                    size="micro"
                    color="rgba(14,16,32,0.8)"
                    preserveCase
                    className="text-balance"
                  >
                    {round.imposterGuessedCorrectly
                      ? `imposter guessed it: ${round.imposterGuess}`
                      : `imposter guessed ${round.imposterGuess} — wrong`}
                  </PixelText>
                )}
              </div>
            </PixelPanel>
          )}

          {step >= 3 && (
            <PixelPanel>
              <div className="flex flex-col" style={{ gap: grid(2) }}>
                <PixelText size="micro" color={PALETTE.inkDim}>
                  scores
                </PixelText>
                {ranked.map((entry) => (
                  <div
                    key={entry.player.id}
                    className="flex items-center"
                    style={{ gap: grid(2) }}
                  >
                    <AvatarView
                      spriteID={entry.player.spriteID}
                      paletteID={entry.player.paletteID}
                      size={28}
                    />
                    <PixelText size="caption" className="flex-1 truncate">
                      {entry.player.name}
                    </PixelText>
                    {(lastDeltas[entry.player.id] ?? 0) > 0 && (
                      <PixelText size="caption" color={PALETTE.crew}>
                        {`+${lastDeltas[entry.player.id]}`}
                      </PixelText>
                    )}
                    <PixelText
                      color={PALETTE.gold}
                      className="text-right"
                      style={{ width: 36 }}
                    >
                      {entry.score}
                    </PixelText>
                  </div>
                ))}
              </div>
            </PixelPanel>
          )}
        </div>
      </div>

      <div className="w-full" style={{ paddingBottom: grid(6) }}>
        <PixelButton
          onClick={() => {
            if (step < 3) setStep(step + 1);
            else engine().continueAfterResult();
          }}
        >
          {buttonTitle}
        </PixelButton>
      </div>
    </div>
  );
}
