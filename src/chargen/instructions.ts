// Renders character generation per-stage instructions, current values, and progress.

import { header, footer, divider } from "@ursamu/ursamu";
import {
  COFD_MENTAL_SKILLS,
  COFD_PHYSICAL_SKILLS,
  COFD_SOCIAL_SKILLS,
  COFD_MERITS,
  splitMeritStorageKey,
} from "../dictionary/index.ts";
import { COFD_TEMPLATES } from "../gamelines/templates.ts";
import { getStageName, type CofdCgState } from "./state.ts";

function ljust(s: string, w: number): string {
  return s + " ".repeat(Math.max(0, w - s.length));
}

/** ljust that ignores %c* color codes when measuring width. */
function vljust(s: string, w: number): string {
  const vis = s.replace(/%c[a-z]/gi, "").length;
  return s + " ".repeat(Math.max(0, w - vis));
}

function formatDots(val: number): string {
  const v = Math.max(0, Math.min(5, val));
  return "%ch%cy" + "*".repeat(v) + "%cn%cx" + ".".repeat(5 - v) + "%cn";
}

/** Visible label "Name: ***.. (N)" padded to width w (color codes don't count). */
function attrCell(label: string, val: number, w: number): string {
  const labelStr = label + ":";
  const tail = " (" + val + ")";
  const visibleLen = labelStr.length + 5 + tail.length; // label+":" + dots(5) + tail
  const pad = Math.max(1, w - visibleLen);
  return `%ch${labelStr}%cn${" ".repeat(pad)}${formatDots(val)}${tail}`;
}

/** "Name(N)" cell, padded to w columns. */
function _skillCell(name: string, val: number, w: number): string {
  const title = name.replace(/\b\w/g, (c) => c.toUpperCase());
  return ljust(`${title}(${val})`, w);
}

/** Render three lists side-by-side as N rows of fixed-width cells. */
function threeColumn(
  left: string[],
  mid: string[],
  right: string[],
  cellW: number,
  gutter = " ",
): string[] {
  const rows = Math.max(left.length, mid.length, right.length);
  const out: string[] = [];
  for (let i = 0; i < rows; i++) {
    const a = left[i] ?? " ".repeat(cellW);
    const b = mid[i] ?? " ".repeat(cellW);
    const c = right[i] ?? " ".repeat(cellW);
    out.push("  " + a + gutter + b + gutter + c);
  }
  return out;
}

/**
 * Generates beautiful CLI instructions, current values, and progress meter.
 */
