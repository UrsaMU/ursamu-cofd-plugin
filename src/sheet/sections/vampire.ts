// Vampire identity section.
//
// Renders Bane, Mask & Dirge Touchstones, and the Blood Potency / Vitae /
// Humanity block when the sheet's template is "vampire". Returns [] for any
// other template so the section is invisible on mortal / werewolf / etc.

import { divider } from "@ursamu/ursamu";
import { getBane, getBloodPotencyEntry } from "../../gamelines/vampire.ts";
import type { SheetContext, SheetSection } from "./types.ts";

/** Truncate a string to `n` chars without adding an ellipsis. */
function trimTo(s: string, n: number): string {
  if (!s) return "";
  return s.length <= n ? s : s.slice(0, n);
}

export const vampireSection: SheetSection = {
  key: "vampire",
  async render(ctx: SheetContext): Promise<string[]> {
    const { sheet } = ctx;
    if ((sheet.template || "").toLowerCase().trim() !== "vampire") {
      return [];
    }

    const clanKey = (sheet.customFields?.clan || "").toLowerCase().trim();
    const covenant = sheet.customFields?.covenant || "(unset)";
    const clanLabel = sheet.customFields?.clan || "(unset)";
    const bane = getBane(clanKey);

    const mask = sheet.touchstones?.mask || "(unset)";
    const dirge = sheet.touchstones?.dirge || "(unset)";

    const bp = sheet.powerStatValue ?? 0;
    const bpRow = getBloodPotencyEntry(bp);
    const vitae = sheet.energyCurrent ?? 0;
    const humanity = sheet.moralityValue ?? 0;

    const lines: string[] = [];
    lines.push(await divider("V A M P I R E"));
    lines.push(
      `  %chClan:%cn           ${clanLabel.padEnd(20)} %chCovenant:%cn    ${covenant}`,
    );

    if (bane) {
      const baneLine = `${bane.name} - ${trimTo(bane.description, 80)}`;
      lines.push(`  %chBane:%cn           ${baneLine}`);
    } else {
      lines.push(`  %chBane:%cn           (unknown clan)`);
    }

    lines.push(`  %chMask:%cn           ${mask}`);
    lines.push(`  %chDirge:%cn          ${dirge}`);
    lines.push(
      `  %chBlood Potency:%cn  ${bp}  (Vitae max ${bpRow.maxVitae}, per-turn ${bpRow.maxPerTurn}, min Humanity ${bpRow.minHumanity})`,
    );
    lines.push(`  %chVitae:%cn          ${vitae} / ${bpRow.maxVitae}`);
    lines.push(`  %chHumanity:%cn       ${humanity}`);

    return lines;
  },
};
