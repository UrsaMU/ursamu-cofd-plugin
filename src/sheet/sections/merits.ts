// Merits section: single-column dotted-leader listing (5-dot scale rendered
// as numeric value, with optional temp value in parens).

import { divider } from "@ursamu/ursamu";
import { COFD_MERITS } from "../../dictionary/index.ts";
import { formatDottedStatLine } from "../../support/format.ts";
import type { SheetSection, SheetContext } from "./types.ts";

function meritName(key: string): string {
  const found = COFD_MERITS.find(m => m.key === key);
  return found ? found.name : key.replace(/\b\w/g, (c) => c.toUpperCase());
}

export const meritsSection: SheetSection = {
  key: "merits",
  async render(ctx: SheetContext): Promise<string[]> {
    const { sheet, width } = ctx;
    const lines: string[] = [];

    const active = Object.keys(sheet.merits || {})
      .filter(m => (sheet.merits[m] || 0) > 0)
      .sort();
    if (active.length === 0) return lines;

    lines.push(await divider("M E R I T S"));

    for (const key of active) {
      const base = sheet.merits[key] || 0;
      const temp = sheet.tempStats?.[key];
      lines.push(
        "  " + formatDottedStatLine(meritName(key), base, temp, width - 2),
      );
    }

    return lines;
  },
};
