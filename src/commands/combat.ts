// +combat command -- CoFD 2e encounter management.
// Tracks initiative order, turns, Defense, and ambush resolution.

import { divider, type IUrsamuSDK } from "@ursamu/ursamu";
import {
  addParticipant,
  advanceTurn,
  applyDefense,
  createEncounter,
  encounterDb,
  getEncounterForRoom,
  removeParticipant,
  roll1d10,
  rollInitiative,
} from "../combat/encounter.ts";
import type { CofdSheet } from "../stats/index.ts";
import type { Encounter } from "../combat/types.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function renderOrder(enc: Encounter): string {
  const lines: string[] = [];
  enc.participants.forEach((p, i) => {
    const marker = i === enc.turnIdx ? ">" : " ";
    const flags: string[] = [];
    if (p.isDodging) flags.push("Dodge");
    if (p.isOut) flags.push("Incap");
    const tag = flags.length ? ` (${flags.join(", ")})` : "";
    lines.push(
      `  ${marker} ${String(p.initiative).padStart(3)}  ${pad(p.name, 20)}${tag}`,
    );
  });
  return lines.join("\n");
}

/** Parse optional "for <player>" from the end of rest. */
function splitForTarget(rest: string): { body: string; targetName: string } {
  const idx = rest.toLowerCase().lastIndexOf(" for ");
  if (idx < 0) return { body: rest.trim(), targetName: "" };
  return { body: rest.slice(0, idx).trim(), targetName: rest.slice(idx + 5).trim() };
}

// ---------------------------------------------------------------------------
// Sub-command handlers
// ---------------------------------------------------------------------------

async function combatStatus(u: IUrsamuSDK) {
  const roomId = u.here?.id;
  if (!roomId) { u.send("You are not in a room."); return; }
  const enc = await getEncounterForRoom(roomId);
  if (!enc) { u.send("No active encounter in this room. Use +combat/start to begin one."); return; }
  const lines: string[] = [];
  lines.push(await divider("C O M B A T"));
  lines.push(`  Status: ${enc.status}  Round: ${enc.round}`);
  if (enc.participants.length === 0) {
    lines.push("  No participants yet. Use +combat/join.");
  } else {
    lines.push(renderOrder(enc));
  }
  u.send(lines.join("\n"));
}

async function combatStart(u: IUrsamuSDK) {
  const roomId = u.here?.id;
  if (!roomId) { u.send("You are not in a room."); return; }
  const existing = await getEncounterForRoom(roomId);
  if (existing) {
    u.send(`An encounter is already active here (status: ${existing.status}).`);
    return;
  }
  await createEncounter(roomId);
  u.send("Combat encounter started. Use +combat/join to add participants.");
}

async function combatJoin(u: IUrsamuSDK, rest: string) {
  const roomId = u.here?.id;
  if (!roomId) { u.send("You are not in a room."); return; }
  const enc = await getEncounterForRoom(roomId);
  if (!enc) { u.send("No encounter here. Use +combat/start first."); return; }

  const { targetName } = splitForTarget(rest);
  let actor = u.me;
  if (targetName) {
    const found = await u.util.target(u.me, targetName, true);
    if (!found) { u.send(`No player matches '${targetName}'.`); return; }
    if (!(await u.canEdit(u.me, found))) {
      u.send("Permission denied. You cannot add another player to combat.");
      return;
    }
    actor = found;
  }
  await addParticipant(enc.id, actor);
  const label = actor.id === u.me.id ? "You have" : `${u.util.displayName(actor, u.me)} has`;
  u.send(`${label} joined the encounter.`);
}

async function combatLeave(u: IUrsamuSDK, rest: string) {
  const roomId = u.here?.id;
  if (!roomId) { u.send("You are not in a room."); return; }
  const enc = await getEncounterForRoom(roomId);
  if (!enc) { u.send("No encounter here."); return; }

  const { targetName } = splitForTarget(rest);
  let actor = u.me;
  if (targetName) {
    const found = await u.util.target(u.me, targetName, true);
    if (!found) { u.send(`No player matches '${targetName}'.`); return; }
    if (!(await u.canEdit(u.me, found))) {
      u.send("Permission denied. You cannot remove another player from combat.");
      return;
    }
    actor = found;
  }
  const result = await removeParticipant(enc.id, actor.id);
  if (!result) { u.send("Encounter not found."); return; }
  const label = actor.id === u.me.id ? "You have" : `${u.util.displayName(actor, u.me)} has`;
  u.send(`${label} left the encounter.`);
  if (result.wasActive) {
    // Advance was already handled structurally by removeParticipant's turnIdx fix.
    const fresh = await getEncounterForRoom(roomId);
    if (fresh && fresh.participants.length > 0) {
      const cur = fresh.participants[fresh.turnIdx];
      u.send(`Turn advances to ${cur.name}.`);
    }
  }
}

async function combatBegin(u: IUrsamuSDK) {
  const roomId = u.here?.id;
  if (!roomId) { u.send("You are not in a room."); return; }
  const enc = await getEncounterForRoom(roomId);
  if (!enc) { u.send("No encounter here. Use +combat/start first."); return; }
  if (enc.participants.length === 0) {
    u.send("No participants to roll initiative for. Use +combat/join.");
    return;
  }
  const updated = await rollInitiative(enc.id, u);
  if (!updated) { u.send("Failed to roll initiative."); return; }
  const lines: string[] = [];
  lines.push(await divider("I N I T I A T I V E"));
  lines.push(renderOrder(updated));
  lines.push(`  Round 1 -- ${updated.participants[0].name} acts first.`);
  u.send(lines.join("\n"));
}

