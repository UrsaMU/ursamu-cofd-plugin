// +grapple command -- CoFD 2e grapple initiation and move resolution.
//
// Syntax:
//   +grapple <target>          -- initiate grab: Str+Brawl vs Defense
//   +grapple/<move>            -- execute a grapple move on current grapple target
//
// Moves:
//   /break-free     -- Str+Brawl; break the grapple if successes >= holder's
//   /control-weapon -- control a weapon in the grapple
//   /damage         -- Str+Brawl; deal bashing (no weapon)
//   /disarm         -- disarm the opponent
//   /drop-prone     -- knock both to the ground
//   /hold           -- maintain the grapple without a move
//   /restrain       -- fully restrain; opponent may not move or attack
//   /take-cover     -- use opponent as cover

import type { IUrsamuSDK } from "@ursamu/ursamu";
import { type CofdSheet, defaultSheet } from "../stats/index.ts";
import { computeDefense } from "../combat/pools.ts";
import { applyAttackDamage } from "../combat/damage.ts";
import { getEncounterForRoom, applyDefense } from "../combat/encounter.ts";
import { executeRoll } from "../roller/index.ts";

/** Grapple state stored on participant sheet under state.cofd_grapple. */
export interface GrappleState {
  /** The id of the character currently grappled with (or null). */
  grappleWith: string | null;
  /** True when this character is the one who initiated / holds the grapple. */
  isHolder: boolean;
}

const VALID_MOVES = [
  "break-free",
  "control-weapon",
  "damage",
  "disarm",
  "drop-prone",
  "hold",
  "restrain",
  "take-cover",
] as const;
type GrappleMove = typeof VALID_MOVES[number];

function attr(sheet: CofdSheet, name: string): number {
  return (sheet.attributes as Record<string, number>)[name] ?? 1;
}

function skill(sheet: CofdSheet, name: string): number {
  return (sheet.skills as Record<string, number>)[name] ?? 0;
}

