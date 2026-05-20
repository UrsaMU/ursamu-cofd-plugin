// Evaluates merit/template prerequisites against a character sheet.

import {
  COFD_ATTRIBUTES,
  COFD_SKILLS,
  COFD_MERITS,
  parseMeritRef,
} from "../dictionary/index.ts";
import { COFD_TEMPLATES } from "../gamelines/templates.ts";
import { migrateSheet, type CofdSheet } from "../stats/sheet.ts";

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

    // 2. Standard comparison matching key op value. Key may carry a
    //    `(qualifier)` or `:qualifier` suffix for instanced merits.
    const match = clean.match(/^([a-z0-9 ]+?(?:\([^)]+\)|:[a-z0-9 -]+)?)\s*(>=|>|<=|<|==|=)\s*(.+)$/);
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

      // Trait search priority. Merits may be qualified: language(spanish).
      const meritRef = parseMeritRef(key);
      const meritIsKnown = COFD_MERITS.some(m => m.key === meritRef.merit);

      if (COFD_ATTRIBUTES.includes(key)) {
        actualValue = sheet.attributes[key] || 1;
      } else if (COFD_SKILLS.includes(key)) {
        actualValue = sheet.skills[key] || 0;
      } else if (meritIsKnown) {
        // Qualified form: exact match on "merit:qualifier".
        // Bare form: take the highest rating across any instance of this merit.
        if (meritRef.qualifier) {
          actualValue = sheet.merits[meritRef.storageKey] || 0;
        } else {
          let best = sheet.merits[meritRef.merit] || 0;
          for (const k of Object.keys(sheet.merits || {})) {
            if (k === meritRef.merit) continue;
            if (k.startsWith(meritRef.merit + ":")) {
              best = Math.max(best, sheet.merits[k] || 0);
            }
          }
          actualValue = best;
        }
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
