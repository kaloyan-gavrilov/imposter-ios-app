'use client';

import { useState } from 'react';

import { AvatarView } from '@/design/AvatarView';
import { PixelButton } from '@/design/PixelButton';
import { PixelText, PixelTitle } from '@/design/PixelText';
import { PALETTE, grid } from '@/design/theme';
import { currentRound, playerByID } from '@/domain/engineStore';
import { IMPOSTER_GUESS_POINTS } from '@/domain/scoring';
import { engine, useEngine } from '@/domain/useEngine';

/// The caught imposter gets one shot at naming the secret word for a comeback.
export function ImposterGuessView() {
  const caught = useEngine((state) =>
    playerByID(state, currentRound(state)?.ejectedID),
  );
  const [guess, setGuess] = useState('');

  const empty = guess.trim().length === 0;

  function submit() {
    const value = guess.trim();
    if (value.length === 0) return;
    engine().submitImposterGuess(value);
  }

  return (
    <div
      className="flex min-h-full flex-col items-center"
      style={{ gap: grid(5) }}
    >
      <div className="flex-1" />

      {caught && (
        <>
          <AvatarView
            spriteID={caught.spriteID}
            paletteID={caught.paletteID}
            size={88}
          />
          <PixelTitle
            text={caught.name}
            size="title"
            shadowColor={PALETTE.imposter}
          />
        </>
      )}

      <PixelText
        size="caption"
        color={PALETTE.inkDim}
        className="text-center text-balance"
      >
        {`caught! name the word for ${IMPOSTER_GUESS_POINTS} points`}
      </PixelText>

      <form
        className="w-full"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <input
          value={guess}
          onChange={(event) => setGuess(event.target.value)}
          placeholder="YOUR GUESS"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="done"
          className="w-full text-center outline-none"
          style={{
            background: PALETTE.surface,
            border: `3px solid ${PALETTE.ink}`,
            color: PALETTE.ink,
            padding: grid(4),
            letterSpacing: 1.5,
          }}
        />
      </form>

      <div className="flex-1" />

      <div
        className="flex w-full flex-col"
        style={{ gap: grid(3), paddingBottom: grid(6) }}
      >
        <PixelButton disabled={empty} onClick={submit}>
          Submit Guess
        </PixelButton>
        <PixelButton
          fill={PALETTE.surfaceRaised}
          size="body"
          feedback="tap"
          onClick={() => engine().skipImposterGuess()}
        >
          No Idea
        </PixelButton>
      </div>
    </div>
  );
}
