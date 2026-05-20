// Renders character generation per-stage instructions, current values, and progress.

import { header, footer, divider } from "@ursamu/ursamu";
import {
  COFD_MENTAL_SKILLS,
  COFD_PHYSICAL_SKILLS,
  COFD_SOCIAL_SKILLS,
  COFD_MERITS,
} from "../dictionary/index.ts";
import { COFD_TEMPLATES } from "../gamelines/templates.ts";
import { getStageName, type CofdCgState } from "./state.ts";

function ljust(s: string, w: number): string {
  return s + " ".repeat(Math.max(0, w - s.length));
}

function formatDots(val: number): string {
  return "%ch%cy" + "●".repeat(val) + "%cn%cx" + "○".repeat(5 - val) + "%cn";
}

/**
 * Generates beautiful CLI instructions, current values, and progress meter.
 */
export async function getStageInstructions(playerName: string, cgState: CofdCgState): Promise<string> {
  const stage = cgState.stage;
  const sheet = cgState.sheet;
  const tKey = sheet.template.toLowerCase().trim();
  const tmpl = COFD_TEMPLATES[tKey] || COFD_TEMPLATES.mortal;

  const lines: string[] = [];
  lines.push(await header(`CHARACTER CREATION — STAGE ${stage}: ${getStageName(stage).toUpperCase()}`));

  // Progress Bar
  const steps = [1, 2, 3, 4, 5, 6].map(s => {
    const name = `${s}:${getStageName(s).split(" ")[0]}`;
    return s === stage ? `%ch%cy[${name}]%cn` : `[${name}]`;
  }).join(" > ");
  lines.push(`  %chProgress:%cn ${steps}`);
  lines.push(await divider(""));

  switch (stage) {
    case 1:
      lines.push("  Welcome to character creation! Let's start by defining your core identity.");
      lines.push("  Please set your Concept (overall theme), Virtue (strength), and Vice (flaw).");
      lines.push("");
      lines.push(`    %ch%ccConcept:%cn ${sheet.concept}`);
      lines.push(`    %ch%ccVirtue:%cn  ${sheet.virtue}`);
      lines.push(`    %ch%ccVice:%cn    ${sheet.vice}`);
      lines.push("");
      lines.push("  %chCommands:%cn");
      lines.push("    +cg/set concept=<text>   — Define your character's high-level concept.");
      lines.push("    +cg/set virtue=<text>    — Define your primary virtue.");
      lines.push("    +cg/set vice=<text>      — Define your primary vice.");
      lines.push("    +cg/next                 — Advance to the next stage once done.");
      break;

    case 2:
      lines.push("  Choose your Supernatural Template. This dictates your character's nature.");
      lines.push("  Supported templates: %chmortal%cn, %chvampire%cn, %chwerewolf%cn, %chmage%cn, %chchangeling%cn.");
      lines.push("");
      lines.push(`    %ch%ccSelected:%cn ${sheet.template.toUpperCase()} (${tmpl.name})`);
      lines.push("");
      lines.push("  %chCommands:%cn");
      lines.push("    +cg/set template=<name>  — Set your template (e.g. +cg/set template=vampire).");
      lines.push("    +cg/back                 — Go back to stage 1.");
      lines.push("    +cg/next                 — Advance to stage 3.");
      break;

    case 3:
      lines.push(`  Configure custom details specific to the %ch${tmpl.name}%cn template.`);
      if (tmpl.customFields.length === 0) {
        lines.push("");
        lines.push("    No template-specific details required for Mortals!");
        lines.push("");
      } else {
        lines.push("");
        for (const f of tmpl.customFields) {
          const title = f.replace(/\b\w/g, c => c.toUpperCase());
          const val = sheet.customFields[f] || "Not Set";
          lines.push(`    %ch%cc${ljust(title + ":", 12)}%cn ${val}`);
        }
        lines.push("");
      }
      lines.push("  %chCommands:%cn");
      if (tmpl.customFields.length > 0) {
        for (const f of tmpl.customFields) {
          lines.push(`    +cg/set ${f}=<value>    — Set your character's ${f}.`);
        }
      }
      lines.push("    +cg/back                 — Go back to stage 2.");
      lines.push("    +cg/next                 — Advance to stage 4.");
      break;

    case 4: {
      lines.push("  Allocate dots across your Attributes. All attributes start with a baseline of 1.");
      lines.push("  You must allocate your groups so that the EXTRA dots allocated (above 1) sum");
      lines.push("  up to a permutation of the pools: %ch5 dots%cn (Primary), %ch4 dots%cn (Secondary), and %ch3 dots%cn (Tertiary).");
      lines.push("");

      const atts = sheet.attributes;
      lines.push(`    %ch%ccMental Attributes:%cn (Current Extra: +${(atts.intelligence || 1) - 1 + (atts.wits || 1) - 1 + (atts.resolve || 1) - 1})`);
      lines.push(`      Intelligence: ${formatDots(atts.intelligence || 1)} (${atts.intelligence})`);
      lines.push(`      Wits:         ${formatDots(atts.wits || 1)} (${atts.wits})`);
      lines.push(`      Resolve:      ${formatDots(atts.resolve || 1)} (${atts.resolve})`);

      lines.push(`    %ch%ccPhysical Attributes:%cn (Current Extra: +${(atts.strength || 1) - 1 + (atts.dexterity || 1) - 1 + (atts.stamina || 1) - 1})`);
      lines.push(`      Strength:     ${formatDots(atts.strength || 1)} (${atts.strength})`);
      lines.push(`      Dexterity:    ${formatDots(atts.dexterity || 1)} (${atts.dexterity})`);
      lines.push(`      Stamina:      ${formatDots(atts.stamina || 1)} (${atts.stamina})`);

      lines.push(`    %ch%ccSocial Attributes:%cn (Current Extra: +${(atts.presence || 1) - 1 + (atts.manipulation || 1) - 1 + (atts.composure || 1) - 1})`);
      lines.push(`      Presence:     ${formatDots(atts.presence || 1)} (${atts.presence})`);
      lines.push(`      Manipulation: ${formatDots(atts.manipulation || 1)} (${atts.manipulation})`);
      lines.push(`      Composure:    ${formatDots(atts.composure || 1)} (${atts.composure})`);
      lines.push("");

      const mExt = (atts.intelligence || 1) - 1 + (atts.wits || 1) - 1 + (atts.resolve || 1) - 1;
      const pExt = (atts.strength || 1) - 1 + (atts.dexterity || 1) - 1 + (atts.stamina || 1) - 1;
      const sExt = (atts.presence || 1) - 1 + (atts.manipulation || 1) - 1 + (atts.composure || 1) - 1;
      const totalAllocated = mExt + pExt + sExt;

      lines.push(`    %chCurrent extra dots allocated:%cn ${totalAllocated} / 12 dots`);
      lines.push(`    %chAllocations:%cn Mental (+${mExt}), Physical (+${pExt}), Social (+${sExt})`);
      lines.push("");
      lines.push("  %chCommands:%cn");
      lines.push("    +cg/set <attribute>=<dots> — Set an attribute dot rating (1 to 5).");
      lines.push("    +cg/back                   — Go back to stage 3.");
      lines.push("    +cg/next                   — Validate allocations and advance to stage 5.");
      break;
    }

    case 5: {
      lines.push("  Allocate dots across your Skills. You have three skill pools to assign across");
      lines.push("  Mental, Physical, and Social groups: %ch11 dots%cn (Primary), %ch9 dots%cn (Secondary), and %ch7 dots%cn (Tertiary).");
      lines.push("");

      const sks = sheet.skills;
      const mSum = COFD_MENTAL_SKILLS.reduce((acc, s) => acc + (sks[s] || 0), 0);
      const pSum = COFD_PHYSICAL_SKILLS.reduce((acc, s) => acc + (sks[s] || 0), 0);
      const sSum = COFD_SOCIAL_SKILLS.reduce((acc, s) => acc + (sks[s] || 0), 0);
      const totalSkills = mSum + pSum + sSum;

      lines.push(`    %ch%ccMental Skills:%cn (Total: ${mSum} dots)`);
      lines.push("      " + COFD_MENTAL_SKILLS.map(s => `${s.replace(/\b\w/g, c => c.toUpperCase())}(${sks[s] || 0})`).join(", "));

      lines.push(`    %ch%ccPhysical Skills:%cn (Total: ${pSum} dots)`);
      lines.push("      " + COFD_PHYSICAL_SKILLS.map(s => `${s.replace(/\b\w/g, c => c.toUpperCase())}(${sks[s] || 0})`).join(", "));

      lines.push(`    %ch%ccSocial Skills:%cn (Total: ${sSum} dots)`);
      lines.push("      " + COFD_SOCIAL_SKILLS.map(s => `${s.replace(/\b\w/g, c => c.toUpperCase())}(${sks[s] || 0})`).join(", "));
      lines.push("");

      lines.push(`    %chCurrent skill dots allocated:%cn ${totalSkills} / 27 dots`);
      lines.push(`    %chAllocations:%cn Mental (${mSum}), Physical (${pSum}), Social (${sSum})`);
      lines.push("");
      lines.push("  %chCommands:%cn");
      lines.push("    +cg/set <skill>=<dots> — Set a skill dot rating (0 to 5).");
      lines.push("    +cg/back               — Go back to stage 4.");
      lines.push("    +cg/next               — Validate skill pools and advance to stage 6.");
      break;
    }

    case 6: {
      lines.push("  Allocate starting powers and merits specific to your template and character.");
      let startingDots = 0;
      if (sheet.template === "vampire") startingDots = 3;
      if (sheet.template === "werewolf") startingDots = 3;
      if (sheet.template === "mage") startingDots = 6;
      if (sheet.template === "changeling") startingDots = 3;

      lines.push(`  You have %ch${startingDots} starting dots%cn for supernatural powers, and exactly %ch7 starting dots%cn for merits.`);
      lines.push("");

      if (tmpl.validPowers.length === 0) {
        lines.push("    No supernatural powers required for Mortals!");
        lines.push("");
      } else {
        lines.push("    %ch%ccSupernatural Powers:%cn");
        for (const p of tmpl.validPowers) {
          const title = p.replace(/\b\w/g, c => c.toUpperCase());
          const val = sheet.powers[p] || 0;
          lines.push(`      ${ljust(title + ":", 18)} ${formatDots(val)} (${val})`);
        }
        const allocatedPowers = tmpl.validPowers.reduce((acc, p) => acc + (sheet.powers[p] || 0), 0);
        lines.push(`    %chPower dots allocated:%cn ${allocatedPowers} / ${startingDots} dots`);
        lines.push("");
      }

      lines.push("    %ch%ccAcquired Merits:%cn");
      const activeMeritsList = Object.keys(sheet.merits || {}).filter(m => (sheet.merits[m] || 0) > 0);
      if (activeMeritsList.length === 0) {
        lines.push("      No merits purchased yet.");
      } else {
        for (const mKey of activeMeritsList) {
          const found = COFD_MERITS.find(m => m.key === mKey);
          const name = found ? found.name : mKey.replace(/\b\w/g, c => c.toUpperCase());
          const val = sheet.merits[mKey] || 0;
          lines.push(`      ${ljust(name + ":", 18)} ${formatDots(val)} (${val})`);
        }
      }
      const allocatedMerits = Object.keys(sheet.merits || {}).reduce((acc, m) => acc + (sheet.merits[m] || 0), 0);
      lines.push(`    %chMerit dots allocated:%cn ${allocatedMerits} / 7 dots`);
      lines.push("");

      lines.push("  %chCommands:%cn");
      if (tmpl.validPowers.length > 0) {
        lines.push("    +cg/set <power>=<dots>  — Allocate dots to a starting power.");
      }
      lines.push("    +cg/set <merit>=<dots>  — Allocate dots to a merit (or empty to reset/delete).");
      lines.push("    +cg/back                — Go back to stage 5.");
      lines.push("    +cg/submit              — Perform a final review and submit your sheet for approval!");
      break;
    }
  }

  lines.push(await divider(""));
  lines.push("  %chHelper Commands:%cn");
  lines.push("    +cg/reset               — Discard all changes and restart character creation.");
  lines.push(await footer());

  return lines.join("\n");
}
