// +gear command -- browse the Appendix One catalog and manage character
// inventory + equipped slots. Full integration: armor penalties are applied
// in the advantages sheet section; equipped weapon damage is added by
// +roll/weapon. Cross-player edits require canEdit.

import { divider, type IUrsamuSDK } from "@ursamu/ursamu";
import {
  addItem,
  EQUIPMENT,
  equipAt,
  lookupItem,
  removeItemAt,
  unequipSlot,
} from "../equipment/index.ts";
import { type CofdSheet } from "../stats/index.ts";

function splitForTarget(rest: string): { body: string; target: string } {
  const idx = rest.toLowerCase().lastIndexOf(" for ");
  if (idx < 0) return { body: rest.trim(), target: "" };
  return { body: rest.slice(0, idx).trim(), target: rest.slice(idx + 5).trim() };
}

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

function dots(n: number): string {
  return n > 0 ? "*".repeat(n) : "--";
}

async function gearList(u: IUrsamuSDK, category: string) {
  const cat = category.toLowerCase().trim();
  const lines: string[] = [];
  lines.push(await divider("E Q U I P M E N T   C A T A L O G"));

  const sections: Array<[string, { key: string; name: string; availability: number }[]]> = [];
  if (!cat || cat === "weapons" || cat === "ranged") {
    sections.push(["Ranged Weapons", EQUIPMENT.weapons.ranged]);
  }
  if (!cat || cat === "weapons" || cat === "melee") {
    sections.push(["Melee Weapons", EQUIPMENT.weapons.melee]);
  }
  if (!cat || cat === "armor") sections.push(["Armor", EQUIPMENT.armor]);
  if (!cat || cat === "mental") sections.push(["Mental Gear", EQUIPMENT.gear.mental]);
  if (!cat || cat === "physical") sections.push(["Physical Gear", EQUIPMENT.gear.physical]);
  if (!cat || cat === "social") sections.push(["Social Gear", EQUIPMENT.gear.social]);
  if (!cat || cat === "services") {
    sections.push(["Services", EQUIPMENT.services]);
  }

  if (sections.length === 0) {
    u.send(
      "Usage: +gear/list [weapons|ranged|melee|armor|mental|physical|social|services]",
    );
    return;
  }

  for (const [label, entries] of sections) {
    lines.push(`%ch${label}%cn`);
    for (const e of entries) {
      lines.push(`  ${e.key.padEnd(28)} ${dots(e.availability).padEnd(6)} ${e.name}`);
    }
  }
  u.send(lines.join("\n"));
}

async function gearShow(u: IUrsamuSDK, key: string) {
  const resolved = lookupItem(key);
  if (!resolved) {
    u.send(`Unknown item '${key}'. Try +gear/list.`);
    return;
  }
  const lines: string[] = [];
  lines.push(await divider(resolved.entry.name.toUpperCase()));

  switch (resolved.type) {
    case "weapon-ranged":
    case "weapon-melee": {
      const w = resolved.entry as typeof EQUIPMENT.weapons.ranged[number];
      lines.push(`  Type:         ${resolved.type === "weapon-ranged" ? "Ranged" : "Melee"}`);
      lines.push(`  Damage:       ${signed(w.damage)}`);
      lines.push(`  Initiative:   ${signed(w.initiative)}`);
      lines.push(`  Strength:     ${w.strength}`);
      lines.push(`  Size:         ${w.size}`);
      lines.push(`  Availability: ${dots(w.availability)}`);
      if (w.ranges) lines.push(`  Ranges:       ${w.ranges}`);
      if (w.clip !== undefined) lines.push(`  Clip:         ${w.clip}`);
      if (w.special) lines.push(`  Special:      ${w.special}`);
      if (w.example) lines.push(`  Example:      ${w.example}`);
      break;
    }
    case "armor": {
      const a = resolved.entry as typeof EQUIPMENT.armor[number];
      lines.push(`  Rating:       ${a.ratingGeneral}/${a.ratingBallistic} (general/ballistic)`);
      lines.push(`  Strength:     ${a.strength}`);
      lines.push(`  Defense:      ${signed(a.defensePenalty)}`);
      lines.push(`  Speed:        ${signed(a.speedPenalty)}`);
      lines.push(`  Availability: ${dots(a.availability)}`);
      lines.push(`  Coverage:     ${a.coverage}`);
      lines.push(`  Concealed:    ${a.concealed ? "yes" : "no"}`);
      lines.push(`  Era:          ${a.era}`);
      break;
    }
    case "gear-mental":
    case "gear-physical":
    case "gear-social": {
      const g = resolved.entry as typeof EQUIPMENT.gear.mental[number];
      lines.push(`  Dice Bonus:   ${signed(g.diceBonus)}`);
      lines.push(`  Durability:   ${g.durability}`);
      lines.push(`  Size:         ${g.size}`);
      lines.push(`  Structure:    ${g.structure}`);
      lines.push(`  Availability: ${dots(g.availability)}`);
      lines.push(`  Effect:       ${g.effect}`);
      break;
    }
    case "service": {
      const s = resolved.entry as typeof EQUIPMENT.services[number];
      lines.push(`  Skill:        ${s.skill}`);
      lines.push(`  Availability: ${dots(s.availability)}`);
      lines.push(`  Dice Bonus:   ${signed(s.diceBonus)}`);
      break;
    }
  }
  u.send(lines.join("\n"));
}

