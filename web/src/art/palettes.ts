/// Recolours a sprite. Slots line up with `spriteSlot`:
/// 0 body, 1 shade, 2 outline, 3 white, 4 accent.
/// Ported from ImposterApp/Avatars/AvatarPalette.swift.
export interface AvatarPalette {
  id: string;
  hexes: string[];
}

export const AVATAR_PALETTES: AvatarPalette[] = [
  { id: 'lime', hexes: ['#8BD62F', '#5E9B18', '#14210B', '#F6FBEA', '#FFC93C'] },
  { id: 'magenta', hexes: ['#F2559B', '#A82363', '#25091A', '#FFF0F7', '#6BE3FF'] },
  { id: 'cyan', hexes: ['#49C7E8', '#1F7A96', '#08202B', '#EDFBFF', '#FFD166'] },
  { id: 'amber', hexes: ['#F2A93B', '#B06B12', '#2A1704', '#FFF6E4', '#FF5C4D'] },
  { id: 'violet', hexes: ['#9B6BE3', '#5F35A3', '#180B2B', '#F4EDFF', '#7CF6C8'] },
  { id: 'coral', hexes: ['#F2695C', '#A83226', '#2B0C08', '#FFEFEC', '#FFE066'] },
  { id: 'mint', hexes: ['#5FD9A8', '#24906A', '#07231A', '#EFFFF8', '#FF8FCB'] },
  { id: 'steel', hexes: ['#A9B4D6', '#5A6486', '#11141F', '#FFFFFF', '#F2559B'] },
];

export function paletteByID(id: string): AvatarPalette {
  return AVATAR_PALETTES.find((palette) => palette.id === id) ?? AVATAR_PALETTES[0];
}

/// Body colour, used for score chips and vote highlights.
export function paletteSignature(palette: AvatarPalette): string {
  return palette.hexes[0];
}
