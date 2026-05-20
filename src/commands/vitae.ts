// +vitae command: view, spend, and gain Vitae for a vampire character.
//
// Vampire-only. Cross-player edits require canEdit (builder+). DB writes
// preserve every other sheet field via spread; sheets are stored at
// `data.cofd`.

import { type IUrsamuSDK } from "@ursamu/ursamu";
import {
  BLOOD_POTENCY,
  getBloodPotencyEntry,
} from "../gamelines/vampire.ts";
import { type CofdSheet } from "../stats/index.ts";

/** Pull off a trailing " for <player>" suffix. */
function splitForTarget(rest: string): { body: string; target: string } {
  const idx = rest.toLowerCase().lastIndexOf(" for ");
  if (idx < 0) return { body: rest.trim(), target: "" };
  return {
    body: rest.slice(0, idx).trim(),
    target: rest.slice(idx + 5).trim(),
  };
}

/**
 * Pure validation helper for spend amounts. Exposed for unit tests.
 *
 * - Rejects non-vampire sheets.
 * - Rejects non-positive amounts.
 * - Rejects amounts exceeding the current Vitae pool.
 */
export interface VitaeSpendValidation {
  ok: boolean;
  error?: string;
  warning?: string;
  perTurnCap?: number;
}

export function validateVitaeSpend(
  sheet: CofdSheet,
  amount: number,
): VitaeSpendValidation {
  if ((sheet.template || "").toLowerCase().trim() !== "vampire") {
    return { ok: false, error: "Only vampires have Vitae." };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Amount must be a positive integer." };
  }
  const current = sheet.energyCurrent ?? 0;
  if (amount > current) {
    return {
      ok: false,
      error: `Insufficient Vitae: have ${current}, need ${amount}.`,
    };
  }
  const row = getBloodPotencyEntry(sheet.powerStatValue ?? 0);
  if (amount > row.maxPerTurn) {
    return {
      ok: true,
      perTurnCap: row.maxPerTurn,
      warning:
        `Per-turn cap exceeded: BP ${sheet.powerStatValue ?? 0} allows ${row.maxPerTurn}/turn. Spending will require multiple turns of fiction.`,
    };
  }
  return { ok: true, perTurnCap: row.maxPerTurn };
}

/** Resolves the target player, prefering `arg`, falling back to self. */
async function resolveTarget(u: IUrsamuSDK, arg: string) {
  if (!arg) return u.me;
  return await u.util.target(u.me, arg, true);
}

function status(sheet: CofdSheet): string {
  const row = getBloodPotencyEntry(sheet.powerStatValue ?? 0);
  return `Vitae: ${sheet.energyCurrent ?? 0} / ${row.maxVitae}  (BP ${sheet.powerStatValue ?? 0}, per-turn ${row.maxPerTurn})`;
}

async function vitaeView(u: IUrsamuSDK, rest: string) {
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
  if ((sheet.template || "").toLowerCase().trim() !== "vampire") {
    u.send("Only vampires have Vitae.");
    return;
  }
  const label = target.id === u.me.id ? "You" : u.util.displayName(target, u.me);
  u.send(`${label}: ${status(sheet)}`);
}

