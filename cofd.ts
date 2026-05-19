// Chronicles of Darkness (CoFD) RPG Mechanics and Engine
// Implements Attributes, Skills, Specialties, Roll Parsing, and D10 10-Again Roll Engine.
// Modular template support for Vampire, Changeling, Werewolf, Mage, and Mortals.

import { COFD_TEMPLATES, type CofdTemplate } from "./templates.ts";
import { header, footer, divider } from "jsr:@ursamu/ursamu";

// Dynamically load core traits from JSON resources on module load
const attributesUrl = new URL("./resources/attributes.json", import.meta.url);
const skillsUrl = new URL("./resources/skills.json", import.meta.url);
const meritsUrl = new URL("./resources/merits.json", import.meta.url);

const attributesData = JSON.parse(Deno.readTextFileSync(attributesUrl));
const skillsData = JSON.parse(Deno.readTextFileSync(skillsUrl));

export interface MeritDefinition {
  key: string;
  name: string;
  category: string;
  allowedDots: number[];
  prereqs: string[];
}

export const COFD_MERITS: MeritDefinition[] = JSON.parse(Deno.readTextFileSync(meritsUrl));

export const MENTAL_ATTRIBUTES = [...attributesData.mental] as readonly string[];
export const PHYSICAL_ATTRIBUTES = [...attributesData.physical] as readonly string[];
export const SOCIAL_ATTRIBUTES = [...attributesData.social] as readonly string[];

export const COFD_ATTRIBUTES = [
  ...MENTAL_ATTRIBUTES,
  ...PHYSICAL_ATTRIBUTES,
  ...SOCIAL_ATTRIBUTES
] as readonly string[];

export type CofdAttribute = string;

export const COFD_MENTAL_SKILLS = [...skillsData.mental] as readonly string[];
export const COFD_PHYSICAL_SKILLS = [...skillsData.physical] as readonly string[];
export const COFD_SOCIAL_SKILLS = [...skillsData.social] as readonly string[];

export const COFD_SKILLS = [
  ...COFD_MENTAL_SKILLS,
  ...COFD_PHYSICAL_SKILLS,
  ...COFD_SOCIAL_SKILLS
] as readonly string[];

export type CofdSkill = string;

export interface CofdSheet {
  template: string;            // e.g. "mortal", "vampire", "changeling"
  concept: string;
  virtue: string;
  vice: string;
  attributes: Record<CofdAttribute, number>;
  skills: Record<CofdSkill, number>;
  specialties: Record<string, string[]>;
  merits: Record<string, number>;       // e.g. { giant: 4, "iron stomach": 2 }
  moralityValue: number;       // e.g. Integrity, Humanity, Clarity, Wisdom
  powerStatValue: number;      // e.g. Blood Potency, Wyrd, Gnosis
  energyCurrent: number;       // e.g. Vitae, Glamour, Mana
  customFields: Record<string, string>; // e.g. { clan: "Daeva", covenant: "Invictus" }
  powers: Record<string, number>;       // e.g. { vigor: 3, resilience: 2 }
  advantages: {
    willpowerMax: number;
    willpowerCurrent: number;
    size: number;
  };
}

/**
 * Migrates older sheets to the new template-driven structure safely with zero data loss.
 */
export function migrateSheet(sheet: any): CofdSheet {
  const template = sheet.template || "mortal";
  const moralityValue = typeof sheet.moralityValue === "number"
    ? sheet.moralityValue
    : (sheet.advantages?.integrity ?? 7);
  const powerStatValue = typeof sheet.powerStatValue === "number" ? sheet.powerStatValue : 0;
  const energyCurrent = typeof sheet.energyCurrent === "number" ? sheet.energyCurrent : 0;
  const customFields = sheet.customFields || {};
  const powers = sheet.powers || {};
  const merits = sheet.merits || {};

  return {
    ...sheet,
    template,
    moralityValue,
    powerStatValue,
    energyCurrent,
    customFields,
    powers,
    merits,
    advantages: {
      willpowerMax: sheet.advantages?.willpowerMax ?? 2,
      willpowerCurrent: sheet.advantages?.willpowerCurrent ?? 2,
      size: sheet.advantages?.size ?? 5,
    },
  };
}

