// +touchstone command: view/set/clear Mask and Dirge anchors for vampires.
//
// Mask is the public-persona Touchstone; Dirge is the predatory Touchstone.
// Both are vampire-specific. Cross-player edits require canEdit.

import { type IUrsamuSDK } from "@ursamu/ursamu";
import { type CofdSheet, type Touchstones } from "../stats/index.ts";

function splitForTarget(rest: string): { body: string; target: string } {
  const idx = rest.toLowerCase().lastIndexOf(" for ");
  if (idx < 0) return { body: rest.trim(), target: "" };
  return {
    body: rest.slice(0, idx).trim(),
    target: rest.slice(idx + 5).trim(),
  };
}

async function resolveTarget(u: IUrsamuSDK, arg: string) {
  if (!arg) return u.me;
  return await u.util.target(u.me, arg, true);
}

function isVampire(sheet: CofdSheet): boolean {
  return (sheet.template || "").toLowerCase().trim() === "vampire";
}

function showTouchstones(label: string, sheet: CofdSheet): string {
  const mask = sheet.touchstones?.mask || "(unset)";
  const dirge = sheet.touchstones?.dirge || "(unset)";
  return `${label}\n  Mask:  ${mask}\n  Dirge: ${dirge}`;
}

async function touchstoneView(u: IUrsamuSDK, rest: string) {
  const target = await resolveTarget(u, rest);
  if (!target) {
    u.send(`Player '${rest}' not found.`);
    return;
  }
  const sheet = target.state?.cofd as CofdSheet | undefined;
  if (!sheet) {
    u.send("That player does not have an approved character sheet yet.");
    return;
  }
  if (!isVampire(sheet)) {
    u.send("Mask and Dirge Touchstones are vampire-specific.");
    return;
  }
  const label = target.id === u.me.id
    ? "Your Touchstones:"
    : `${u.util.displayName(target, u.me)}'s Touchstones:`;
  u.send(showTouchstones(label, sheet));
}

async function touchstoneSet(
  u: IUrsamuSDK,
  body: string,
  targetName: string,
  slot: "mask" | "dirge",
) {
  if (!body) {
    u.send(`Usage: +touchstone/${slot} <name> [for <player>]`);
    return;
  }
  const target = await resolveTarget(u, targetName);
  if (!target) {
    u.send(`Player '${targetName}' not found.`);
    return;
  }
  const sheetRaw = target.state?.cofd as CofdSheet | undefined;
  if (!sheetRaw) {
    u.send("That player does not have an approved character sheet yet.");
    return;
  }
  if (!isVampire(sheetRaw)) {
    u.send("Mask and Dirge Touchstones are vampire-specific.");
    return;
  }
  const sameTarget = target.id === u.me.id;
  if (!sameTarget && !(await u.canEdit(u.me, target))) {
    u.send("Permission denied. You cannot modify that player's Touchstones.");
    return;
  }

  const ts: Touchstones = { ...(sheetRaw.touchstones ?? {}) };
  ts[slot] = body;
  const updated: CofdSheet = { ...sheetRaw, touchstones: ts };
  await u.db.modify(target.id, "$set", { "data.cofd": updated });

  const label = sameTarget ? "Your" : `${u.util.displayName(target, u.me)}'s`;
  const slotLabel = slot === "mask" ? "Mask" : "Dirge";
  u.send(`${label} ${slotLabel} Touchstone set to: ${body}`);
}

async function touchstoneClear(
  u: IUrsamuSDK,
  targetName: string,
  slot: "mask" | "dirge",
) {
  const target = await resolveTarget(u, targetName);
  if (!target) {
    u.send(`Player '${targetName}' not found.`);
    return;
  }
  const sheetRaw = target.state?.cofd as CofdSheet | undefined;
  if (!sheetRaw) {
    u.send("That player does not have an approved character sheet yet.");
    return;
  }
  if (!isVampire(sheetRaw)) {
    u.send("Mask and Dirge Touchstones are vampire-specific.");
    return;
  }
  const sameTarget = target.id === u.me.id;
  if (!sameTarget && !(await u.canEdit(u.me, target))) {
    u.send("Permission denied. You cannot modify that player's Touchstones.");
    return;
  }
  const ts: Touchstones = { ...(sheetRaw.touchstones ?? {}) };
  delete ts[slot];
  const updated: CofdSheet = { ...sheetRaw, touchstones: ts };
  await u.db.modify(target.id, "$set", { "data.cofd": updated });

  const label = sameTarget ? "Your" : `${u.util.displayName(target, u.me)}'s`;
  const slotLabel = slot === "mask" ? "Mask" : "Dirge";
  u.send(`${label} ${slotLabel} Touchstone cleared. Losing a Touchstone risks 1 Humanity dot per CoFD 2e.`);
}

export async function touchstoneExec(u: IUrsamuSDK) {
  const sw = (u.cmd.args[0] ?? "").toLowerCase().trim();
  const rest = u.util.stripSubs(u.cmd.args[1] ?? "").trim();

  if (!sw) {
    await touchstoneView(u, rest);
    return;
  }

  const { body, target: targetName } = splitForTarget(rest);

  switch (sw) {
    case "view":
      await touchstoneView(u, rest);
      return;
    case "mask":
      await touchstoneSet(u, body, targetName, "mask");
      return;
    case "dirge":
      await touchstoneSet(u, body, targetName, "dirge");
      return;
    case "clear-mask":
      await touchstoneClear(u, targetName || body, "mask");
      return;
    case "clear-dirge":
      await touchstoneClear(u, targetName || body, "dirge");
      return;
    default:
      u.send(`Unknown +touchstone switch '/${sw}'. Use /mask, /dirge, /clear-mask, or /clear-dirge.`);
  }
}
