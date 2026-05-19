// Merits section: two-column merit listing in 5-dot scale.

import { divider } from "jsr:@ursamu/ursamu";
import { COFD_MERITS } from "../../dictionary/index.ts";
import { ljust } from "../../support/format.ts";
import type { SheetSection, SheetContext } from "./types.ts";

function format5Dot(val: number): string {
  return "%ch%cy" + "●".repeat(val) + "%cn%cx" + "○".repeat(5 - val) + "%cn";
}

export const meritsSection: SheetSection = {
  key: "merits",
  async render(ctx: SheetContext): Promise<string[]> {
    const { sheet } = ctx;
    const lines: string[] = [];

    const activeMerits = Object.keys(sheet.merits || {}).filter(
      m => (sheet.merits[m] || 0) > 0,
    );
    if (activeMerits.length === 0) return lines;

    lines.push(await divider("M E R I T S"));
    for (let i = 0; i < activeMerits.length; i += 2) {
      const m1 = activeMerits[i];
      const m2 = activeMerits[i + 1];

      const getMeritName = (key: string) => {
        const found = COFD_MERITS.find(m => m.key === key);
        return found ? found.name : key.replace(/\b\w/g, c => c.toUpperCase());
      };

      const name1 = getMeritName(m1);
      const label1 = ljust(name1 + ":", 20);
      const val1 = sheet.merits[m1] || 0;
      let line = `  %ch${label1}%cn ${format5Dot(val1)}`;

      if (m2) {
        const name2 = getMeritName(m2);
        const label2 = ljust(name2 + ":", 20);
        const val2 = sheet.merits[m2] || 0;
        line += `   %ch${label2}%cn ${format5Dot(val2)}`;
      }
      lines.push(line);
    }

    return lines;
  },
};