/**
 * Returns a new default empty character sheet.
 */
export function defaultSheet(): CofdSheet {
  const attributes = {} as Record<CofdAttribute, number>;
  for (const attr of COFD_ATTRIBUTES) {
    attributes[attr] = 1;
  }

  const skills = {} as Record<CofdSkill, number>;
  for (const skill of COFD_SKILLS) {
    skills[skill] = 0;
  }

  return {
    template: "mortal",
    concept: "Unknown",
    virtue: "Unknown",
    vice: "Unknown",
    attributes,
    skills,
    specialties: {},
    merits: {},
    moralityValue: 7,
    powerStatValue: 0,
    energyCurrent: 0,
    customFields: {},
    powers: {},
    advantages: {
      willpowerMax: 2, // Resolve(1) + Composure(1)
      willpowerCurrent: 2,
      size: 5,
    },
  };
}

/**
 * Recalculates dynamic advantages (like Max Willpower) based on Attributes and Templates.
 */
export function refreshAdvantages(sheet: CofdSheet): CofdSheet {
  sheet = migrateSheet(sheet);
  const resolve = sheet.attributes.resolve || 1;
  const composure = sheet.attributes.composure || 1;
  const oldMax = sheet.advantages.willpowerMax;
  const newMax = resolve + composure;

  sheet.advantages.willpowerMax = newMax;
  if (oldMax !== newMax) {
    sheet.advantages.willpowerCurrent = Math.min(sheet.advantages.willpowerCurrent, newMax);
  }

  // Clamp energy pool to maximum allowed by current template & powerStatValue
  const tKey = sheet.template.toLowerCase().trim();
  const tmpl = COFD_TEMPLATES[tKey] || COFD_TEMPLATES.mortal;
  const maxEnergy = tmpl.energyMaxFormula(sheet.powerStatValue);
  sheet.energyCurrent = Math.min(sheet.energyCurrent, maxEnergy);

  return sheet;
}

/**
 * Evaluates prefixless and context-aware prerequisites against a character sheet.
 */
export function checkPrerequisites(prereqs: string[], sheet: CofdSheet): { valid: boolean; reason?: string } {
  sheet = migrateSheet(sheet);
  const tKey = sheet.template.toLowerCase().trim();
  const tmpl = COFD_TEMPLATES[tKey] || COFD_TEMPLATES.mortal;

  for (const expr of prereqs) {
    const clean = expr.trim().toLowerCase();

    // 1. Shorthand template matching e.g. "@vampire"
    if (clean.startsWith("@")) {
      const templateName = clean.slice(1).trim();
      if (sheet.template.toLowerCase() !== templateName) {
        return {
          valid: false,
          reason: `Requires template '${templateName}' (Current template: '${sheet.template}')`
        };
      }
      continue;
    }

    // 2. Standard comparison matching key op value
    const match = clean.match(/^([a-z0-9 ]+?)\s*(>=|>|<=|<|==|=)\s*(.+)$/);
    if (match) {
      const key = match[1].trim();
      const op = match[2];
      const valStr = match[3].trim();

      // Handle template string check like "template=vampire"
      if (key === "template") {
        const pass = valStr === sheet.template.toLowerCase();
        if (!pass) {
          return {
            valid: false,
            reason: `Requires template = ${valStr} (Current template: '${sheet.template}')`
          };
        }
        continue;
      }

      const valInt = parseInt(valStr, 10);
      let actualValue = 0;

      // Trait search priority:
      if (COFD_ATTRIBUTES.includes(key)) {
        actualValue = sheet.attributes[key] || 1;
      } else if (COFD_SKILLS.includes(key)) {
        actualValue = sheet.skills[key] || 0;
      } else if (sheet.merits && sheet.merits[key] !== undefined) {
        actualValue = sheet.merits[key];
      } else if (COFD_MERITS.some(m => m.key === key)) {
        actualValue = sheet.merits[key] || 0;
      } else if (sheet.powers && sheet.powers[key] !== undefined) {
        actualValue = sheet.powers[key];
      } else if (tmpl.validPowers && tmpl.validPowers.includes(key)) {
        actualValue = sheet.powers[key] || 0;
      } else if (key === tmpl.moralityName.toLowerCase()) {
        actualValue = sheet.moralityValue;
      } else if (key === tmpl.powerStatName.toLowerCase()) {
        actualValue = sheet.powerStatValue;
      }

      let pass = false;
      if (!isNaN(valInt)) {
        switch (op) {
          case ">=": pass = actualValue >= valInt; break;
          case ">": pass = actualValue > valInt; break;
          case "<=": pass = actualValue <= valInt; break;
          case "<": pass = actualValue < valInt; break;
          case "==":
          case "=": pass = actualValue === valInt; break;
        }
      } else {
        pass = String(actualValue).toLowerCase() === valStr;
      }

      if (!pass) {
        const titleKey = key.replace(/\b\w/g, c => c.toUpperCase());
        return {
          valid: false,
          reason: `Requires ${titleKey} ${op} ${valStr} (Current value: ${actualValue})`
        };
      }
    } else {
      return { valid: false, reason: `Invalid prerequisite syntax: '${expr}'` };
    }
  }
  return { valid: true };
}

