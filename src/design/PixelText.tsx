import type { CSSProperties, ReactNode } from 'react';

import { FONT_SIZE, PALETTE, type FontSize } from './theme';

interface PixelTextProps {
  children: ReactNode;
  /// Named step on the ramp, or a raw px value for the few one-off sizes.
  size?: FontSize | number;
  color?: string;
  tracking?: number;
  /// Words and hints keep their original casing; everything else shouts.
  preserveCase?: boolean;
  className?: string;
  style?: CSSProperties;
}

function resolveSize(size: FontSize | number): number {
  return typeof size === 'number' ? size : FONT_SIZE[size];
}

/// Chunky pixel label with letter tracking, the default text style app-wide.
export function PixelText({
  children,
  size = 'body',
  color = PALETTE.ink,
  tracking = 1.5,
  preserveCase = false,
  className = '',
  style,
}: PixelTextProps) {
  return (
    <span
      className={className}
      style={{
        fontSize: resolveSize(size),
        color,
        letterSpacing: tracking,
        textTransform: preserveCase ? 'none' : 'uppercase',
        lineHeight: 1.6,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

interface PixelTitleProps {
  text: string;
  size?: FontSize | number;
  color?: string;
  shadowColor?: string;
  className?: string;
}

/// Text with a hard 3px offset shadow, for headings. The shadow is a second copy
/// rather than a text-shadow so it stays perfectly crisp at any size.
export function PixelTitle({
  text,
  size = 'title',
  color = PALETTE.ink,
  shadowColor = PALETTE.accent,
  className = '',
}: PixelTitleProps) {
  const shared: CSSProperties = {
    fontSize: resolveSize(size),
    letterSpacing: 3,
    textTransform: 'uppercase',
    lineHeight: 1.4,
    whiteSpace: 'pre-wrap',
  };

  return (
    <span className={`relative inline-block ${className}`}>
      <span
        aria-hidden
        className="absolute left-[3px] top-[3px] whitespace-pre-wrap"
        style={{ ...shared, color: shadowColor }}
      >
        {text}
      </span>
      <span className="relative" style={{ ...shared, color }}>
        {text}
      </span>
    </span>
  );
}
