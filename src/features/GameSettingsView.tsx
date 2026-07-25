'use client';

import { wordBank } from '@/content/wordBank';
import { CategoryIconView } from '@/design/CategoryIconView';
import { ChipButton, PixelButton } from '@/design/PixelButton';
import { PixelText } from '@/design/PixelText';
import { ScreenHeader, SettingsSection, ToggleRow } from '@/design/Chrome';
import { PALETTE, grid } from '@/design/theme';
import { useRoster } from '@/domain/rosterStore';
import { engine, useEngine } from '@/domain/useEngine';
import {
  DISCUSSION_TIMERS,
  DISCUSSION_TIMER_TITLE,
  IMPOSTER_MODES,
  IMPOSTER_MODE_EXPLANATION,
  IMPOSTER_MODE_TITLE,
  ROUND_OPTIONS,
  maxImposters,
  validationMessage,
} from '@/domain/settings';
import { categoryWords } from '@/domain/word';
import { haptics } from '@/lib/haptics';

export function GameSettingsView() {
  const players = useRoster((state) => state.players);
  const settings = useEngine((state) => state.settings);

  const playerCount = players.length;
  const allowedImposters = maxImposters(playerCount);
  const validation = validationMessage(settings, playerCount);

  function toggleCategory(id: string) {
    haptics.select();
    const selected = settings.categoryIDs.includes(id);
    engine().setSettings({
      categoryIDs: selected
        ? settings.categoryIDs.filter((existing) => existing !== id)
        : [...settings.categoryIDs, id],
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <ScreenHeader
        title="Setup"
        subtitle={`${playerCount} players`}
        onBack={() => engine().goHome()}
      />

      <div className="hide-scrollbars flex-1 overflow-y-auto">
        <div
          className="flex flex-col"
          style={{ gap: grid(6), paddingBlock: grid(4) }}
        >
          <SettingsSection title="Categories">
            <div className="grid grid-cols-2" style={{ gap: grid(2) }}>
              {wordBank.categories.map((category) => {
                const selected = settings.categoryIDs.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleCategory(category.id)}
                    className="flex flex-col items-center"
                    style={{
                      gap: grid(1),
                      background: selected ? PALETTE.crew : PALETTE.surface,
                      borderWidth: selected ? 3 : 2,
                      borderStyle: 'solid',
                      borderColor: selected
                        ? PALETTE.ink
                        : PALETTE.surfaceRaised,
                      paddingBlock: grid(3),
                    }}
                  >
                    <CategoryIconView categoryID={category.id} size={32} />
                    <PixelText
                      size="caption"
                      color={selected ? PALETTE.background : PALETTE.ink}
                      className="text-center"
                    >
                      {category.name}
                    </PixelText>
                    <PixelText
                      size="micro"
                      color={selected ? PALETTE.background : PALETTE.inkDim}
                    >
                      {`${categoryWords(category).length} words`}
                    </PixelText>
                  </button>
                );
              })}
            </div>
          </SettingsSection>

          <SettingsSection
            title="Imposters"
            caption={`max ${allowedImposters} for ${playerCount} players`}
          >
            <div className="flex" style={{ gap: grid(2) }}>
              {[1, 2, 3].map((count) => (
                <ChipButton
                  key={count}
                  title={String(count)}
                  selected={settings.imposterCount === count}
                  enabled={count <= allowedImposters}
                  tint={PALETTE.imposter}
                  onClick={() => engine().setSettings({ imposterCount: count })}
                />
              ))}
            </div>
          </SettingsSection>

          <SettingsSection
            title="Imposter card"
            caption={IMPOSTER_MODE_EXPLANATION[settings.imposterMode]}
          >
            <div className="flex" style={{ gap: grid(2) }}>
              {IMPOSTER_MODES.map((mode) => (
                <ChipButton
                  key={mode}
                  title={IMPOSTER_MODE_TITLE[mode]}
                  selected={settings.imposterMode === mode}
                  onClick={() => engine().setSettings({ imposterMode: mode })}
                />
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title="Rounds">
            <div className="flex" style={{ gap: grid(2) }}>
              {ROUND_OPTIONS.map((count) => (
                <ChipButton
                  key={count}
                  title={String(count)}
                  selected={settings.roundCount === count}
                  tint={PALETTE.crew}
                  onClick={() => engine().setSettings({ roundCount: count })}
                />
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title="Discussion timer">
            <div className="flex" style={{ gap: grid(2) }}>
              {DISCUSSION_TIMERS.map((option) => (
                <ChipButton
                  key={option}
                  title={DISCUSSION_TIMER_TITLE[option]}
                  selected={settings.timer === option}
                  tint={PALETTE.gold}
                  onClick={() => engine().setSettings({ timer: option })}
                />
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title="Extras">
            <div className="flex flex-col" style={{ gap: grid(2) }}>
              <ToggleRow
                title="No voting"
                caption="Skip the vote — after discussion, one button reveals the imposter. No scoring."
                value={settings.noVoting}
                onChange={(value) => engine().setSettings({ noVoting: value })}
              />
              {/* Nobody gets caught without a vote, so the guess never fires. */}
              {!settings.noVoting && (
                <ToggleRow
                  title="Caught imposter guesses"
                  caption="One shot at naming the word for 2 points."
                  value={settings.allowImposterGuess}
                  onChange={(value) =>
                    engine().setSettings({ allowImposterGuess: value })
                  }
                />
              )}
              <ToggleRow
                title="Imposters know each other"
                caption="Their cards list the other imposters."
                value={settings.impostersKnowEachOther}
                onChange={(value) =>
                  engine().setSettings({ impostersKnowEachOther: value })
                }
              />
            </div>
          </SettingsSection>
        </div>
      </div>

      <div
        className="flex flex-col items-center"
        style={{ gap: grid(2), paddingBlock: grid(4) }}
      >
        {validation && (
          <PixelText size="caption" color={PALETTE.imposter}>
            {validation}
          </PixelText>
        )}
        <PixelButton
          disabled={validation !== null}
          onClick={() => engine().startGame(players)}
        >
          Deal Cards
        </PixelButton>
      </div>
    </div>
  );
}
