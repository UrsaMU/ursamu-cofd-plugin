// Attributes section: divider + 3 lines of attribute dots.

import { divider } from "jsr:@ursamu/ursamu";
import type { SheetSection, SheetContext } from "./types.ts";

function formatDot(val: number): string {
  return "%ch%cy" + "●".repeat(val) + "%cn%cx" + "○".repeat(10 - val) + "%cn";
}

export const attributesSection: SheetSection = {
  key: "attributes",
  async render(ctx: SheetContext): Promise<string[]> {
    const { sheet } = ctx;
    const atts = sheet.attributes;
    const lines: string[] = [];

    lines.push(await divider("A T T R I B U T E S"));

    lines.push(
      `  %chIntelligence:%cn ${formatDot(atts.intelligence || 1)}  %chStrength:%cn  ${formatDot(atts.strength || 1)}  %chPresence:%cn     ${formatDot(atts.presence || 1)}`
    );
    lines.push(
      `  %chWits:%cn         ${formatDot(atts.wits || 1)}  %chDexterity:%cn ${formatDot(atts.dexterity || 1)}  %chManipulation:%cn ${formatDot(atts.manipulation || 1)}`
    );
    lines.push(
      `  %chResolve:%cn      ${formatDot(atts.resolve || 1)}  %chStamina:%cn   ${formatDot(atts.stamina || 1)}  %chComposure:%cn    ${formatDot(atts.composure || 1)}`
    );

    return lines;
  },
};