export async function grappleExec(u: IUrsamuSDK) {
  const rawArgs = u.cmd.args[0] ?? "";
  const rest = u.util.stripSubs(rawArgs).trim();

  if (!rest) {
    u.send(
      "Usage: +grapple <target>  or  +grapple/<move>" +
        "\nMoves: break-free, control-weapon, damage, disarm, drop-prone, hold, restrain, take-cover",
    );
    return;
  }

  // Parse "<target>[/<move>]" or just "/<move>" (no target = use current grapple).
  const slashIdx = rest.indexOf("/");
  const maybeTarget = slashIdx >= 0 ? rest.slice(0, slashIdx).trim() : rest;
  const maybeMove = slashIdx >= 0 ? rest.slice(slashIdx + 1).trim().toLowerCase() : "";

  // ---- Encounter check -----------------------------------------------
  const roomId = u.here?.id ?? "";
  const encounter = roomId ? await getEncounterForRoom(roomId) : null;
  if (!encounter || encounter.status !== "active") {
    u.send("There is no active combat encounter in this room.");
    return;
  }
  const currentActor = encounter.participants[encounter.turnIdx];
  if (!currentActor || currentActor.actorId !== u.me.id) {
    u.send("It is not your turn.");
    return;
  }

  const mySheet: CofdSheet = (u.me.state?.cofd as CofdSheet) ?? defaultSheet();
  const grappleState = (u.me.state?.cofd_grapple as GrappleState | undefined) ?? {
    grappleWith: null,
    isHolder: false,
  };

  // ---- Move on existing grapple --------------------------------------
  if (maybeMove) {
    if (!(VALID_MOVES as readonly string[]).includes(maybeMove)) {
      u.send(
        `Unknown grapple move: /${maybeMove}\n` +
          `Valid: ${VALID_MOVES.join(", ")}`,
      );
      return;
    }
    const move = maybeMove as GrappleMove;

    // Resolve target: prefer current grapple partner, or use the arg.
    let opponentId = grappleState.grappleWith ?? null;
    if (!opponentId && maybeTarget) {
      const tgt = await u.util.target(u.me, maybeTarget, true);
      if (!tgt) {
        u.send(`Target '${maybeTarget}' not found.`);
        return;
      }
      opponentId = tgt.id;
    }
    if (!opponentId) {
      u.send("You are not currently in a grapple. Use +grapple <target> to initiate one.");
      return;
    }

    const opponent = await u.util.target(u.me, opponentId, true);
    if (!opponent) {
      u.send("Your grapple opponent is no longer here.");
      await u.db.modify(u.me.id, "$set", { "state.cofd_grapple": { grappleWith: null, isHolder: false } });
      return;
    }

    const canEdit = await u.canEdit(u.me, opponent);
    if (!canEdit) {
      u.send("You do not have permission to affect that target.");
      return;
    }

    const oppSheet: CofdSheet = (opponent.state?.cofd as CofdSheet) ?? defaultSheet();

    switch (move) {
      case "hold":
        u.broadcast(`%cy${u.me.name ?? "Unknown"} holds ${opponent.name ?? "Unknown"} in a grapple.%cn`);
        break;

      case "damage": {
        // Str+Brawl, bashing, no Defense subtraction (already grappling).
        const pool = attr(mySheet, "strength") + skill(mySheet, "brawl");
        const result = executeRoll(pool);
        const hits = result.successes;
        const armorId = oppSheet.equipment?.equippedArmor ?? null;
        // No armor lookup needed for grapple damage (attacker bypasses armor in RAW
        // for improvised damage -- simplified: apply with 0 armor).
        const dmg = applyAttackDamage(oppSheet, hits, "bashing", 0, 0, false);
        if (dmg.netDamage > 0) {
          await u.db.modify(opponent.id, "$set", { "state.cofd": dmg.sheet });
        }
        u.broadcast(
          `%cyGRAPPLE>>%cn ${u.me.name ?? "?"} damages ${opponent.name ?? "?"}: ` +
            `${hits} success${hits === 1 ? "" : "es"}, ${dmg.netDamage} bashing.`,
        );
        if (dmg.beatenDown) u.broadcast(`%cr${opponent.name ?? "?"} is Beaten Down!%cn`);
        void armorId; // suppress unused warning
        break;
      }

      case "break-free": {
        // Str+Brawl; if successes >= holder's Str+Brawl: grapple ends.
        const pool = attr(mySheet, "strength") + skill(mySheet, "brawl");
        const result = executeRoll(pool);
        const holderPool = attr(oppSheet, "strength") + skill(oppSheet, "brawl");
        const freed = result.successes >= holderPool;
        if (freed) {
          await u.db.modify(u.me.id, "$set", { "state.cofd_grapple": { grappleWith: null, isHolder: false } });
          await u.db.modify(opponent.id, "$set", { "state.cofd_grapple": { grappleWith: null, isHolder: false } });
          u.broadcast(`%cy${u.me.name ?? "?"} breaks free from ${opponent.name ?? "?"}!%cn`);
        } else {
          u.broadcast(`%cy${u.me.name ?? "?"} fails to break free (${result.successes} vs ${holderPool}).%cn`);
        }
        break;
      }

      case "restrain": {
        const pool = attr(mySheet, "strength") + skill(mySheet, "brawl");
        const result = executeRoll(pool);
        const oppDef = computeDefense(oppSheet);
        if (result.successes > oppDef) {
          u.broadcast(`%cy${u.me.name ?? "?"} fully restrains ${opponent.name ?? "?"}!%cn`);
        } else {
          u.broadcast(`%cy${u.me.name ?? "?"} struggles to restrain ${opponent.name ?? "?"} but fails.%cn`);
        }
        break;
      }

      case "disarm": {
        const pool = attr(mySheet, "strength") + skill(mySheet, "brawl");
        const result = executeRoll(pool);
        const oppDef = computeDefense(oppSheet);
        if (result.successes > oppDef) {
          u.broadcast(`%cy${u.me.name ?? "?"} disarms ${opponent.name ?? "?"}!%cn`);
          // ST-level effect: actual item manipulation out of scope here.
        } else {
          u.broadcast(`%cy${u.me.name ?? "?"} attempts to disarm ${opponent.name ?? "?"} but fails.%cn`);
        }
        break;
      }

      case "drop-prone": {
        u.broadcast(`%cy${u.me.name ?? "?"} drags ${opponent.name ?? "?"} to the ground!%cn Both are now prone.%cn`);
        break;
      }

      case "control-weapon": {
        const pool = attr(mySheet, "strength") + skill(mySheet, "brawl");
        const result = executeRoll(pool);
        const oppDef = computeDefense(oppSheet);
        if (result.successes > oppDef) {
          u.broadcast(`%cy${u.me.name ?? "?"} controls ${opponent.name ?? "?"}'s weapon!%cn`);
        } else {
          u.broadcast(`%cy${u.me.name ?? "?"} fails to control ${opponent.name ?? "?"}'s weapon.%cn`);
        }
        break;
      }

      case "take-cover": {
        u.broadcast(`%cy${u.me.name ?? "?"} uses ${opponent.name ?? "?"} as cover!%cn`);
        break;
      }
    }

    await applyDefense(encounter.id, opponent.id);
    return;
  }

  // ---- Initiate grapple ----------------------------------------------
  const target = await u.util.target(u.me, maybeTarget, true);
  if (!target) {
    u.send(`Target '${maybeTarget}' not found.`);
    return;
  }

  const canEdit = await u.canEdit(u.me, target);
  if (!canEdit) {
    u.send("You do not have permission to affect that target.");
    return;
  }

  const targetSheet: CofdSheet = (target.state?.cofd as CofdSheet) ?? defaultSheet();
  const targetParticipant = encounter.participants.find((p) => p.actorId === target.id);
  let targetDefense = computeDefense(targetSheet);
  if (targetParticipant) {
    targetDefense = Math.max(0, targetDefense - targetParticipant.appliedDefense);
  }

  const pool = Math.max(0,
    attr(mySheet, "strength") + skill(mySheet, "brawl") - targetDefense,
  );
  const result = executeRoll(pool);
  const success = result.successes > 0;

  const attackerName = u.me.name ?? "Unknown";
  const tgtName = target.name ?? "Unknown";
  u.broadcast(
    `%cyGRAPPLE>>%cn ${attackerName} attempts to grapple ${tgtName}: ` +
      `${result.successes} success${result.successes === 1 ? "" : "es"} -- ` +
      (success ? "%cgGrab succeeds!%cn" : "%crFails.%cn"),
  );

  if (success) {
    // Mark both participants as grappling each other.
    await u.db.modify(u.me.id, "$set", {
      "state.cofd_grapple": { grappleWith: target.id, isHolder: true },
    });
    await u.db.modify(target.id, "$set", {
      "state.cofd_grapple": { grappleWith: u.me.id, isHolder: false },
    });
  }

  await applyDefense(encounter.id, target.id);
}
