/// Thin wrapper so haptic intent is named at call sites instead of scattered
/// vibration calls — mirrors ImposterApp/Design/Haptics.swift.
///
/// Note: iOS Safari does not implement the Vibration API, so on iPhone these are
/// all no-ops. The call sites stay identical to the Swift ones so the feedback
/// lights up for free if Safari ever ships it.

function buzz(pattern: number | number[]) {
  if (typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Vibration can throw when the document isn't focused. Never worth failing on.
  }
}

export const haptics = {
  tap: () => buzz(10),
  thud: () => buzz(30),
  select: () => buzz(5),
  success: () => buzz([10, 40, 10]),
  warning: () => buzz([40, 60, 40]),
};
