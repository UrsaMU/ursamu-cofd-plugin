// +gear command -- browse the Appendix One catalog and manage real game
// objects. Items are UrsaMU Things in the carrier's contents. Equipping
// a weapon or armor sets the "dark" flag (hidden from look) and stamps
// equippedBy on the item so it can't be dropped while equipped.

import { divider, type IUrsamuSDK } from "@ursamu/ursamu";
import {
  carriedItems,
  createItem,
  destroyItem,
  displayName,
  EQUIPMENT,
  equipItem,
  inventoryItems,
  itemData,
  lookupItem,
  parseWeaponTags,
  reloadItem,
  roomItems,
  unequipItem,
} from "../equipment/index.ts";
import { type CofdSheet } from "../stats/index.ts";
import { getEncounterForRoom } from "../combat/encounter.ts";
import { hasMatchingQuickDraw } from "../combat/modifiers.ts";

function splitForTarget(rest: string): { body: string; target: string } {
  const idx = rest.toLowerCase().lastIndexOf(" for ");
  if (idx < 0) return { body: rest.trim(), target: "" };
  return { body: rest.slice(0, idx).trim(), target: rest.slice(idx + 5).trim() };
}

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

function dots(n: number): string {
  return n > 0 ? "*".repeat(n) : "-";
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
  if (!cat || cat === "services") sections.push(["Services", EQUIPMENT.services]);

  if (sections.length === 0) {
    u.send("Usage: +gear/list [weapons|ranged|melee|armor|mental|physical|social|services]");
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
      if (w.ranges) lines.push(`  Range:        ${w.ranges}`);
      if (w.capacity) lines.push(`  Capacity:     ${w.capacity}`);
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
      break;
    }
    case "gear-mental":
    case "gear-physical":
    case "gear-social": {
      const g = resolved.entry as typeof EQUIPMENT.gear.mental[number];
      lines.push(`  Dice Bonus:   ${signed(g.diceBonus)}`);
      lines.push(`  Durability:   ${g.durability}`);
      lines.push(`  Size:         ${g.size}`);
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

async function gearAdd(u: IUrsamuSDK, rest: string) {
  const { body, target: targetName } = splitForTarget(rest);
  const slash = body.indexOf("/");
  const key = (slash >= 0 ? body.slice(0, slash) : body).trim();
  const note = slash >= 0 ? body.slice(slash + 1).trim() : "";
  if (!key) { u.send("Usage: +gear/add <key>[/<note>] [for <player>]"); return; }
  if (!lookupItem(key)) { u.send(`Unknown item '${key}'. See +gear/list.`); return; }
  const ctx = await resolveTarget(u, targetName);
  if (!ctx) return;
  const item = await createItem(u, ctx.target.id, key, { note: note || undefined });
  if (!item) { u.send(`Could not create '${key}'.`); return; }
  const who = ctx.sameTarget ? "your" : `${u.util.displayName(ctx.target, u.me)}'s`;
  const entry = lookupItem(key)!;
  u.send(`Added %ch${entry.entry.name}%cn to ${who} inventory.`);
}

async function gearRemove(u: IUrsamuSDK, rest: string) {
  const { body, target: targetName } = splitForTarget(rest);
  const idx = parseInt(body.trim(), 10);
  if (!Number.isInteger(idx) || idx < 1) { u.send("Usage: +gear/remove <#> [for <player>]"); return; }
  const ctx = await resolveTarget(u, targetName);
  if (!ctx) return;
  // Slot numbers count inventory (unequipped) items.
  const inv = await inventoryItems(u, ctx.target.id);
  if (idx > inv.length) { u.send(`No inventory slot ${idx}.`); return; }
  const item = inv[idx - 1];
  await destroyItem(u, item.id);
  const who = ctx.sameTarget ? "your" : `${u.util.displayName(ctx.target, u.me)}'s`;
  u.send(`Removed %ch${displayName(item)}%cn from ${who} inventory.`);
}

async function gearEquip(u: IUrsamuSDK, rest: string) {
  const { body, target: targetName } = splitForTarget(rest);
  const idx = parseInt(body.trim(), 10);
  if (!Number.isInteger(idx) || idx < 1) { u.send("Usage: +gear/equip <#> [for <player>]"); return; }
  const ctx = await resolveTarget(u, targetName);
  if (!ctx) return;
  const eq = ctx.sheet.equipment ?? { equippedWeapon: null, equippedArmor: null };
  const result = await equipItem(u, ctx.target.id, idx, eq.equippedWeapon, eq.equippedArmor);
  if (result.error) { u.send(result.error); return; }
  const newEq = result.slot === "weapon"
    ? { ...eq, equippedWeapon: result.equippedId }
    : { ...eq, equippedArmor: result.equippedId };
  await u.db.modify(ctx.target.id, "$set", { "data.cofd": { ...ctx.sheet, equipment: newEq } });
  const items = await u.db.search({ id: result.equippedId } as any);
  const equipped = items[0];
  const name = equipped ? displayName(equipped) : result.equippedId;
  const who = ctx.sameTarget ? "you" : u.util.displayName(ctx.target, u.me);
  u.send(`${who} now ${result.slot === "armor" ? "wears" : "wields"} %ch${name}%cn.`);

  // Slow weapons drawn during active combat cost an instant action -- unless
  // the actor has the matching Quick Draw merit for the weapon's class.
  if (result.slot === "weapon" && equipped) {
    const itemKey = itemData(equipped)?.key;
    const catalog = itemKey ? lookupItem(itemKey) : null;
    const tags = parseWeaponTags((catalog?.entry as { special?: string } | undefined)?.special);
    if (tags.slow) {
      const roomId = u.here?.id;
      const enc = roomId ? await getEncounterForRoom(roomId) : null;
      const isParticipant = !!enc &&
        enc.status === "active" &&
        enc.participants.some((p) => p.actorId === ctx.target.id);
      if (isParticipant) {
        // Map catalog type to Quick Draw qualifier (firearms / melee).
        const weaponClass = catalog?.type === "weapon-ranged"
          ? "firearms"
          : catalog?.type === "weapon-melee"
            ? "melee"
            : null;
        if (!hasMatchingQuickDraw(ctx.sheet, weaponClass)) {
          const subj = ctx.sameTarget ? "You spend" : `${who} spends`;
          u.send(
            `%cyNote:%cn ${subj} an instant action drawing the %ch${name}%cn (Slow). This is ${ctx.sameTarget ? "your" : "their"} turn.`,
          );
        }
      }
    }
  }
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
  const eq = ctx.sheet.equipment ?? { equippedWeapon: null, equippedArmor: null };
  const itemId = slot === "weapon" ? eq.equippedWeapon : eq.equippedArmor;
  if (!itemId) { u.send(`No ${slot} equipped.`); return; }
  await unequipItem(u, itemId);
  const newEq = slot === "weapon"
    ? { ...eq, equippedWeapon: null }
    : { ...eq, equippedArmor: null };
  await u.db.modify(ctx.target.id, "$set", { "data.cofd": { ...ctx.sheet, equipment: newEq } });
  const who = ctx.sameTarget ? "You" : u.util.displayName(ctx.target, u.me);
  u.send(`${who} ${slot === "armor" ? "remove the armor" : "lower the weapon"}.`);
}

async function gearDrop(u: IUrsamuSDK, rest: string) {
  const idx = parseInt(rest.trim(), 10);
  if (!Number.isInteger(idx) || idx < 1) { u.send("Usage: +gear/drop <#>"); return; }
  const sheet = u.me.state?.cofd as CofdSheet | undefined;
  if (!sheet) { u.send("You do not have an approved character sheet yet."); return; }
  const inv = await inventoryItems(u, u.me.id);
  if (idx > inv.length) { u.send(`No inventory slot ${idx} (equipped items must be unequipped first).`); return; }
  const item = inv[idx - 1];
  const d = itemData(item);
  if (d?.equippedBy) { u.send(`${displayName(item)} is equipped. Unequip it first.`); return; }
  const roomId = u.here?.id;
  if (!roomId) { u.send("Nowhere to drop that here."); return; }
  await u.db.modify(item.id, "$set", { "data.location": roomId } as any);
  u.send(`You drop %ch${displayName(item)}%cn.`);
  u.here?.broadcast?.(`${u.util.displayName(u.me, u.me)} drops ${displayName(item)}.`);
}

async function gearPickup(u: IUrsamuSDK, rest: string) {
  const name = rest.trim().toLowerCase();
  if (!name) { u.send("Usage: +gear/pickup <name|index>"); return; }
  const roomId = u.here?.id;
  if (!roomId) { u.send("Nothing here."); return; }
  const dropped = await roomItems(u, roomId);
  if (dropped.length === 0) { u.send("Nothing here to pick up."); return; }
  const asIdx = parseInt(name, 10);
  let item = Number.isInteger(asIdx) && asIdx >= 1 && asIdx <= dropped.length
    ? dropped[asIdx - 1]
    : dropped.find((o) => displayName(o).toLowerCase().includes(name));
  if (!item) { u.send(`Nothing matching '${rest}' is here.`); return; }
  await u.db.modify(item.id, "$set", { "data.location": u.me.id } as any);
  u.send(`You pick up %ch${displayName(item)}%cn.`);
}

async function gearGive(u: IUrsamuSDK, rest: string) {
  const toIdx = rest.toLowerCase().lastIndexOf(" to ");
  if (toIdx < 0) { u.send("Usage: +gear/give <#> to <player>"); return; }
  const idx = parseInt(rest.slice(0, toIdx).trim(), 10);
  const recipientName = rest.slice(toIdx + 4).trim();
  if (!Number.isInteger(idx) || idx < 1 || !recipientName) {
    u.send("Usage: +gear/give <#> to <player>"); return;
  }
  const recipient = await u.util.target(u.me, recipientName, true);
  if (!recipient) { u.send(`Player '${recipientName}' not found.`); return; }
  const inv = await inventoryItems(u, u.me.id);
  if (idx > inv.length) { u.send(`No inventory slot ${idx} (unequip first).`); return; }
  const item = inv[idx - 1];
  if (itemData(item)?.equippedBy) { u.send(`${displayName(item)} is equipped. Unequip first.`); return; }
  await u.db.modify(item.id, "$set", { "data.location": recipient.id } as any);
  u.send(`You hand %ch${displayName(item)}%cn to ${u.util.displayName(recipient, u.me)}.`);
  u.send(
    `${u.util.displayName(u.me, recipient)} hands you %ch${displayName(item)}%cn.`,
    recipient.id,
  );
}

export async function gearReload(u: IUrsamuSDK, rest: string) {
  const { body, target: targetName } = splitForTarget(rest);
  const ctx = await resolveTarget(u, targetName);
  if (!ctx) return;
  const idxStr = body.trim();
  if (!idxStr) {
    const id = ctx.sheet.equipment?.equippedWeapon;
    if (!id) { u.send("No weapon equipped."); return; }
    const ok = await reloadItem(u, id);
    if (!ok) { u.send("Equipped weapon is not a firearm."); return; }
    const items = await u.db.search({ id } as any);
    const who = ctx.sameTarget ? "You" : u.util.displayName(ctx.target, u.me);
    const name = items[0] ? displayName(items[0]) : id;
    u.send(`${who} reload %ch${name}%cn.`);
    return;
  }
  const idx = parseInt(idxStr, 10);
  if (!Number.isInteger(idx) || idx < 1) { u.send("Usage: +gear/reload [<#>] [for <player>]"); return; }
  const inv = await inventoryItems(u, ctx.target.id);
  if (idx > inv.length) { u.send(`No inventory slot ${idx}.`); return; }
  const item = inv[idx - 1];
  const ok = await reloadItem(u, item.id);
  if (!ok) { u.send(`${displayName(item)} is not a firearm.`); return; }
  const who = ctx.sameTarget ? "You" : u.util.displayName(ctx.target, u.me);
  u.send(`${who} reload %ch${displayName(item)}%cn.`);
}

async function gearView(u: IUrsamuSDK, rest: string) {
  const targetName = rest.trim();
  const target = targetName ? await u.util.target(u.me, targetName, true) : u.me;
  if (!target) { u.send(`Player '${targetName}' not found.`); return; }
  const sheet = target.state?.cofd as CofdSheet | undefined;
  if (!sheet) { u.send("That player does not have an approved character sheet yet."); return; }
  const carried = await carriedItems(u, target.id);
  const state = sheet.equipment ?? { equippedWeapon: null, equippedArmor: null };
  const lines: string[] = [];
  lines.push(await divider("G E A R"));
  const label = u.util.displayName(target, u.me);
  if (carried.length === 0 && !state.equippedWeapon && !state.equippedArmor) {
    lines.push(`  ${label} carries nothing.`);
    u.send(lines.join("\n"));
    return;
  }
  const inv = carried.filter((o) => !itemData(o)?.equippedBy);
  const equipped = carried.filter((o) => !!itemData(o)?.equippedBy);
  const ordered = [...inv, ...equipped];
  ordered.forEach((obj, i) => {
    const d = itemData(obj)!;
    const marks: string[] = [];
    if (state.equippedWeapon === obj.id) marks.push("equipped");
    if (state.equippedArmor === obj.id) marks.push("worn");
    const tag = marks.length ? ` (${marks.join(", ")})` : "";
    const ammo = typeof d.currentClip === "number" ? ` [ammo ${d.currentClip}]` : "";
    const note = d.note ? ` -- ${d.note}` : "";
    lines.push(`  ${String(i + 1).padStart(2)}. ${displayName(obj)}${ammo}${tag}${note}`);
  });
  u.send(lines.join("\n"));
}

export async function gearExec(u: IUrsamuSDK) {
  const sw = (u.cmd.args[0] ?? "").toLowerCase().trim();
  const rest = u.util.stripSubs(u.cmd.args[1] ?? "").trim();
  if (!sw) { await gearView(u, rest); return; }
  switch (sw) {
    case "view":   await gearView(u, rest);   return;
    case "list":   await gearList(u, rest);   return;
    case "show":   await gearShow(u, rest);   return;
    case "add":    await gearAdd(u, rest);    return;
    case "remove": case "rem": await gearRemove(u, rest); return;
    case "equip":  await gearEquip(u, rest);  return;
    case "unequip": await gearUnequip(u, rest); return;
    case "drop":   await gearDrop(u, rest);   return;
    case "pickup": case "take": await gearPickup(u, rest); return;
    case "give":   await gearGive(u, rest);   return;
    case "reload": await gearReload(u, rest); return;
    default:
      u.send(
        `Unknown +gear switch '/${sw}'. Use /list, /show, /add, /remove, /equip, /unequip, /drop, /pickup, /give, /reload.`,
      );
  }
}
