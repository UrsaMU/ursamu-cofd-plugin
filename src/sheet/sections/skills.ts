// Skills section: divider + 24 stat lines grouped by Mental/Physical/Social.

import { divider } from "@ursamu/ursamu";
import {
  COFD_MENTAL_SKILLS,
  COFD_PHYSICAL_SKILLS,
  COFD_SOCIAL_SKILLS,
} from "../../dictionary/index.ts";
import { formatDottedStatLine, center } from "../../support/format.ts";
import type { SheetSection, SheetContext } from "./types.ts";

const TITLE_CASE = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

function statLine(
  ctx: SheetContext,
  key: string,
  base: number,
): string {
  const temp = ctx.sheet.tempStats?.[key];
  return "  " + formatDottedStatLine(TITLE_CASE(key), base, temp, ctx.width - 2);
}

function renderSpecialties(ctx: SheetContext, skill: string): string[] {
  const specs = ctx.sheet.specialties?.[skill] || [];
  if (specs.length === 0) return [];
  // Show specialties under the parent skill, indented further.
  return [`    %cx(${specs.join(", ")})%cn`];
}

export const skillsSection: SheetSection = {
  key: "skills",
  async render(ctx: SheetContext): Promise<string[]> {
    const { sheet, width } = ctx;
    const sks = sheet.skills;
    const lines: string[] = [];

    lines.push(await divider("S K I L L S"));

    const subhead = (label: string) =>
      `%ch%cc${center(label, width)}%cn`;

    const emit = (skill: string) => {
      lines.push(statLine(ctx, skill, sks[skill] || 0));
      lines.push(...renderSpecialties(ctx, skill));
    };

    lines.push(subhead("Mental"));
    for (const s of COFD_MENTAL_SKILLS)   emit(s);

    lines.push(subhead("Physical"));
    for (const s of COFD_PHYSICAL_SKILLS) emit(s);

    lines.push(subhead("Social"));
    for (const s of COFD_SOCIAL_SKILLS)   emit(s);

    return lines;
  },
};
