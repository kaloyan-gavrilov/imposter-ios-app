/// Central design tokens, ported from ImposterApp/Design/Theme.swift.
/// Everything pixel-art: no rounded corners, no blurred shadows, no gradients
/// that need more than a handful of steps.

export const PALETTE = {
  background: '#0E1020',
  backgroundDeep: '#070812',
  surface: '#1B1E38',
  surfaceRaised: '#2A2F54',
  ink: '#F2F0E6',
  inkDim: '#8B90B8',
  accent: '#F22299',
  accentDark: '#8E0F59',
  crew: '#A8E10C',
  crewDark: '#5C7D06',
  imposter: '#E5352B',
  imposterDark: '#7E1712',
  gold: '#FFC93C',
  shadow: '#000000',
} as const;

export type PaletteColor = keyof typeof PALETTE;

/// Everything snaps to a 4px grid so edges land on whole pixels.
export const UNIT = 4;
export const grid = (n: number) => UNIT * n;

export const METRICS = {
  borderWidth: 3,
  shadowOffset: 6,
  pressOffset: 3,
  screenPadding: grid(5),
} as const;

/// Press Start 2P is noticeably wider than the iOS system-monospaced stack, so
/// the ramp is scaled down from the Swift values (40/28/20/16/13) to keep the
/// longest hint lines and multi-word answers on screen.
export const FONT_SIZE = {
  display: 30,
  title: 21,
  heading: 15,
  body: 12,
  caption: 10,
  micro: 8,
} as const;

export type FontSize = keyof typeof FONT_SIZE;

/// Stepped and quick. Nothing springy — springs read as "modern app", not pixel art.
export const MOTION = {
  snap: '120ms ease-out',
  slide: '220ms ease-in-out',
} as const;
