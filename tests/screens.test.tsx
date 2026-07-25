/** @vitest-environment jsdom */
import {
  cleanup,
  configure,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { RootView } from '@/features/RootView';
import { engineStore } from '@/domain/useEngine';
import { useRoster } from '@/domain/rosterStore';
import { currentRound } from '@/domain/engineStore';
import { DEFAULT_SETTINGS } from '@/domain/settings';
import { makePlayer, type Player } from '@/domain/player';

/// Drives the real screens through a real game so every phase is proven to
/// render — the engine tests cover the rules, these cover the views.

// PixelTitle paints its drop shadow as a second, aria-hidden copy of the text.
// Text queries would otherwise match both copies of every heading.
configure({ defaultIgnore: 'script, style, [aria-hidden="true"]' });

function seedRoster(names: string[]): Player[] {
  const players = names.reduce<Player[]>(
    (roster, name) => [...roster, makePlayer(name, roster)],
    [],
  );
  useRoster.setState({ players, hydrated: true });
  return players;
}

function resetEngine() {
  engineStore.setState({
    phase: 'home',
    players: [],
    rounds: [],
    scores: {},
    lastDeltas: {},
    recycledPool: false,
    revealIndex: 0,
    voteIndex: 0,
    usedKeys: new Set(),
    settings: { ...DEFAULT_SETTINGS, allowImposterGuess: false, roundCount: 1 },
  });
}

const NAMES = ['Nyx', 'Bolt', 'Juno', 'Kai', 'Wren'];

beforeEach(() => {
  window.localStorage.clear();
  resetEngine();
  seedRoster(NAMES);
});

afterEach(cleanup);

describe('screen rendering', () => {
  test('home shows the title and the roster count', () => {
    render(<RootView />);
    expect(screen.getByText('Imposter')).toBeDefined();
    expect(screen.getByText('one of you is lying')).toBeDefined();
    expect(screen.getByText(`Players (${NAMES.length})`)).toBeDefined();
  });

  test('home blocks starting with too few players', () => {
    seedRoster(['Solo', 'Duo']);
    render(<RootView />);
    expect(screen.getByText('add at least 3 players')).toBeDefined();
    const start = screen.getByRole('button', { name: /start game/i });
    expect((start as HTMLButtonElement).disabled).toBe(true);
  });

  test('player setup lists everyone and can add a name', () => {
    engineStore.getState().openPlayers();
    render(<RootView />);

    for (const name of NAMES) expect(screen.getByText(name)).toBeDefined();
    expect(screen.getByText('5/16')).toBeDefined();

    fireEvent.change(screen.getByPlaceholderText('NAME'), {
      target: { value: 'Pip' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(useRoster.getState().players.map((p) => p.name)).toContain('Pip');
  });

  test('player setup rejects a duplicate name', () => {
    engineStore.getState().openPlayers();
    render(<RootView />);

    fireEvent.change(screen.getByPlaceholderText('NAME'), {
      target: { value: 'nyx' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('NYX is already playing')).toBeDefined();
    expect(useRoster.getState().players).toHaveLength(5);
  });

  test('settings renders every category and starts a game', () => {
    engineStore.getState().openSettings();
    render(<RootView />);

    expect(screen.getByText('Food & Drink')).toBeDefined();
    expect(screen.getByText('Famous People')).toBeDefined();
    expect(screen.getByText('5 players')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /deal cards/i }));
    expect(engineStore.getState().phase).toBe('reveal');
  });

  test('settings caps the imposter chips at the player maximum', () => {
    seedRoster(['A', 'B', 'C']);
    engineStore.getState().openSettings();
    render(<RootView />);

    // Scoped to the section — the rounds chips reuse the same numbers.
    const imposters = within(screen.getByRole('region', { name: 'Imposters' }));

    // 3 players allow exactly 1 imposter, so chips 2 and 3 are disabled.
    const two = imposters.getByRole('button', { name: '2' }) as HTMLButtonElement;
    const three = imposters.getByRole('button', {
      name: '3',
    }) as HTMLButtonElement;
    expect(two.disabled).toBe(true);
    expect(three.disabled).toBe(true);
  });

  test('reveal keeps the card covered until it is held', () => {
    const players = useRoster.getState().players;
    engineStore.getState().startGame(players);
    render(<RootView />);

    const round = currentRound(engineStore.getState())!;
    const word = round.word.text;

    expect(screen.getByText('hold to reveal')).toBeDefined();
    expect(screen.queryByText(word)).toBeNull();

    const card = screen.getByText('hold to reveal').closest('.no-touch-callout')!;
    fireEvent.pointerDown(card);

    // The first player in the reveal order sees either the word or the imposter card.
    const first = players.find((p) => p.id === round.revealOrder[0])!;
    if (round.imposterIDs.includes(first.id)) {
      expect(screen.getByText('Imposter')).toBeDefined();
    } else {
      expect(screen.getAllByText(word).length).toBeGreaterThan(0);
    }

    fireEvent.pointerUp(card);
    expect(screen.getByText('hold to reveal')).toBeDefined();
  });

  test('reveal releases the card when the tab loses focus', () => {
    engineStore.getState().startGame(useRoster.getState().players);
    render(<RootView />);

    const card = screen.getByText('hold to reveal').closest('.no-touch-callout')!;
    fireEvent.pointerDown(card);
    expect(screen.queryByText('hold to reveal')).toBeNull();

    fireEvent.blur(window);
    expect(screen.getByText('hold to reveal')).toBeDefined();
  });

  test('reveal advances through every player then reaches discussion', () => {
    const players = useRoster.getState().players;
    engineStore.getState().startGame(players);
    render(<RootView />);

    for (let i = 0; i < players.length - 1; i += 1) {
      // The counter shares its node with the round number: "round 1 · 1/5".
      expect(screen.getByText(new RegExp(`${i + 1}/5$`))).toBeDefined();
      fireEvent.click(screen.getByRole('button', { name: /got it/i }));
    }
    fireEvent.click(screen.getByRole('button', { name: /start discussion/i }));
    expect(screen.getByText(/first word goes to/)).toBeDefined();
  });

  test('discussion shows a running timer that can be paused', () => {
    engineStore.getState().startGame(useRoster.getState().players);
    engineStore.setState({ phase: 'discussion' });
    render(<RootView />);

    expect(screen.getByText('1:30')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByRole('button', { name: 'Resume' })).toBeDefined();
  });

  test('discussion says so when the timer is off', () => {
    engineStore.getState().setSettings({ timer: 0 });
    engineStore.getState().startGame(useRoster.getState().players);
    engineStore.setState({ phase: 'discussion' });
    render(<RootView />);

    expect(screen.getByText('talk it out. no timer.')).toBeDefined();
  });

  test('voting hides the ballot behind a handoff and excludes the voter', () => {
    const players = useRoster.getState().players;
    engineStore.getState().startGame(players);
    engineStore.getState().beginVoting();
    render(<RootView />);

    const voter = players[0];
    expect(screen.getByText('pass to')).toBeDefined();
    expect(screen.getByText(voter.name)).toBeDefined();
    expect(screen.queryByText('who is the imposter?')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /it's me/i }));
    expect(screen.getByText('who is the imposter?')).toBeDefined();

    // The voter cannot vote for themselves.
    expect(screen.queryByRole('button', { name: new RegExp(voter.name) })).toBeNull();
    for (const other of players.slice(1)) {
      expect(screen.getByText(other.name)).toBeDefined();
    }

    // Lock In is gated until a candidate is picked.
    const lock = screen.getByRole('button', { name: /lock in/i }) as HTMLButtonElement;
    expect(lock.disabled).toBe(true);
    fireEvent.click(screen.getByText(players[1].name));
    expect((screen.getByRole('button', { name: /lock in/i }) as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: /lock in/i }));
    expect(engineStore.getState().voteIndex).toBe(1);
    // The next voter gets a fresh handoff screen.
    expect(screen.getByText('pass to')).toBeDefined();
  });

  test('no-voting mode reveals the imposter straight from discussion', () => {
    const players = useRoster.getState().players;
    engineStore.getState().setSettings({ noVoting: true });
    engineStore.getState().startGame(players);
    engineStore.setState({ phase: 'discussion' });
    render(<RootView />);

    fireEvent.click(screen.getByRole('button', { name: /reveal imposter/i }));
    expect(engineStore.getState().phase).toBe('noVoteReveal');

    const round = currentRound(engineStore.getState())!;
    const imposter = players.find((p) => round.imposterIDs.includes(p.id))!;
    expect(screen.getByText('the imposter was')).toBeDefined();
    expect(screen.getByText(imposter.name)).toBeDefined();
    expect(screen.getByText('the word was')).toBeDefined();
    // No vote happened, so nothing about ejections or scores is on screen.
    expect(screen.queryByText('voted out')).toBeNull();
    expect(screen.queryByText('scores')).toBeNull();

    // roundCount is 1 in these tests, so this ends the run with no scoreboard.
    fireEvent.click(screen.getByRole('button', { name: /end game/i }));
    expect(engineStore.getState().phase).toBe('home');
  });

  test('round result reveals in four steps then offers the final scores', () => {
    const players = useRoster.getState().players;
    engineStore.getState().startGame(players);
    engineStore.getState().beginVoting();

    const imposter = currentRound(engineStore.getState())!.imposterIDs[0];
    for (const player of players) {
      engineStore.getState().castVote(player.id, imposter);
    }
    render(<RootView />);

    expect(screen.getByText('voted out')).toBeDefined();
    expect(screen.queryByText('the word was')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /reveal more/i }));
    expect(screen.getByText('Imposter caught')).toBeDefined();
    expect(screen.getByText('the imposter was')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /reveal more/i }));
    expect(screen.getByText('the word was')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /reveal more/i }));
    expect(screen.getByText('scores')).toBeDefined();

    // roundCount is 1 in these tests, so the run ends here.
    fireEvent.click(screen.getByRole('button', { name: /final scores/i }));
    expect(engineStore.getState().phase).toBe('gameOver');
  });

  test('imposter guess screen accepts a word', () => {
    const players = useRoster.getState().players;
    engineStore.getState().setSettings({ allowImposterGuess: true });
    engineStore.getState().startGame(players);
    engineStore.getState().beginVoting();

    const imposter = currentRound(engineStore.getState())!.imposterIDs[0];
    for (const player of players) {
      engineStore.getState().castVote(player.id, imposter);
    }
    expect(engineStore.getState().phase).toBe('imposterGuess');

    render(<RootView />);
    expect(screen.getByText(/name the word for 2 points/)).toBeDefined();

    const word = currentRound(engineStore.getState())!.word.text;
    fireEvent.change(screen.getByPlaceholderText('YOUR GUESS'), {
      target: { value: word.toLowerCase() },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit guess/i }));

    expect(currentRound(engineStore.getState())!.imposterGuessedCorrectly).toBe(true);
    expect(engineStore.getState().phase).toBe('roundResult');
  });

  test('game over ranks everyone and can restart with the same roster', () => {
    const players = useRoster.getState().players;
    engineStore.getState().startGame(players);
    engineStore.getState().beginVoting();
    const imposter = currentRound(engineStore.getState())!.imposterIDs[0];
    for (const player of players) {
      engineStore.getState().castVote(player.id, imposter);
    }
    engineStore.getState().continueAfterResult();

    render(<RootView />);
    expect(screen.getByText('Game Over')).toBeDefined();
    expect(screen.getByText('winner')).toBeDefined();
    for (const player of players) {
      expect(screen.getAllByText(player.name).length).toBeGreaterThan(0);
    }

    fireEvent.click(screen.getByRole('button', { name: /play again/i }));
    expect(engineStore.getState().phase).toBe('reveal');
    expect(Object.values(engineStore.getState().scores)).toEqual([0, 0, 0, 0, 0]);
  });

  test('main menu clears the game', () => {
    const players = useRoster.getState().players;
    engineStore.getState().startGame(players);
    engineStore.setState({ phase: 'gameOver' });
    render(<RootView />);

    fireEvent.click(screen.getByRole('button', { name: /main menu/i }));
    expect(engineStore.getState().phase).toBe('home');
  });
});

describe('pixel art rendering', () => {
  test('avatars draw as svg rects tinted by the player palette', () => {
    const { container } = render(<RootView />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);

    const first = svgs[0];
    expect(first.getAttribute('viewBox')).toBe('0 0 16 16');
    expect(first.getAttribute('shape-rendering')).toBe('crispEdges');
    expect(first.querySelectorAll('rect').length).toBeGreaterThan(0);
    expect(first.getAttribute('style')).toContain('--pal-0');
  });

  test('category icons draw with their own baked colours', () => {
    engineStore.getState().openSettings();
    const { container } = render(<RootView />);

    const icons = [...container.querySelectorAll('svg')].filter(
      (svg) => !(svg.getAttribute('style') ?? '').includes('--pal-0'),
    );
    expect(icons.length).toBeGreaterThanOrEqual(9);
    expect(icons[0].querySelectorAll('rect').length).toBeGreaterThan(0);
    expect(icons[0].innerHTML).toContain('#');
  });
});
