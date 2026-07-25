'use client';

import { useEffect, useRef } from 'react';

import { AvatarView } from '@/design/AvatarView';
import { PixelButton, TextButton } from '@/design/PixelButton';
import { PixelPanel } from '@/design/PixelPanel';
import { PixelText, PixelTitle } from '@/design/PixelText';
import { PALETTE, grid } from '@/design/theme';
import { currentRound, playerByID } from '@/domain/engineStore';
import { engine, useEngine } from '@/domain/useEngine';
import { haptics } from '@/lib/haptics';
import { useCountdown, useWakeLock } from '@/lib/useCountdown';

export function DiscussionView() {
  const roundNumber = useEngine((state) => currentRound(state)?.number ?? 1);
  const timer = useEngine((state) => state.settings.timer);
  const noVoting = useEngine((state) => state.settings.noVoting);
  const firstSpeaker = useEngine((state) =>
    playerByID(state, currentRound(state)?.firstSpeakerID),
  );

  const { remaining, running, toggle } = useCountdown(timer);
  useWakeLock(true);

  // Buzz on the run-in and once at zero, matching the Swift tick handler.
  const lastBuzzed = useRef<number | null>(null);
  useEffect(() => {
    if (timer === 0 || !running) return;
    if (lastBuzzed.current === remaining) return;
    lastBuzzed.current = remaining;

    if (remaining === 0) haptics.warning();
    else if (remaining <= 5) haptics.tap();
  }, [remaining, running, timer]);

  const timerFill =
    remaining === 0
      ? PALETTE.imposter
      : remaining <= 10
        ? PALETTE.gold
        : PALETTE.surface;

  const timeString = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;

  return (
    <div
      className="flex min-h-full flex-col items-center"
      style={{ gap: grid(6) }}
    >
      <div
        className="flex w-full items-center justify-between"
        style={{ paddingTop: grid(4) }}
      >
        <TextButton onClick={() => engine().endGame()}>Home</TextButton>
        <PixelText size="caption" color={PALETTE.inkDim}>
          {`round ${roundNumber} · discuss`}
        </PixelText>
        <TextButton onClick={() => engine().skipRound()}>Skip</TextButton>
      </div>

      <div className="flex-1" />

      {firstSpeaker && (
        <div className="flex flex-col items-center" style={{ gap: grid(2) }}>
          <PixelText size="caption" color={PALETTE.inkDim}>
            first word goes to
          </PixelText>
          <AvatarView
            spriteID={firstSpeaker.spriteID}
            paletteID={firstSpeaker.paletteID}
            size={72}
          />
          <PixelTitle text={firstSpeaker.name} size="heading" />
        </div>
      )}

      {timer !== 0 ? (
        <div className="flex flex-col items-center" style={{ gap: grid(4) }}>
          <PixelPanel fill={timerFill} padding={grid(6)}>
            <PixelText
              size="display"
              color={remaining <= 10 ? PALETTE.background : PALETTE.ink}
            >
              {timeString}
            </PixelText>
          </PixelPanel>

          <PixelButton
            fill={PALETTE.surfaceRaised}
            size="body"
            fullWidth={false}
            feedback="tap"
            onClick={toggle}
          >
            {running ? 'Pause' : 'Resume'}
          </PixelButton>
        </div>
      ) : (
        <PixelText color={PALETTE.inkDim}>talk it out. no timer.</PixelText>
      )}

      <div className="flex-1" />

      <div className="w-full" style={{ paddingBottom: grid(6) }}>
        <PixelButton
          onClick={() =>
            noVoting ? engine().revealNoVote() : engine().beginVoting()
          }
        >
          {noVoting ? 'Reveal Imposter' : 'Vote Now'}
        </PixelButton>
      </div>
    </div>
  );
}