async function resolveTarget(u: IUrsamuSDK, targetName: string) {
  const target = targetName ? await u.util.target(u.me, targetName, true) : u.me;
  if (!target) {
    u.send(`Player '${targetName}' not found.`);
    return null;
  }
  const sheet = target.state?.cofd as CofdSheet | undefined;
  if (!sheet) {
    u.send("That player does not have an approved character sheet yet.");
    return null;
  }
  const sameTarget = target.id === u.me.id;
  if (!sameTarget && !(await u.canEdit(u.me, target))) {
    u.send("Permission denied. You cannot modify that player's gear.");
    return null;
  }
  return { target, sheet, sameTarget };
}

async function gearAdd(u: IUrsamuSDK, rest: string) {
  const { body, target: targetName } = splitForTarget(rest);
  const slash = body.indexOf("/");
  const key = (slash >= 0 ? body.slice(0, slash) : body).trim();
  const note = slash >= 0 ? body.slice(slash + 1).trim() : "";
  if (!key) {
    u.send("Usage: +gear/add <key>[/<note>] [for <player>]");
    return;
  }
  if (!lookupItem(key)) {
    u.send(`Unknown item '${key}'. See +gear/list.`);
    return;
  }
  const ctx = await resolveTarget(u, targetName);
  if (!ctx) return;
  const { sheet: updated, item, error } = addItem(ctx.sheet, key, note || undefined);
  if (error) {
    u.send(error);
    return;
  }
  await u.db.modify(ctx.target.id, "$set", { "data.cofd": updated });
  const resolved = lookupItem(key)!;
  const who = ctx.sameTarget ? "your" : `${u.util.displayName(ctx.target, u.me)}'s`;
  u.send(`Added %ch${resolved.entry.name}%cn to ${who} inventory (slot ${updated.equipment!.items.length}, id ${item!.id.slice(0, 8)}).`);
}

async function gearRemove(u: IUrsamuSDK, rest: string) {
  const { body, target: targetName } = splitForTarget(rest);
  const idx = parseInt(body.trim(), 10);
  if (!Number.isInteger(idx) || idx < 1) {
    u.send("Usage: +gear/remove <#> [for <player>]");
    return;
  }
  const ctx = await resolveTarget(u, targetName);
  if (!ctx) return;
  const { sheet: updated, removed, error } = removeItemAt(ctx.sheet, idx);
  if (error) {
    u.send(error);
    return;
  }
  await u.db.modify(ctx.target.id, "$set", { "data.cofd": updated });
  const name = lookupItem(removed!.key)?.entry.name ?? removed!.key;
  const who = ctx.sameTarget ? "your" : `${u.util.displayName(ctx.target, u.me)}'s`;
  u.send(`Removed %ch${name}%cn from ${who} inventory.`);
}

