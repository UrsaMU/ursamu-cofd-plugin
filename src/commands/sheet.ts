// +sheet and +sheet/set command implementations.

import type { IUrsamuSDK } from "@ursamu/ursamu";
import {
  defaultSheet,
  setTrait,
  validateTraitValue,
  type CofdSheet,
} from "../stats/index.ts";
import { COFD_SKILLS } from "../dictionary/index.ts";
import { formatSheet } from "../sheet/index.ts";

export async function sheetExec(u: IUrsamuSDK) {
  const targetName = (u.cmd.args[0] ?? "").trim();
  const target = targetName ? await u.util.target(u.me, targetName) : u.me;

  if (!target) {
    u.send(`Player '${targetName}' not found.`);
    return;
  }

  const sheet = target.state?.cofd as CofdSheet | undefined;
  if (!sheet) {
    u.send("That player does not have an approved character sheet yet.");
    return;
  }

  const formatted = await formatSheet(u.util.displayName(target, u.me), target.id, sheet, undefined, u);
  u.send(formatted);
}

export async function sheetSetExec(u: IUrsamuSDK) {
  // Real call path from addCmd pattern: args[0]="set" (switch),
  // args[1]="[target/]trait=value" or "specialty/skill=name".
  // Tests that pre-split into [lhs, rhs] are also supported as a fallback.
  let lhs = "";
  let rhs = "";
  const a0 = (u.cmd.args[0] ?? "").trim();
  // stripSubs first: trait names/values and specialty text get persisted to
  // the sheet and later echoed via +sheet output. Without this, a player can
  // plant %c color codes (or staff-channel tokens) in their own labels.
  const a1 = u.util.stripSubs(u.cmd.args[1] ?? "").trim();

  if (a0.toLowerCase() === "set" || a0.toLowerCase() === "") {
    // Real path: parse args[1] as "<lhs>=<rhs>".
    const eqIdx = a1.indexOf("=");
    if (eqIdx >= 0) {
      lhs = a1.slice(0, eqIdx).trim();
      rhs = a1.slice(eqIdx + 1).trim();
    } else {
      lhs = a1;
      rhs = "";
    }
  } else {
    // Legacy test path: args already split.
    lhs = a0;
    rhs = a1;
  }

  if (!lhs) {
    u.send("Usage: +sheet/set [<player>/]<trait>=<value> (or specialty/<skill>=<name>)");
    return;
  }
  // Empty rhs is meaningful: it resets a trait to default and clears
  // all specialties on a skill. Downstream handlers interpret it.

  let targetName = "";
  let trait = lhs;

  if (lhs.includes("/")) {
    const parts = lhs.split("/");
    // Check if it's "specialty/skill"
    if (parts[0].toLowerCase() === "specialty" || parts[0].toLowerCase() === "specialties") {
      trait = lhs;
    } else {
      targetName = parts[0].trim();
      trait = parts.slice(1).join("/").trim();
    }
  }

  const target = targetName ? await u.util.target(u.me, targetName) : u.me;
  if (!target) {
    u.send(`Player '${targetName}' not found.`);
    return;
  }

  // Authorization check
  if (!(await u.canEdit(u.me, target))) {
    u.send("Permission denied. You cannot modify that player's character sheet.");
    return;
  }

  // Check if target has a live sheet
  const hasLiveSheet = !!target.state?.cofd;
  if (!hasLiveSheet) {
    u.send("That player does not have an approved character sheet yet. Sheet modifications are blocked until character generation is completed via '+cg'.");
    return;
  }

  // Specialty handler
  if (trait.toLowerCase().startsWith("specialty/")) {
    const skillName = trait.slice("specialty/".length).trim().toLowerCase();
    if (!(COFD_SKILLS as readonly string[]).includes(skillName)) {
      u.send(`Invalid skill name for specialty: '${skillName}'.`);
      return;
    }

    const specValue = rhs.trim();
    const sheet = (target.state?.cofd as CofdSheet) || defaultSheet();
    if (!sheet.specialties) {
      sheet.specialties = {};
    }
    if (!sheet.specialties[skillName]) {
      sheet.specialties[skillName] = [];
    }

    if (specValue.length > 40) {
      u.send(`Specialty name too long (max 40 characters; got ${specValue.length}).`);
      return;
    }
    if (!specValue) {
      // Empty value resets the skill's specialty list (matches the trait
      // reset convention: `+sheet/set athletics=` -> reset Athletics).
      sheet.specialties[skillName] = [];
      u.send(`Cleared all specialties for skill '${skillName}' on ${target.name}'s sheet.`);
    } else {
      if (!sheet.specialties[skillName].includes(specValue)) {
        sheet.specialties[skillName].push(specValue);
      }
      u.send(`Added specialty '${specValue}' to skill '${skillName}' on ${target.name}'s sheet.`);
    }

    await u.db.modify(target.id, "$set", { "data.cofd": sheet });
    return;
  }

  // Standard trait handler
  try {
    const sheet = (target.state?.cofd as CofdSheet) || defaultSheet();
    const validatedValue = validateTraitValue(trait, rhs, sheet);
    const updatedSheet = setTrait(sheet, trait, validatedValue);

    await u.db.modify(target.id, "$set", { "data.cofd": updatedSheet });
    u.send(`Set trait '${trait}' to '${validatedValue}' on ${target.name}'s sheet.`);
  } catch (err: any) {
    u.send(`Error: ${err.message}`);
  }
}
