// Skills section: divider + 8 rows x 3 columns (Mental/Physical/Social).
// Specialties render inline beneath the skill row that has them.

import { divider } from "@ursamu/ursamu";
import {
  COFD_MENTAL_SKILLS,
  COFD_PHYSICAL_SKILLS,
  COFD_SOCIAL_SKILLS,
} from "../../dictionary/index.ts";
import { formatDottedStatLine } from "../../support/format.ts";
import type { SheetSection, SheetContext } from "./types.ts";

const TITLE_CASE = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const SEP = "  ";

function cell(ctx: SheetContext, key: string, base: number, cellWidth: number): string {
  const temp = ctx.sheet.tempStats?.[key];
  return formatDottedStatLine(TITLE_CASE(key), base, temp, cellWidth);
}

function specialtyLines(ctx: SheetContext, row: [string, string, string]): string[] {
  const specsBy = (k: string) => ctx.sheet.specialties?.[k] || [];
  const any = row.some((k) => specsBy(k).length > 0);
  if (!any) return [];
  // Indented "(spec1, spec2)" listed by parent skill on one combined line.
  return row
    .filter((k) => specsBy(k).length > 0)
    .map((k) => `    %cx${TITLE_CASE(k)}: ${specsBy(k).join(", ")}%cn`);
}

export const skillsSection: SheetSection = {
  key: "skills",
  async render(ctx: SheetContext): Promise<string[]> {
    const { sheet, width } = ctx;
    const sks = sheet.skills;
    const cw = Math.floor((width - 2 - SEP.length * 2) / 3);
    const lines: string[] = [];

    lines.push(await divider("S K I L L S"));

    for (let i = 0; i < 8; i++) {
      const m = COFD_MENTAL_SKILLS[i];
      const p = COFD_PHYSICAL_SKILLS[i];
      const s = COFD_SOCIAL_SKILLS[i];

      lines.push(
        "  " +
        cell(ctx, m, sks[m] || 0, cw) + SEP +
        cell(ctx, p, sks[p] || 0, cw) + SEP +
        cell(ctx, s, sks[s] || 0, cw)
      );

      lines.push(...specialtyLines(ctx, [m, p, s]));
    }

    return lines;
  },
};