export async function getStageInstructions(_playerName: string, cgState: CofdCgState): Promise<string> {
  const stage = cgState.stage;
  const sheet = cgState.sheet;
  const tKey = sheet.template.toLowerCase().trim();
  const tmpl = COFD_TEMPLATES[tKey] || COFD_TEMPLATES.mortal;

  const lines: string[] = [];
  lines.push(await header(`CHARACTER CREATION -- STAGE ${stage}: ${getStageName(stage).toUpperCase()}`));

  // Progress Bar -- compact form keeps the line under 78 cols.
  const maxStage = tmpl.validPowers.length > 0 ? 7 : 6;
  const stageLabels: Record<number, string> = {
    1: "Concept",
    2: "Template",
    3: "Detail",
    4: "Attrs",
    5: "Skills",
    6: "Merits",
    7: "Powers",
  };
  const stagesList = [];
  for (let s = 1; s <= maxStage; s++) {
    stagesList.push(s);
  }
  const steps = stagesList.map(s => {
    const name = stageLabels[s] ?? "Stage";
    return s === stage ? `%ch%cy[${name}]%cn` : `[${name}]`;
  }).join(" ");
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
      lines.push(await divider(""));
      lines.push("  %chCommands:%cn");
      lines.push("    +cg/set concept=<text>   -- Define your character's high-level concept.");
      lines.push("    +cg/set virtue=<text>    -- Define your primary virtue.");
      lines.push("    +cg/set vice=<text>      -- Define your primary vice.");
      lines.push("    +cg/next                 -- Advance to the next stage once done.");
      break;

    case 2:
      lines.push("  Choose your Supernatural Template. This dictates your character's nature.");
      lines.push("  Supported templates: %chmortal%cn, %chchangeling%cn.");
      lines.push("");
      lines.push(`    %ch%ccSelected:%cn ${sheet.template.toUpperCase()} (${tmpl.name})`);
      lines.push("");
      lines.push(await divider(""));
      lines.push("  %chCommands:%cn");
      lines.push("    +cg/set template=<name>  -- Set your template (e.g. changeling).");
      lines.push("    +cg/back                 -- Go back to stage 1.");
      lines.push("    +cg/next                 -- Advance to stage 3.");
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
      lines.push(await divider(""));
      lines.push("  %chCommands:%cn");
      if (tmpl.customFields.length > 0) {
        for (const f of tmpl.customFields) {
          lines.push(`    +cg/set ${f}=<value>    -- Set your character's ${f}.`);
        }
      }
      lines.push("    +cg/back                 -- Go back to stage 2.");
      lines.push("    +cg/next                 -- Advance to stage 4.");
      break;

    case 4: {
      lines.push("  Allocate dots across your Attributes. All start at a baseline of 1.");
      lines.push("  You must allocate your groups so that the EXTRA dots allocated (above 1) sum");
      lines.push("  up to a permutation of the pools: %ch5%cn / %ch4%cn / %ch3%cn dots.");
      lines.push("");

      const atts = sheet.attributes;
      const mExt = (atts.intelligence || 1) - 1 + (atts.wits || 1) - 1 + (atts.resolve || 1) - 1;
      const pExt = (atts.strength || 1) - 1 + (atts.dexterity || 1) - 1 + (atts.stamina || 1) - 1;
      const sExt = (atts.presence || 1) - 1 + (atts.manipulation || 1) - 1 + (atts.composure || 1) - 1;
      const W = 24;
      lines.push(
        "  " +
          vljust(`%ch%ccMental%cn (+${mExt})`, W) + " " +
          vljust(`%ch%ccPhysical%cn (+${pExt})`, W) + " " +
          vljust(`%ch%ccSocial%cn (+${sExt})`, W),
      );
      const col1 = [
        attrCell("Intelligence", atts.intelligence || 1, W),
        attrCell("Wits",         atts.wits || 1,         W),
        attrCell("Resolve",      atts.resolve || 1,      W),
      ];
      const col2 = [
        attrCell("Strength",  atts.strength || 1,  W),
        attrCell("Dexterity", atts.dexterity || 1, W),
        attrCell("Stamina",   atts.stamina || 1,   W),
      ];
      const col3 = [
        attrCell("Presence",     atts.presence || 1,     W),
        attrCell("Manipulation", atts.manipulation || 1, W),
        attrCell("Composure",    atts.composure || 1,    W),
      ];
      for (const r of threeColumn(col1, col2, col3, W)) lines.push(r);
      lines.push("");
      const totalAllocated = mExt + pExt + sExt;

      lines.push(`    %chCurrent extra dots allocated:%cn ${totalAllocated} / 12 dots`);
      lines.push(`    %chAllocations:%cn Mental (+${mExt}), Physical (+${pExt}), Social (+${sExt})`);
      lines.push("");
      lines.push(await divider(""));
      lines.push("  %chCommands:%cn");
      lines.push("    +cg/set <attribute>=<dots>  -- Set a rating (1 to 5).");
      lines.push("    +cg/back                   -- Go back to stage 3.");
      lines.push("    +cg/next                   -- Validate and advance to stage 5.");
      break;
    }

    case 5: {
      lines.push("  Allocate dots across your Skills. Three pools for the three groups:");
      lines.push("  Mental / Physical / Social: %ch11%cn / %ch9%cn / %ch7%cn dots.");
      lines.push("");

      const sks = sheet.skills;
      const mSum = COFD_MENTAL_SKILLS.reduce((acc, s) => acc + (sks[s] || 0), 0);
      const pSum = COFD_PHYSICAL_SKILLS.reduce((acc, s) => acc + (sks[s] || 0), 0);
      const sSum = COFD_SOCIAL_SKILLS.reduce((acc, s) => acc + (sks[s] || 0), 0);
      const totalSkills = mSum + pSum + sSum;

      const W = 24;
      lines.push(
        "  " +
          vljust(`%ch%ccMental%cn (${mSum})`, W) + " " +
          vljust(`%ch%ccPhysical%cn (${pSum})`, W) + " " +
          vljust(`%ch%ccSocial%cn (${sSum})`, W),
      );
      const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
      const col1 = COFD_MENTAL_SKILLS.map((s) => attrCell(titleCase(s), sks[s] || 0, W));
      const col2 = COFD_PHYSICAL_SKILLS.map((s) => attrCell(titleCase(s), sks[s] || 0, W));
      const col3 = COFD_SOCIAL_SKILLS.map((s) => attrCell(titleCase(s), sks[s] || 0, W));
      for (const r of threeColumn(col1, col2, col3, W)) lines.push(r);
      lines.push("");

      lines.push(`    %chCurrent skill dots allocated:%cn ${totalSkills} / 27 dots`);
      lines.push(`    %chAllocations:%cn Mental (${mSum}), Physical (${pSum}), Social (${sSum})`);
      lines.push("");
      lines.push(await divider(""));
      lines.push("  %chCommands:%cn");
      lines.push("    +cg/set <skill>=<dots> -- Set a skill dot rating (0 to 5).");
      lines.push("    +cg/back               -- Go back to stage 4.");
      lines.push("    +cg/next               -- Validate and advance to stage 6.");
      break;
    }

    case 6: {
      lines.push("  Allocate starting merits for your character.");
      lines.push("  You must allocate exactly %ch7%cn merit dots.");
      lines.push("");

      const MW = 36;
      const allocatedMerits = Object.keys(sheet.merits || {}).reduce((acc, m) => acc + (sheet.merits[m] || 0), 0);
      lines.push(`  %ch%ccMerits%cn (${allocatedMerits} / 7)`);
      const activeMeritsList = Object.keys(sheet.merits || {}).filter(m => (sheet.merits[m] || 0) > 0);
      if (activeMeritsList.length === 0) {
        lines.push("  No merits purchased yet.");
      } else {
        for (const mKey of activeMeritsList) {
          const { merit, qualifier } = splitMeritStorageKey(mKey);
          const found = COFD_MERITS.find(m => m.key === merit);
          const base = found ? found.name : merit.replace(/\b\w/g, c => c.toUpperCase());
          const qual = qualifier ? ` (${qualifier.replace(/\b\w/g, c => c.toUpperCase())})` : "";
          const name = base + qual;
          const val = sheet.merits[mKey] || 0;
          lines.push("  " + attrCell(name, val, MW));
        }
      }
      lines.push("");

      lines.push(await divider(""));
      lines.push("  %chCommands:%cn");
      lines.push("    +cg/set <merit>=<dots>  -- Allocate dots (empty = clear).");
      lines.push("    +cg/back                -- Go back to stage 5.");
      if (maxStage === 6) {
        lines.push("    +cg/submit              -- Final review and submit for approval.");
      } else {
        lines.push("    +cg/next                -- Validate and advance to stage 7.");
      }
      break;
    }

    case 7: {
      const pName = tmpl.name === "Changeling: The Lost" ? "Contracts" : "Powers";
      lines.push(`  Allocate starting ${pName.toLowerCase()} specific to your template.`);
      let startingDots = 0;
      if (sheet.template === "changeling") startingDots = 3;

      lines.push(`  %ch${startingDots}%cn starting ${pName.toLowerCase()} dots.`);
      lines.push("");

      const MW = 36;
      const allocatedPowers = tmpl.validPowers.reduce((acc, p) => acc + (sheet.powers[p] || 0), 0);
      lines.push(`  %ch%cc${pName}%cn (${allocatedPowers} / ${startingDots})`);
      for (const p of tmpl.validPowers) {
        const title = p.replace(/\b\w/g, c => c.toUpperCase());
        const val = sheet.powers[p] || 0;
        lines.push("  " + attrCell(title, val, MW));
      }
      lines.push("");

      lines.push(await divider(""));
      lines.push("  %chCommands:%cn");
      lines.push(`    +cg/set <${tmpl.name === "Changeling: The Lost" ? "contract" : "power"}>=<dots>  -- Allocate dots.`);
      lines.push("    +cg/back                -- Go back to stage 6.");
      lines.push("    +cg/submit              -- Final review and submit for approval.");
      break;
    }
  }

  lines.push(await divider(""));
  lines.push("  %chHelper Commands:%cn");
  lines.push("    +cg/reset               -- Discard all changes and restart.");
  lines.push(await footer());

  return lines.join("\n");
}
