// Merits section: 2 columns of dotted-leader merit lines.

import { divider } from "@ursamu/ursamu";
import { COFD_MERITS } from "../../dictionary/index.ts";
import { formatDottedStatLine } from "../../support/format.ts";
import type { SheetSection, SheetContext } from "./types.ts";

const SEP = "  ";

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

    const cw = Math.floor((width - 2 - SEP.length) / 2);
    for (let i = 0; i < active.length; i += 2) {
      const k1 = active[i];
      const k2 = active[i + 1];
      const cell1 = formatDottedStatLine(
        meritName(k1), sheet.merits[k1], sheet.tempStats?.[k1], cw,
      );
      const cell2 = k2
        ? SEP + formatDottedStatLine(
            meritName(k2), sheet.merits[k2], sheet.tempStats?.[k2], cw,
          )
        : "";
      lines.push("  " + cell1 + cell2);
    }

    return lines;
  },
};
