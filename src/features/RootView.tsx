'use client';

import { useEffect } from 'react';

import { StarfieldBackground } from '@/design/Chrome';
import { METRICS } from '@/design/theme';
import { useRoster } from '@/domain/rosterStore';
import { engine, engineStore, useEngine } from '@/domain/useEngine';
import { SETTINGS_KEY, load, save } from '@/lib/storage';
import { applyDebugPhase, readDebugPhase } from '@/lib/debugPhase';
import { useServiceWorker } from '@/lib/useServiceWorker';
import type { GameSettings } from '@/domain/settings';

import { DiscussionView } from './DiscussionView';
import { GameOverView } from './GameOverView';
import { GameSettingsView } from './GameSettingsView';
import { HomeView } from './HomeView';
import { ImposterGuessView } from './ImposterGuessView';
import { NoVoteRevealView } from './NoVoteRevealView';
import { PlayerSetupView } from './PlayerSetupView';
import { RevealView } from './RevealView';
import { RoundResultView } from './RoundResultView';
import { VotingView } from './VotingView';

export function RootView() {
  const phase = useEngine((state) => state.phase);
  const settings = useEngine((state) => state.settings);
  const hydrated = useRoster((state) => state.hydrated);
  const hydrateRoster = useRoster((state) => state.hydrate);

  useServiceWorker();

  // Storage is read after mount, never during render — reading it while
  // rendering would desync the server HTML from the first client paint.
  useEffect(() => {
    hydrateRoster();
    const stored = load<Partial<GameSettings>>(SETTINGS_KEY);
    if (stored) engine().setSettings(stored);

    const debug = readDebugPhase();
    if (debug) {
      const roster = useRoster.getState();
      applyDebugPhase(
        engineStore,
        debug,
        roster.players,
        roster.add,
        () => useRoster.getState().players,
      );
    }
  }, [hydrateRoster]);

  useEffect(() => {
    if (hydrated) save(SETTINGS_KEY, settings);
  }, [settings, hydrated]);

  // A hardware back press mid-round would drop everyone out of the game, so the
  // history stack keeps one spare entry to swallow it.
  useEffect(() => {
    window.history.pushState(null, '');
    const swallow = () => window.history.pushState(null, '');
    window.addEventListener('popstate', swallow);
    return () => window.removeEventListener('popstate', swallow);
  }, []);

  return (
    <>
      <StarfieldBackground />
      <main
        className="app-shell relative mx-auto flex w-full max-w-md flex-col"
        style={{
          paddingInline: METRICS.screenPadding,
        }}
      >
        {/* Hidden until the roster is known, so the menu never flashes an
            empty player count on a device that already has one. */}
        <div
          className="flex min-h-full flex-1 flex-col"
          style={{ visibility: hydrated ? 'visible' : 'hidden' }}
        >
          <PhaseView phase={phase} />
        </div>
      </main>
    </>
  );
}

function PhaseView({ phase }: { phase: ReturnType<typeof engine>['phase'] }) {
  switch (phase) {
    case 'home':
      return <HomeView />;
    case 'players':
      return <PlayerSetupView />;
    case 'settings':
      return <GameSettingsView />;
    case 'reveal':
      return <RevealView />;
    case 'discussion':
      return <DiscussionView />;
    case 'voting':
      return <VotingView />;
    case 'noVoteReveal':
      return <NoVoteRevealView />;
    case 'imposterGuess':
      return <ImposterGuessView />;
    case 'roundResult':
      return <RoundResultView />;
    case 'gameOver':
      return <GameOverView />;
  }
}
