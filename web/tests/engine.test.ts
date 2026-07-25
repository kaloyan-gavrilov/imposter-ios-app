import { describe, expect, test } from 'vitest';

import {
  cardFor,
  currentRound,
  standings,
  type EngineState,
} from '@/domain/engineStore';
import { wordKey } from '@/domain/word';
import {
  everyoneVotes,
  makeRoster,
  revealAll,
  testBank,
  testEngine,
} from './helpers';

const ROSTER = makeRoster(['Nyx', 'Bolt', 'Juno', 'Kai', 'Wren']);

function crewMember(state: EngineState): string {
  const round = currentRound(state)!;
  return state.players.find((p) => !round.imposterIDs.includes(p.id))!.id;
}

describe('game lifecycle', () => {
  test('starting a game deals a round and zeroes scores', () => {
    const store = testEngine();
    store.getState().startGame(ROSTER);
    const state = store.getState();

    expect(state.phase).toBe('reveal');
    expect(state.rounds).toHaveLength(1);
    expect(currentRound(state)!.number).toBe(1);
    expect(Object.values(state.scores)).toEqual([0, 0, 0, 0, 0]);
    expect(currentRound(state)!.imposterIDs).toHaveLength(1);
    expect(currentRound(state)!.revealOrder).toHaveLength(5);
  });

  test('reveal walks every player then moves to discussion', () => {
    const store = testEngine();
    store.getState().startGame(ROSTER);

    for (let i = 0; i < ROSTER.length - 1; i += 1) {
      store.getState().advanceReveal();
      expect(store.getState().phase).toBe('reveal');
      expect(store.getState().revealIndex).toBe(i + 1);
    }
    store.getState().advanceReveal();
    expect(store.getState().phase).toBe('discussion');
  });

  test('catching the imposter pays the crew two each', () => {
    const store = testEngine({ allowImposterGuess: false });
    store.getState().startGame(ROSTER);
    revealAll(store);
    store.getState().beginVoting();

    const imposter = currentRound(store.getState())!.imposterIDs[0];
    everyoneVotes(store, imposter);

    const state = store.getState();
    expect(state.phase).toBe('roundResult');
    expect(currentRound(state)!.outcome).toBe('imposterCaught');
    expect(state.scores[imposter]).toBe(0);
    for (const player of state.players) {
      if (player.id !== imposter) expect(state.scores[player.id]).toBe(2);
    }
  });

  test('ejecting the wrong player pays the imposter three', () => {
    const store = testEngine();
    store.getState().startGame(ROSTER);
    revealAll(store);
    store.getState().beginVoting();

    const imposter = currentRound(store.getState())!.imposterIDs[0];
    everyoneVotes(store, crewMember(store.getState()));

    const state = store.getState();
    expect(currentRound(state)!.outcome).toBe('wrongEjection');
    expect(state.scores[imposter]).toBe(3);
  });

  test('a tie triggers exactly one revote, then hangs', () => {
    const store = testEngine();
    store.getState().startGame(ROSTER);
    revealAll(store);
    store.getState().beginVoting();

    const [a, b, c, d, e] = store.getState().players.map((p) => p.id);

    // 2-2 split with one abstain-equivalent vote onto a third player is still a
    // clean tie at the top between a and b.
    const tie = () => {
      store.getState().castVote(a, b);
      store.getState().castVote(b, a);
      store.getState().castVote(c, b);
      store.getState().castVote(d, a);
      store.getState().castVote(e, c);
    };

    tie();
    expect(currentRound(store.getState())!.wasRevote).toBe(true);
    expect(currentRound(store.getState())!.outcome).toBeNull();
    expect(store.getState().voteIndex).toBe(0);
    expect(store.getState().phase).toBe('voting');

    tie();
    const state = store.getState();
    expect(currentRound(state)!.outcome).toBe('noEjection');
    expect(currentRound(state)!.ejectedID).toBeNull();
    expect(state.phase).toBe('roundResult');
    for (const id of currentRound(state)!.imposterIDs) {
      expect(state.scores[id]).toBe(3);
    }
  });

  test('a caught imposter naming the word scores two on top of the crew payout', () => {
    const store = testEngine({ allowImposterGuess: true });
    store.getState().startGame(ROSTER);
    revealAll(store);
    store.getState().beginVoting();

    const imposter = currentRound(store.getState())!.imposterIDs[0];
    everyoneVotes(store, imposter);
    expect(store.getState().phase).toBe('imposterGuess');

    const word = currentRound(store.getState())!.word.text;
    store.getState().submitImposterGuess(word.toUpperCase());

    const state = store.getState();
    expect(currentRound(state)!.imposterGuessedCorrectly).toBe(true);
    expect(state.scores[imposter]).toBe(2);
    expect(state.phase).toBe('roundResult');
  });

  test('skipping the guess scores nothing extra', () => {
    const store = testEngine({ allowImposterGuess: true });
    store.getState().startGame(ROSTER);
    revealAll(store);
    store.getState().beginVoting();

    const imposter = currentRound(store.getState())!.imposterIDs[0];
    everyoneVotes(store, imposter);
    store.getState().skipImposterGuess();

    expect(store.getState().scores[imposter]).toBe(0);
    expect(store.getState().phase).toBe('roundResult');
  });

  test('ten rounds never repeat a word and end in game over', () => {
    const store = testEngine({ roundCount: 10, allowImposterGuess: false });
    store.getState().startGame(ROSTER);

    const seen = new Set<string>();
    for (let round = 0; round < 10; round += 1) {
      seen.add(wordKey(currentRound(store.getState())!.word));
      revealAll(store);
      store.getState().beginVoting();
      everyoneVotes(store, currentRound(store.getState())!.imposterIDs[0]);
      store.getState().continueAfterResult();
    }

    expect(seen.size).toBe(10);
    expect(store.getState().phase).toBe('gameOver');
    expect(store.getState().rounds).toHaveLength(10);
  });

  test('standings sort by score, highest first', () => {
    const store = testEngine();
    store.getState().startGame(ROSTER);
    revealAll(store);
    store.getState().beginVoting();
    everyoneVotes(store, currentRound(store.getState())!.imposterIDs[0]);

    const ranked = standings(store.getState());
    for (let i = 1; i < ranked.length; i += 1) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
  });

  test('ending a game clears scores but keeps the session word cache', () => {
    const store = testEngine();
    store.getState().startGame(ROSTER);
    const cached = new Set(store.getState().usedKeys);
    expect(cached.size).toBe(1);

    store.getState().endGame();
    const state = store.getState();
    expect(state.phase).toBe('home');
    expect(state.players).toEqual([]);
    expect(state.rounds).toEqual([]);
    expect(state.scores).toEqual({});
    expect(state.usedKeys).toEqual(cached);
  });

  test('play again resets scores and keeps the roster', () => {
    const store = testEngine({ roundCount: 1, allowImposterGuess: false });
    store.getState().startGame(ROSTER);
    revealAll(store);
    store.getState().beginVoting();
    everyoneVotes(store, currentRound(store.getState())!.imposterIDs[0]);
    store.getState().continueAfterResult();
    expect(store.getState().phase).toBe('gameOver');

    store.getState().playAgainSamePlayers();
    const state = store.getState();
    expect(state.players).toEqual(ROSTER);
    expect(Object.values(state.scores)).toEqual([0, 0, 0, 0, 0]);
    expect(state.phase).toBe('reveal');
    expect(state.rounds).toHaveLength(1);
  });
});