async function gearEquip(u: IUrsamuSDK, rest: string) {
  const { body, target: targetName } = splitForTarget(rest);
  const idx = parseInt(body.trim(), 10);
  if (!Number.isInteger(idx) || idx < 1) {
    u.send("Usage: +gear/equip <#> [for <player>]");
    return;
  }
  const ctx = await resolveTarget(u, targetName);
  if (!ctx) return;
  const { sheet: updated, item, slot, error } = equipAt(ctx.sheet, idx);
  if (error) {
    u.send(error);
    return;
  }
  await u.db.modify(ctx.target.id, "$set", { "data.cofd": updated });
  const name = lookupItem(item!.key)?.entry.name ?? item!.key;
  const who = ctx.sameTarget ? "you" : u.util.displayName(ctx.target, u.me);
  u.send(`${who} now ${slot === "armor" ? "wears" : "wields"} %ch${name}%cn.`);
}

async function gearUnequip(u: IUrsamuSDK, rest: string) {
  const { body, target: targetName } = splitForTarget(rest);
  const slot = body.trim().toLowerCase();
  if (slot !== "weapon" && slot !== "armor") {
    u.send("Usage: +gear/unequip <weapon|armor> [for <player>]");
    return;
  }
  const ctx = await resolveTarget(u, targetName);
  if (!ctx) return;
  const updated = unequipSlot(ctx.sheet, slot);
  await u.db.modify(ctx.target.id, "$set", { "data.cofd": updated });
  const who = ctx.sameTarget ? "You" : u.util.displayName(ctx.target, u.me);
  u.send(`${who} ${slot === "armor" ? "removes the armor" : "lowers the weapon"}.`);
}

async function gearView(u: IUrsamuSDK, rest: string) {
  const targetName = rest.trim();
  const target = targetName ? await u.util.target(u.me, targetName, true) : u.me;
  if (!target) {
    u.send(`Player '${targetName}' not found.`);
    return;
  }
  const sheet = target.state?.cofd as CofdSheet | undefined;
  if (!sheet) {
    u.send("That player does not have an approved character sheet yet.");
    return;
  }
  const state = sheet.equipment ?? { items: [], equippedWeapon: null, equippedArmor: null };
  const lines: string[] = [];
  lines.push(await divider("G E A R"));
  const label = u.util.displayName(target, u.me);
  if (state.items.length === 0 && !state.equippedWeapon && !state.equippedArmor) {
    lines.push(`  ${label} carries nothing.`);
    u.send(lines.join("\n"));
    return;
  }
  state.items.forEach((item, i) => {
    const name = lookupItem(item.key)?.entry.name ?? item.key;
    const marks: string[] = [];
    if (state.equippedWeapon === item.id) marks.push("equipped");
    if (state.equippedArmor === item.id) marks.push("worn");
    const tag = marks.length ? ` (${marks.join(", ")})` : "";
    const note = item.note ? ` -- ${item.note}` : "";
    lines.push(`  ${String(i + 1).padStart(2)}. ${name}${tag}${note}`);
  });
  u.send(lines.join("\n"));
}

export async function gearExec(u: IUrsamuSDK) {
  const sw = (u.cmd.args[0] ?? "").toLowerCase().trim();
  const rest = u.util.stripSubs(u.cmd.args[1] ?? "").trim();

  if (!sw) {
    await gearView(u, rest);
    return;
  }
  switch (sw) {
    case "view":
      await gearView(u, rest);
      return;
    case "list":
      await gearList(u, rest);
      return;
    case "show":
      await gearShow(u, rest);
      return;
    case "add":
      await gearAdd(u, rest);
      return;
    case "remove":
    case "rem":
      await gearRemove(u, rest);
      return;
    case "equip":
      await gearEquip(u, rest);
      return;
    case "unequip":
      await gearUnequip(u, rest);
      return;
    default:
      u.send(
        `Unknown +gear switch '/${sw}'. Use /list, /show, /add, /remove, /equip, /unequip.`,
      );
  }
}
