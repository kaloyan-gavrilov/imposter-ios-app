'use client';

import type { ReactNode } from 'react';

import { haptics } from '@/lib/haptics';
import { seededRng } from '@/lib/rng';
import { PixelText } from './PixelText';
import { FONT_SIZE, PALETTE, grid } from './theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

/// Shared top bar: back chevron, title, optional trailing text.
export function ScreenHeader({ title, subtitle, onBack }: ScreenHeaderProps) {
  return (
    <div
      className="flex w-full items-center"
      style={{ gap: grid(3), paddingTop: grid(3) }}
    >
      {onBack && (
        <button
          type="button"
          aria-label="Back"
          onClick={() => {
            haptics.tap();
            onBack();
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center"
          style={{
            background: PALETTE.surface,
            border: `2px solid ${PALETTE.ink}`,
            fontSize: FONT_SIZE.heading,
          }}
        >
          {'<'}
        </button>
      )}
      <PixelText size="heading" className="flex-1 truncate">
        {title}
      </PixelText>
      {subtitle && (
        <PixelText size="caption" color={PALETTE.inkDim}>
          {subtitle}
        </PixelText>
      )}
    </div>
  );
}

interface SettingsSectionProps {
  title: string;
  caption?: string;
  children: ReactNode;
}

export function SettingsSection({
  title,
  caption,
  children,
}: SettingsSectionProps) {
  return (
    <section
      aria-label={title}
      className="flex w-full flex-col"
      style={{ gap: grid(2) }}
    >
      <PixelText size="caption" color={PALETTE.inkDim}>
        {title}
      </PixelText>
      {children}
      {caption && (
        <PixelText size="micro" color={PALETTE.inkDim} preserveCase>
          {caption}
        </PixelText>
      )}
    </section>
  );
}

interface ToggleRowProps {
  title: string;
  caption?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function ToggleRow({ title, caption, value, onChange }: ToggleRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => {
        haptics.select();
        onChange(!value);
      }}
      className="flex w-full items-center text-left"
      style={{
        gap: grid(3),
        background: PALETTE.surface,
        border: `2px solid ${PALETTE.surfaceRaised}`,
        padding: grid(3),
      }}
    >
      <span className="flex flex-1 flex-col" style={{ gap: 2 }}>
        <PixelText size="caption">{title}</PixelText>
        {caption && (
          <PixelText size="micro" color={PALETTE.inkDim} preserveCase>
            {caption}
          </PixelText>
        )}
      </span>
      <span
        className="relative shrink-0"
        style={{
          width: 44,
          height: 24,
          background: value ? PALETTE.crew : PALETTE.surfaceRaised,
          border: `2px solid ${value ? PALETTE.ink : PALETTE.inkDim}`,
        }}
      >
        <span
          className="absolute top-0"
          style={{
            width: 18,
            height: 20,
            left: value ? 22 : 0,
            background: value ? PALETTE.background : PALETTE.inkDim,
            transition: 'left 120ms ease-out',
          }}
        />
      </span>
    </button>
  );
}

/// Sparse static pixel stars — cheap depth without competing with the UI.
/// Positions come from the same seeded xorshift as the Swift Canvas version, so
/// the field never shimmers between renders.
export function StarfieldBackground() {
  const rng = seededRng(20_260_725);
  const stars = Array.from({ length: 70 }, () => ({
    left: `${Math.round(rng() * 100)}%`,
    top: `${Math.round(rng() * 100)}%`,
    bright: rng() < 0.25,
  }));

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0">
      {stars.map((star, index) => (
        <span
          key={index}
          className="absolute"
          style={{
            left: star.left,
            top: star.top,
            width: 3,
            height: 3,
            background: star.bright ? PALETTE.inkDim : PALETTE.surfaceRaised,
          }}
        />
      ))}
    </div>
  );
}
