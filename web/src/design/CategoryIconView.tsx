import { iconByID } from '@/art/categoryIcons';
import { ICON_MARKUP } from '@/art/generated/icons';

interface CategoryIconViewProps {
  categoryID: string;
  size?: number;
}

/// Draws a pre-rendered category icon. Colours are baked in — category art is
/// fixed, never recoloured per player.
export function CategoryIconView({
  categoryID,
  size = 48,
}: CategoryIconViewProps) {
  const icon = iconByID(categoryID);
  const markup = ICON_MARKUP[icon.id] ?? ICON_MARKUP.unknown ?? '';

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden
      shapeRendering="crispEdges"
      style={{ display: 'block', flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
