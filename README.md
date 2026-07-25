# Imposter

A pass-and-play party game for 3–16 people and one phone. Everyone gets the same
secret word — except the imposter, who has to fake it until the vote.

No accounts, no server, no network calls. The whole game is a static site that
runs offline and installs to the home screen as a PWA.

> Originally a SwiftUI iOS app; now a static Next.js web app living in `web/`.
> The Swift sources were removed once the port reached parity — the name stuck.

## How a round plays

1. **Reveal** — pass the phone around. Each player holds their card to see the
   secret word, or to find out they're the imposter.
2. **Discussion** — a random first speaker is picked, then everyone describes the
   word without saying it. Optional timer (1:00 / 1:30 / 2:00 / 3:00).
3. **Vote** — pass the phone again, one secret vote each. A tie triggers one
   revote; a second tie is a hung vote and nobody goes.
4. **Guess** — a caught imposter gets one shot at naming the secret word.
5. **Score** — crew get **2** for catching an imposter, imposters get **3** for
   surviving the vote, and a caught imposter who names the word still banks **2**.

Play 1, 3, 5, 7 or 10 rounds. Imposters are always a strict minority
(`floor((players - 1) / 2)` max), which is what keeps the vote meaningful.

### Imposter modes

| Mode | The imposter's card shows |
| --- | --- |
| **Blind** | Nothing. Pure bluffing. |
| **Hint** | One vague facet of the real word ("some people keep one at home"). |
| **Decoy** | A *different* word — and no warning that they're the imposter. |

Hint lines are shared across many words on purpose, so hearing one again in a
later game never pins the answer down.

### Other options

- **No-voting mode** — skip the vote entirely; after discussion one button reveals
  the imposters and the round ends. No scoring, no scoreboard.
- **Imposters know each other** — with 2+ imposters, they see each other's names.
- **Imposter guess** — toggle the caught-imposter word guess on or off.

## Words

1,664 words across 9 categories — food, animals, movies, music, places, objects,
jobs, sports, people. Pick any combination. Dealt words don't repeat within a
session; if a pool runs dry mid-game the app says so rather than silently
recycling behind your back.

## Develop

```sh
cd web
npm install
npm run dev        # next dev
npm test           # vitest — rules, engine, art, hint balance, screens
npm run typecheck  # tsc --noEmit
npm run build      # gen:art + next build -> static export in web/out
```

`web/out` is a plain folder of static files — host it anywhere.

## Layout

| Path | What |
| --- | --- |
| `web/src/domain` | Game rules: engine store, scoring, role assigner, word dealer, settings |
| `web/src/content` | Word bank + per-category JSON word lists |
| `web/src/art` | Pixel sprites, palettes, category icons (+ generated SVG) |
| `web/src/design` | Design tokens and pixel UI primitives |
| `web/src/features` | One component per game phase |
| `web/src/lib` | Storage, haptics, RNG, hooks, service worker |
| `web/tests` | Vitest suites |

Built with Next.js 16 (static export), React 19, Zustand and Tailwind v4. Player
avatars and category icons are pixel art generated at build time — no image
assets to ship.

The domain layer is deliberately UI-free: scoring, role assignment and word
dealing are pure functions with their own tests, so the rules can be verified
without rendering anything.

### State

Roster and settings persist in `localStorage`. Scores and the dealt-word cache
are session-only, by design — reload and the game starts clean.

## Adding words

Drop entries into the relevant `web/src/content/words/*.json`. Each word is
either a bare string or `{ "text": "...", "hints": ["facetID"] }`, where facet
ids point at the category's shared `hints` table. Malformed files throw at parse
time — a bad word list fails the build, not a round.
