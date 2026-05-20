// +attack command -- CoFD 2e combat attack resolution.
//
// Syntax:
//   +attack <target>[/<switches>]
//
// Switches (stackable):
//   /unarmed /melee /ranged /thrown   -- pool override
//   /all-out                          -- +2, attacker loses Defense
//   /charge                           -- +2, attacker loses Defense
//   /aim                              -- bank +1 aim (max 3) for /ranged
//   /offhand                          -- -2
//   /pull[=<max>]                     -- pulling blow (cap damage)
//   /head /arm /leg /hand /eye /heart /torso  -- specified target
//   /burst-short /burst-med /burst-long       -- autofire
//   /into-melee[=<n>]                 -- bystanders to avoid
//   /target-prone /target-surprised   -- target state
//   /willpower                        -- spend 1 WP for +3 dice
//   /no-ammo                          -- skip ammo decrement (ST override)
//
// Resolution order:
//   1. Active encounter required
//   2. Must be attacker's turn
//   3. Target lookup
//   4. Determine pool type from weapon or switch
//   5. Compute Defense (lower of Dex/Wits + Athletics)
//   6. Build modifiers
//   7. Apply willpower (+3 dice)
//   8. Decrement firearm ammo
//   9. Roll
//  10. Apply damage, tilts, beaten-down / unconscious
//  11. Increment encounter appliedDefense for target
//  12. Output

import type { IUrsamuSDK } from "@ursamu/ursamu";
import { type CofdSheet, defaultSheet } from "../stats/index.ts";
import type { AttackOptions } from "../combat/modifiers.ts";
import { buildPool, computeDefense, type AttackPoolType } from "../combat/pools.ts";
import { applyAttackDamage } from "../combat/damage.ts";
import { checkSpecifiedTargetTilts } from "../combat/tilts.ts";
import { addTilt } from "../subsystems/tilts.ts";
import {
  getEncounterForRoom,
  applyDefense,
} from "../combat/encounter.ts";
import { executeRoll } from "../roller/index.ts";
import {
  equippedWeaponEntry,
  equippedArmorEntry,
  fireShots,
} from "../equipment/index.ts";

