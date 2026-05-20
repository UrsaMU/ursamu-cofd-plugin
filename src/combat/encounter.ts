// CoFD 2e combat encounter management.
// Encounters are stored as DBO records in `cofd.encounters`.
// Pure ops accept the encounter object and return the mutated copy;
// each op then persists via the DBO API.

import { DBO, type IDBObj, type IUrsamuSDK } from "@ursamu/ursamu";
import type { CofdSheet } from "../stats/index.ts";
import type { Encounter, Participant } from "./types.ts";
import {
  isWeaponType,
  lookupItem,
  type WeaponEntry,
} from "../equipment/catalog.ts";
import { itemData } from "../equipment/objects.ts";

// ---------------------------------------------------------------------------
// DBO collection
// ---------------------------------------------------------------------------

// deno-lint-ignore no-explicit-any
type Q = any;

export const encounterDb = new DBO<Encounter>("cofd.encounters");

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

/** Create a new encounter anchored to roomId. Status begins at "intent". */
export async function createEncounter(roomId: string): Promise<Encounter> {
  const now = Date.now();
  const enc: Encounter = {
    id: `enc-${now}-${Math.floor(Math.random() * 1e6)}`,
    roomId,
    round: 0,
    turnIdx: 0,
    participants: [],
    status: "intent",
    createdAt: now,
  };
  await encounterDb.create(enc);
  return enc;
}

// ---------------------------------------------------------------------------
// Participant management
// ---------------------------------------------------------------------------

/** Add an actor to an encounter. No-op if already present. */
export async function addParticipant(
  encounterId: string,
  actor: IDBObj,
): Promise<Encounter | null> {
  const enc = await encounterDb.findOne({ id: encounterId } as Q);
  if (!enc) return null;
  if (enc.participants.some((p) => p.actorId === actor.id)) return enc;
  const updated: Encounter = {
    ...enc,
    participants: [
      ...enc.participants,
      {
        actorId: actor.id,
        name: actor.name ?? actor.id,
        initiative: 0,
        appliedDefense: 0,
        isDodging: false,
        isOut: false,
      },
    ],
  };
  await encounterDb.update({ id: encounterId } as Q, updated);
  return updated;
}

/** Remove an actor from an encounter. */
export async function removeParticipant(
  encounterId: string,
  actorId: string,
): Promise<{ encounter: Encounter; wasActive: boolean } | null> {
  const enc = await encounterDb.findOne({ id: encounterId } as Q);
  if (!enc) return null;
  const idx = enc.participants.findIndex((p) => p.actorId === actorId);
  if (idx < 0) return { encounter: enc, wasActive: false };

  const wasActive = enc.status === "active" && idx === enc.turnIdx;
  const participants = enc.participants.filter((p) => p.actorId !== actorId);

  // Adjust turnIdx after removal so the pointer stays on the same player.
  let turnIdx = enc.turnIdx;
  if (enc.status === "active") {
    if (idx < turnIdx) {
      turnIdx = Math.max(0, turnIdx - 1);
    } else if (turnIdx >= participants.length) {
      turnIdx = 0;
    }
  }

  const updated: Encounter = { ...enc, participants, turnIdx };
  await encounterDb.update({ id: encounterId } as Q, updated);
  return { encounter: updated, wasActive };
}

// ---------------------------------------------------------------------------
// Initiative roll
// ---------------------------------------------------------------------------

/** Roll 1d10. Extracted for easy stubbing in tests. */
export function roll1d10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

/**
 * Roll initiative for all non-out participants in the encounter.
 * Formula: 1d10 + Dexterity + Composure + weapon.initiative (if equipped).
 * Ties broken by Composure first, then Dexterity, then random.
 */
