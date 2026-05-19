// Chronicles of Darkness (CoFD) Interactive Character Generation Engine
// Implements 6 stages of guided character creation with math validators.

import {
  COFD_ATTRIBUTES,
  COFD_SKILLS,
  COFD_MENTAL_SKILLS,
  COFD_PHYSICAL_SKILLS,
  COFD_SOCIAL_SKILLS,
  COFD_MERITS,
  MENTAL_ATTRIBUTES,
  PHYSICAL_ATTRIBUTES,
  SOCIAL_ATTRIBUTES,
  defaultSheet,
  validateTraitValue,
  setTrait,
  type CofdSheet,
  type CofdAttribute,
  type CofdSkill
} from "./cofd.ts";
import { COFD_TEMPLATES, type CofdTemplate } from "./templates.ts";
import { header, footer, divider } from "jsr:@ursamu/ursamu";

export interface CofdCgState {
  stage: number;        // 1 to 6
  sheet: CofdSheet;
  isSubmitted: boolean;
  isApproved: boolean;
}

export function initCgState(): CofdCgState {
  return {
    stage: 1,
    sheet: defaultSheet(),
    isSubmitted: false,
    isApproved: false,
  };
}

function getStageName(stage: number): string {
  switch (stage) {
    case 1: return "Core Identity";
    case 2: return "Supernatural Template";
    case 3: return "Template Specifics";
    case 4: return "Attributes Allocation";
    case 5: return "Skills Allocation";
    case 6: return "Supernatural Powers";
    default: return "Unknown";
  }
}

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
  lines.push(await divider(null));

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

  lines.push(await divider(null));
  lines.push("  %chHelper Commands:%cn");
  lines.push("    +cg/reset               — Discard all changes and restart character creation.");
  lines.push(await footer());

  return lines.join("\n");
}

/**
 * Mathematically validates the parameters for the current stage.
 */
export function validateCurrentStage(cgState: CofdCgState): { valid: boolean; error?: string } {
  const stage = cgState.stage;
  const sheet = cgState.sheet;
  const tKey = sheet.template.toLowerCase().trim();
  const tmpl = COFD_TEMPLATES[tKey];

  if (!tmpl) {
    return { valid: false, error: `Invalid template: '${sheet.template}'. Please select a valid template in Stage 2.` };
  }

  switch (stage) {
    case 1:
      if (!sheet.concept || sheet.concept.trim().toLowerCase() === "unknown") {
        return { valid: false, error: "Concept cannot be empty or 'Unknown'." };
      }
      if (!sheet.virtue || sheet.virtue.trim().toLowerCase() === "unknown") {
        return { valid: false, error: "Virtue cannot be empty or 'Unknown'." };
      }
      if (!sheet.vice || sheet.vice.trim().toLowerCase() === "unknown") {
        return { valid: false, error: "Vice cannot be empty or 'Unknown'." };
      }
      break;

    case 2:
      // Validated above
      break;

    case 3:
      for (const f of tmpl.customFields) {
        const val = sheet.customFields[f];
        if (!val || val.trim().toLowerCase() === "unknown" || val.trim().toLowerCase() === "not set") {
          return { valid: false, error: `Template field '${f}' is not set. All custom details are required.` };
        }
      }
      break;

    case 4: {
      const atts = sheet.attributes;
      const mExt = (atts.intelligence || 1) - 1 + (atts.wits || 1) - 1 + (atts.resolve || 1) - 1;
      const pExt = (atts.strength || 1) - 1 + (atts.dexterity || 1) - 1 + (atts.stamina || 1) - 1;
      const sExt = (atts.presence || 1) - 1 + (atts.manipulation || 1) - 1 + (atts.composure || 1) - 1;

      const extras = [mExt, pExt, sExt].sort((a, b) => a - b);
      if (extras[0] !== 3 || extras[1] !== 4 || extras[2] !== 5) {
        return {
          valid: false,
          error: `Attribute pools are invalid. You must allocate your extra dots to a permutation of {5, 4, 3}.\n` +
                 `Currently: Mental (+${mExt}), Physical (+${pExt}), Social (+${sExt}).`
        };
      }
      break;
    }

    case 5: {
      const sks = sheet.skills;
      const mSum = COFD_MENTAL_SKILLS.reduce((acc, s) => acc + (sks[s] || 0), 0);
      const pSum = COFD_PHYSICAL_SKILLS.reduce((acc, s) => acc + (sks[s] || 0), 0);
      const sSum = COFD_SOCIAL_SKILLS.reduce((acc, s) => acc + (sks[s] || 0), 0);

      const sums = [mSum, pSum, sSum].sort((a, b) => a - b);
      if (sums[0] !== 7 || sums[1] !== 9 || sums[2] !== 11) {
        return {
          valid: false,
          error: `Skill pools are invalid. You must allocate your skills to a permutation of {11, 9, 7}.\n` +
                 `Currently: Mental (${mSum}), Physical (${pSum}), Social (${sSum}).`
        };
      }
      break;
    }

    case 6: {
      let startingDots = 0;
      if (sheet.template === "vampire") startingDots = 3;
      if (sheet.template === "werewolf") startingDots = 3;
      if (sheet.template === "mage") startingDots = 6;
      if (sheet.template === "changeling") startingDots = 3;

      const allocatedPowers = tmpl.validPowers.reduce((acc, p) => acc + (sheet.powers[p] || 0), 0);
      if (allocatedPowers !== startingDots) {
        return {
          valid: false,
          error: `Power dots allocation is invalid. You must allocate exactly ${startingDots} starting power dots.\n` +
                 `Currently allocated: ${allocatedPowers} dots.`
        };
      }

      const allocatedMerits = Object.keys(sheet.merits || {}).reduce((acc, m) => acc + (sheet.merits[m] || 0), 0);
      if (allocatedMerits !== 7) {
        return {
          valid: false,
          error: `Merits allocation is invalid. You must allocate exactly 7 starting merits dots.\n` +
                 `Currently allocated: ${allocatedMerits} dots.`
        };
      }
      break;
    }
  }

  return { valid: true };
}

