'use client';

import { useRef, useState } from 'react';

import { AvatarTile } from '@/design/AvatarView';
import { PixelButton } from '@/design/PixelButton';
import { PixelText } from '@/design/PixelText';
import { ScreenHeader } from '@/design/Chrome';
import { FONT_SIZE, PALETTE, grid } from '@/design/theme';
import { PLAYER_MAX_COUNT, type Player } from '@/domain/player';
import { useRoster } from '@/domain/rosterStore';
import { engine } from '@/domain/useEngine';
import { haptics } from '@/lib/haptics';
import { useLongPress } from '@/lib/useLongPress';

export function PlayerSetupView() {
  const players = useRoster((state) => state.players);
  const add = useRoster((state) => state.add);
  const nameExists = useRoster((state) => state.nameExists);

  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function addPlayer() {
    const name = draft.trim();
    if (name.length === 0) return;

    if (players.length >= PLAYER_MAX_COUNT) {
      setError(`max ${PLAYER_MAX_COUNT} players`);
      haptics.warning();
      return;
    }
    if (nameExists(name)) {
      setError(`${name.toUpperCase()} is already playing`);
      haptics.warning();
      return;
    }

    add(name);
    setDraft('');
    setError(null);
    haptics.tap();
    inputRef.current?.focus();
  }

  const canAddMore = players.length < PLAYER_MAX_COUNT;

  return (
    <div className="flex min-h-full flex-col" style={{ gap: grid(4) }}>
      <ScreenHeader
        title="Players"
        subtitle={`${players.length}/${PLAYER_MAX_COUNT}`}
        onBack={() => engine().goHome()}
      />

      <form
        className="flex w-full items-stretch"
        style={{ gap: grid(2) }}
        onSubmit={(event) => {
          event.preventDefault();
          addPlayer();
        }}
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="NAME"
          maxLength={12}
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="done"
          className="min-w-0 flex-1 uppercase outline-none"
          style={{
            background: PALETTE.surface,
            border: `3px solid ${PALETTE.ink}`,
            color: PALETTE.ink,
            padding: grid(3),
            letterSpacing: 1.5,
          }}
        />
        <PixelButton
          size="body"
          fullWidth={false}
          disabled={!canAddMore}
          feedback="none"
          onClick={addPlayer}
          className="shrink-0"
        >
          Add
        </PixelButton>
      </form>

      {error && (
        <PixelText size="caption" color={PALETTE.imposter}>
          {error}
        </PixelText>
      )}

      {players.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <PixelText color={PALETTE.inkDim}>nobody here yet</PixelText>
        </div>
      ) : (
        <div className="hide-scrollbars flex-1 overflow-y-auto">
          <div
            className="flex flex-col"
            style={{ gap: grid(3), paddingBlock: grid(2) }}
          >
            {players.map((player) => (
              <PlayerRow key={player.id} player={player} />
            ))}
          </div>
        </div>
      )}

      <PixelText
        size="caption"
        color={PALETTE.inkDim}
        className="text-center"
        style={{ paddingBottom: grid(4) }}
      >
        tap avatar to change · hold to recolour
      </PixelText>
    </div>
  );
}

function PlayerRow({ player }: { player: Player }) {
  const nextSprite = useRoster((state) => state.nextSprite);
  const nextPalette = useRoster((state) => state.nextPalette);
  const remove = useRoster((state) => state.remove);

  // Tap cycles the sprite, long-press recolours — same as the Swift row.
  const avatarHandlers = useLongPress({
    onTap: () => {
      haptics.select();
      nextSprite(player.id);
    },
    onLongPress: () => {
      haptics.tap();
      nextPalette(player.id);
    },
  });

  return (
    <div
      className="flex items-center"
      style={{
        gap: grid(3),
        background: PALETTE.surface,
        border: `2px solid ${PALETTE.surfaceRaised}`,
        padding: grid(2),
      }}
    >
      <button
        type="button"
        aria-label={`Change ${player.name}'s avatar`}
        className="no-touch-callout shrink-0"
        {...avatarHandlers}
      >
        <AvatarTile spriteID={player.spriteID} paletteID={player.paletteID} size={44} />
      </button>

      <PixelText className="flex-1 truncate">{player.name}</PixelText>

      <button
        type="button"
        aria-label={`Remove ${player.name}`}
        onClick={() => {
          haptics.warning();
          remove(player.id);
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center"
        style={{
          background: PALETTE.surface,
          border: `2px solid ${PALETTE.imposterDark}`,
          color: PALETTE.imposter,
          fontSize: FONT_SIZE.body,
        }}
      >
        X
      </button>
    </div>
  );
}
