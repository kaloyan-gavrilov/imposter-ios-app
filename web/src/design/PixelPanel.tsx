import type { CSSProperties, ReactNode } from 'react';

import { PALETTE, grid } from './theme';

interface PixelPanelProps {
  children: ReactNode;
  fill?: string;
  border?: string;
  padding?: number;
  className?: string;
  style?: CSSProperties;
}

/// Hard-edged box: flat fill, 3px border, solid offset shadow. No blur, no radius.
export function PixelPanel({
  children,
  fill = PALETTE.surface,
  border = PALETTE.ink,
  padding = grid(4),
  className = '',
  style,
}: PixelPanelProps) {
  return (
    <div
      className={`pixel-edge ${className}`}
      style={{
        background: fill,
        borderColor: border,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/// Thin decorative divider made of a dotted pixel run.
export function PixelDivider({ color = PALETTE.inkDim }: { color?: string }) {
  return (
    <div
      aria-hidden
      className="h-[3px] w-full"
      style={{
        backgroundImage: `repeating-linear-gradient(to right, ${color} 0 4px, transparent 4px 8px)`,
      }}
    />
  );
}
