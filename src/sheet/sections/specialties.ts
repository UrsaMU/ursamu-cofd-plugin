// Specialties section: one line per skill that has specialties.

import { divider } from "jsr:@ursamu/ursamu";
import type { SheetSection, SheetContext } from "./types.ts";

export const specialtiesSection: SheetSection = {
  key: "specialties",
  async render(ctx: SheetContext): Promise<string[]> {
    const { sheet } = ctx;
    const lines: string[] = [];

    const specialtySkills = Object.keys(sheet.specialties).filter(
      s => (sheet.specialties[s] || []).length > 0,
    );
    if (specialtySkills.length === 0) return lines;

    lines.push(await divider("S P E C I A L T I E S"));
    for (const skill of specialtySkills) {
      const specs = sheet.specialties[skill] || [];
      const skillTitle = skill.replace(/\b\w/g, c => c.toUpperCase());
      lines.push(`  %ch${skillTitle}:%cn ${specs.join(", ")}`);
    }

    return lines;
  },
};
