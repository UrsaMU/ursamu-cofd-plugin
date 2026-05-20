// Advantages section: willpower/morality/size, initiative/speed/defense,
// and optional powerStat/energy pool line for supernatural templates.

import { divider } from "@ursamu/ursamu";
import { ljust } from "../../support/format.ts";
import type { SheetSection, SheetContext } from "./types.ts";

export const advantagesSection: SheetSection = {
  key: "advantages",
  async render(ctx: SheetContext): Promise<string[]> {
    const { sheet, template: tmpl } = ctx;
    const atts = sheet.attributes;
    const sks = sheet.skills;
    const lines: string[] = [];

    lines.push(await divider("A D V A N T A G E S"));

    const willpowerStr = `${sheet.advantages.willpowerCurrent}/${sheet.advantages.willpowerMax}`;
    const initiative = (atts.dexterity || 1) + (atts.composure || 1);
    const speed = (atts.strength || 1) + (atts.dexterity || 1) + 5;
    const defense = Math.min(atts.dexterity || 1, atts.wits || 1) + (sks.athletics || 0);

    lines.push(
      `  %chWillpower:%cn  ${ljust(willpowerStr, 12)} %ch${tmpl.moralityName}:%cn ${ljust(sheet.moralityValue.toString(), 10)} %chSize:%cn ${ljust(sheet.advantages.size.toString(), 10)}`
    );
    lines.push(
      `  %chInitiative:%cn ${ljust(initiative.toString(), 12)} %chSpeed:%cn     ${ljust(speed.toString(), 10)} %chDefense:%cn ${ljust(defense.toString(), 10)}`
    );

    // If the template has dynamic advantages (powerStat & energy pool), display them.
    if (tmpl.powerStatName !== "None" || tmpl.energyName !== "None") {
      const powerStr = `${tmpl.powerStatName}: ${sheet.powerStatValue}`;
      const energyMax = tmpl.energyMaxFormula(sheet.powerStatValue);
      const energyStr = `${tmpl.energyName}: ${sheet.energyCurrent}/${energyMax}`;
      lines.push(
        `  %ch${ljust(powerStr, 25)}  ${energyStr}%cn`
      );
    }

    return lines;
  },
};
