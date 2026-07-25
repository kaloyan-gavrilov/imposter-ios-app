'use client';

import type { ReactNode } from 'react';

import { haptics } from '@/lib/haptics';
import { FONT_SIZE, PALETTE, grid, type FontSize } from './theme';

interface PixelButtonProps {
  children: ReactNode;
  onClick?: () => void;
  fill?: string;
  textColor?: string;
  border?: string;
  size?: FontSize | number;
  fullWidth?: boolean;
  disabled?: boolean;
  /// Which haptic intent fires on press, matching the Swift call sites.
  feedback?: 'tap' | 'thud' | 'select' | 'none';
  className?: string;
  ariaLabel?: string;
}

/// Button that physically presses into its shadow when held. Uses :active rather
/// than :hover — there is no hover on the phones this is built for.
export function PixelButton({
  children,
  onClick,
  fill = PALETTE.accent,
  textColor = PALETTE.ink,
  border = PALETTE.ink,
  size = 'heading',
  fullWidth = true,
  disabled = false,
  feedback = 'thud',
  className = '',
  ariaLabel,
}: PixelButtonProps) {
  const fontSize = typeof size === 'number' ? size : FONT_SIZE[size];

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        if (feedback !== 'none') haptics[feedback]();
        onClick?.();
      }}
      className={`pixel-edge pixel-press select-none ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      style={{
        background: fill,
        color: textColor,
        borderColor: border,
        fontSize,
        letterSpacing: 2,
        textTransform: 'uppercase',
        lineHeight: 1.4,
        paddingBlock: grid(4),
        paddingInline: grid(6),
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

interface TextButtonProps {
  children: ReactNode;
  onClick?: () => void;
  color?: string;
  ariaLabel?: string;
}

/// Bare uppercase label with no border or fill, for low-emphasis actions tucked
/// into a header row (home, skip) that shouldn't compete with the primary CTA.
export function TextButton({
  children,
  onClick,
  color = PALETTE.inkDim,
  ariaLabel,
}: TextButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={() => {
        haptics.tap();
        onClick?.();
      }}
      className="select-none"
      style={{
        color,
        fontSize: FONT_SIZE.caption,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        lineHeight: 1.6,
      }}
    >
      {children}
    </button>
  );
}

interface ChipButtonProps {
  title: string;
  selected: boolean;
  enabled?: boolean;
  tint?: string;
  onClick: () => void;
}

/// Small selectable pill used throughout the setup screen.
export function ChipButton({
  title,
  selected,
  enabled = true,
  tint = PALETTE.accent,
  onClick,
}: ChipButtonProps) {
  return (
    <button
      type="button"
      disabled={!enabled}
      aria-pressed={selected}
      onClick={() => {
        if (!enabled) return;
        haptics.select();
        onClick();
      }}
      className="flex-1 select-none"
      style={{
        background: selected ? tint : PALETTE.surface,
        color: selected ? PALETTE.background : PALETTE.ink,
        borderWidth: selected ? 3 : 2,
        borderStyle: 'solid',
        borderColor: selected ? PALETTE.ink : PALETTE.surfaceRaised,
        fontSize: FONT_SIZE.caption,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        paddingBlock: grid(3),
        paddingInline: grid(2),
        opacity: enabled ? 1 : 0.35,
      }}
    >
      {title}
    </button>
  );
}
