/**
 * Chart colour system.
 *
 * The categorical order below is VALIDATED, not chosen by eye — it was run
 * through the palette checker against the #FFFFFF card surface and passes the
 * lightness band, chroma floor, colour-vision separation, normal-vision floor
 * and 3:1 contrast checks. An earlier ordering that looked obviously distinct
 * to full-colour vision collapsed to ΔE 3.8 under deuteranopia, which is why
 * this list is fixed rather than a set of nice colours.
 *
 * Two rules that keep it valid:
 *   1. Assign hues in this order and never cycle. A seventh series folds into
 *      "Other" rather than inventing a colour.
 *   2. Order is load-bearing — adjacent pairs were checked as neighbours, so
 *      reordering can break the separation the validator confirmed.
 *
 * Status colours are deliberately NOT in here. Good/warning/critical carry
 * meaning wherever they appear, and reusing one as "series 4" would make a
 * neutral category read as a problem.
 */
export const CATEGORICAL = [
  "#6D4AF2", // brand purple — always the primary series
  "#0D9488", // teal
  "#B45309", // amber
  "#DB2777", // pink
  "#2563EB", // blue
  "#4D7C0F", // olive
] as const;

/** Anything beyond the six named hues. Never a generated colour. */
export const OVERFLOW_COLOR = "#94A3B8";

/** Single-hue ramp for magnitude (light → dark). */
export const SEQUENTIAL = ["#EDE9FE", "#C9BCFB", "#A48DF7", "#8567F4", "#6D4AF2"] as const;

/** Recessive chrome so the data stays the loudest thing in the frame. */
export const CHART_INK = {
  grid: "#EEF0F4",
  axis: "#9CA3AF",
  label: "#6B7280",
  surface: "#FFFFFF",
} as const;

export function colorAt(index: number) {
  return index < CATEGORICAL.length ? CATEGORICAL[index] : OVERFLOW_COLOR;
}

/**
 * Cap a breakdown at the palette size, rolling the tail into "Other".
 *
 * Keeps a long-tailed dimension (30 categories, say) from ever needing a
 * seventh colour, which is the point at which a categorical chart stops being
 * readable regardless of the palette.
 */
export function withOverflow<T extends { label: string; value: number }>(
  rows: T[],
  limit = CATEGORICAL.length,
): Array<{ label: string; value: number; color: string }> {
  const sorted = [...rows].sort((left, right) => right.value - left.value);
  const head = sorted.slice(0, limit).map((row, index) => ({
    label: row.label,
    value: row.value,
    color: colorAt(index),
  }));
  const tail = sorted.slice(limit);
  if (tail.length > 0) {
    head.push({
      label: `Other (${tail.length})`,
      value: tail.reduce((total, row) => total + row.value, 0),
      color: OVERFLOW_COLOR,
    });
  }
  return head;
}
