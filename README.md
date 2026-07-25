# Imposter

Pass-and-play party game. One of you is lying.

Originally a SwiftUI iOS app; now a static Next.js web app (PWA) living in `web/`.
The Swift sources were removed once the port reached parity.

## Develop

```sh
cd web
npm install
npm run dev        # next dev
npm test           # vitest (rules, engine, art, screens)
npm run typecheck  # tsc --noEmit
npm run build      # gen:art + next build -> static export in web/out
```

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

State: roster and settings persist in `localStorage`; scores and the dealt-word
cache are session-only, by design.
