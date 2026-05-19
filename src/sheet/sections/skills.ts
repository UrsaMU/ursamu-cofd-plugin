// Skills section: divider + 8 lines of skill dots in three columns.

import { divider } from "jsr:@ursamu/ursamu";
import {
  COFD_MENTAL_SKILLS,
  COFD_PHYSICAL_SKILLS,
  COFD_SOCIAL_SKILLS,
} from "../../dictionary/index.ts";
import { ljust } from "../../support/format.ts";
import type { SheetSection, SheetContext } from "./types.ts";

function formatDot(val: number): string {
  return "%ch%cy" + "●".repeat(val) + "%cn%cx" + "○".repeat(10 - val) + "%cn";
}

export const skillsSection: SheetSection = {
  key: "skills",
  async render(ctx: SheetContext): Promise<string[]> {
    const { sheet } = ctx;
    const sks = sheet.skills;
    const lines: string[] = [];

    lines.push(await divider("S K I L L S"));

    for (let i = 0; i < 8; i++) {
      const mental = COFD_MENTAL_SKILLS[i];
      const physical = COFD_PHYSICAL_SKILLS[i];
      const social = COFD_SOCIAL_SKILLS[i];

      const mLabel = ljust(mental.replace(/\b\w/g, c => c.toUpperCase()) + ":", 14);
      const pLabel = ljust(physical.replace(/\b\w/g, c => c.toUpperCase()) + ":", 12);
      const sLabel = ljust(social.replace(/\b\w/g, c => c.toUpperCase()) + ":", 14);

      const mVal = sks[mental] || 0;
      const pVal = sks[physical] || 0;
      const sVal = sks[social] || 0;

      lines.push(
        `  %ch${mLabel}%cn ${formatDot(mVal)}  %ch${pLabel}%cn ${formatDot(pVal)}  %ch${sLabel}%cn ${formatDot(sVal)}`
      );
    }

    return lines;
  },
};