/**
 * Validates a value for setting a trait under the active sheet's template configuration.
 * Returns the parsed value, or throws an error.
 */
export function validateTraitValue(trait: string, valueStr: string, sheet?: CofdSheet): string | number {
  sheet = sheet ? migrateSheet(sheet) : defaultSheet();
  const key = trait.toLowerCase().trim();
  const valLower = valueStr.trim().toLowerCase();
  const valInt = parseInt(valLower, 10);

  const tKey = sheet.template.toLowerCase().trim();
  const tmpl = COFD_TEMPLATES[tKey] || COFD_TEMPLATES.mortal;

  // 1. Support Optional Value Reset Syntax (e.g. +cg/set trait=)
  if (valueStr.trim() === "") {
    if (key === "template") {
      throw new Error("Template cannot be reset to empty.");
    }
    if (COFD_ATTRIBUTES.includes(key)) {
      return 1;
    }
    if (COFD_SKILLS.includes(key)) {
      return 0;
    }
    const meritDef = COFD_MERITS.find(m => m.key === key);
    if (meritDef) {
      return 0;
    }
    if (tmpl.validPowers.includes(key)) {
      return 0;
    }
    if (["concept", "virtue", "vice"].includes(key)) {
      return "";
    }
    if (tmpl.customFields.includes(key)) {
      return "Not Set";
    }
    if (key === tmpl.moralityName.toLowerCase()) {
      return 7;
    }
    const powerAliases = [tmpl.powerStatName.toLowerCase()];
    if (tmpl.powerStatName === "Blood Potency") powerAliases.push("bp");
    if (tmpl.powerStatName === "Primal Urge") powerAliases.push("pu");
    if (powerAliases.includes(key)) {
      return sheet.template.toLowerCase() === "mortal" ? 0 : 1;
    }
    if (tmpl.energyName !== "None" && key === tmpl.energyName.toLowerCase()) {
      return 0;
    }
    if (key === "willpower") {
      return (sheet.attributes.resolve || 1) + (sheet.attributes.composure || 1);
    }
    if (key === "size") {
      return 5;
    }
    throw new Error(`Unknown trait: '${trait}'.`);
  }

  // 2. Standard validations
  if (key === "template") {
    if (!COFD_TEMPLATES[valLower]) {
      throw new Error(`Invalid template: '${valueStr}'. Valid templates: ${Object.keys(COFD_TEMPLATES).join(", ")}`);
    }
    return valLower;
  }

  if (COFD_ATTRIBUTES.includes(key)) {
    if (isNaN(valInt) || valInt < 1 || valInt > 10) {
      throw new Error("Attributes must be integers between 1 and 10.");
    }
    return valInt;
  }

  if (COFD_SKILLS.includes(key)) {
    if (isNaN(valInt) || valInt < 0 || valInt > 10) {
      throw new Error("Skills must be integers between 0 and 10.");
    }
    return valInt;
  }

  // Merits check
  const meritDef = COFD_MERITS.find(m => m.key === key);
  if (meritDef) {
    if (valInt === 0) {
      return 0;
    }
    if (isNaN(valInt) || !meritDef.allowedDots.includes(valInt)) {
      throw new Error(`Merit '${meritDef.name}' only allows ratings of: ${meritDef.allowedDots.join(", ")}`);
    }
    // Check prerequisites
    const prereqCheck = checkPrerequisites(meritDef.prereqs, sheet);
    if (!prereqCheck.valid) {
      throw new Error(`Cannot purchase '${meritDef.name}': ${prereqCheck.reason}`);
    }
    return valInt;
  }

  // Morality check
  if (key === tmpl.moralityName.toLowerCase()) {
    if (isNaN(valInt) || valInt < 1 || valInt > 10) {
      throw new Error(`${tmpl.moralityName} must be an integer between 1 and 10.`);
    }
    return valInt;
  }

  // Power Stat check (e.g. Blood Potency / BP, Gnosis, Wyrd, Primal Urge / PU)
  const powerAliases = [tmpl.powerStatName.toLowerCase()];
  if (tmpl.powerStatName === "Blood Potency") powerAliases.push("bp");
  if (tmpl.powerStatName === "Primal Urge") powerAliases.push("pu");
  if (powerAliases.includes(key)) {
    if (isNaN(valInt) || valInt < 0 || valInt > 10) {
      throw new Error(`${tmpl.powerStatName} must be an integer between 0 and 10.`);
    }
    return valInt;
  }

  // Energy check (e.g. Vitae, Glamour, Mana, Essence)
  if (tmpl.energyName !== "None" && key === tmpl.energyName.toLowerCase()) {
    if (isNaN(valInt) || valInt < 0) {
      throw new Error(`${tmpl.energyName} must be a non-negative integer.`);
    }
    return valInt;
  }

  if (key === "willpower") {
    if (isNaN(valInt) || valInt < 0) {
      throw new Error("Willpower must be a non-negative integer.");
    }
    return valInt;
  }

  if (key === "size") {
    if (isNaN(valInt) || valInt < 1 || valInt > 20) {
      throw new Error("Size must be an integer between 1 and 20.");
    }
    return valInt;
  }

  if (["concept", "virtue", "vice"].includes(key)) {
    return valueStr.trim();
  }

  // Custom Fields check (e.g. Clan, Covenant, Seeming)
  if (tmpl.customFields.includes(key)) {
    return valueStr.trim();
  }

  // Powers check (e.g. Vigor, Forces)
  if (tmpl.validPowers.includes(key)) {
    if (isNaN(valInt) || valInt < 0 || valInt > 5) {
      throw new Error("Powers must be integers between 0 and 5.");
    }
    return valInt;
  }

  throw new Error(`Unknown or read-only trait: '${trait}'.`);
}

