'use client';

import { useEffect, useState } from 'react';

import { AvatarView } from '@/design/AvatarView';
import { PixelButton, TextButton } from '@/design/PixelButton';
import { PixelPanel } from '@/design/PixelPanel';
import { PixelText, PixelTitle } from '@/design/PixelText';
import { PALETTE, grid } from '@/design/theme';
import {
  cardFor,
  currentRound,
  isImposterCard,
  revealPlayer,
  type RevealCard,
} from '@/domain/engineStore';
import { engine, useEngineState } from '@/domain/useEngine';
import { haptics } from '@/lib/haptics';

/// Pass-and-play reveal. The card only shows while a finger is held down, so a
/// glance over the shoulder is much harder to pull off.
///
/// Unlike the iOS version, the web cannot block screenshots — but the hold is
/// still released the moment the tab loses focus, so the card can't be left
/// exposed by switching apps.
export function RevealView() {
  const [holding, setHolding] = useState(false);

  const state = useEngineState();
  const player = revealPlayer(state);
  const card = player ? cardFor(state, player) : null;
  const round = currentRound(state);
  const roundNumber = round?.number ?? 1;
  const revealIndex = state.revealIndex;
  const total = state.players.length;
  const isLast = !round || revealIndex + 1 >= round.revealOrder.length;

  // Never leave a card revealed when the player looks away from the page.
  useEffect(() => {
    const release = () => setHolding(false);
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', release);
    return () => {
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', release);
    };
  }, []);

  // A fresh player means a fresh, covered card.
  useEffect(() => setHolding(false), [revealIndex]);

  if (!player || !card) return null;

  const fill = holding
    ? isImposterCard(card)
      ? PALETTE.imposter
      : PALETTE.crew
    : PALETTE.surface;

  return (
    <div className="flex min-h-full flex-col items-center" style={{ gap: grid(6) }}>
      <div
        className="flex w-full items-center justify-between"
        style={{ paddingTop: grid(4) }}
      >
        <TextButton onClick={() => engine().endGame()}>Home</TextButton>
        <PixelText size="caption" color={PALETTE.inkDim}>
          {`round ${roundNumber} · ${revealIndex + 1}/${total}`}
        </PixelText>
        <TextButton
          onClick={() => {
            setHolding(false);
            engine().skipRound();
          }}
        >
          Skip
        </TextButton>
      </div>

      <div className="flex-1" />

      <AvatarView
        spriteID={player.spriteID}
        paletteID={player.paletteID}
        size={96}
      />
      <PixelText size="caption" color={PALETTE.inkDim}>
        pass to
      </PixelText>
      <PixelTitle text={player.name} size="title" />

      <div
        className="no-touch-callout w-full"
        onPointerDown={(event) => {
          event.preventDefault();
          if (!holding) {
            setHolding(true);
            haptics.thud();
          }
        }}
        onPointerUp={() => setHolding(false)}
        onPointerCancel={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
        onContextMenu={(event) => event.preventDefault()}
      >
        <PixelPanel
          fill={fill}
          border={PALETTE.ink}
          padding={grid(5)}
          style={{ transition: 'background 120ms ease-out' }}
        >
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{ gap: grid(3), minHeight: 140 }}
          >
            {holding ? (
              <RevealedContent card={card} />
            ) : (
              <>
                <PixelText color={PALETTE.inkDim}>hold to reveal</PixelText>
                <PixelText size="micro" color={PALETTE.inkDim}>
                  keep your finger down
                </PixelText>
              </>
            )}
          </div>
        </PixelPanel>
      </div>

      <div className="flex-1" />

      <div className="w-full" style={{ paddingBottom: grid(6) }}>
        <PixelButton
          fill={PALETTE.surfaceRaised}
          feedback="tap"
          onClick={() => {
            setHolding(false);
            engine().advanceReveal();
          }}
        >
          {isLast ? 'Start Discussion' : 'Got It — Pass On'}
        </PixelButton>
      </div>
    </div>
  );
}

function RevealedContent({ card }: { card: RevealCard }) {
  if (card.kind === 'crew') {
    return (
      <>
        <PixelText size="micro" color="rgba(14,16,32,0.7)">
          your word
        </PixelText>
        <PixelText
          size="heading"
          color={PALETTE.background}
          preserveCase
          className="text-balance"
        >
          {card.word}
        </PixelText>
      </>
    );
  }

  return (
    <>
      <PixelText size="micro" color="rgba(242,240,230,0.8)">
        you are the
      </PixelText>
      <PixelTitle
        text="Imposter"
        size="title"
        shadowColor={PALETTE.imposterDark}
      />
      {card.kind === 'imposterBlind' ? (
        <PixelText size="caption">no word. blend in.</PixelText>
      ) : (
        <PixelText size="caption" preserveCase className="text-balance">
          {card.hint}
        </PixelText>
      )}
      {card.partners.length > 0 && (
        <PixelText size="micro" color="rgba(242,240,230,0.8)">
          {`with ${card.partners.join(', ')}`}
        </PixelText>
      )}
    </>
  );
}
