// String padding helpers used by sheet/chargen renderers.

export function ljust(s: string, w: number): string {
  return s.padEnd(w);
}

export function center(s: string, w: number): string {
  if (s.length >= w) return s;
  const left = Math.floor((w - s.length) / 2);
  return " ".repeat(left) + s + " ".repeat(w - s.length - left);
}

/**
 * Render a stat line with a dotted leader. The label sits flush-left,
 * the value sits flush-right within `width`, and dots fill the space
 * between. When `temp` is provided and differs from `base`, the trailing
 * value renders as `base(temp)`.
 *
 *   formatDottedStatLine("Intelligence", 3, undefined, 44)
 *     -> "Intelligence:..............................3"
 *
 *   formatDottedStatLine("Wits", 2, 3, 44)
 *     -> "Wits:.....................................2(3)"
 *
 * Color codes are applied: label is %ch, dots are %cx (dim), value is
 * %ch%cy. The width is the visible-character width AFTER color codes
 * are stripped.
 */
export function formatDottedStatLine(
  label: string,
  base: number,
  temp: number | undefined,
  width: number,
): string {
  const labelStr = label + ":";
  const valueStr = (temp !== undefined && temp !== base)
    ? `${base}(${temp})`
    : `${base}`;

  const dotsNeeded = width - labelStr.length - valueStr.length;
  const dots = ".".repeat(Math.max(1, dotsNeeded));

  return `%ch${labelStr}%cn%cx${dots}%cn%ch%cy${valueStr}%cn`;
}