/**
 * Sets a trait value on a character sheet dynamically matching its template.
 */
export function setTrait(sheet: CofdSheet, trait: string, value: string | number): CofdSheet {
  sheet = migrateSheet(sheet);
  const key = trait.toLowerCase().trim();

  const tKey = sheet.template.toLowerCase().trim();
  const tmpl = COFD_TEMPLATES[tKey] || COFD_TEMPLATES.mortal;

  if (key === "template") {
    const nextTemplate = value as string;
    sheet.template = nextTemplate;
    const nextTmpl = COFD_TEMPLATES[nextTemplate];
    if (nextTmpl) {
      sheet.powerStatValue = nextTemplate === "mortal" ? 0 : 1;
      sheet.energyCurrent = nextTmpl.energyMaxFormula(sheet.powerStatValue);
      sheet.customFields = {};
      sheet.powers = {};
    }
    sheet = refreshAdvantages(sheet);
    return sheet;
  }

  if (COFD_ATTRIBUTES.includes(key)) {
    sheet.attributes[key] = value as number;
    sheet = refreshAdvantages(sheet);
    return sheet;
  }

  if (COFD_SKILLS.includes(key)) {
    sheet.skills[key] = value as number;
    return sheet;
  }

  // Set Merits
  const meritDef = COFD_MERITS.find(m => m.key === key);
  if (meritDef) {
    const valInt = value as number;
    if (valInt === 0) {
      delete sheet.merits[key];
    } else {
      sheet.merits[key] = valInt;
    }
    return sheet;
  }

  if (key === tmpl.moralityName.toLowerCase()) {
    sheet.moralityValue = value as number;
    return sheet;
  }

  const powerAliases = [tmpl.powerStatName.toLowerCase()];
  if (tmpl.powerStatName === "Blood Potency") powerAliases.push("bp");
  if (tmpl.powerStatName === "Primal Urge") powerAliases.push("pu");
  if (powerAliases.includes(key)) {
    sheet.powerStatValue = value as number;
    sheet = refreshAdvantages(sheet);
    return sheet;
  }

  if (tmpl.energyName !== "None" && key === tmpl.energyName.toLowerCase()) {
    const maxVal = tmpl.energyMaxFormula(sheet.powerStatValue);
    sheet.energyCurrent = Math.min(value as number, maxVal);
    return sheet;
  }

  if (key === "willpower") {
    sheet.advantages.willpowerCurrent = Math.min(value as number, sheet.advantages.willpowerMax);
    return sheet;
  }

  if (key === "size") {
    sheet.advantages.size = value as number;
    return sheet;
  }

  if (["concept", "virtue", "vice"].includes(key)) {
    (sheet as any)[key] = value as string;
    return sheet;
  }

  if (tmpl.customFields.includes(key)) {
    const valStr = value as string;
    if (valStr === "Not Set" || valStr === "") {
      delete sheet.customFields[key];
    } else {
      sheet.customFields[key] = valStr;
    }
    return sheet;
  }

  if (tmpl.validPowers.includes(key)) {
    const valInt = value as number;
    if (valInt === 0) {
      delete sheet.powers[key];
    } else {
      sheet.powers[key] = valInt;
    }
    return sheet;
  }

  throw new Error(`Trait '${trait}' cannot be set directly.`);
}