describe('no-voting mode', () => {
  test('discussion goes straight to the reveal, casting no votes', () => {
    const store = testEngine({ noVoting: true, roundCount: 2 });
    store.getState().startGame(ROSTER);
    revealAll(store);
    expect(store.getState().phase).toBe('discussion');

    store.getState().revealNoVote();
    const state = store.getState();
    expect(state.phase).toBe('noVoteReveal');
    expect(currentRound(state)!.votes).toEqual({});
    expect(currentRound(state)!.ejectedID).toBeNull();
    expect(currentRound(state)!.outcome).toBeNull();
  });

  test('continuing deals the next round and never scores', () => {
    const store = testEngine({ noVoting: true, roundCount: 2 });
    store.getState().startGame(ROSTER);
    revealAll(store);
    store.getState().revealNoVote();

    store.getState().finishNoVoteRound();
    const state = store.getState();
    expect(state.phase).toBe('reveal');
    expect(state.rounds).toHaveLength(2);
    expect(Object.values(state.scores)).toEqual([0, 0, 0, 0, 0]);
    expect(state.lastDeltas).toEqual({});
  });

  test('the last round returns home instead of showing a scoreboard', () => {
    const store = testEngine({ noVoting: true, roundCount: 1 });
    store.getState().startGame(ROSTER);
    revealAll(store);
    store.getState().revealNoVote();

    store.getState().finishNoVoteRound();
    const state = store.getState();
    expect(state.phase).toBe('home');
    expect(state.rounds).toEqual([]);
  });
});

