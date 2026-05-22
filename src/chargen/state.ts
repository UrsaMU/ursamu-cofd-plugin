// Character generation state shape, initialization, and per-stage trait updates.

import {
  COFD_ATTRIBUTES,
  COFD_SKILLS,
  COFD_MERITS,
  parseMeritRef,
} from "../dictionary/index.ts";
import { COFD_TEMPLATES } from "../gamelines/templates.ts";
import {
  defaultSheet,
  setTrait,
  validateTraitValue,
  type CofdSheet,
} from "../stats/index.ts";

export interface CofdCgState {
  stage: number;        // 1 to 6
  sheet: CofdSheet;
  isSubmitted: boolean;
  isApproved: boolean;
  submittedJob?: number;
  submittedAt?: number;
}

export function initCgState(): CofdCgState {
  return {
    stage: 1,
    sheet: defaultSheet(),
    isSubmitted: false,
    isApproved: false,
  };
}

export function getStageName(stage: number): string {
  switch (stage) {
    case 1: return "Concept & Anchors";
    case 2: return "Template";
    case 3: return "Template Details";
    case 4: return "Attributes";
    case 5: return "Skills";
    case 6: return "Merits & Powers";
    default: return "Unknown";
  }
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
      // Merits may be qualified ("language(spanish)"). Match on the merit
      // portion of the key, not the full storage key.
      const meritRef = parseMeritRef(key);
      const meritDef = COFD_MERITS.find(m => m.key === meritRef.merit);
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