export interface ParsedRoll {
  pool: number;
  terms: string[];
  appliedSpecialties: string[];
  untrainedPenaltyApplied: number;
  error?: string;
}

/**
 * Parses a dice pool expression against the template-driven sheet.
 * Supports rolling dynamic attributes, skills, specialties, custom fields, power stats, and supernatural powers.
 */
export function parseRollExpression(expr: string, sheet: CofdSheet): ParsedRoll {
  sheet = migrateSheet(sheet);
  const cleanExpr = expr.toLowerCase().replace(/\s+/g, "");
  if (!cleanExpr) {
    return { pool: 0, terms: [], appliedSpecialties: [], untrainedPenaltyApplied: 0, error: "Empty roll expression." };
  }

  const tKey = sheet.template.toLowerCase().trim();
  const tmpl = COFD_TEMPLATES[tKey] || COFD_TEMPLATES.mortal;

  // Check if it's a raw dice pool number
  if (/^[+-]?\d+$/.test(cleanExpr)) {
    const rawPool = parseInt(cleanExpr, 10);
    return {
      pool: rawPool,
      terms: [`Raw Pool (${rawPool})`],
      appliedSpecialties: [],
      untrainedPenaltyApplied: 0
    };
  }

  let pool = 0;
  const terms: string[] = [];
  const appliedSpecialties: string[] = [];
  let untrainedPenaltyApplied = 0;

  const regex = /([+-]?)([a-z0-9_/]+)/g;
  let match;

  while ((match = regex.exec(cleanExpr)) !== null) {
    const sign = match[1] || "+";
    const token = match[2];

    // Check if numeric modifier
    if (/^\d+$/.test(token)) {
      const modifier = parseInt(token, 10);
      const value = sign === "-" ? -modifier : modifier;
      pool += value;
      terms.push(`${sign}${modifier}`);
      continue;
    }

    // Check if skill with specialty (e.g. "crafts/automotive")
    if (token.includes("/")) {
      const parts = token.split("/");
      const skillName = parts[0];
      const specName = parts.slice(1).join("/");

      if (!(COFD_SKILLS as readonly string[]).includes(skillName)) {
        return { pool: 0, terms: [], appliedSpecialties: [], untrainedPenaltyApplied: 0, error: `Invalid skill: '${skillName}'.` };
      }

      const dots = sheet.skills[skillName as CofdSkill] || 0;
      let termVal = dots;

      // Handle untrained penalty
      if (dots === 0) {
        const isMental = (COFD_MENTAL_SKILLS as readonly string[]).includes(skillName);
        const penalty = isMental ? -3 : -1;
        untrainedPenaltyApplied += penalty;
        termVal += penalty;
        terms.push(`${skillName}(0, Untrained ${penalty})`);
      } else {
        terms.push(`${skillName}(${dots})`);
      }

      // Check specialty
      const playerSpecs = sheet.specialties[skillName] || [];
      if (playerSpecs.some(s => s.toLowerCase() === specName)) {
        termVal += 1;
        appliedSpecialties.push(`${skillName}/${specName}`);
        terms.push(`Specialty:${specName}(+1)`);
      }

      pool += sign === "-" ? -termVal : termVal;
      continue;
    }

    // Check if pure Attribute
    if ((COFD_ATTRIBUTES as readonly string[]).includes(token)) {
      const dots = sheet.attributes[token as CofdAttribute] || 1;
      pool += sign === "-" ? -dots : dots;
      terms.push(`${token}(${dots})`);
      continue;
    }

    // Check if pure Skill
    if ((COFD_SKILLS as readonly string[]).includes(token)) {
      const dots = sheet.skills[token as CofdSkill] || 0;
      let termVal = dots;

      if (dots === 0) {
        const isMental = (COFD_MENTAL_SKILLS as readonly string[]).includes(token);
        const penalty = isMental ? -3 : -1;
        untrainedPenaltyApplied += penalty;
        termVal += penalty;
        terms.push(`${token}(0, Untrained ${penalty})`);
      } else {
        terms.push(`${token}(${dots})`);
      }

      pool += sign === "-" ? -termVal : termVal;
      continue;
    }

    // Check if active template's Power Stat name (or aliases like bp, pu)
    const powerAliases = [tmpl.powerStatName.toLowerCase()];
    if (tmpl.powerStatName === "Blood Potency") powerAliases.push("bp");
    if (tmpl.powerStatName === "Primal Urge") powerAliases.push("pu");
    if (powerAliases.includes(token)) {
      const dots = sheet.powerStatValue || 0;
      pool += sign === "-" ? -dots : dots;
      terms.push(`${tmpl.powerStatName}(${dots})`);
      continue;
    }

    // Check if active template's Morality trait name
    if (token === tmpl.moralityName.toLowerCase()) {
      const dots = sheet.moralityValue || 0;
      pool += sign === "-" ? -dots : dots;
      terms.push(`${tmpl.moralityName}(${dots})`);
      continue;
    }

    // Check if active template's valid Powers (e.g. vigor, forces)
    if (tmpl.validPowers.includes(token)) {
      const dots = sheet.powers[token] || 0;
      pool += sign === "-" ? -dots : dots;
      const powerTitle = token.replace(/\b\w/g, c => c.toUpperCase());
      terms.push(`${powerTitle}(${dots})`);
      continue;
    }

    return { pool: 0, terms: [], appliedSpecialties: [], untrainedPenaltyApplied: 0, error: `Unknown trait: '${token}'.` };
  }

  if (terms.length === 0) {
    return { pool: 0, terms: [], appliedSpecialties: [], untrainedPenaltyApplied: 0, error: "Could not parse any traits in roll expression." };
  }

  return {
    pool,
    terms,
    appliedSpecialties,
    untrainedPenaltyApplied
  };
}

