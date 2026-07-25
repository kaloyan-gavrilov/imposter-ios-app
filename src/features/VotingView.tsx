'use client';

import { useEffect, useState } from 'react';

import { AvatarView } from '@/design/AvatarView';
import { PixelButton } from '@/design/PixelButton';
import { PixelText, PixelTitle } from '@/design/PixelText';
import { PALETTE, grid } from '@/design/theme';
import { currentRound, votingPlayer } from '@/domain/engineStore';
import { engine, useEngine } from '@/domain/useEngine';
import { haptics } from '@/lib/haptics';

/// Secret voting: the device goes round again, each player taps their pick, and
/// a handoff screen sits between voters so nobody sees the previous choice.
export function VotingView() {
  const voteIndex = useEngine((state) => state.voteIndex);
  const players = useEngine((state) => state.players);
  const voter = useEngine(votingPlayer);
  const wasRevote = useEngine(
    (state) => currentRound(state)?.wasRevote ?? false,
  );

  const [handoff, setHandoff] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

  // Cover the ballot again the moment the device changes hands.
  useEffect(() => {
    setHandoff(true);
    setPending(null);
  }, [voteIndex]);

  return (
    <div className="flex min-h-full flex-col" style={{ gap: grid(4) }}>
      <div
        className="flex w-full items-center justify-between"
        style={{ paddingTop: grid(4) }}
      >
        <PixelText
          size="caption"
          color={wasRevote ? PALETTE.gold : PALETTE.inkDim}
        >
          {wasRevote ? 'revote' : 'vote'}
        </PixelText>
        <PixelText size="caption" color={PALETTE.inkDim}>
          {`${voteIndex + 1}/${players.length}`}
        </PixelText>
      </div>

      {handoff ? (
        <div
          className="flex flex-1 flex-col items-center justify-center"
          style={{ gap: grid(5) }}
        >
          <div className="flex-1" />
          {voter && (
            <>
              <AvatarView
                spriteID={voter.spriteID}
                paletteID={voter.paletteID}
                size={96}
              />
              <PixelText size="caption" color={PALETTE.inkDim}>
                pass to
              </PixelText>
              <PixelTitle text={voter.name} size="title" />
            </>
          )}
          <div className="flex-1" />
          <div className="w-full" style={{ paddingBottom: grid(6) }}>
            <PixelButton feedback="tap" onClick={() => setHandoff(false)}>
              It&apos;s Me — Vote
            </PixelButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col" style={{ gap: grid(4) }}>
          <PixelText className="text-center">who is the imposter?</PixelText>

          <div className="hide-scrollbars flex-1 overflow-y-auto">
            <div
              className="grid grid-cols-2"
              style={{ gap: grid(2), paddingBlock: grid(2) }}
            >
              {players
                .filter((candidate) => candidate.id !== voter?.id)
                .map((candidate) => {
                  const selected = pending === candidate.id;
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        haptics.select();
                        setPending(candidate.id);
                      }}
                      className="flex flex-col items-center"
                      style={{
                        gap: grid(1),
                        background: selected
                          ? PALETTE.imposter
                          : PALETTE.surface,
                        borderWidth: selected ? 3 : 2,
                        borderStyle: 'solid',
                        borderColor: selected
                          ? PALETTE.ink
                          : PALETTE.surfaceRaised,
                        paddingBlock: grid(2),
                      }}
                    >
                      <AvatarView
                        spriteID={candidate.spriteID}
                        paletteID={candidate.paletteID}
                        size={52}
                      />
                      <PixelText
                        size="caption"
                        color={selected ? PALETTE.background : PALETTE.ink}
                      >
                        {candidate.name}
                      </PixelText>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="w-full" style={{ paddingBottom: grid(6) }}>
            <PixelButton
              fill={PALETTE.imposter}
              disabled={pending === null}
              onClick={() => {
                if (!voter || !pending) return;
                engine().castVote(voter.id, pending);
              }}
            >
              Lock In Vote
            </PixelButton>
          </div>
        </div>
      )}
    </div>
  );
}