/** Helper: parse an integer from a switch value string, clamped to range. */
function parseIntSwitch(val: string | undefined, min: number, max: number, def: number): number {
  if (!val) return def;
  const n = parseInt(val, 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

export async function attackExec(u: IUrsamuSDK) {
  const rawArgs = u.cmd.args[0] ?? "";
  const rest = u.util.stripSubs(rawArgs).trim();

  if (!rest) {
    u.send("Usage: +attack <target>[/<switches>]  e.g. +attack Bob/melee/all-out");
    return;
  }

  // Parse "<target>[/<switch>[/<switch>...]]" from the single arg.
  // Switches are everything after the first "/" that contains no spaces.
  // Target name may not contain "/".
  const slashIdx = rest.indexOf("/");
  let targetName = slashIdx >= 0 ? rest.slice(0, slashIdx).trim() : rest;
  const switchStr = slashIdx >= 0 ? rest.slice(slashIdx + 1) : "";
  const rawSwitches = switchStr
    ? switchStr.split("/").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];

  targetName = u.util.stripSubs(targetName).trim();
  if (!targetName) {
    u.send("Usage: +attack <target>[/<switches>]");
    return;
  }

  // ---- Encounter check ------------------------------------------------
  const roomId = u.here?.id ?? "";
  const encounter = roomId ? await getEncounterForRoom(roomId) : null;
  if (!encounter || encounter.status !== "active") {
    u.send("There is no active combat encounter in this room. Start one with +combat.");
    return;
  }

  // Must be your turn.
  const currentActor = encounter.participants[encounter.turnIdx];
  if (!currentActor || currentActor.actorId !== u.me.id) {
    u.send("It is not your turn.");
    return;
  }

  // ---- Target lookup --------------------------------------------------
  const target = await u.util.target(u.me, targetName, true);
  if (!target) {
    u.send(`Target '${targetName}' not found.`);
    return;
  }

  const canEditTarget = await u.canEdit(u.me, target);
  // Health writes require canEdit on the target (builder+ or self).
  if (!canEditTarget) {
    u.send("You do not have permission to apply damage to that target.");
    return;
  }

  // ---- Parse switches -------------------------------------------------
  let poolOverride: AttackPoolType | undefined;
  let allOut = false;
  let charge = false;
  let offhand = false;
  let pulling: { max: number } | undefined;
  let burstShort = false;
  let burstMed = false;
  let burstLong = false;
  let intoMeleeCount: number | undefined;
  let targetProne = false;
  let targetSurprised = false;
  let wantWillpower = false;
  let skipAmmo = false;
  let doAim = false;
  let specified: AttackOptions["specified"];
  let aimBankVal: number | undefined;

  for (const sw of rawSwitches) {
    if (sw === "unarmed") poolOverride = "unarmed";
    else if (sw === "melee") poolOverride = "melee";
    else if (sw === "ranged") poolOverride = "ranged";
    else if (sw === "thrown") poolOverride = "thrown";
    else if (sw === "all-out" || sw === "allout") allOut = true;
    else if (sw === "charge") charge = true;
    else if (sw === "aim") doAim = true;
    else if (sw === "offhand") offhand = true;
    else if (sw.startsWith("pull")) {
      const eqIdx = sw.indexOf("=");
      const max = eqIdx >= 0 ? parseIntSwitch(sw.slice(eqIdx + 1), 1, 99, 1) : 1;
      pulling = { max };
    } else if (sw === "burst-short") burstShort = true;
    else if (sw === "burst-med") burstMed = true;
    else if (sw === "burst-long") burstLong = true;
    else if (sw.startsWith("into-melee")) {
      const eqIdx = sw.indexOf("=");
      intoMeleeCount = eqIdx >= 0 ? parseIntSwitch(sw.slice(eqIdx + 1), 1, 10, 1) : 1;
    } else if (sw === "target-prone") targetProne = true;
    else if (sw === "target-surprised") targetSurprised = true;
    else if (sw === "willpower" || sw === "wp") wantWillpower = true;
    else if (sw === "no-ammo") skipAmmo = true;
    else if (sw === "head") specified = "head";
    else if (sw === "arm") specified = "arm";
    else if (sw === "leg") specified = "leg";
    else if (sw === "hand") specified = "hand";
    else if (sw === "eye") specified = "eye";
    else if (sw === "heart") specified = "heart";
    else if (sw === "torso") specified = "torso";
    else {
      u.send(`Unknown attack switch: /${sw}`);
      return;
    }
  }

  // ---- Attacker sheet -------------------------------------------------
  const mySheet: CofdSheet = (u.me.state?.cofd as CofdSheet) ?? defaultSheet();

  // ---- Aim banking (/aim stores for next ranged attack) ---------------
  const aimState = (u.me.state?.cofd_aim as { banked: number } | undefined) ?? { banked: 0 };
  if (doAim) {
    const newBanked = Math.min(3, aimState.banked + 1);
    await u.db.modify(u.me.id, "$set", { "state.cofd_aim": { banked: newBanked } });
    u.send(`%cgAim banked.%cn You now have +${newBanked} aim bonus for your next ranged attack.`);
    return;
  }
  const aimBonus = poolOverride === "ranged" ? aimState.banked : 0;
  if (aimBonus > 0) {
    // Consume aim after use.
    aimBankVal = aimBonus;
    await u.db.modify(u.me.id, "$set", { "state.cofd_aim": { banked: 0 } });
  }

  // ---- Weapon info ----------------------------------------------------
  const equippedWeaponId = mySheet.equipment?.equippedWeapon ?? null;
  const weaponInfo = await equippedWeaponEntry(u, equippedWeaponId);

  // Determine pool type.
  let poolType: AttackPoolType;
  if (poolOverride) {
    poolType = poolOverride;
  } else if (weaponInfo) {
    // Infer from the catalog type embedded in the lookup result.
    // equippedWeaponEntry only returns weapon-ranged and weapon-melee types.
    const key = weaponInfo.entry.key ?? "";
    // We need the catalog type. Look it up again for type.
    const { lookupItem } = await import("../equipment/catalog.ts");
    const resolved = lookupItem(key);
    poolType = resolved?.type === "weapon-ranged" ? "ranged" : "melee";
  } else {
    poolType = "unarmed";
  }

  const isFirearm = poolType === "ranged";

  // ---- Target sheet and Defense ---------------------------------------
  const targetSheet: CofdSheet = (target.state?.cofd as CofdSheet) ?? defaultSheet();
  let targetDefense = computeDefense(targetSheet);

  // Subtract applied defense (target has been attacked this round already).
  const targetParticipant = encounter.participants.find((p) => p.actorId === target.id);
  if (targetParticipant) {
    targetDefense = Math.max(0, targetDefense - targetParticipant.appliedDefense);
  }

  // Dodge: if target is dodging, use 2x Defense as a contested pool (handled
  // later by noting that target effectively has 2x Defense dice).
  // For pool builder purposes, if dodging we pass double defense but note it.
  let dodging = false;
  if (targetParticipant?.isDodging) {
    dodging = true;
    // Dodge in CoFD 2e works as a subtraction of 2x Defense dice from the
    // attacker's pool. We fold this into a modified targetDefense value.
    targetDefense = targetParticipant.appliedDefense > 0
      ? 0 // already doubled out in prior attack
      : computeDefense(targetSheet) * 2;
  }

  // ---- Willpower ------------------------------------------------------
  let extraDice = 0;
  let spentWp = false;
  if (wantWillpower) {
    if (mySheet.advantages.willpowerCurrent < 1) {
      u.send("You have no Willpower left to spend.");
      return;
    }
    extraDice = 3;
    spentWp = true;
    await u.db.modify(u.me.id, "$set", {
      "state.cofd": {
        ...mySheet,
        advantages: {
          ...mySheet.advantages,
          willpowerCurrent: mySheet.advantages.willpowerCurrent - 1,
        },
      },
    });
  }

  // ---- Aim bonus ------------------------------------------------------
  if (aimBankVal) {
    extraDice += aimBankVal;
  }

  // ---- Build options and pool -----------------------------------------
  const opts: AttackOptions = {
    pool: poolType,
    allOut,
    charge,
    offhand,
    pulling,
    burstShort,
    burstMed,
    burstLong,
    intoMelee: intoMeleeCount,
    targetProne,
    targetSurprised,
    specified,
    aim: aimBankVal ?? 0,
  };

  const built = buildPool(mySheet, poolType, opts, targetDefense, extraDice);
  const finalPool = built.total;

  // ---- Ammo decrement --------------------------------------------------
  if (isFirearm && !skipAmmo && equippedWeaponId) {
    const remaining = await fireShots(u, equippedWeaponId, 1);
    if (remaining === null) {
      u.send("Your firearm is out of ammo. Reload first with +gear/reload.");
      return;
    }
  }

  // ---- Roll ------------------------------------------------------------
  const result = executeRoll(Math.max(0, finalPool));

  // ---- Damage resolution ----------------------------------------------
  const weaponDmgMod = weaponInfo?.entry?.damage ?? 0;
  const rawHits = result.successes + (result.successes > 0 ? weaponDmgMod : 0);

  // Armor
  const armorId = targetSheet.equipment?.equippedArmor ?? null;
  const targetArmor = await equippedArmorEntry(u, armorId);
  const armorGeneral = targetArmor?.entry?.ratingGeneral ?? 0;
  const armorBallistic = targetArmor?.entry?.ratingBallistic ?? 0;

  // Pulling blow cap
  const effectiveHits = pulling ? Math.min(rawHits, pulling.max) : rawHits;

  // Determine damage type (ranged = lethal; unarmed / thrown = bashing; melee = lethal unless blunt).
  // Simplified: ranged always lethal; others bashing by default (caller can override via weapon entry
  // once that field exists in the catalog -- for now use weapon damage > 0 as a lethal proxy).
  const damageType: "bashing" | "lethal" = isFirearm ? "lethal" : "bashing";

  let netDamage = 0;
  let beatenDown = false;
  let unconscious = false;
  let appliedTilts: string[] = [];

  if (result.successes > 0) {
    const dmgResult = applyAttackDamage(
      targetSheet,
      effectiveHits,
      damageType,
      armorGeneral,
      armorBallistic,
      isFirearm,
    );

    netDamage = dmgResult.netDamage;
    beatenDown = dmgResult.beatenDown;
    unconscious = dmgResult.unconscious;

    if (netDamage > 0) {
      // Persist updated health to target.
      await u.db.modify(target.id, "$set", {
        "state.cofd": dmgResult.sheet,
      });

      // Specified target tilts.
      const stamina = targetSheet.attributes?.stamina ?? 1;
      const size = targetSheet.advantages?.size ?? 5;
      appliedTilts = checkSpecifiedTargetTilts(netDamage, stamina, size, specified);

      if (appliedTilts.length > 0) {
        let tiltSheet = dmgResult.sheet;
        for (const key of appliedTilts) {
          // Only apply recognized subsystem tilts (not heart-strike).
          if (key !== "heart-strike") {
            tiltSheet = addTilt(tiltSheet, key);
          }
        }
        await u.db.modify(target.id, "$set", { "state.cofd": tiltSheet });
      }

      // Increment applied defense for target.
      await applyDefense(encounter.id, target.id);
    }
  }

  // ---- Output ----------------------------------------------------------
  const attackerName = u.me.name ?? "Unknown";
  const targetName2 = target.name ?? "Unknown";
  const hitWord = result.successes > 0 ? "hits" : "misses";
  const poolDesc = `${built.formula}=${finalPool > 0 ? finalPool : "chance"}d`;
  const diceStr = result.rolls.join(" ");
  const dmgPart = netDamage > 0 ? ` ${netDamage} ${damageType}` : "";
  const dodgeNote = dodging ? " (dodging)" : "";

  // Public line.
  u.broadcast(
    `%cyATTACK>>%cn ${attackerName} attacks ${targetName2}${dodgeNote}: ` +
      `%cw${result.successes}%cn success${result.successes === 1 ? "" : "es"} ${hitWord}${dmgPart}.`,
  );

  // Private detail line to attacker.
  u.send(
    `%cgROLL DETAIL:%cn ${poolDesc} (${diceStr})` +
      (spentWp ? " [+3 WP]" : "") +
      (aimBankVal ? ` [+${aimBankVal} aim]` : "") +
      (result.dramaticFailure ? " %crDRAMATIC FAILURE%cn" : ""),
  );

  // Notify target of damage privately.
  if (netDamage > 0 && target.id !== u.me.id) {
    u.send(
      `%cyINJURED:%cn ${attackerName} dealt ${netDamage} ${damageType} damage to you.`,
      target.id,
    );
  }

  // Status effects.
  if (beatenDown) {
    u.broadcast(`%cr${targetName2} is Beaten Down!%cn`);
  }
  if (unconscious) {
    u.broadcast(`%cr${targetName2} is Incapacitated!%cn`);
  }
  for (const tiltKey of appliedTilts) {
    if (tiltKey === "heart-strike") {
      u.broadcast(`%cy${targetName2} takes a strike to the heart!%cn`);
    } else {
      u.broadcast(`%cy${targetName2} gains tilt: ${tiltKey}%cn`);
    }
  }

  // All-out / charge: attacker loses defense next round (note only).
  if (built.mods.attackerLosesDefense) {
    u.send(
      "%cyNote:%cn You lose your Defense until your next turn (all-out / charge).",
    );
  }
}