export interface RollResult {
  successes: number;
  rolls: number[];
  exceptional: boolean;
  dramaticFailure: boolean;
  isChanceDie: boolean;
}

/**
 * Performs a D10 roll according to Chronicles of Darkness rules (including 10-again and chance die).
 */
export function executeRoll(pool: number): RollResult {
  const rolls: number[] = [];
  let successes = 0;

  if (pool <= 0) {
    const die = Math.floor(Math.random() * 10) + 1;
    rolls.push(die);
    const isChanceSuccess = die === 10;
    const isDramaticFailure = die === 1;

    return {
      successes: isChanceSuccess ? 1 : 0,
      rolls,
      exceptional: false,
      dramaticFailure: isDramaticFailure,
      isChanceDie: true
    };
  }

  let diceToRoll = pool;
  while (diceToRoll > 0) {
    const nextDiceCount = diceToRoll;
    diceToRoll = 0;

    for (let i = 0; i < nextDiceCount; i++) {
      const die = Math.floor(Math.random() * 10) + 1;
      rolls.push(die);

      if (die >= 8) {
        successes++;
      }
      if (die === 10) {
        diceToRoll++;
      }
    }
  }

  return {
    successes,
    rolls,
    exceptional: successes >= 5,
    dramaticFailure: false,
    isChanceDie: false
  };
}

