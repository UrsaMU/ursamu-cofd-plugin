// Attributes section: divider + 9 stat lines grouped by Mental/Physical/Social.

import { divider } from "@ursamu/ursamu";
import { formatDottedStatLine, center } from "../../support/format.ts";
import type { SheetSection, SheetContext } from "./types.ts";

const TITLE_CASE = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

function statLine(
  ctx: SheetContext,
  key: string,
  base: number,
): string {
  const temp = ctx.sheet.tempStats?.[key];
  // Indent 2 spaces; visible width target is ctx.width - 2 (default 76).
  return "  " + formatDottedStatLine(TITLE_CASE(key), base, temp, ctx.width - 2);
}

const MENTAL    = ["intelligence", "wits", "resolve"];
const PHYSICAL  = ["strength", "dexterity", "stamina"];
const SOCIAL    = ["presence", "manipulation", "composure"];

export const attributesSection: SheetSection = {
  key: "attributes",
  async render(ctx: SheetContext): Promise<string[]> {
    const { sheet, width } = ctx;
    const atts = sheet.attributes;
    const lines: string[] = [];

    lines.push(await divider("A T T R I B U T E S"));

    const subhead = (label: string) =>
      `%ch%cc${center(label, width)}%cn`;

    lines.push(subhead("Mental"));
    for (const k of MENTAL)   lines.push(statLine(ctx, k, atts[k] || 1));

    lines.push(subhead("Physical"));
    for (const k of PHYSICAL) lines.push(statLine(ctx, k, atts[k] || 1));

    lines.push(subhead("Social"));
    for (const k of SOCIAL)   lines.push(statLine(ctx, k, atts[k] || 1));

    return lines;
  },
};