/**
 * Updates traits specific to the current creation stage.
 */
export function updateCgState(cgState: CofdCgState, trait: string, val: string): CofdCgState {
  const stage = cgState.stage;
  let sheet = JSON.parse(JSON.stringify(cgState.sheet)) as CofdSheet;
  const key = trait.toLowerCase().trim();

  const tKey = sheet.template.toLowerCase().trim();
  const tmpl = COFD_TEMPLATES[tKey] || COFD_TEMPLATES.mortal;

  // 1. Stage-specific trait check
  switch (stage) {
    case 1:
      if (!["concept", "virtue", "vice"].includes(key)) {
        throw new Error("In Stage 1, you can only set concept, virtue, and vice.");
      }
      break;

    case 2:
      if (key !== "template") {
        throw new Error("In Stage 2, you can only set template (e.g. +cg/set template=vampire).");
      }
      break;

    case 3:
      if (!tmpl.customFields.includes(key)) {
        throw new Error(`In Stage 3, you can only set custom fields for '${tmpl.name}': ${tmpl.customFields.join(", ")}.`);
      }
      break;

    case 4:
      if (!COFD_ATTRIBUTES.includes(key)) {
        throw new Error(`In Stage 4, you can only set attributes: ${COFD_ATTRIBUTES.join(", ")}.`);
      }
      break;

    case 5:
      if (!COFD_SKILLS.includes(key)) {
        throw new Error(`In Stage 5, you can only set skills: ${COFD_SKILLS.join(", ")}.`);
      }
      break;

    case 6: {
      const meritDef = COFD_MERITS.find(m => m.key === key);
      const isPower = tmpl.validPowers.includes(key);
      if (!meritDef && !isPower) {
        throw new Error(`In Stage 6, you can only allocate starting powers (${tmpl.validPowers.join(", ")}) or merits.`);
      }
      break;
    }

    default:
      throw new Error(`Invalid character generation stage: ${stage}.`);
  }

  // 2. Validate and set value using our standardized engine functions
  const validatedValue = validateTraitValue(trait, val, sheet);

  // Enforce chargen-specific caps (attributes, skills, powers <= 5)
  if (typeof validatedValue === "number") {
    if (COFD_ATTRIBUTES.includes(key) && (validatedValue < 1 || validatedValue > 5)) {
      throw new Error("During character generation, attributes must be between 1 and 5.");
    }
    if (COFD_SKILLS.includes(key) && (validatedValue < 0 || validatedValue > 5)) {
      throw new Error("During character generation, skills must be between 0 and 5.");
    }
    if (tmpl.validPowers.includes(key) && (validatedValue < 0 || validatedValue > 5)) {
      throw new Error("During character generation, powers must be between 0 and 5.");
    }
  }

  sheet = setTrait(sheet, trait, validatedValue);

  return {
    ...cgState,
    sheet,
  };
}
