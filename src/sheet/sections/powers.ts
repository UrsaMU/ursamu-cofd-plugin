// Powers section: template-aware header (Disciplines/Arcana/Contracts/Renown)
// rendered as a two-column 10-dot list.

import { divider } from "jsr:@ursamu/ursamu";
import { ljust } from "../../support/format.ts";
import type { SheetSection, SheetContext } from "./types.ts";

function formatDot(val: number): string {
  return "%ch%cy" + "●".repeat(val) + "%cn%cx" + "○".repeat(10 - val) + "%cn";
}

export const powersSection: SheetSection = {
  key: "powers",
  async render(ctx: SheetContext): Promise<string[]> {
    const { sheet, template: tmpl } = ctx;
    const lines: string[] = [];

    const activePowers = tmpl.validPowers.filter(p => (sheet.powers[p] || 0) > 0);
    if (activePowers.length === 0) return lines;

    let powerHeader = "P O W E R S";
    if (sheet.template === "vampire") powerHeader = "D I S C I P L I N E S";
    if (sheet.template === "mage") powerHeader = "A R C A N A";
    if (sheet.template === "changeling") powerHeader = "C O N T R A C T S";
    if (sheet.template === "werewolf") powerHeader = "R E N O W N";

    lines.push(await divider(powerHeader));

    for (let i = 0; i < activePowers.length; i += 2) {
      const p1 = activePowers[i];
      const p2 = activePowers[i + 1];

      const label1 = ljust(p1.replace(/\b\w/g, c => c.toUpperCase()) + ":", 16);
      const val1 = sheet.powers[p1] || 0;
      let line = `  %ch${label1}%cn ${formatDot(val1)}`;

      if (p2) {
        const label2 = ljust(p2.replace(/\b\w/g, c => c.toUpperCase()) + ":", 16);
        const val2 = sheet.powers[p2] || 0;
        line += `   %ch${label2}%cn ${formatDot(val2)}`;
      }
      lines.push(line);
    }

    return lines;
  },
};
