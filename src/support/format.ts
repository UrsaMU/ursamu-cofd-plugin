// String padding helpers used by sheet/chargen renderers.

export function ljust(s: string, w: number): string {
  return s.padEnd(w);
}

export function center(s: string, w: number): string {
  if (s.length >= w) return s;
  const left = Math.floor((w - s.length) / 2);
  return " ".repeat(left) + s + " ".repeat(w - s.length - left);
}
