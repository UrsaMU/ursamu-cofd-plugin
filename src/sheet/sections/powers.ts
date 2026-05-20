// Powers section: template-aware header (Disciplines/Arcana/Contracts/Renown)
// rendered as a single-column dotted-leader list.

import { divider } from "@ursamu/ursamu";
import { formatDottedStatLine } from "../../support/format.ts";
import type { SheetSection, SheetContext } from "./types.ts";

const TITLE_CASE = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

export const powersSection: SheetSection = {
  key: "powers",
  async render(ctx: SheetContext): Promise<string[]> {
    const { sheet, template: tmpl, width } = ctx;
    const lines: string[] = [];

    const active = tmpl.validPowers.filter(p => (sheet.powers[p] || 0) > 0);
    if (active.length === 0) return lines;

    let powerHeader = "P O W E R S";
    if (sheet.template === "vampire")    powerHeader = "D I S C I P L I N E S";
    if (sheet.template === "mage")       powerHeader = "A R C A N A";
    if (sheet.template === "changeling") powerHeader = "C O N T R A C T S";
    if (sheet.template === "werewolf")   powerHeader = "R E N O W N";

    lines.push(await divider(powerHeader));

    for (const key of active) {
      const base = sheet.powers[key] || 0;
      const temp = sheet.tempStats?.[key];
      lines.push(
        "  " + formatDottedStatLine(TITLE_CASE(key), base, temp, width - 2),
      );
    }

    return lines;
  },
};
