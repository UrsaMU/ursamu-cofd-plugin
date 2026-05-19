// +sheet and +sheet/set command implementations.

import type { IUrsamuSDK } from "jsr:@ursamu/ursamu";
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

  const formatted = await formatSheet(u.util.displayName(target, u.me), sheet);
  u.send(formatted);
}

export async function sheetSetExec(u: IUrsamuSDK) {
  const lhs = (u.cmd.args[0] ?? "").trim();
  const rhs = (u.cmd.args[1] ?? "").trim();

  if (!lhs || !rhs) {
    u.send("Usage: +sheet/set [<player>/]<trait>=<value> (or specialty/<skill>=<name>)");
    return;
  }

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
    if (!specValue) {
      u.send("Specialty name cannot be empty.");
      return;
    }

    const sheet = (target.state?.cofd as CofdSheet) || defaultSheet();
    if (!sheet.specialties) {
      sheet.specialties = {};
    }
    if (!sheet.specialties[skillName]) {
      sheet.specialties[skillName] = [];
    }

    if (specValue.toLowerCase() === "clear" || specValue.toLowerCase() === "none") {
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
