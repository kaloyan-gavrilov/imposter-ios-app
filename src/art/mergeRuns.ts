export interface PixelRun {
  x: number;
  y: number;
  width: number;
  slot: number;
}

/// Collapses each ASCII row into maximal horizontal runs of one palette slot.
/// Used by the build-time SVG codegen, and by tests to prove the generated
/// markup covers exactly the same pixels as the source grid.
export function mergeRuns(
  rows: readonly string[],
  slotOf: (character: string) => number | null,
): PixelRun[] {
  const runs: PixelRun[] = [];

  rows.forEach((row, y) => {
    let start = -1;
    let slot = -1;

    const flush = (end: number) => {
      if (start !== -1) runs.push({ x: start, y, width: end - start, slot });
      start = -1;
      slot = -1;
    };

    for (let x = 0; x < row.length; x += 1) {
      const next = slotOf(row[x]);
      if (next === null) {
        flush(x);
      } else if (next !== slot) {
        flush(x);
        start = x;
        slot = next;
      }
    }
    flush(row.length);
  });

  return runs;
}