describe('reveal cards', () => {
  test('crew see the real word', () => {
    const store = testEngine();
    store.getState().startGame(ROSTER);
    const state = store.getState();
    const round = currentRound(state)!;
    const crew = state.players.find((p) => !round.imposterIDs.includes(p.id))!;

    expect(cardFor(state, crew)).toEqual({
      kind: 'crew',
      word: round.word.text,
    });
  });

  test('hint mode gives the imposter the round hint', () => {
    const store = testEngine({ imposterMode: 'hint' });
    store.getState().startGame(ROSTER);
    const state = store.getState();
    const round = currentRound(state)!;
    const imposter = state.players.find((p) =>
      round.imposterIDs.includes(p.id),
    )!;

    const card = cardFor(state, imposter);
    expect(card.kind).toBe('imposterHint');
    expect(card).toMatchObject({ hint: round.imposterHint });
  });

  test('blind mode tells the imposter nothing', () => {
    const store = testEngine({ imposterMode: 'blind' });
    store.getState().startGame(ROSTER);
    const state = store.getState();
    const round = currentRound(state)!;
    const imposter = state.players.find((p) =>
      round.imposterIDs.includes(p.id),
    )!;

    expect(cardFor(state, imposter)).toEqual({
      kind: 'imposterBlind',
      partners: [],
    });
  });

  test('decoy mode hands the imposter a crew-shaped card with a different word', () => {
    const store = testEngine({ imposterMode: 'decoy' });
    store.getState().startGame(ROSTER);
    const state = store.getState();
    const round = currentRound(state)!;
    const imposter = state.players.find((p) =>
      round.imposterIDs.includes(p.id),
    )!;

    const card = cardFor(state, imposter);
    expect(card.kind).toBe('crew');
    expect(card).toMatchObject({ word: round.decoyWord! });
    expect((card as { word: string }).word).not.toBe(round.word.text);
  });

  test('partners appear only when imposters know each other', () => {
    const known = testEngine({
      imposterCount: 2,
      imposterMode: 'blind',
      impostersKnowEachOther: true,
    });
    known.getState().startGame(ROSTER);
    let state = known.getState();
    let round = currentRound(state)!;
    let imposter = state.players.find((p) =>
      round.imposterIDs.includes(p.id),
    )!;
    expect((cardFor(state, imposter) as { partners: string[] }).partners).toHaveLength(1);

    const secret = testEngine({
      imposterCount: 2,
      imposterMode: 'blind',
      impostersKnowEachOther: false,
    });
    secret.getState().startGame(ROSTER);
    state = secret.getState();
    round = currentRound(state)!;
    imposter = state.players.find((p) => round.imposterIDs.includes(p.id))!;
    expect((cardFor(state, imposter) as { partners: string[] }).partners).toHaveLength(0);
  });
});

describe('session word cache', () => {
  test('a drained pool recycles instead of failing the round', () => {
    // Three words, four rounds: the fourth has to recycle.
    const store = testEngine(
      { roundCount: 4, allowImposterGuess: false },
      { bank: testBank(3) },
    );
    store.getState().startGame(ROSTER);

    const dealt: string[] = [];
    for (let round = 0; round < 4; round += 1) {
      dealt.push(currentRound(store.getState())!.word.text);
      revealAll(store);
      store.getState().beginVoting();
      everyoneVotes(store, currentRound(store.getState())!.imposterIDs[0]);
      store.getState().continueAfterResult();
    }

    expect(dealt).toHaveLength(4);
    expect(new Set(dealt.slice(0, 3)).size).toBe(3);
    expect(store.getState().recycledPool).toBe(true);
    expect(store.getState().phase).toBe('gameOver');
  });
});
