// Changeling: The Lost (CtL) identity section.
//
// Renders Seeming, Kith, Court, Needle, Thread, Wyrd, Glamour, and Clarity.

import { divider } from "@ursamu/ursamu";
import { getStandardMaxEnergy } from "../../gamelines/templates.ts";
import type { SheetContext, SheetSection } from "./types.ts";

export const changelingSection: SheetSection = {
  key: "changeling",
  async render(ctx: SheetContext): Promise<string[]> {
    const { sheet } = ctx;
    if ((sheet.template || "").toLowerCase().trim() !== "changeling") {
      return [];
    }

    const seeming = sheet.customFields?.seeming || "(unset)";
    const kith = sheet.customFields?.kith || "(unset)";
    const court = sheet.customFields?.court || "(unset)";
    const needle = sheet.customFields?.needle || "(unset)";
    const thread = sheet.customFields?.thread || "(unset)";

    const wyrd = sheet.powerStatValue ?? 1;
    const maxGlamour = getStandardMaxEnergy(wyrd);
    const glamour = sheet.energyCurrent ?? 0;
    const clarity = sheet.moralityValue ?? 7;

    const lines: string[] = [];
    lines.push(await divider("C H A N G E L I N G :   T H E   L O S T"));
    lines.push(
      `  %chSeeming:%cn       ${seeming.padEnd(20)} %chKith:%cn         ${kith}`
    );
    lines.push(
      `  %chCourt:%cn         ${court.padEnd(20)}`
    );
    lines.push(
      `  %chNeedle:%cn        ${needle.padEnd(20)} %chThread:%cn       ${thread}`
    );
    lines.push(
      `  %chWyrd:%cn          ${wyrd}  (Glamour max ${maxGlamour})`
    );
    lines.push(
      `  %chGlamour:%cn       ${glamour} / ${maxGlamour}`
    );
    lines.push(
      `  %chClarity:%cn       ${clarity}`
    );

    return lines;
  },
};