export async function rollInitiative(
  encounterId: string,
  u: IUrsamuSDK,
): Promise<Encounter | null> {
  const enc = await encounterDb.findOne({ id: encounterId } as Q);
  if (!enc) return null;

  const rolled: Participant[] = await Promise.all(
    enc.participants.map(async (p) => {
      const actors = await u.db.search({ id: p.actorId } as Q);
      const actor = actors[0];
      if (!actor) return { ...p, initiative: 0 };

      const sheet = actor.state?.cofd as CofdSheet | undefined;
      const dex = sheet?.attributes?.Dexterity ?? 1;
      const composure = sheet?.attributes?.Composure ?? 1;

      // Weapon initiative penalty: look up the equipped weapon in sheet.
      let weaponMod = 0;
      const weaponId = sheet?.equipment?.equippedWeapon;
      if (weaponId) {
        const weaponObjs = await u.db.search({ id: weaponId } as Q);
        if (weaponObjs[0]) {
          const d = itemData(weaponObjs[0]);
          if (d) {
            const resolved = lookupItem(d.key);
            if (resolved && isWeaponType(resolved.type)) {
              weaponMod = (resolved.entry as WeaponEntry).initiative ?? 0;
            }
          }
        }
      }

      const die = roll1d10();
      const initiative = die + dex + composure + weaponMod;
      return { ...p, initiative };
    }),
  );

  // Sort descending; ties: random tiebreak for simplicity.
  rolled.sort((a, b) => {
    if (b.initiative !== a.initiative) return b.initiative - a.initiative;
    return Math.random() - 0.5;
  });

  const updated: Encounter = {
    ...enc,
    participants: rolled,
    round: 1,
    turnIdx: 0,
    status: "active",
  };
  await encounterDb.update({ id: encounterId } as Q, updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Turn management
// ---------------------------------------------------------------------------

/**
 * Advance the turn pointer.
 * When it wraps past the last participant, increment round and reset
 * every appliedDefense and isDodging to 0/false.
 */
export async function advanceTurn(
  encounterId: string,
): Promise<Encounter | null> {
  const enc = await encounterDb.findOne({ id: encounterId } as Q);
  if (!enc || enc.status !== "active") return enc ?? null;

  const count = enc.participants.length;
  if (count === 0) return enc;

  let nextIdx = enc.turnIdx + 1;
  let round = enc.round;
  let participants = enc.participants;

  if (nextIdx >= count) {
    nextIdx = 0;
    round += 1;
    // Reset per-round Defense and dodge state.
    participants = participants.map((p) => ({
      ...p,
      appliedDefense: 0,
      isDodging: false,
    }));
  }

  const updated: Encounter = { ...enc, participants, round, turnIdx: nextIdx };
  await encounterDb.update({ id: encounterId } as Q, updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Per-turn flags
// ---------------------------------------------------------------------------

/** Increment appliedDefense for a participant (called each time they are attacked). */
export async function applyDefense(
  encounterId: string,
  actorId: string,
): Promise<Encounter | null> {
  const enc = await encounterDb.findOne({ id: encounterId } as Q);
  if (!enc) return null;
  const participants = enc.participants.map((p) =>
    p.actorId === actorId ? { ...p, appliedDefense: p.appliedDefense + 1 } : p
  );
  const updated: Encounter = { ...enc, participants };
  await encounterDb.update({ id: encounterId } as Q, updated);
  return updated;
}

/** Set or clear the dodge flag for a participant. */
export async function setDodge(
  encounterId: string,
  actorId: string,
  dodging: boolean,
): Promise<Encounter | null> {
  const enc = await encounterDb.findOne({ id: encounterId } as Q);
  if (!enc) return null;
  const participants = enc.participants.map((p) =>
    p.actorId === actorId ? { ...p, isDodging: dodging } : p
  );
  const updated: Encounter = { ...enc, participants };
  await encounterDb.update({ id: encounterId } as Q, updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

/** Return the active (non-resolved) encounter for a room, or null. */
export async function getEncounterForRoom(
  roomId: string,
): Promise<Encounter | null> {
  const results = await encounterDb.find({ roomId } as Q);
  const live = results.filter((e) => e.status !== "resolved");
  return live[0] ?? null;
}