function ljust(s: string, w: number): string {
  return s.padEnd(w);
}

function center(s: string, w: number): string {
  if (s.length >= w) return s;
  const left = Math.floor((w - s.length) / 2);
  return " ".repeat(left) + s + " ".repeat(w - s.length - left);
}

/**
 * Formats a character sheet into a beautiful, template-aware MUSH-compatible string.
 */
export async function formatSheet(playerName: string, sheet: CofdSheet): Promise<string> {
  sheet = migrateSheet(sheet);
  const width = 78;

  const tKey = sheet.template.toLowerCase().trim();
  const tmpl = COFD_TEMPLATES[tKey] || COFD_TEMPLATES.mortal;

  const lines: string[] = [];

  lines.push(await header(`CHRONICLES OF DARKNESS — ${tmpl.name.toUpperCase()}`));

  // Headers (Name, Concept, Virtue, Vice)
  lines.push(
    `  %ch%ccName:%cn    ${ljust(playerName, 26)}  %ch%ccConcept:%cn ${ljust(sheet.concept, 29)}`
  );
  lines.push(
    `  %ch%ccVirtue:%cn  ${ljust(sheet.virtue, 26)}  %ch%ccVice:%cn    ${ljust(sheet.vice, 29)}`
  );

  // Custom Fields (Clan, Covenant, Seeming, Path, etc.)
  if (tmpl.customFields.length > 0) {
    const fieldsStr = tmpl.customFields
      .map(f => {
        const title = f.replace(/\b\w/g, c => c.toUpperCase());
        const val = sheet.customFields[f] || "Unknown";
        return `%ch%cc${title}:%cn ${ljust(val, 20)}`;
      })
      .join(" ");
    lines.push(`  ${fieldsStr}`);
  }

  lines.push(await divider("A T T R I B U T E S"));

  const formatDot = (val: number) => {
    return "%ch%cy" + "●".repeat(val) + "%cn%cx" + "○".repeat(10 - val) + "%cn";
  };

  const atts = sheet.attributes;
  lines.push(
    `  %chIntelligence:%cn ${formatDot(atts.intelligence || 1)}  %chStrength:%cn  ${formatDot(atts.strength || 1)}  %chPresence:%cn     ${formatDot(atts.presence || 1)}`
  );
  lines.push(
    `  %chWits:%cn         ${formatDot(atts.wits || 1)}  %chDexterity:%cn ${formatDot(atts.dexterity || 1)}  %chManipulation:%cn ${formatDot(atts.manipulation || 1)}`
  );
  lines.push(
    `  %chResolve:%cn      ${formatDot(atts.resolve || 1)}  %chStamina:%cn   ${formatDot(atts.stamina || 1)}  %chComposure:%cn    ${formatDot(atts.composure || 1)}`
  );

  lines.push(await divider("S K I L L S"));

  const sks = sheet.skills;
  for (let i = 0; i < 8; i++) {
    const mental = COFD_MENTAL_SKILLS[i];
    const physical = COFD_PHYSICAL_SKILLS[i];
    const social = COFD_SOCIAL_SKILLS[i];

    const mLabel = ljust(mental.replace(/\b\w/g, c => c.toUpperCase()) + ":", 14);
    const pLabel = ljust(physical.replace(/\b\w/g, c => c.toUpperCase()) + ":", 12);
    const sLabel = ljust(social.replace(/\b\w/g, c => c.toUpperCase()) + ":", 14);

    const mVal = sks[mental] || 0;
    const pVal = sks[physical] || 0;
    const sVal = sks[social] || 0;

    lines.push(
      `  %ch${mLabel}%cn ${formatDot(mVal)}  %ch${pLabel}%cn ${formatDot(pVal)}  %ch${sLabel}%cn ${formatDot(sVal)}`
    );
  }

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

  // If the template has dynamic advantages (powerStat & energy pool), display them beautifully
  if (tmpl.powerStatName !== "None" || tmpl.energyName !== "None") {
    const powerStr = `${tmpl.powerStatName}: ${sheet.powerStatValue}`;
    const energyMax = tmpl.energyMaxFormula(sheet.powerStatValue);
    const energyStr = `${tmpl.energyName}: ${sheet.energyCurrent}/${energyMax}`;
    lines.push(
      `  %ch${ljust(powerStr, 25)}  ${energyStr}%cn`
    );
  }

  const format5Dot = (val: number) => {
    return "%ch%cy" + "●".repeat(val) + "%cn%cx" + "○".repeat(5 - val) + "%cn";
  };

  // Merits List
  const activeMerits = Object.keys(sheet.merits || {}).filter(m => (sheet.merits[m] || 0) > 0);
  if (activeMerits.length > 0) {
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
  }

  // Specialties
  const specialtySkills = Object.keys(sheet.specialties).filter(s => (sheet.specialties[s] || []).length > 0);
  if (specialtySkills.length > 0) {
    lines.push(await divider("S P E C I A L T I E S"));
    for (const skill of specialtySkills) {
      const specs = sheet.specialties[skill] || [];
      const skillTitle = skill.replace(/\b\w/g, c => c.toUpperCase());
      lines.push(`  %ch${skillTitle}:%cn ${specs.join(", ")}`);
    }
  }

  // Powers List (Disciplines, Contracts, Arcana, Renown, etc.)
  const activePowers = tmpl.validPowers.filter(p => (sheet.powers[p] || 0) > 0);
  if (activePowers.length > 0) {
    let powerHeader = "P O W E R S";
    if (sheet.template === "vampire") powerHeader = "D I S C I P L I N E S";
    if (sheet.template === "mage") powerHeader = "A R C A N A";
    if (sheet.template === "changeling") powerHeader = "C O N T R A C T S";
    if (sheet.template === "werewolf") powerHeader = "R E N O W N";

    lines.push(await divider(powerHeader));

    // Format powers in an elegant two-column layout
    for (let i = 0; i < activePowers.length; i += 2) {
      const p1 = activePowers[i];
      const p2 = activePowers[i + 1];

      const label1 = ljust(p1.replace(/\b\w/g, c => c.toUpperCase()) + ":", 16);
      const val1 = sheet.powers[p1] || 0;
      let line = `  %ch${label1}%cn ${formatDot(val1)}`;

      if (p2) {
        const label2 = ljust(p2.replace(/\b\w/g, c => c.toUpperCase()) + ":", 16);
        const val2 = sheet.powers[p2] || 0;
        line += `   %ch${label2}%cn ${formatDot(val2)}`;
      }
      lines.push(line);
    }
  }

  lines.push(await footer());
  return lines.join("\n");
}