async function vitaeSpend(u: IUrsamuSDK, body: string, targetName: string) {
  const amount = body ? parseInt(body, 10) : 1;
  if (!Number.isFinite(amount) || amount <= 0) {
    u.send("Usage: +vitae/spend [<n>] [for <player>]  -- n must be a positive integer.");
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
  const sameTarget = target.id === u.me.id;
  if (!sameTarget && !(await u.canEdit(u.me, target))) {
    u.send("Permission denied. You cannot modify that player's Vitae.");
    return;
  }

  const check = validateVitaeSpend(sheetRaw, amount);
  if (!check.ok) {
    u.send(`Error: ${check.error}`);
    return;
  }
  if (check.warning) {
    u.send(`Note: ${check.warning}`);
  }

  const newVitae = (sheetRaw.energyCurrent ?? 0) - amount;
  const updated: CofdSheet = { ...sheetRaw, energyCurrent: newVitae };
  await u.db.modify(target.id, "$set", { "data.cofd": updated });

  const label = sameTarget ? "You" : u.util.displayName(target, u.me);
  u.send(`${label} spent ${amount} Vitae.  ${status(updated)}`);
}

async function vitaeGain(u: IUrsamuSDK, body: string, targetName: string) {
  const amount = body ? parseInt(body, 10) : 1;
  if (!Number.isFinite(amount) || amount <= 0) {
    u.send("Usage: +vitae/gain [<n>] [for <player>]  -- n must be a positive integer.");
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
  if ((sheetRaw.template || "").toLowerCase().trim() !== "vampire") {
    u.send("Only vampires have Vitae.");
    return;
  }
  const sameTarget = target.id === u.me.id;
  if (!sameTarget && !(await u.canEdit(u.me, target))) {
    u.send("Permission denied. You cannot modify that player's Vitae.");
    return;
  }

  const row = getBloodPotencyEntry(sheetRaw.powerStatValue ?? 0);
  const current = sheetRaw.energyCurrent ?? 0;
  const newVitae = Math.min(row.maxVitae, current + amount);
  const gained = newVitae - current;
  const updated: CofdSheet = { ...sheetRaw, energyCurrent: newVitae };
  await u.db.modify(target.id, "$set", { "data.cofd": updated });

  const label = sameTarget ? "You" : u.util.displayName(target, u.me);
  if (gained < amount) {
    u.send(`${label} gained ${gained} Vitae (capped at BP max ${row.maxVitae}).  ${status(updated)}`);
  } else {
    u.send(`${label} gained ${amount} Vitae.  ${status(updated)}`);
  }
}

async function vitaeBlush(u: IUrsamuSDK, targetName: string) {
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
  const sameTarget = target.id === u.me.id;
  if (!sameTarget && !(await u.canEdit(u.me, target))) {
    u.send("Permission denied. You cannot modify that player's Vitae.");
    return;
  }
  const check = validateVitaeSpend(sheetRaw, 1);
  if (!check.ok) {
    u.send(`Error: ${check.error}`);
    return;
  }
  const updated: CofdSheet = { ...sheetRaw, energyCurrent: (sheetRaw.energyCurrent ?? 0) - 1 };
  await u.db.modify(target.id, "$set", { "data.cofd": updated });

  const label = sameTarget ? "You" : u.util.displayName(target, u.me);
  u.send(`${label} spent 1 Vitae for Blush of Life (one hour of mortal mimicry).  ${status(updated)}`);
}

async function vitaeBoost(u: IUrsamuSDK, body: string, targetName: string) {
  const attr = body.toLowerCase().trim();
  const valid = new Set(["strength", "dexterity", "stamina"]);
  if (!valid.has(attr)) {
    u.send("Usage: +vitae/boost <strength|dexterity|stamina> [for <player>]");
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
  const sameTarget = target.id === u.me.id;
  if (!sameTarget && !(await u.canEdit(u.me, target))) {
    u.send("Permission denied. You cannot modify that player's Vitae.");
    return;
  }
  const check = validateVitaeSpend(sheetRaw, 1);
  if (!check.ok) {
    u.send(`Error: ${check.error}`);
    return;
  }
  const updated: CofdSheet = { ...sheetRaw, energyCurrent: (sheetRaw.energyCurrent ?? 0) - 1 };
  await u.db.modify(target.id, "$set", { "data.cofd": updated });

  const label = sameTarget ? "You" : u.util.displayName(target, u.me);
  u.send(`${label} spent 1 Vitae to boost ${attr} (+2 for the scene).  ${status(updated)}`);
}

export async function vitaeExec(u: IUrsamuSDK) {
  const sw = (u.cmd.args[0] ?? "").toLowerCase().trim();
  const rest = u.util.stripSubs(u.cmd.args[1] ?? "").trim();

  if (!sw) {
    await vitaeView(u, rest);
    return;
  }

  const { body, target: targetName } = splitForTarget(rest);

  switch (sw) {
    case "view":
      await vitaeView(u, rest);
      return;
    case "spend":
      await vitaeSpend(u, body, targetName);
      return;
    case "gain":
      await vitaeGain(u, body, targetName);
      return;
    case "blush":
      await vitaeBlush(u, targetName);
      return;
    case "boost":
      await vitaeBoost(u, body, targetName);
      return;
    default:
      u.send(`Unknown +vitae switch '/${sw}'. Use /spend, /gain, /blush, or /boost.`);
  }
}

// Re-export the BP table for the help command / showcases if needed.
export { BLOOD_POTENCY };