async function combatNext(u: IUrsamuSDK) {
  const roomId = u.here?.id;
  if (!roomId) { u.send("You are not in a room."); return; }
  const enc = await getEncounterForRoom(roomId);
  if (!enc || enc.status !== "active") {
    u.send("No active encounter. Use +combat/begin to start the round.");
    return;
  }
  const updated = await advanceTurn(enc.id);
  if (!updated) { u.send("Failed to advance turn."); return; }
  const cur = updated.participants[updated.turnIdx];
  u.send(
    `Round ${updated.round} -- It is now ${cur.name}'s turn (Initiative: ${cur.initiative}).`,
  );
}

async function combatEnd(u: IUrsamuSDK) {
  const roomId = u.here?.id;
  if (!roomId) { u.send("You are not in a room."); return; }
  const enc = await getEncounterForRoom(roomId);
  if (!enc) { u.send("No encounter here."); return; }
  const resolved = { ...enc, status: "resolved" as const };
  // deno-lint-ignore no-explicit-any
  await encounterDb.update({ id: enc.id } as any, resolved);
  u.send("The encounter has ended. All participants are dismissed.");
}

async function combatOrder(u: IUrsamuSDK) {
  const roomId = u.here?.id;
  if (!roomId) { u.send("You are not in a room."); return; }
  const enc = await getEncounterForRoom(roomId);
  if (!enc) { u.send("No encounter here."); return; }
  const lines: string[] = [];
  lines.push(await divider("I N I T I A T I V E   O R D E R"));
  lines.push(`  Round ${enc.round}  Status: ${enc.status}`);
  if (enc.participants.length === 0) {
    lines.push("  No participants.");
  } else {
    lines.push(renderOrder(enc));
  }
  u.send(lines.join("\n"));
}

async function combatAmbush(u: IUrsamuSDK, rest: string) {
  const roomId = u.here?.id;
  if (!roomId) { u.send("You are not in a room."); return; }
  const enc = await getEncounterForRoom(roomId);
  if (!enc) { u.send("No encounter here."); return; }

  const targetName = rest.trim();
  if (!targetName) { u.send("Usage: +combat/ambush <target>"); return; }
  const target = await u.util.target(u.me, targetName, true);
  if (!target) { u.send(`No player matches '${targetName}'.`); return; }

  const mySheet = u.me.state?.cofd as CofdSheet | undefined;
  const theirSheet = target.state?.cofd as CofdSheet | undefined;

  // Attacker: Dexterity + Stealth
  const atkDex = mySheet?.attributes?.Dexterity ?? 1;
  const atkStealth = mySheet?.skills?.Stealth ?? 0;
  // Defender: Wits + Composure
  const defWits = theirSheet?.attributes?.Wits ?? 1;
  const defComp = theirSheet?.attributes?.Composure ?? 1;

  const atkPool = atkDex + atkStealth;
  const defPool = defWits + defComp;

  // Roll contested pools.
  let atkSuccesses = 0;
  for (let i = 0; i < atkPool; i++) {
    const die = roll1d10();
    if (die >= 8) atkSuccesses++;
    if (die === 10) { // 10-again
      const reroll = roll1d10();
      if (reroll >= 8) atkSuccesses++;
    }
  }
  let defSuccesses = 0;
  for (let i = 0; i < defPool; i++) {
    const die = roll1d10();
    if (die >= 8) defSuccesses++;
    if (die === 10) {
      const reroll = roll1d10();
      if (reroll >= 8) defSuccesses++;
    }
  }

  const attackerName = u.util.displayName(u.me, u.me);
  const defenderName = u.util.displayName(target, u.me);
  const lines: string[] = [];
  lines.push(await divider("A M B U S H"));
  lines.push(
    `  ${attackerName} (Dex ${atkDex} + Stealth ${atkStealth} = ${atkPool} dice): %ch${atkSuccesses} success${atkSuccesses !== 1 ? "es" : ""}%cn`,
  );
  lines.push(
    `  ${defenderName} (Wits ${defWits} + Composure ${defComp} = ${defPool} dice): %ch${defSuccesses} success${defSuccesses !== 1 ? "es" : ""}%cn`,
  );

  if (atkSuccesses > defSuccesses) {
    lines.push(
      `  Ambush succeeds! ${defenderName} loses their first-turn action and Defense this round.`,
    );
    // Mark defender as having applied defense so pool effectively exhausted.
    await applyDefense(enc.id, target.id);
    // Also mark defender out-of-action for first turn via setDodge=false is insufficient;
    // store in isOut temporarily: a full implementation would track "surprised" state.
    // For this implementation, we note it in output and leave mechanical enforcement to staff.
  } else if (defSuccesses > atkSuccesses) {
    lines.push(`  Ambush fails! ${defenderName} is aware of the threat.`);
  } else {
    lines.push("  Tied! The attacker narrowly fails to surprise the defender.");
  }

  u.send(lines.join("\n"));
}

// ---------------------------------------------------------------------------
// Main dispatch
// ---------------------------------------------------------------------------

export async function combatExec(u: IUrsamuSDK) {
  const sw = (u.cmd.args[0] ?? "").toLowerCase().trim();
  const rest = u.util.stripSubs(u.cmd.args[1] ?? "").trim();

  switch (sw) {
    case "start":  await combatStart(u);        return;
    case "join":   await combatJoin(u, rest);   return;
    case "leave":  await combatLeave(u, rest);  return;
    case "begin":  await combatBegin(u);        return;
    case "next":   await combatNext(u);         return;
    case "end":    await combatEnd(u);          return;
    case "order":  await combatOrder(u);        return;
    case "ambush": await combatAmbush(u, rest); return;
    default:       await combatStatus(u);       return;
  }
}
